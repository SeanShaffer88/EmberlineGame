# Validation record — Emberline 0.1.1 — 2026-10-22

This is a **playable preview**, not a claim of a completed device certification or parity with a commercial game.

## Game rules

15 automated test groups passed again under Node.js for this update. They cover deterministic initial state; proximity, energy, harvest quantities and depletion; recipe spending and invalid counts; free recovery without resources; bridge access without world reset; save round trips and malformed input; active-time simulation; greenhouse production; all 16 story milestones completed with normal gathering/crafting/movement; upgrade limits, companions, wildlife and beacon requirements; all eight secrets and final vault; earned equipment and masterwork gating; 100 successive contracts completed with normal game actions; seeded contract variation and endurance resets; and difficulty without content restrictions.

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

This update reran browser smoke, touch gathering/building, and startup-failure checks. A separate environmental QA run verified a touch-generated trail, changing tree transforms, increased snow and dimmer light in a storm fixture, and reduced snow density in Battery saver, with no JavaScript exceptions. Screenshots were visually inspected. Storm state was explicitly set for this visual check; it is not campaign-completion evidence.

Reports are produced in `build/browser-results.json`, `build/touch-results.json`, `build/replay-ui-results.json`, and `build/joystick-results.json`. Screenshots are browser captures, not photographs or screenshots of a Galaxy S24 Ultra. Software renderer speed is not a mobile performance measurement.

## Android package

Built with OpenJDK 17.0.20.1, Android 31 platform stubs, and Android build-tools 35.0.0. Package: `com.seanshaffer.emberline`, versionCode 2, versionName 0.1.1, minSdk 29, targetSdk 35. Release signing is separate from the source tree; debugging is disabled. APK signature and 16 KB ZIP alignment checks pass. There are no native `.so` libraries, so there is no bundled ELF page-size or ABI-specific dependency.

Signer certificate SHA-256: `6adb1d3400cdf72d42797af9235b1b70fba217131e2c2cef3e12dc0d310dce09`.

ZIP CRC checks pass; all 11 bundled web files match the tested source byte for byte. The APK is 488,617 bytes; SHA-256: `81b474ca320d8ac6f862b13d28ab2a85a8bc18663de9f8c87f7eb349ae024f14`.

The manifest requests no permissions, including no INTERNET, billing, advertising ID, analytics, or storage permissions. The user-selected document provider is used for save export/import. Assets, code and sounds are local; no service-worker cache or remote service is needed.

## Startup regression and native Android checks

The reported 0.1.0 loading-screen hang was reproduced in the Android emulator. Its AAPT2-generated archive contained raw backslashes in nested vendor paths, so Android could not open the renderer dependency. The earlier Windows ZIP inspection had silently normalized those filenames and missed the problem. A regression fixture now writes a genuine backslash entry and verifies canonical output, DEX inclusion, resource compression, and CRCs. The final APK has no raw backslash entries.

A classic bootstrap script now catches failed module loads and early exceptions, offers retry, and displays Android/WebView details. Browser failure-injection checks confirm that both failure paths preserve the saved settlement and that retry restores it. An error after startup does not cover the running game.

An AOSP Android 15 / API 35 x86_64 emulator, Android System WebView 124.0.6367.219, 720×1560 screen, and software GPU were used. Airplane mode remained enabled for native game checks. No physical phone was connected.

Native checks completed during this update:

- Installed the repaired APK over the original using the same package and signing certificate; loading reaches the rendered game.
- Started a game, dismissed the guide, selected a tree by touch, walked to it, and gathered six timber.
- Crafted two planks; inventory became nine timber and two planks, with the harvested tree stock reduced by one.
- Force-stopped/relaunched and backgrounded/resumed the Activity. Exported JSON confirmed the resource counts, harvested stock, and Battery saver setting survived.
- Exported through Android's native document picker; consumed one food; imported the exported file through the native picker and observed food restored from four to five.
- Installed the final movement build over that save, cold-launched in airplane mode, and verified retained inventory/settings, version 0.1.1, responsive walking, and visible footprints.
- Inspected screenshots for status/navigation-bar spacing. The final walking check produced no Emberline or AndroidRuntime error log entries.

The exact final APK was signature/alignment/CRC checked and its 11 web assets compared byte for byte with the working source. Debugging is disabled in the release.

## Physical-phone check — Galaxy S24 Ultra — 2026-10-23

The owner installed 0.1.1 on the target Galaxy S24 Ultra and ran the recommended phone check below. They reported no problems and smooth play. Their only request was joystick movement, which was then added (see below). This is an owner playtest report, not a measured frame-rate, battery, or certification result. Full campaign and long replay runs remain verified in model tests, not played end to end on Android.

## Joystick movement (0.1.2 source)

`tests/joystick.mjs` checks in headless Chrome at 412×915 with touch emulation that the joystick does not overlap Return & rest, the menu bar, the place name, or the action card; that holding it right, up, left, and down walks at least two tiles in the matching screen direction and stops on release; that arrow keys do the same; that it clears a selection; and that the position reached survives reload, with no JavaScript errors. The model and the other browser suites still pass. Source is versioned 0.1.2 (versionCode 3). The joystick has not yet been built into a signed APK or tested on the phone; the APK, signature, and hash records above are for 0.1.1.

Recommended phone check: update without uninstalling → cold-launch in airplane mode → walk and gather → craft → close/relaunch → verify progress → export/import backup → background/resume. Keep the same signing identity for future updates.
