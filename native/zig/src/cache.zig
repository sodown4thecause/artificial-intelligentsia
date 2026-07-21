const std = @import("std");
const crypto = @import("crypto.zig");

const Entry = struct { key: []u8, value: []u8 };
const max_store_size = 32 * 1024 * 1024;

/// A small encrypted key/value store. The file contains only an AEAD nonce, tag,
/// and ciphertext; keys are encrypted along with their values.
pub const Cache = struct {
    allocator: std.mem.Allocator,
    directory: []u8,
    key: crypto.Key,
    entries: std.ArrayList(Entry),

    pub fn init(allocator: std.mem.Allocator, path: []const u8, master_key: crypto.Key) !Cache {
        try std.fs.cwd().makePath(path);
        return .{
            .allocator = allocator,
            .directory = try allocator.dupe(u8, path),
            .key = master_key,
            .entries = std.ArrayList(Entry).init(allocator),
        };
    }

    pub fn load(self: *Cache) !void {
        const path = try self.filePath();
        defer self.allocator.free(path);
        const file = std.fs.cwd().openFile(path, .{}) catch |err| switch (err) {
            error.FileNotFound => return,
            else => return err,
        };
        defer file.close();
        const bytes = try file.readToEndAlloc(self.allocator, max_store_size);
        defer self.allocator.free(bytes);
        if (bytes.len < 32) return error.InvalidCacheFile;
        if (!std.mem.eql(u8, bytes[0..4], "CC01")) return error.InvalidCacheFile;
        var nonce: crypto.Nonce = undefined;
        var tag: crypto.Tag = undefined;
        @memcpy(&nonce, bytes[4..16]);
        @memcpy(&tag, bytes[16..32]);
        const plain = try crypto.decrypt(self.allocator, bytes[32..], nonce, tag, self.key);
        defer self.allocator.free(plain);
        try self.decode(plain);
    }

    pub fn deinit(self: *Cache) void {
        self.clearEntries();
        self.entries.deinit();
        self.allocator.free(self.directory);
    }

    pub fn set(self: *Cache, key: []const u8, value: []const u8) !void {
        for (self.entries.items) |*entry| if (std.mem.eql(u8, entry.key, key)) {
            self.allocator.free(entry.value);
            entry.value = try self.allocator.dupe(u8, value);
            return self.persist();
        };
        try self.entries.append(.{ .key = try self.allocator.dupe(u8, key), .value = try self.allocator.dupe(u8, value) });
        errdefer {
            const entry = self.entries.pop().?;
            self.allocator.free(entry.key);
            self.allocator.free(entry.value);
        }
        try self.persist();
    }

    /// The caller owns the returned value.
    pub fn get(self: *const Cache, key: []const u8) !?[]u8 {
        for (self.entries.items) |entry| if (std.mem.eql(u8, entry.key, key)) return try self.allocator.dupe(u8, entry.value);
        return null;
    }

    pub fn delete(self: *Cache, key: []const u8) !void {
        for (self.entries.items, 0..) |entry, index| if (std.mem.eql(u8, entry.key, key)) {
            self.allocator.free(entry.key);
            self.allocator.free(entry.value);
            _ = self.entries.orderedRemove(index);
            try self.persist();
            return;
        };
    }

    pub fn clear(self: *Cache) !void {
        self.clearEntries();
        try self.persist();
    }

    /// The caller owns the returned keys and each key within it.
    pub fn keys(self: *const Cache, allocator: std.mem.Allocator) ![][]u8 {
        var result = try allocator.alloc([]u8, self.entries.items.len);
        errdefer allocator.free(result);
        for (self.entries.items, 0..) |entry, index| result[index] = try allocator.dupe(u8, entry.key);
        return result;
    }

    fn clearEntries(self: *Cache) void {
        for (self.entries.items) |entry| {
            self.allocator.free(entry.key);
            self.allocator.free(entry.value);
        }
        self.entries.clearRetainingCapacity();
    }

    fn filePath(self: *const Cache) ![]u8 {
        return std.fs.path.join(self.allocator, &.{ self.directory, "cache.bin" });
    }

    fn persist(self: *Cache) !void {
        const plain = try self.encode();
        defer self.allocator.free(plain);
        const encrypted = try crypto.encrypt(self.allocator, plain, self.key);
        defer self.allocator.free(encrypted.ciphertext);
        const path = try self.filePath();
        defer self.allocator.free(path);
        const file = try std.fs.cwd().createFile(path, .{ .truncate = true });
        defer file.close();
        try file.writeAll("CC01");
        try file.writeAll(&encrypted.nonce);
        try file.writeAll(&encrypted.tag);
        try file.writeAll(encrypted.ciphertext);
    }

    fn encode(self: *const Cache) ![]u8 {
        var bytes = std.ArrayList(u8).init(self.allocator);
        errdefer bytes.deinit();
        const writer = bytes.writer();
        try writer.writeInt(u32, @intCast(self.entries.items.len), .little);
        for (self.entries.items) |entry| {
            try writer.writeInt(u32, @intCast(entry.key.len), .little);
            try writer.writeAll(entry.key);
            try writer.writeInt(u32, @intCast(entry.value.len), .little);
            try writer.writeAll(entry.value);
        }
        return bytes.toOwnedSlice();
    }

    fn decode(self: *Cache, bytes: []const u8) !void {
        var stream = std.io.fixedBufferStream(bytes);
        const reader = stream.reader();
        const count = try reader.readInt(u32, .little);
        if (count > 100_000) return error.InvalidCacheFile;
        self.clearEntries();
        for (0..count) |_| {
            const key_len = try reader.readInt(u32, .little);
            if (key_len > max_store_size) return error.InvalidCacheFile;
            const key = try self.allocator.alloc(u8, key_len);
            errdefer self.allocator.free(key);
            try reader.readNoEof(key);
            const value_len = try reader.readInt(u32, .little);
            if (value_len > max_store_size) return error.InvalidCacheFile;
            const value = try self.allocator.alloc(u8, value_len);
            errdefer self.allocator.free(value);
            try reader.readNoEof(value);
            try self.entries.append(.{ .key = key, .value = value });
        }
    }
};
