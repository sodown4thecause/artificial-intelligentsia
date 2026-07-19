const std = @import("std");
const dialogs = @import("dialogs.zig");
const clipboard = @import("clipboard.zig");

const Status = enum(c_int) { ok = 0, cancelled = 1, failed = -1 };

fn input(value: ?[*:0]const u8) []const u8 {
    return if (value) |text| std.mem.span(text) else "";
}

fn firstExtension(value: []const u8) []const u8 {
    const separator = std.mem.indexOfScalar(u8, value, ',') orelse return value;
    return value[0..separator];
}

fn copyToC(value: []const u8, out: *?[*]u8, out_len: *usize) Status {
    const result = std.heap.c_allocator.alloc(u8, value.len + 1) catch return .failed;
    std.mem.copyForwards(u8, result[0..value.len], value);
    result[value.len] = 0;
    out.* = result.ptr;
    out_len.* = value.len;
    return .ok;
}

pub export fn creature_dialog_open(title: ?[*:0]const u8, default_path: ?[*:0]const u8, extension_list: ?[*:0]const u8, allow_multiple: bool, out_paths: *?[*]u8, out_len: *usize) c_int {
    out_paths.* = null;
    out_len.* = 0;
    const extension = firstExtension(input(extension_list));
    const allowed_extensions: []const []const u8 = if (extension.len == 0) &.{} else &.{extension};
    const value = dialogs.showOpenDialog(std.heap.c_allocator, .{ .title = input(title), .defaultPath = input(default_path), .allowedExtensions = allowed_extensions, .allowMultiple = allow_multiple }) catch return @intFromEnum(Status.failed);
    if (value) |paths| {
        defer std.heap.c_allocator.free(paths);
        return @intFromEnum(copyToC(paths, out_paths, out_len));
    }
    return @intFromEnum(Status.cancelled);
}

pub export fn creature_dialog_save(title: ?[*:0]const u8, default_path: ?[*:0]const u8, extension_list: ?[*:0]const u8, out_path: *?[*]u8, out_len: *usize) c_int {
    out_path.* = null;
    out_len.* = 0;
    const extension = firstExtension(input(extension_list));
    const allowed_extensions: []const []const u8 = if (extension.len == 0) &.{} else &.{extension};
    const value = dialogs.showSaveDialog(std.heap.c_allocator, .{ .title = input(title), .defaultPath = input(default_path), .allowedExtensions = allowed_extensions }) catch return @intFromEnum(Status.failed);
    if (value) |path| {
        defer std.heap.c_allocator.free(path);
        return @intFromEnum(copyToC(path, out_path, out_len));
    }
    return @intFromEnum(Status.cancelled);
}

pub export fn creature_clipboard_read(out_text: *?[*]u8, out_len: *usize) c_int {
    out_text.* = null;
    out_len.* = 0;
    const value = clipboard.readText(std.heap.c_allocator) catch return @intFromEnum(Status.failed);
    if (value) |text| {
        defer std.heap.c_allocator.free(text);
        return @intFromEnum(copyToC(text, out_text, out_len));
    }
    return @intFromEnum(Status.cancelled);
}

pub export fn creature_clipboard_write(text: ?[*:0]const u8) c_int {
    clipboard.writeText(input(text)) catch return @intFromEnum(Status.failed);
    return @intFromEnum(Status.ok);
}

pub export fn creature_free_string(ptr: ?[*]u8) void {
    if (ptr) |value| std.c.free(@ptrCast(value));
}
