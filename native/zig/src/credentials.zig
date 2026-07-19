const builtin = @import("builtin");
const std = @import("std");

pub const CredentialError = error{
    InvalidArgument,
    NotFound,
    AccessDenied,
    PlatformUnavailable,
    SystemFailure,
    OutOfMemory,
};

pub fn storeCredential(service: []const u8, account: []const u8, secret: []const u8) CredentialError!void {
    if (service.len == 0 or account.len == 0 or secret.len == 0) return error.InvalidArgument;

    return switch (builtin.os.tag) {
        .windows => storeWindows(service, account, secret),
        .macos => runSecurity(&.{ "add-generic-password", "-U", "-s", service, "-a", account, "-w", secret }),
        .linux => storeLinux(service, account, secret),
        else => error.PlatformUnavailable,
    };
}

pub fn loadCredential(allocator: std.mem.Allocator, service: []const u8, account: []const u8) CredentialError![]u8 {
    if (service.len == 0 or account.len == 0) return error.InvalidArgument;

    return switch (builtin.os.tag) {
        .windows => loadWindows(allocator, service, account),
        .macos => loadSecurity(allocator, &.{ "find-generic-password", "-s", service, "-a", account, "-w" }),
        .linux => loadLinux(allocator, service, account),
        else => error.PlatformUnavailable,
    };
}

pub fn deleteCredential(service: []const u8, account: []const u8) CredentialError!void {
    if (service.len == 0 or account.len == 0) return error.InvalidArgument;

    return switch (builtin.os.tag) {
        .windows => deleteWindows(service, account),
        .macos => runSecurity(&.{ "delete-generic-password", "-s", service, "-a", account }),
        .linux => deleteLinux(service, account),
        else => error.PlatformUnavailable,
    };
}

fn mapSystemError(code: u32) CredentialError {
    return switch (code) {
        2, 1168 => error.NotFound,
        5 => error.AccessDenied,
        else => error.SystemFailure,
    };
}

fn runSecurity(args: []const []const u8) CredentialError!void {
    var argv = std.ArrayList([]const u8).init(std.heap.page_allocator);
    defer argv.deinit();
    argv.append("security") catch return error.OutOfMemory;
    argv.appendSlice(args) catch return error.OutOfMemory;

    const result = std.process.Child.run(.{ .allocator = std.heap.page_allocator, .argv = argv.items }) catch return error.PlatformUnavailable;
    defer std.heap.page_allocator.free(result.stdout);
    defer std.heap.page_allocator.free(result.stderr);
    if (result.term.Exited == 0) return;
    return error.SystemFailure;
}

fn loadSecurity(allocator: std.mem.Allocator, args: []const []const u8) CredentialError![]u8 {
    var argv = std.ArrayList([]const u8).init(allocator);
    defer argv.deinit();
    argv.append("security") catch return error.OutOfMemory;
    argv.appendSlice(args) catch return error.OutOfMemory;

    const result = std.process.Child.run(.{ .allocator = allocator, .argv = argv.items }) catch return error.PlatformUnavailable;
    defer allocator.free(result.stderr);
    if (result.term.Exited != 0) {
        allocator.free(result.stdout);
        return error.NotFound;
    }
    const secret = allocator.dupe(u8, std.mem.trimRight(u8, result.stdout, "\r\n")) catch return error.OutOfMemory;
    allocator.free(result.stdout);
    return secret;
}

fn storeLinux(service: []const u8, account: []const u8, secret: []const u8) CredentialError!void {
    var child = std.process.Child.init(&.{ "secret-tool", "store", "--label=Creature OS", "service", service, "account", account }, std.heap.page_allocator);
    child.stdin_behavior = .Pipe;
    child.stdout_behavior = .Ignore;
    child.stderr_behavior = .Ignore;
    child.spawn() catch return error.PlatformUnavailable;
    child.stdin.?.writer().writeAll(secret) catch return error.SystemFailure;
    child.stdin.?.close();
    const term = child.wait() catch return error.SystemFailure;
    if (term.Exited != 0) return error.SystemFailure;
}

fn loadLinux(allocator: std.mem.Allocator, service: []const u8, account: []const u8) CredentialError![]u8 {
    const result = std.process.Child.run(.{
        .allocator = allocator,
        .argv = &.{ "secret-tool", "lookup", "service", service, "account", account },
    }) catch return error.PlatformUnavailable;
    defer allocator.free(result.stderr);
    if (result.term.Exited != 0) {
        allocator.free(result.stdout);
        return error.NotFound;
    }
    const secret = allocator.dupe(u8, std.mem.trimRight(u8, result.stdout, "\r\n")) catch return error.OutOfMemory;
    allocator.free(result.stdout);
    return secret;
}

fn deleteLinux(service: []const u8, account: []const u8) CredentialError!void {
    const result = std.process.Child.run(.{
        .allocator = std.heap.page_allocator,
        .argv = &.{ "secret-tool", "clear", "service", service, "account", account },
    }) catch return error.PlatformUnavailable;
    defer std.heap.page_allocator.free(result.stdout);
    defer std.heap.page_allocator.free(result.stderr);
    if (result.term.Exited != 0) return error.NotFound;
}

const CREDENTIALW = extern struct {
    Flags: u32,
    Type: u32,
    TargetName: ?[*:0]u16,
    Comment: ?[*:0]u16,
    LastWritten: extern struct { dwLowDateTime: u32, dwHighDateTime: u32 },
    CredentialBlobSize: u32,
    CredentialBlob: ?[*]u8,
    Persist: u32,
    AttributeCount: u32,
    Attributes: ?*anyopaque,
    TargetAlias: ?[*:0]u16,
    UserName: ?[*:0]u16,
};

extern "advapi32" fn CredWriteW(credential: *const CREDENTIALW, flags: u32) callconv(.winapi) i32;
extern "advapi32" fn CredReadW(target_name: [*:0]const u16, credential_type: u32, flags: u32, credential: *?*CREDENTIALW) callconv(.winapi) i32;
extern "advapi32" fn CredDeleteW(target_name: [*:0]const u16, credential_type: u32, flags: u32) callconv(.winapi) i32;
extern "advapi32" fn CredFree(buffer: *anyopaque) callconv(.winapi) void;

fn storeWindows(service: []const u8, account: []const u8, secret: []const u8) CredentialError!void {
    const allocator = std.heap.page_allocator;
    const target = std.unicode.utf8ToUtf16LeWithNull(allocator, service) catch return error.InvalidArgument;
    defer allocator.free(target);
    const user = std.unicode.utf8ToUtf16LeWithNull(allocator, account) catch return error.InvalidArgument;
    defer allocator.free(user);

    var credential = CREDENTIALW{
        .Flags = 0,
        .Type = 1,
        .TargetName = target.ptr,
        .Comment = null,
        .LastWritten = undefined,
        .CredentialBlobSize = @intCast(secret.len),
        .CredentialBlob = @constCast(secret.ptr),
        .Persist = 2,
        .AttributeCount = 0,
        .Attributes = null,
        .TargetAlias = null,
        .UserName = user.ptr,
    };
    if (CredWriteW(&credential, 0) == 0) return mapSystemError(std.os.windows.kernel32.GetLastError());
}

fn loadWindows(allocator: std.mem.Allocator, service: []const u8, _: []const u8) CredentialError![]u8 {
    const target = std.unicode.utf8ToUtf16LeWithNull(allocator, service) catch return error.InvalidArgument;
    defer allocator.free(target);
    var raw_credential: ?*CREDENTIALW = null;
    if (CredReadW(target.ptr, 1, 0, &raw_credential) == 0) return mapSystemError(std.os.windows.kernel32.GetLastError());
    const credential = raw_credential orelse return error.SystemFailure;
    defer CredFree(@ptrCast(credential));
    const blob = credential.CredentialBlob orelse return allocator.alloc(u8, 0) catch error.OutOfMemory;
    return allocator.dupe(u8, blob[0..credential.CredentialBlobSize]) catch error.OutOfMemory;
}

fn deleteWindows(service: []const u8, _: []const u8) CredentialError!void {
    const target = std.unicode.utf8ToUtf16LeWithNull(std.heap.page_allocator, service) catch return error.InvalidArgument;
    defer std.heap.page_allocator.free(target);
    if (CredDeleteW(target.ptr, 1, 0) == 0) return mapSystemError(std.os.windows.kernel32.GetLastError());
}
