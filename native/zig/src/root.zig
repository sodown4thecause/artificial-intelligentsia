const std = @import("std");
const notifications = @import("notifications.zig");
const tray = @import("tray.zig");

const version = "0.1.0";

pub export fn creature_native_init() callconv(.c) c_int {
    return 0;
}

pub export fn creature_native_version() callconv(.c) [*:0]const u8 {
    return version;
}

pub export fn creature_tray_show(icon_path: [*:0]const u8, tooltip: [*:0]const u8) callconv(.c) c_int {
    tray.showTray(std.mem.span(icon_path), std.mem.span(tooltip));
    return 0;
}

pub export fn creature_tray_hide() callconv(.c) c_int {
    tray.hideTray();
    return 0;
}

pub export fn creature_tray_set_tooltip(tooltip: [*:0]const u8) callconv(.c) c_int {
    tray.setTooltip(std.mem.span(tooltip));
    return 0;
}

pub export fn creature_notification_show(title: [*:0]const u8, body: [*:0]const u8) callconv(.c) c_int {
    notifications.showNotification(std.mem.span(title), std.mem.span(body), null);
    return 0;
}

test {
    _ = @import("notifications.zig");
    _ = @import("tray.zig");
}
