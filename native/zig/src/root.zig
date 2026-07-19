const std = @import("std");
const cache = @import("cache.zig");
const crypto = @import("crypto.zig");
const queue = @import("queue.zig");
const shortcuts = @import("shortcuts.zig");

const version = "0.1.0";
const allocator = std.heap.c_allocator;
var global_cache: ?cache.Cache = null;
var global_queue: ?queue.OfflineQueue = null;

pub export fn creature_native_init() callconv(.c) c_int { return 0; }
pub export fn creature_native_version() callconv(.c) [*:0]const u8 { return version; }

pub export fn creature_shortcut_register(modifiers: u32, key: [*:0]const u8, callback_id: [*:0]const u8) callconv(.c) c_int {
    shortcuts.registerShortcut(.{
        .modifiers = modifiers,
        .key = std.mem.span(key),
        .callback_context = std.mem.span(callback_id),
    }) catch return -1;
    return 0;
}

pub export fn creature_shortcut_unregister(callback_id: [*:0]const u8) callconv(.c) c_int {
    return if (shortcuts.unregisterShortcut(std.mem.span(callback_id))) 0 else -1;
}

pub export fn creature_shortcut_unregister_all() callconv(.c) c_int {
    shortcuts.unregisterAllShortcuts();
    return 0;
}

pub export fn creature_cache_init(path: [*:0]const u8, master_key: [*:0]const u8) callconv(.c) c_int {
    if (global_cache) |*existing| existing.deinit();
    const key = crypto.deriveKey(std.mem.span(master_key), "creature-os-cache-v1");
    var initialized = cache.Cache.init(allocator, std.mem.span(path), key) catch return -1;
    initialized.load() catch {
        initialized.deinit();
        return -1;
    };
    global_cache = initialized;
    if (global_cache) |*active| global_queue = queue.OfflineQueue.init(allocator, active);
    return 0;
}

pub export fn creature_cache_set(key: [*:0]const u8, value: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_cache) |*value| value else return -1;
    active.set(std.mem.span(key), std.mem.span(value)) catch return -1;
    return 0;
}

/// The SDK allocates out_value; callers must release it with creature_cache_free_string.
pub export fn creature_cache_get(key: [*:0]const u8, out_value: *?[*]u8, out_len: *usize) callconv(.c) c_int {
    const active = if (global_cache) |*value| value else return -1;
    const value = active.get(std.mem.span(key)) catch return -1;
    if (value) |bytes| {
        out_value.* = bytes.ptr;
        out_len.* = bytes.len;
    } else {
        out_value.* = null;
        out_len.* = 0;
    }
    return 0;
}

pub export fn creature_cache_delete(key: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_cache) |*value| value else return -1;
    active.delete(std.mem.span(key)) catch return -1;
    return 0;
}

pub export fn creature_cache_free_string(ptr: [*]u8, len: usize) callconv(.c) void { allocator.free(ptr[0..len]); }

pub export fn creature_queue_enqueue(operation_type: [*:0]const u8, payload: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_queue) |*value| value else return -1;
    const id = active.enqueue(std.mem.span(operation_type), std.mem.span(payload)) catch return -1;
    allocator.free(id);
    return 0;
}

pub export fn creature_queue_dequeue(out_operation: *?[*]u8, out_len: *usize) callconv(.c) c_int {
    const active = if (global_queue) |*value| value else return -1;
    var operation = (active.dequeue() catch return -1) orelse {
        out_operation.* = null;
        out_len.* = 0;
        return 0;
    };
    defer operation.deinit(allocator);
    const value = active.toJson(&operation) catch return -1;
    out_operation.* = value.ptr;
    out_len.* = value.len;
    return 0;
}

pub export fn creature_queue_mark_completed(id: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_queue) |*value| value else return -1;
    active.markCompleted(std.mem.span(id)) catch return -1;
    return 0;
}

pub export fn creature_queue_mark_failed(id: [*:0]const u8, message: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_queue) |*value| value else return -1;
    active.markFailed(std.mem.span(id), std.mem.span(message)) catch return -1;
    return 0;
}

pub export fn creature_queue_retry(id: [*:0]const u8) callconv(.c) c_int {
    const active = if (global_queue) |*value| value else return -1;
    active.retry(std.mem.span(id)) catch return -1;
    return 0;
}

pub export fn creature_queue_pending_count() callconv(.c) c_int {
    const active = &(global_queue orelse return -1);
    return @intCast(active.pendingCount() catch return -1);
}

test {
    _ = @import("cache.zig");
    _ = @import("queue.zig");
    _ = @import("shortcuts.zig");
}
