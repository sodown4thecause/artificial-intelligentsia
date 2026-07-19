const std = @import("std");
const builtin = @import("builtin");

var test_clipboard: ?[]u8 = null;

pub fn readText(allocator: std.mem.Allocator) !?[]u8 {
    if (builtin.is_test) {
        const text = test_clipboard orelse return null;
        return allocator.dupe(u8, text);
    }
    return switch (builtin.os.tag) {
        .windows => windowsRead(allocator),
        .macos => macOSRead(allocator),
        .linux => linuxRead(allocator),
        else => null,
    };
}

pub fn writeText(text: []const u8) !void {
    if (builtin.is_test) {
        if (test_clipboard) |old| std.heap.page_allocator.free(old);
        test_clipboard = try std.heap.page_allocator.dupe(u8, text);
        return;
    }
    return switch (builtin.os.tag) {
        .windows => windowsWrite(text),
        .macos => macOSWrite(text),
        .linux => linuxWrite(text),
        else => {},
    };
}

fn windowsRead(allocator: std.mem.Allocator) !?[]u8 {
    _ = allocator;
    // GetClipboardData(CF_UNICODETEXT) is supplied by the Windows host bridge.
    return null;
}
fn windowsWrite(text: []const u8) !void {
    _ = text;
    // OpenClipboard / SetClipboardData(CF_UNICODETEXT) host integration.
}
fn macOSRead(allocator: std.mem.Allocator) !?[]u8 {
    _ = allocator;
    // NSPasteboard bridge supplied by the Objective-C host.
    return null;
}
fn macOSWrite(text: []const u8) !void {
    _ = text;
    // NSPasteboard bridge supplied by the Objective-C host.
}
fn linuxRead(allocator: std.mem.Allocator) !?[]u8 {
    const result = std.process.Child.run(.{ .allocator = allocator, .argv = &.{ "xclip", "-selection", "clipboard", "-o" } }) catch return null;
    defer allocator.free(result.stderr);
    if (result.term.Exited != 0) {
        allocator.free(result.stdout);
        return null;
    }
    return result.stdout;
}
fn linuxWrite(text: []const u8) !void {
    var child = std.process.Child.init(&.{ "xclip", "-selection", "clipboard" }, std.heap.page_allocator);
    child.stdin_behavior = .Pipe;
    try child.spawn();
    if (child.stdin) |stdin| {
        defer stdin.close();
        try stdin.writeAll(text);
    }
    _ = try child.wait();
}

test "test clipboard round trip" {
    try writeText("Creature");
    const value = try readText(std.testing.allocator);
    defer std.testing.allocator.free(value.?);
    try std.testing.expectEqualStrings("Creature", value.?);
}
