# Reference environments

Creature OS desktop releases are supported on the following end-user environments. CI validates a native runner for each operating-system family; it does not make a Linux artifact portable to macOS or Windows.

## Supported operating systems

| Platform | Supported versions | CI reference runner |
| --- | --- | --- |
| Windows | Windows 10 22H2 (x64) and Windows 11 23H2 or later (x64/Arm64 where packaged) | Windows Server 2022 |
| macOS | macOS 13 Ventura, 14 Sonoma, and 15 Sequoia (Apple Silicon and Intel where packaged) | macOS Apple Silicon, Xcode 15.2 |
| Linux | Ubuntu 22.04 LTS and 24.04 LTS (x86_64) | Linux container, Node 22 |

Older operating systems may work but are not release-blocking test targets. The desktop release notes must identify an architecture when a platform-specific installer is published.

## CI desktop flow matrix

CircleCI runs the same deterministic desktop-flow suite on the Windows, macOS, and Linux reference runners. Each job runs:

```sh
npm ci
npm run verify:platform-flows
npm run typecheck
npm run test:unit
npm run test:eval
npm run test:e2e
npm run test:redteam
```

`npm run verify:platform-flows` emits one artifact-friendly line per platform label. Every line must list `email-to-work`, `document-improvement`, `approval-resume`, and `automation-simulate-apply-reverse`. The deterministic tests select these labels directly, so they do not inspect the host filesystem, load a native library, access a provider, or require secrets.

The native-library CI matrix also compiles, build-tests, smokes, checksums, records evidence JSON for, and retains each platform library. It is not an installer/package, installation, launched-desktop, or OS-keyring smoke test. Release candidates still require separate evidence that installed Windows, macOS, and Linux desktop packages and their credential services initialize successfully on their target architecture.

## Prerequisites

- A supported, fully patched operating system; local system clock synchronization is required for provider authentication.
- 4 logical CPU cores, 8 GB RAM, and 5 GB free disk space are the minimum supported baseline. 16 GB RAM is recommended when running local tools alongside Creature OS.
- A modern TLS 1.2+ network path to the configured backend and identity/provider endpoints. Corporate TLS interception must allow the application’s trust configuration.
- OS credential storage must be available: Windows Credential Manager, macOS Keychain, or a Secret Service-compatible Linux keyring.
- Linux installs require an X11 or Wayland desktop session, `libnotify`, and a functioning keyring. Distribution packages may have additional shared-library dependencies.

## Performance baselines

Measure release candidates on a clean reference environment with a normal broadband connection and an account containing up to 10,000 indexed items. These are release-readiness guardrails, not guarantees for every provider.

| Journey | Baseline |
| --- | --- |
| Cold launch to interactive shell | p95 <= 5 seconds |
| Warm launch to interactive shell | p95 <= 2 seconds |
| Open a local view after launch | p95 <= 500 ms |
| Queue an approved action locally | p95 <= 1 second |
| Memory at idle after initial sync | <= 500 MB |

Record hardware, OS version, app build, network conditions, account size, and p50/p95 measurements for every release candidate. Investigate a regression greater than 15% or any missed baseline before promoting the release.

## Known limitations

- Linux support is limited to the listed Ubuntu LTS releases; other distributions are best effort.
- Wayland notification, clipboard, and deep-link behavior can vary by desktop environment.
- Native installers are not published until the signing, notarization, and packaging commands replace the CI placeholders. The current CI artifact is a release-review placeholder, not an installable product.
- Offline work is limited to data already cached locally; provider actions require connectivity and a valid authorization.
- Screen-reader, high-contrast, and non-English locale validation is tracked per release and must be recorded in release notes when incomplete.
# Gate 1 native evidence status (2026-07-22)

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| D1 naming | **PASS/CLOSED** | Product: **Creature OS**; primary assistant module: **Go Agent**. |
| Native-library CI | **PASS** | [Successful CircleCI workflow](https://app.circleci.com/workflow/67015e34-5490-4e31-9520-3e90477a2bd8): [macOS 142](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/142), [Windows 143](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/143), [Linux 144](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/144), and [artifact publication 145](https://circleci.com/gh/sodown4thecause/artificial-intelligentsia/145) passed native-library compilation, build tests, smoke checks, checksums, evidence JSON, and retention. [PR #30](https://github.com/sodown4thecause/artificial-intelligentsia/pull/30) (`ec9139a`) introduced this matrix/evidence. |
| Published native-library archives | **PASS** | The [`v0.1.0` prerelease](https://github.com/sodown4thecause/artificial-intelligentsia/releases/tag/v0.1.0) contains platform native-library archives; [PR #31](https://github.com/sodown4thecause/artificial-intelligentsia/pull/31) (`f3af0d2`) added README and release links. |
| Native SDK Windows directory package and launch | **LOCAL PASS ONLY** | `vercel-labs/native` CLI 0.5.4 checked, built, packaged, and launch-smoked `apps/desktop-native` on Windows with Zig 0.16.0. The package executable was `package/windows/bin/creature-os-go-agent.exe`; it remained alive for 2,322 ms before the smoke terminated it. Its required `gpu_surface` is the Native SDK canvas renderer, not a WebView; no web, network, filesystem, shell, or credentials permission is declared. |
| Installer/package, installation, launch, signing/notarization, and production OS keyring write/read/delete | **BLOCKED/NOT IMPLEMENTED** | Native-library archives are developer artifacts only, not installers or runnable desktop packages. |
