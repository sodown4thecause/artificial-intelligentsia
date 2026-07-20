# D8: Native-first desktop UI with selective WebView surfaces

**Status:** Decided

## Context and problem statement

Creature OS is a native desktop product, but Native SDK is pre-1.0. The desktop client must provide responsive workspace navigation, reliable operating-system integration, secure credential handling, offline behavior, and deterministic automation. At the same time, some flows—particularly authentication and specialised, fast-moving interactive surfaces—may be safer or more practical to host in an embedded or companion web surface.

The decision is how to preserve a coherent native product without coupling product and domain behavior to experimental Native SDK APIs or turning the application into a WebView shell.

## Options considered

### 1. Fully native

Implement every surface with Native SDK.

- **Advantages:** consistent desktop interaction, direct access to platform capabilities, and a single rendering model.
- **Disadvantages:** maximum exposure to pre-1.0 API churn; slower delivery for complex web-oriented flows; no practical fallback when a required native capability is incomplete.

### 2. Fully WebView-backed

Render the product in a WebView and use a thin native host only for packaging.

- **Advantages:** reuse of web UI expertise and components, rapid iteration, and fewer platform-specific rendering concerns.
- **Disadvantages:** compromises native performance and integration, broadens the security boundary, weakens deterministic native UI testing, and contradicts the product's native-desktop architecture.

### 3. Hybrid / selective WebView backing

Make native rendering the default and permit isolated WebView-backed surfaces only where their value outweighs the integration cost.

- **Advantages:** retains native desktop strengths while providing a contained compatibility and delivery escape hatch for suitable complex flows.
- **Disadvantages:** introduces two rendering and test paths, requires explicit navigation and data-boundary rules, and can drift toward a WebView shell without governance.

## Decision

Adopt a **native-first hybrid** approach. The primary application shell and core daily-work surfaces are fully native; WebViews are allowed only as individually approved, bounded adapters.

### Surfaces that must be native

- Application windows, navigation, workspace layout, command palette, and keyboard shortcuts.
- System tray, notifications, clipboard, file dialogs, desktop packaging, updates, and local cache/offline-queue status.
- Credential and permission prompts, approval controls, and any flow that reads or writes operating-system credential storage.
- Core task, inbox, calendar, writing, and agent-control views, including their loading, error, and offline states.

### Surfaces eligible for WebView backing

- Authentication and identity-provider journeys where the provider requires or materially benefits from a browser-compatible flow.
- Isolated complex or vendor-owned interactive surfaces whose native implementation would duplicate a mature web capability or is blocked by a Native SDK limitation.
- A companion web surface when an embedded WebView is unsuitable, subject to the same boundary and security rules.

A WebView is not eligible merely because it is faster to build. Each use must document its owner, why native is unsuitable, its permitted origin(s), data contract, navigation/close behavior, fallback behavior, and test coverage. WebViews must not become the default container for application navigation or core workspace UI.

### Boundary rules

- Native SDK APIs are available only inside desktop/platform adapters. UI state and business/domain services depend on application-defined interfaces, not Native SDK types, imports, or callbacks.
- WebView adapters receive only the minimum scoped data needed for their surface. They use explicit message contracts and allowlisted origins; they do not receive direct credential-store, file-system, clipboard, notification, or privileged bridge access.
- Authentication tokens and desktop credentials remain under native adapter control. A WebView may complete an authentication interaction but must not own durable credential storage.
- The native shell owns routing, lifecycle, permission decisions, telemetry policy, and error recovery for WebView surfaces.

## Consequences

### Performance

Core interactions remain native, avoiding WebView startup, memory, and rendering overhead in the most frequent workflows. Approved WebViews carry an additional launch and resource cost, so they must be lazy-loaded, disposable, and measured independently.

### Security

The native shell retains control of credentials and privileged operating-system operations. WebViews add an untrusted-content boundary, therefore require allowlisted origins, minimal scoped data, explicit messaging, and no implicit privilege escalation. This limits the blast radius of authentication or vendor UI defects.

### Maintainability

The hybrid model has an intentional adapter cost, but it contains Native SDK churn and lets an approved web surface be replaced without rewriting domain behavior. Native remains the default to prevent two competing implementations of every core feature.

### Testability

Native core flows use deterministic Native SDK UI automation. Every WebView-backed surface requires contract tests for its bridge, integration tests for its allowlist and lifecycle, and end-to-end coverage of the native-to-web handoff and failure path. Domain tests run against application interfaces without requiring either renderer.

### Native SDK API isolation

Experimental Native SDK APIs must not leak into business logic. Desktop adapters translate platform events and capabilities into stable application interfaces; dependency injection or composition supplies those interfaces to UI state and domain services. SDK upgrades are therefore tested and contained at adapter boundaries.

## References

- [PRD §12.1 — Native desktop client](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#121-native-desktop-client)
- [PRD §18, Risk 2 — Native SDK is pre-1.0](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#risk-2-native-sdk-is-pre-10)
- [PRD §19, D8 — Native SDK UI surface decision](../../prd/CREATURE_PRD_EVE_NATIVE_SDK.md#19-open-product-decisions)
