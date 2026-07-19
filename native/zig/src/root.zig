const std = @import("std");
const credentials = @import("credentials.zig");

pub const CredentialError = credentials.CredentialError;
pub const storeCredential = credentials.storeCredential;
pub const loadCredential = credentials.loadCredential;
pub const deleteCredential = credentials.deleteCredential;

const version = "0.1.0";

pub export fn creature_native_init() callconv(.c) c_int {
    return 0;
}

pub export fn creature_native_version() callconv(.c) [*:0]const u8 {
    return version;
}

pub export fn creature_credential_store(service: [*:0]const u8, account: [*:0]const u8, secret: [*:0]const u8) callconv(.c) c_int {
    credentials.storeCredential(std.mem.span(service), std.mem.span(account), std.mem.span(secret)) catch |err| return errorCode(err);
    return 0;
}

pub export fn creature_credential_load(service: [*:0]const u8, account: [*:0]const u8, out_secret: *?[*]u8, out_len: *usize) callconv(.c) c_int {
    out_secret.* = null;
    out_len.* = 0;
    const secret = credentials.loadCredential(std.heap.c_allocator, std.mem.span(service), std.mem.span(account)) catch |err| return errorCode(err);
    defer std.heap.c_allocator.free(secret);

    const allocation = std.c.malloc(secret.len + 1) orelse return errorCode(error.OutOfMemory);
    const result: [*]u8 = @ptrCast(allocation);
    @memcpy(result[0..secret.len], secret);
    result[secret.len] = 0;
    out_secret.* = result;
    out_len.* = secret.len;
    return 0;
}

pub export fn creature_credential_delete(service: [*:0]const u8, account: [*:0]const u8) callconv(.c) c_int {
    credentials.deleteCredential(std.mem.span(service), std.mem.span(account)) catch |err| return errorCode(err);
    return 0;
}

pub export fn creature_free_string(pointer: ?[*]u8) callconv(.c) void {
    if (pointer) |value| std.c.free(value);
}

fn errorCode(err: CredentialError) c_int {
    return -@as(c_int, @intFromError(err));
}

test {
    _ = @import("credentials_test.zig");
}
