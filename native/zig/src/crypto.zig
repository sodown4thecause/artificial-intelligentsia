const std = @import("std");

pub const Key = [32]u8;
pub const Nonce = [12]u8;
pub const Tag = [16]u8;

pub const Encrypted = struct {
    ciphertext: []u8,
    nonce: Nonce,
    tag: Tag,
};

/// Derives a 256-bit key without retaining the password or salt.
pub fn deriveKey(password: []const u8, salt: []const u8) Key {
    var key: Key = undefined;
    std.crypto.pwhash.pbkdf2(&key, password, salt, 100_000, std.crypto.auth.hmac.sha2.HmacSha256) catch unreachable;
    return key;
}

pub fn encrypt(allocator: std.mem.Allocator, plaintext: []const u8, key: Key) !Encrypted {
    var nonce: Nonce = undefined;
    std.crypto.random.bytes(&nonce);
    const ciphertext = try allocator.alloc(u8, plaintext.len);
    var tag: Tag = undefined;
    std.crypto.aead.aes_gcm.Aes256Gcm.encrypt(ciphertext, &tag, plaintext, "", nonce, key);
    return .{ .ciphertext = ciphertext, .nonce = nonce, .tag = tag };
}

pub fn decrypt(allocator: std.mem.Allocator, ciphertext: []const u8, nonce: Nonce, tag: Tag, key: Key) ![]u8 {
    const plaintext = try allocator.alloc(u8, ciphertext.len);
    std.crypto.aead.aes_gcm.Aes256Gcm.decrypt(plaintext, ciphertext, tag, "", nonce, key) catch {
        allocator.free(plaintext);
        return error.AuthenticationFailed;
    };
    return plaintext;
}

test "AES-GCM rejects modified ciphertext" {
    const allocator = std.testing.allocator;
    const key = deriveKey("password", "salt");
    var encrypted = try encrypt(allocator, "private", key);
    defer allocator.free(encrypted.ciphertext);
    encrypted.ciphertext[0] ^= 1;
    try std.testing.expectError(error.AuthenticationFailed, decrypt(allocator, encrypted.ciphertext, encrypted.nonce, encrypted.tag, key));
}
