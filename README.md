# Creature OS

[![CircleCI](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia.svg?style=shield&branch=main)](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/tree/main)

Creature OS is an AI-native work operating system, with **Go Agent** as its primary assistant module for durable, approval-aware work.

## Downloads

> **Prerelease — developer artifacts only.** Version 0.1.0 archives are native-library build artifacts, **not installers**. Launch packaging, signing/notarization, production keyring integration, live-service validation, and human Gate 1 sign-off remain pending. Do not treat these files as a production-ready desktop release.

| Platform | Download |
| --- | --- |
| Linux (x86_64) | [`creature-os-v0.1.0-linux-x86_64-native.zip`](https://github.com/sodown4thecause/artificial-intelligentsia/releases/download/v0.1.0/creature-os-v0.1.0-linux-x86_64-native.zip) |
| macOS (Arm64) | [`creature-os-v0.1.0-macos-arm64-native.zip`](https://github.com/sodown4thecause/artificial-intelligentsia/releases/download/v0.1.0/creature-os-v0.1.0-macos-arm64-native.zip) |
| Windows (x86_64) | [`creature-os-v0.1.0-windows-x86_64-native.zip`](https://github.com/sodown4thecause/artificial-intelligentsia/releases/download/v0.1.0/creature-os-v0.1.0-windows-x86_64-native.zip) |

See the [v0.1.0 release](https://github.com/sodown4thecause/artificial-intelligentsia/releases/tag/v0.1.0) for release details. Each archive contains the native library, a SHA-256 checksum, build-evidence JSON, and launch/keyring-status evidence.

## Development

Install dependencies, then run the repository scripts:

```sh
npm install
npm test
npm run typecheck
npm run native:build
```

`native:build` requires [Zig](https://ziglang.org/) on your `PATH`.

## Project status and documentation

- [Gate 1 closure assessment](docs/gates/gate-1-closure.md)
- [Reference environments](docs/reference-environments.md)
