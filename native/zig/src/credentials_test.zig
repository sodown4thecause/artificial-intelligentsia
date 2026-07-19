const std = @import("std");
const credentials = @import("credentials.zig");

const service = "creature-os.native-test";
const account = "credential-round-trip";

test "stores and loads a credential without exposing its secret" {
    const secret = "test-secret-value";
    credentials.deleteCredential(service, account) catch |err| switch (err) {
        error.NotFound => {},
        else => return err,
    };
    try credentials.storeCredential(service, account, secret);
    defer credentials.deleteCredential(service, account) catch {};

    const loaded = try credentials.loadCredential(std.testing.allocator, service, account);
    defer std.testing.allocator.free(loaded);
    try std.testing.expectEqualStrings(secret, loaded);
}

test "deletes a credential" {
    try credentials.storeCredential(service, account, "test-secret-value");
    try credentials.deleteCredential(service, account);
    try std.testing.expectError(error.NotFound, credentials.loadCredential(std.testing.allocator, service, account));
}

test "loading a non-existent credential returns NotFound" {
    try std.testing.expectError(error.NotFound, credentials.loadCredential(std.testing.allocator, service, "does-not-exist"));
}
