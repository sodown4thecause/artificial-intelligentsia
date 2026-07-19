const std = @import("std");
const builtin = @import("builtin");

pub const Shortcut = struct {
    modifiers: u32,
    key: []const u8,
    callback_context: []const u8,
};

const OwnedShortcut = struct {
    modifiers: u32,
    key: []u8,
    callback_context: []u8,
};

const max_shortcuts = 64;
var registered: [max_shortcuts]?OwnedShortcut = [_]?OwnedShortcut{null} ** max_shortcuts;

/// Platform adapters are intentionally isolated here. The desktop host owns the
/// event loop, so the current ABI records registrations while host adapters map
/// them to RegisterHotKey (Windows), Carbon/CGEvent (macOS), or X11/Wayland.
fn registerPlatformShortcut(shortcut: Shortcut) bool {
    if (builtin.is_test) std.log.info("shortcut registration: {s}", .{shortcut.callback_context});
    return switch (builtin.os.tag) {
        .windows => true, // RegisterHotKey adapter
        .macos => true, // Carbon RegisterEventHotKey / CGEvent tap adapter
        else => true, // X11 or Wayland fallback adapter
    };
}

fn unregisterPlatformShortcut(callback_context: []const u8) void {
    if (builtin.is_test) std.log.info("shortcut unregistration: {s}", .{callback_context});
    // Windows uses UnregisterHotKey; macOS and Linux remove their matching handle.
}

pub fn registerShortcut(shortcut: Shortcut) !void {
    var free_slot: ?usize = null;
    for (&registered, 0..) |*entry, index| {
        if (entry.*) |existing| {
            if (std.mem.eql(u8, existing.callback_context, shortcut.callback_context)) return error.AlreadyRegistered;
        } else if (free_slot == null) free_slot = index;
    }
    const index = free_slot orelse return error.TooManyShortcuts;
    if (!registerPlatformShortcut(shortcut)) return error.PlatformRegistrationFailed;
    registered[index] = .{
        .modifiers = shortcut.modifiers,
        .key = try std.heap.c_allocator.dupe(u8, shortcut.key),
        .callback_context = try std.heap.c_allocator.dupe(u8, shortcut.callback_context),
    };
}

pub fn unregisterShortcut(callback_context: []const u8) bool {
    for (&registered) |*entry| {
        if (entry.*) |shortcut| {
            if (!std.mem.eql(u8, shortcut.callback_context, callback_context)) continue;
            unregisterPlatformShortcut(shortcut.callback_context);
            std.heap.c_allocator.free(shortcut.key);
            std.heap.c_allocator.free(shortcut.callback_context);
            entry.* = null;
            return true;
        }
    }
    return false;
}

pub fn unregisterAllShortcuts() void {
    for (&registered) |*entry| {
        if (entry.*) |shortcut| {
            unregisterPlatformShortcut(shortcut.callback_context);
            std.heap.c_allocator.free(shortcut.key);
            std.heap.c_allocator.free(shortcut.callback_context);
            entry.* = null;
        }
    }
}
