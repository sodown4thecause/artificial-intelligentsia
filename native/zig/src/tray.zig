const builtin = @import("builtin");
const std = @import("std");

pub const MenuCallback = *const fn () void;

pub const MenuItem = struct {
    label: []const u8,
    callback: ?MenuCallback = null,
};

pub const TrayIcon = struct {
    icon: []const u8,
    tooltip: []const u8,
    menuItems: []const MenuItem,
};

var active_tray: ?TrayIcon = null;

/// Shows the application tray icon. Platform backends are deliberately kept
/// behind this API: Shell_NotifyIcon on Windows, NSStatusItem on macOS, and
/// AppIndicator/libayatana-appindicator on Linux can be wired in without
/// changing the exported ABI. Until then this stateful fallback is safe in
/// headless builds and observable in Zig tests.
pub fn showTray(icon: []const u8, tooltip: []const u8) void {
    active_tray = .{ .icon = icon, .tooltip = tooltip, .menuItems = &.{} };
    switch (builtin.os.tag) {
        .windows => windowsShowTray(icon, tooltip),
        .macos => macosShowTray(icon, tooltip),
        .linux => linuxShowTray(icon, tooltip),
        else => {},
    }
    logTest("tray shown", tooltip);
}

pub fn hideTray() void {
    active_tray = null;
    logTest("tray hidden", "");
}

pub fn setTooltip(text: []const u8) void {
    if (active_tray) |tray| {
        active_tray = .{ .icon = tray.icon, .tooltip = text, .menuItems = tray.menuItems };
    } else {
        active_tray = .{ .icon = "", .tooltip = text, .menuItems = &.{} };
    }
    logTest("tray tooltip", text);
}

pub fn addMenuItem(label: []const u8, callback: ?MenuCallback) void {
    _ = callback;
    logTest("tray menu item", label);
}

pub fn isVisible() bool {
    return active_tray != null;
}

pub fn tooltip() ?[]const u8 {
    return if (active_tray) |tray| tray.tooltip else null;
}

fn logTest(action: []const u8, text: []const u8) void {
    if (builtin.is_test) std.debug.print("{s}: {s}\n", .{ action, text });
}

// Platform integration points: Shell_NotifyIcon, NSStatusItem, and
// AppIndicator/libayatana-appindicator are intentionally isolated here.
fn windowsShowTray(icon: []const u8, text: []const u8) void {
    _ = icon;
    _ = text;
}

fn macosShowTray(icon: []const u8, text: []const u8) void {
    _ = icon;
    _ = text;
}

fn linuxShowTray(icon: []const u8, text: []const u8) void {
    _ = icon;
    _ = text;
}

test "tray fallback maintains visibility and tooltip" {
    hideTray();
    showTray("creature.ico", "Creature");
    try std.testing.expect(isVisible());
    try std.testing.expectEqualStrings("Creature", tooltip().?);
    setTooltip("Pending approvals");
    try std.testing.expectEqualStrings("Pending approvals", tooltip().?);
    hideTray();
    try std.testing.expect(!isVisible());
}
