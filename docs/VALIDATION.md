# Validation record — 2026-10-22

This is a **playable preview**, not a claim of a completed device certification or parity with a commercial game.

## Game rules

15 automated test groups pass under Node.js. They cover deterministic initial state; proximity, energy, harvest quantities and depletion; recipe spending and invalid counts; free recovery without resources; bridge access without world reset; save round trips and malformed input; active-time simulation; greenhouse production; all 16 story milestones completed with normal gathering/crafting/movement; upgrade limits, companions, wildlife and beacon requirements; all eight secrets and final vault; earned equipment and masterwork gating; 100 successive contracts completed with normal game actions; seeded contract variation and endurance resets; and difficulty without content restrictions.

Tests run in `tests/model.test.mjs`. The complete campaign and 100-contract simulations do not advance real travel time, render graphics, or establish human play balance.

## Rendered browser/touch verification

Separate headless Chrome sessions with software WebGL2 and touch input checked:

- First launch, title, field guide, original 3D scene, crafting, settlement and journal UI.
- Touch raycasting, walking to a resource, two harvests, quest rewards, crafting and a permanent Hearth upgrade.
- Save/reload preserving inventory, harvested nodes, buildings, difficulty, secrets, badges and contracts.
- Free rest, graphics/sound settings, and rejection of invalid imports without changing progress.
- Gameplay and menus continuing after external connectivity was disabled following asset loading.
- No external resource requests and no uncaught JavaScript errors.
- Portrait viewports 360×740, 412×915 and 480×1040, plus a landscape resize check. No horizontal document overflow; screenshots inspected for layout.
- Secret discovery near a cairn, actual touch interaction, and the original lore dialog.
- Contract board, free contract replacement, collection clues, 25 badges, equipment locks, six earned liveries, and difficulty selection.
- A separately identified rescued-crew visual fixture: three camp remarks, remarks changing after the beacon, and an active companion disappearing from camp. This fixture is not evidence of completing the campaign through the touch UI.
- Calling the Android-facing pause/resume hooks freezes/resumes simulation without elapsed-time catch-up.

Reports are produced in `build/browser-results.json`, `build/touch-results.json`, and `build/replay-ui-results.json`. Screenshots are browser captures, not photographs or screenshots of a Galaxy S24 Ultra. Software renderer speed is not a mobile performance measurement.

## Android package

Built with OpenJDK 17.0.20.1, Android 31 platform stubs, and Android build-tools 35.0.0. Package: `com.seanshaffer.emberline`, versionCode 1, versionName 0.1.0, minSdk 29, targetSdk 35. Release signing is separate from the source tree; debugging is disabled. APK signature and 16 KB ZIP alignment checks pass. There are no native `.so` libraries, so there is no bundled ELF page-size or ABI-specific dependency.

Signer certificate SHA-256: `6adb1d3400cdf72d42797af9235b1b70fba217131e2c2cef3e12dc0d310dce09`.

ZIP CRC checks pass; all 10 bundled web files match the tested source byte for byte. The APK is 480,371 bytes; SHA-256: `d848bdee27569b3c9f25812a69068143953952dd84b523f17f29d49391f3c05a`.

The manifest requests no permissions, including no INTERNET, billing, advertising ID, analytics, or storage permissions. The user-selected document provider is used for save export/import. Assets, code and sounds are local; no service-worker cache or remote service is needed.

## Outstanding device checks

No Android device or emulator was connected during this build. Physical installation/upgrade, airplane-mode cold launch, Samsung/WebView GPU rendering and sustained frame rate, audio, app/background lifecycle delivery, safe areas, touch feel, native document export/import and battery behavior remain unverified. The Java shell compiles and the lifecycle hooks pass browser tests; that is not equivalent to those native flows passing on a phone.

The requested target is Galaxy S24 Ultra. Recommended first-device route: install → launch in airplane mode → gather twice → craft → build Hearth → close/relaunch → verify progress → export/import backup → background/resume → walk across the repaired bridge. Keep the same signing identity for updates.
