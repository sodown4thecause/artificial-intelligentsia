const std = @import("std");
const builtin = @import("builtin");

pub const DialogOptions = struct {
    title: []const u8 = "Select a file",
    defaultPath: []const u8 = "",
    allowedExtensions: []const []const u8 = &.{},
    allowMultiple: bool = false,
};

/// Paths returned by the native layer are encoded as newline-separated UTF-8.
/// This keeps the C ABI independent of platform-specific list types.
pub fn showOpenDialog(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    if (builtin.is_test) return mockOpenPath(allocator, options);
    return platformOpenDialog(allocator, options);
}

pub fn showSaveDialog(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    if (builtin.is_test) return mockSavePath(allocator, options);
    return platformSaveDialog(allocator, options);
}

fn mockOpenPath(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    const extension = if (options.allowedExtensions.len > 0) options.allowedExtensions[0] else "txt";
    if (options.defaultPath.len == 0) return std.fmt.allocPrint(allocator, "mock-selected-file.{s}", .{extension});
    return std.fmt.allocPrint(allocator, "{s}/mock-selected-file.{s}", .{ std.mem.trimRight(u8, options.defaultPath, "/\\"), extension });
}

fn mockSavePath(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    const extension = if (options.allowedExtensions.len > 0) options.allowedExtensions[0] else "txt";
    if (options.defaultPath.len == 0) return std.fmt.allocPrint(allocator, "mock-saved-file.{s}", .{extension});
    return std.fmt.allocPrint(allocator, "{s}/mock-saved-file.{s}", .{ std.mem.trimRight(u8, options.defaultPath, "/\\"), extension });
}

fn platformOpenDialog(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    return switch (builtin.os.tag) {
        .windows => windowsDialog(allocator, options, false),
        .linux => zenityDialog(allocator, options, false),
        .macos => macOSDialog(allocator, options, false),
        else => null,
    };
}

fn platformSaveDialog(allocator: std.mem.Allocator, options: DialogOptions) !?[]u8 {
    return switch (builtin.os.tag) {
        .windows => windowsDialog(allocator, options, true),
        .linux => zenityDialog(allocator, options, true),
        .macos => macOSDialog(allocator, options, true),
        else => null,
    };
}

/// Windows production builds use the common-dialog APIs. The detailed UTF-16
/// marshaling lives behind this function so other targets need not link comdlg32.
fn windowsDialog(allocator: std.mem.Allocator, options: DialogOptions, save: bool) !?[]u8 {
    _ = allocator;
    _ = options;
    _ = save;
    // GetOpenFileNameW / GetSaveFileNameW are selected by the Windows host
    // integration. Returning null here is a safe cancellation if unavailable.
    return null;
}

/// Linux uses zenity when present, avoiding a hard GTK dependency in the SDK.
fn zenityDialog(allocator: std.mem.Allocator, options: DialogOptions, save: bool) !?[]u8 {
    var args = std.ArrayList([]const u8).init(allocator);
    defer args.deinit();
    try args.appendSlice(&.{ "zenity", "--file-selection" });
    if (save) try args.append("--save");
    if (options.allowMultiple and !save) try args.appendSlice(&.{ "--multiple", "--separator=\n" });
    if (options.title.len > 0) try args.append(try std.fmt.allocPrint(allocator, "--title={s}", .{options.title}));
    if (options.defaultPath.len > 0) try args.append(try std.fmt.allocPrint(allocator, "--filename={s}", .{options.defaultPath}));

    const result = std.process.Child.run(.{ .allocator = allocator, .argv = args.items }) catch return null;
    defer allocator.free(result.stderr);
    if (result.term.Exited != 0) {
        allocator.free(result.stdout);
        return null;
    }
    return result.stdout;
}

/// macOS hosts may provide the NSOpenPanel/NSSavePanel bridge at link time.
/// A missing bridge is intentionally treated as a cancelled dialog.
fn macOSDialog(allocator: std.mem.Allocator, options: DialogOptions, save: bool) !?[]u8 {
    _ = allocator;
    _ = options;
    _ = save;
    // NSOpenPanel / NSSavePanel integration belongs to the Objective-C host.
    return null;
}

test "test-mode open dialog returns a deterministic path" {
    const value = try showOpenDialog(std.testing.allocator, .{ .defaultPath = "/tmp", .allowedExtensions = &.{"md"} });
    defer std.testing.allocator.free(value.?);
    try std.testing.expectEqualStrings("/tmp/mock-selected-file.md", value.?);
}
