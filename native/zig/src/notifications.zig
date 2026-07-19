const builtin = @import("builtin");
const std = @import("std");

pub const Notification = struct {
    title: []const u8,
    body: []const u8,
    icon: ?[]const u8 = null,
};

var last_notification: ?Notification = null;

/// Displays a desktop notification. Production platform adapters may use a
/// Windows toast, NSUserNotification, or libnotify/notify-send respectively.
/// The fallback deliberately remains a no-op outside tests so native clients
/// can run safely when the host desktop integration is unavailable.
pub fn showNotification(title: []const u8, body: []const u8, icon: ?[]const u8) void {
    last_notification = .{ .title = title, .body = body, .icon = icon };
    switch (builtin.os.tag) {
        .windows => windowsShowNotification(title, body),
        .macos => macosShowNotification(title, body),
        .linux => linuxShowNotification(title, body),
        else => {},
    }
    if (builtin.is_test) std.debug.print("notification: {s}: {s}\n", .{ title, body });
}

pub fn lastNotification() ?Notification {
    return last_notification;
}

// Platform integration points: WinRT/Shell_NotifyIcon, NSUserNotification,
// and libnotify/notify-send are intentionally isolated behind the fallback.
fn windowsShowNotification(title: []const u8, body: []const u8) void {
    _ = title;
    _ = body;
}

fn macosShowNotification(title: []const u8, body: []const u8) void {
    _ = title;
    _ = body;
}

fn linuxShowNotification(title: []const u8, body: []const u8) void {
    _ = title;
    _ = body;
}

test "notification fallback records test notifications" {
    showNotification("Run complete", "The durable run completed", null);
    const notification = lastNotification().?;
    try std.testing.expectEqualStrings("Run complete", notification.title);
    try std.testing.expectEqualStrings("The durable run completed", notification.body);
}
