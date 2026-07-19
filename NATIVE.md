# Creature Native SDK

The Native SDK provides OS-backed credential storage to the desktop application.

## Prerequisites

Install [Zig 0.13 or newer](https://ziglang.org/download/). The TypeScript bridge uses
[`koffi`](https://koffi.dev/), installed with the application dependencies.

## Build and test

```sh
npm run native:build
npm run native:test
```

The library is written to `native/zig/zig-out/lib/`:

- Windows: `creature_native.lib` and `creature_native.dll`
- macOS: `libcreature_native.a` and `libcreature_native.dylib`
- Linux: `libcreature_native.a` and `libcreature_native.so`

Set `CREATURE_NATIVE_LIB_PATH` to the native binary used by the desktop host. Native builds are
opt-in after install: set `CREATURE_BUILD_NATIVE=1` before running `npm install`.

## Platform backends

- **Windows:** Windows Credential Manager (`CredWriteW`, `CredReadW`, and `CredDeleteW`).
- **macOS:** the system `security` utility, which writes to the login Keychain.
- **Linux:** `secret-tool`, the libsecret command-line client. Install a Secret Service provider
  such as GNOME Keyring or KWallet. The TypeScript bridge uses its non-persistent in-memory fallback
  only when the native library itself is unavailable (for CI and tests).

Credential values are intentionally never written to application logs, prompts, or telemetry.
