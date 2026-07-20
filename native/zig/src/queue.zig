const std = @import("std");
const cache_mod = @import("cache.zig");

pub const Status = enum(u8) { pending, processing, completed, failed };

pub const Operation = struct {
    id: []u8,
    operation_type: []u8,
    payload: []u8,
    retry_count: u32,
    status: Status,
    created_at: i64,
    error_message: ?[]u8 = null,

    pub fn deinit(self: *Operation, allocator: std.mem.Allocator) void {
        allocator.free(self.id);
        allocator.free(self.operation_type);
        allocator.free(self.payload);
        if (self.error_message) |message| allocator.free(message);
    }
};

pub const OfflineQueue = struct {
    allocator: std.mem.Allocator,
    cache: *cache_mod.Cache,
    sequence: u64 = 0,

    pub fn init(allocator: std.mem.Allocator, cache: *cache_mod.Cache) OfflineQueue {
        return .{ .allocator = allocator, .cache = cache };
    }

    pub fn enqueue(self: *OfflineQueue, operation_type: []const u8, payload: []const u8) ![]u8 {
        self.sequence += 1;
        var id_buffer: [48]u8 = undefined;
        const id = try std.fmt.bufPrint(&id_buffer, "op-{d}-{d}", .{ std.time.milliTimestamp(), self.sequence });
        var operation = Operation{
            .id = try self.allocator.dupe(u8, id),
            .operation_type = try self.allocator.dupe(u8, operation_type),
            .payload = try self.allocator.dupe(u8, payload),
            .retry_count = 0,
            .status = .pending,
            .created_at = std.time.milliTimestamp(),
        };
        defer operation.deinit(self.allocator);
        try self.store(&operation);
        return self.allocator.dupe(u8, id);
    }

    /// Returns the oldest pending operation and changes it to processing.
    pub fn dequeue(self: *OfflineQueue) !?Operation {
        var pending = try self.pending();
        defer self.freeOperations(pending);
        if (pending.len == 0) return null;
        var operation = pending[0];
        pending[0].id = &.{};
        pending[0].operation_type = &.{};
        pending[0].payload = &.{};
        pending[0].error_message = null;
        operation.status = .processing;
        try self.store(&operation);
        return operation;
    }

    pub fn markCompleted(self: *OfflineQueue, id: []const u8) !void { try self.updateStatus(id, .completed, null, false); }
    pub fn markFailed(self: *OfflineQueue, id: []const u8, message: []const u8) !void { try self.updateStatus(id, .failed, message, true); }
    pub fn retry(self: *OfflineQueue, id: []const u8) !void { try self.updateStatus(id, .pending, null, false); }

    /// The caller owns the returned operations.
    pub fn pending(self: *OfflineQueue) ![]Operation {
        const keys = try self.cache.keys(self.allocator);
        defer {
            for (keys) |key| self.allocator.free(key);
            self.allocator.free(keys);
        }
        var result = std.ArrayList(Operation).init(self.allocator);
        errdefer self.freeOperations(result.items);
        for (keys) |key| {
            if (!std.mem.startsWith(u8, key, "queue:")) continue;
            const value = (try self.cache.get(key)) orelse continue;
            defer self.allocator.free(value);
            var operation = try self.deserialize(value);
            if (operation.status == .pending) try result.append(operation) else operation.deinit(self.allocator);
        }
        std.mem.sort(Operation, result.items, {}, struct { fn lessThan(_: void, left: Operation, right: Operation) bool { return left.created_at < right.created_at; } }.lessThan);
        return result.toOwnedSlice();
    }

    pub fn pendingCount(self: *OfflineQueue) !usize {
        const operations = try self.pending();
        defer self.freeOperations(operations);
        return operations.len;
    }

    pub fn freeOperations(self: *OfflineQueue, operations: []Operation) void {
        for (operations) |*operation| operation.deinit(self.allocator);
        self.allocator.free(operations);
    }

    fn updateStatus(self: *OfflineQueue, id: []const u8, status: Status, message: ?[]const u8, increment_retries: bool) !void {
        const value = (try self.cache.get(try self.cacheKey(id))) orelse return error.OperationNotFound;
        defer self.allocator.free(value);
        var operation = try self.deserialize(value);
        defer operation.deinit(self.allocator);
        operation.status = status;
        if (increment_retries) operation.retry_count += 1;
        if (operation.error_message) |old| self.allocator.free(old);
        operation.error_message = if (message) |text| try self.allocator.dupe(u8, text) else null;
        try self.store(&operation);
    }

    fn store(self: *OfflineQueue, operation: *const Operation) !void {
        const key = try self.cacheKey(operation.id);
        defer self.allocator.free(key);
        const value = try self.serialize(operation);
        defer self.allocator.free(value);
        try self.cache.set(key, value);
    }

    fn cacheKey(self: *OfflineQueue, id: []const u8) ![]u8 { return std.fmt.allocPrint(self.allocator, "queue:{s}", .{id}); }

    fn serialize(self: *OfflineQueue, operation: *const Operation) ![]u8 {
        var bytes = std.ArrayList(u8).init(self.allocator);
        errdefer bytes.deinit();
        const writer = bytes.writer();
        try writer.writeByte(@intFromEnum(operation.status));
        try writer.writeInt(i64, operation.created_at, .little);
        try writer.writeInt(u32, operation.retry_count, .little);
        inline for (.{ operation.id, operation.operation_type, operation.payload, operation.error_message orelse "" }) |field| {
            try writer.writeInt(u32, @intCast(field.len), .little);
            try writer.writeAll(field);
        }
        return bytes.toOwnedSlice();
    }

    pub fn toJson(self: *OfflineQueue, operation: *const Operation) ![]u8 {
        var bytes = std.ArrayList(u8).init(self.allocator);
        errdefer bytes.deinit();
        try std.json.stringify(operation, .{}, bytes.writer());
        return bytes.toOwnedSlice();
    }

    fn deserialize(self: *OfflineQueue, bytes: []const u8) !Operation {
        var stream = std.io.fixedBufferStream(bytes);
        const reader = stream.reader();
        const status = std.meta.intToEnum(Status, try reader.readByte()) catch return error.InvalidOperation;
        const created_at = try reader.readInt(i64, .little);
        const retry_count = try reader.readInt(u32, .little);
        const id = try self.readField(reader);
        errdefer self.allocator.free(id);
        const operation_type = try self.readField(reader);
        errdefer self.allocator.free(operation_type);
        const payload = try self.readField(reader);
        errdefer self.allocator.free(payload);
        const message = try self.readField(reader);
        return .{ .id = id, .operation_type = operation_type, .payload = payload, .retry_count = retry_count, .status = status, .created_at = created_at, .error_message = if (message.len == 0) blk: { self.allocator.free(message); break :blk null; } else message };
    }

    fn readField(self: *OfflineQueue, reader: anytype) ![]u8 {
        const length = try reader.readInt(u32, .little);
        if (length > 16 * 1024 * 1024) return error.InvalidOperation;
        const field = try self.allocator.alloc(u8, length);
        errdefer self.allocator.free(field);
        try reader.readNoEof(field);
        return field;
    }
};
