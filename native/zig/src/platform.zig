const builtin = @import("builtin");
const std = @import("std");

pub const OperatingSystem = enum { windows, macos, linux };

pub const current_os: OperatingSystem = switch (builtin.os.tag) {
    .windows => .windows,
    .macos => .macos,
    else => .linux,
};

pub fn isWindows() bool {
    return current_os == .windows;
}

pub fn isMacOS() bool {
    return current_os == .macos;
}

pub fn isLinux() bool {
    return current_os == .linux;
}

/// Returns the platform's last system error when that concept is available.
pub fn lastError() u32 {
    if (builtin.os.tag == .windows) {
        return std.os.windows.kernel32.GetLastError();
    }
    return 0;
}
