# Validation record — Emberline 0.2.0

Checks performed 2026-10-22; release packaged 2026-10-23.

This is a playable preview. No physical Galaxy S24 Ultra was connected, and this record does not claim commercial-game parity, device certification, sustained phone performance or an end-to-end human campaign playtest.

## Rules, save compatibility and asset provenance

`npm test`: 17 groups pass (16 rules/save groups and one asset-integrity group). Coverage includes the full 16-milestone campaign with ordinary economy/movement, all eight keepsakes and the vault, 100 successive contracts, upgrades, inventory bounds, recovery, active-time-only progression, bridge access without resetting the world, malformed saves, and difficulty without content locks. The new migration check loads a 0.1.x save without a music preference, preserving inventory, buildings, recruitment and master mute; a disabled music preference survives roundtrip.

All 16 bundled GLBs and the train palette texture match their provenance hashes. Every external glTF reference resolves locally inside the asset directory. The curated model subset previously passed Khronos glTF Validator 2.0.0-dev.3.10 with zero errors/warnings; the identical validated bytes are shipped. Model scene roots, lengths, licenses and title-art hash are checked in `tests/assets.test.mjs`. Source/asset licenses and image generation prompts are included.

## Browser and touch checks

Headless Chrome with software WebGL2, touch input and 412×915 viewport was used, with additional 360×740, 480×1040 and landscape layout checks. Reports and screenshots are generated in ignored `build/`.

- `browser-smoke.mjs`: title/field guide, loaded scene, crafting, build/journal menus, reload, free rest, graphics/audio settings, invalid-import preservation and viewport overflow checks pass. No external requests or uncaught JS errors.
- `touch-flow.mjs`: real raycast selection on the new pine, walking, two harvests, first quest reward, crafting, permanent Hearth upgrade and reload persistence pass. Menus and gameplay continue after browser disconnection. The representative capture reported 374 draw calls / 12,670 triangles; this is not a phone frame-rate measurement.
- `replay-ui.mjs`: difficulty, contracts, lore, badges, earned equipment/liveries, lifecycle pause/resume, secret touch interaction, save persistence and rescued-crew remarks pass.
- `startup.mjs`: injected missing modules and early exceptions show retry/details without overwriting a save; retry restores the saved game.
- `art-audio.mjs`: all 16 models and the palette texture load with no CSP, console, shader or JS errors and no external resource requests. An older save retains progress. Master audio and independent music settings work; lifecycle pause suspends AudioContext. OfflineAudioContext produces finite, non-silent, unclipped note/footstep samples. This is synthesis validation, not a speaker listening test.
- Explicit upgraded/storm fixtures check visible wagon, porch, lamps and building rewards, moving crew/hare/trees, unchanged home coordinates, storm intensity and Battery saver. The upgrade screenshot is a constructed visual fixture, not campaign-completion evidence.
- Injected failures of all optional models retain playable original geometry and functional startup/crafting. The model loader has an eight-second timeout; the existing bootstrap watchdog remains enabled.

Screenshots of initial, upgraded and native scenes were inspected. The square fog boundary was replaced with a soft local mask, snow exposure was reduced, coal models were bounded to avoid oversized resource silhouettes, and the detailed bridge is displayed only after its repair flag is earned.

## Android package

Package `com.seanshaffer.emberline`, versionCode 3, versionName 0.2.0, minSdk 29, targetSdk 35. Built using OpenJDK 17.0.20.1, platform 31 stubs and Android build-tools 35.0.0. There are no native `.so` libraries. Production WebView debugging is disabled.

- Size: **3,067,448 bytes**.
- SHA-256: `991f7cac61e9ef645f6e3d37edbc10b72935c1576e0da7fab29d6fabce33802f`.
- Signer SHA-256: `6adb1d3400cdf72d42797af9235b1b70fba217131e2c2cef3e12dc0d310dce09` (unchanged).
- APK signature, ZIP alignment and CRC checks pass. All **38 web assets** match the tested working source byte for byte; raw ZIP entry names contain no backslashes.
- `tests/package-apk.test.py` passes the original raw-backslash packaging regression.
- No Android permissions are requested, including INTERNET. Local GLB fetches are allowed only to the app's intercepted origin; external requests/navigation are blocked. No CDN, service worker, account or runtime server is required.

## Native Android checks

AOSP Android 15 / API 35 x86_64 emulator, Android System WebView 124.0.6367.219, 720×1560 screen and software GPU. Airplane mode remained enabled. Audio output is disabled on this emulator.

Installed 0.2.0 over the existing 0.1.1 package with the same signing identity. The game resumed with nine timber, two planks, five food, six gathered timber, depleted tree stock and Battery saver preserved. The new train, trees and winter materials rendered.

Touch-selected the new pine, walked to it and harvested six timber; the first quest completed. Crafted two more planks and received the crafting milestone reward. Reinstalled the final package over this progress, cold-launched and exported through Android's document picker. The exported JSON confirmed 12 timber, four planks, eight food, ten salvage, two completed milestones and first-pine stock two. Music defaulted on and Battery saver stayed selected. Turning music off and importing that backup through the native picker restored the music-on preference and settlement. Balanced graphics also rendered on the emulator. After retaining the exported test save, cleared only the emulator app data and verified a clean first launch reaches the illustrated title in airplane mode. No Emberline or AndroidRuntime errors were observed in the final native checks.

## Practical limits

The original startup defect remains covered by canonical packaging and startup diagnostics. Emulator and desktop checks cannot establish Samsung GPU behavior, sustained frame rate, battery drain, touch feel or audible mix quality on the Galaxy S24 Ultra. A device playtest remains necessary for those. The campaign and long contract sequence were verified in pure model tests, not played end to end on Android.
