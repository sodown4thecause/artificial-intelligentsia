# Cold-start performance baseline

## Target

After warm-up, Creature OS must make the desktop process available in less than
**2,000 ms** on reference hardware. The measured interval begins immediately
before the desktop bootstrap function is called and ends when it resolves (the
tray is available to the user). It intentionally excludes installation,
operating-system login, and the first launch after an application update.

## Reference hardware

| Platform | Reference profile | OS |
| --- | --- | --- |
| Windows | Intel Core i7-12700, 32 GB RAM, NVMe SSD | Windows 11 23H2 or later |
| macOS | Apple M2, 16 GB unified memory, SSD | macOS 14 or later |
| Linux | AMD Ryzen 7 5700X, 32 GB RAM, NVMe SSD | Ubuntu 24.04 LTS |

## Methodology

1. Build the production desktop bundle and run it once to populate code-signing,
   shader, and application caches.
2. Close all Creature OS processes. Leave the OS logged in and avoid CPU-heavy
   foreground tasks.
3. Run the measurement five times per platform:

   ```sh
   npx tsx scripts/measure-cold-start.ts --module ./path/to/desktop-bootstrap.js
   ```

   The supplied module must export `async bootstrapDesktop()`. The script prints
   a machine-readable duration and exits non-zero when it exceeds 2,000 ms.
4. Record every run, plus median and p95. Use the p95 to determine whether the
   target is met. CI only asserts the relaxed 5,000 ms guardrail because shared
   runners are not performance-reference hardware.

`desktop-bootstrap` timing events are emitted with `started`, `completed`, or
`failed` phases. Platform adapters may subscribe through `onLifecycleTiming`
to forward the same marks to telemetry without adding a platform dependency.

## Current baseline measurements

| Platform | Runs (ms) | Median | p95 | Status |
| --- | --- | ---: | ---: | --- |
| Windows reference | Pending first production-bundle capture | — | — | Not yet measured |
| macOS reference | Pending first production-bundle capture | — | — | Not yet measured |
| Linux reference | Pending first production-bundle capture | — | — | Not yet measured |

The repository previously had no consistent bootstrap boundary or benchmark
harness, so there are no trustworthy historic values to report. Fill this table
only with measurements produced by the command above; do not compare debug
build or first-install results to this baseline.

## Known limitations

- The metric covers desktop bootstrap to tray availability, not renderer first
  paint or remote-service readiness.
- It relies on the platform adapter exposing its production bootstrap function
  as `bootstrapDesktop`; process-launch and code-signing overhead are therefore
  outside the interval.
- Results vary with antivirus scanning, power mode, memory pressure, and SSD
  state. Keep those conditions in the run notes.
- CI protects against gross regressions only; reference-hardware captures are
  required to validate the two-second product target.
