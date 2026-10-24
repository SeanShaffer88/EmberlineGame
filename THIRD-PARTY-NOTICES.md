# Third-party notices and provenance

The runtime includes **three.js 0.186.1**, copyright © 2010–2026 three.js authors, under the MIT License. The full notice is bundled at `web/vendor/THREE-LICENSE.txt`, including inside the APK. Source: https://github.com/mrdoob/three.js. The lockfile records package integrity. The renderer, matching GLTFLoader, BufferGeometryUtils and SkeletonUtils are vendored; all imports are local.

**Kenney Train Kit 1.1 and Nature Kit** supply 16 models and a palette texture under CC0-1.0. Official sources: https://kenney.nl/assets/train-kit and https://kenney.nl/assets/nature-kit. Train Kit additionally credits Guus Vermeulen and Tony Schaer. Complete pack license notices are included in `web/assets/licenses/`. Exact model/texture hashes, source archive hashes, source URLs and modifications are in `web/assets/asset-manifest.json`.

Twelve Nature Kit files had an invalid scene-root reference corrected to their existing identity parent; geometry, materials and binary data were preserved. All 16 curated models passed Khronos glTF Validator 2.0.0-dev.3.10 with zero errors and warnings. Full reports are in `web/assets/validation.json`. Emberline applies its winter palette, snow shader and livery recoloring at runtime. This check covers the bundled subset, not entire upstream packs.

The original title illustration (`web/assets/title.png`) was created with OpenAI image generation for Emberline. Exact prompts and the authoring reference description are retained in `web/assets/generation-prompts.json`; the shipped PNG hash is in the asset manifest. It is a 2D title illustration, not a gameplay screenshot. The project license covers original project contributions to the extent applicable; third-party assets retain their own terms.

Game rules, writing, UI, characters, decorations, animation routines, synthesized effects and the procedural musical arrangement were authored for Emberline. No proprietary game maps, assets, binaries, dialogue or branding are bundled. Music runs as local Web Audio synthesis; ACE-Step is not installed or used by the APK.

Playwright 1.64.1 is a development/test dependency under Apache-2.0 and is not in the APK. Source: https://github.com/microsoft/playwright. The glTF Validator used during asset curation is an Apache-2.0 authoring tool and is not part of the runtime.

The Java shell uses Android platform APIs. SDK/JDK tools are external build tools and are not redistributed. Android System WebView is provided by the device. No game engine, MCP service, cloud service, account, analytics or external network connection is required at runtime.
