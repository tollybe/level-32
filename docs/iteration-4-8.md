# Day 4.8 — Two-player Playtest Fixes (review branch)

**Status:** implemented in PR #8; Android/iPhone real-device re-test and balance acceptance pending. **No Day 5 sprite implementation.**

## Real player feedback
Daan and the host tested together on a phone:
1. Daan needs a visible character, not just an anonymous combat mechanic.
2. Tolly felt too easy for two players.
3. Gameplay actors are too static.
4. Rendering gets laggy at points.
5. Dialogue sometimes feels as though it immediately drops the player into combat; player requests `C` for next dialogue page, not arrow keys.
6. `Shift` as P1 DASH is too easy to overlook.

## Implemented changes
- **Tolly:** co-op HP base 1430 vs 1070; solo base 990 vs 845 before difficulty modifier. Story mode intentionally reduced to 0.67 of this base, Extreme scales to 1.65. Slightly increased Adventure boss speed; changed shockwave/banana timing, with an additional telegraphed last-quarter `rage` state. Difficulty is SUBJECTIVE until same testers replay it, and the priority is challenge without unavoidable hits.
- **Daan:** an on-field animated **provisional actor**, with legs, body, arms and the *existing temporary emblem* used as a badge/head. It is not an attempt to recreate the real Daan; it is NOT the approved canonical character portrait. An approved source photo or clear visual description + explicit sign-off is needed for real illustration. His extra telegraphed Extreme support attack is still controlled by the original mechanics. Do not modify pets' canonical portraits.
- **Animation:** small movement bobs and dash glows for player portrait discs (existing exact images), subtle Tolly bob/tilt and damage flashes, bouncy temporary Daan support actor. **No Chibi Renaissance sprite sheets or replacement portrait art**.
- **Performance:** coarse-pointer touch begins with Lite FX enabled, reducing decorative scenery density, text shadows, HUD DOM redraw frequency and popup-effect caps. Actors/projectiles remain mechanically unchanged. Added optional `LITE FX` toggle; still needs mobile FPS measurement.
- **Cutscenes:** `C` advances lines when in a cinematic; arrows, WASD and Shift cannot progress scene. Buttons remain for phones, with 350ms accidental-activation guard. After a scene, brief temporary protection helps prevent immediate combat damage. Visibly communicates that combat is frozen.
- **DASH discovery:** always-visible P1 SHIFT and P2 ENTER HUD pills, cooldown/ready status, combat visual feedback. Mobile dash buttons remain.

## Regression checklist
- [ ] Playwright Chromium runs on desktop + simulated mobile portrait/landscape, solo/2P and three modes.
- [ ] Two humans repeat actual mobile 2P playtest with Lite FX ON and OFF; note device/browser and where drops occur.
- [ ] Compare Adventure Tolly completion time, boss attacks and damage in solo/duo. Check Story stays welcoming and Extreme remains avoidable.
- [ ] C key advances dialogue; movement arrows do not. On-screen Next/Skip remain accessible on iOS/Android.
- [ ] Scene doesn't accidentally skip to combat and players receive brief invulnerability.
- [ ] DASH status legible and understands Shift/Enter; ability visually clear.
- [ ] Daan visible in Extreme 2nd phase as temporary actor. **Actual approved likeness outstanding**.
- [ ] Birthday invitation always available from selection, during play and after victory/defeat.
- [ ] Canonical five pet/Tolly portrait SHA hashes unchanged. No sprites generated.
- [ ] Do not imply that GitHub Pages playtest is public birthday release or that Day 5 has begun.

## Design boundary
Keep two-player ergonomics, stable browser performance, readability and gentle comedy ahead of adding complexity. No server, account collection or forced phone rotation. Story mode retains ease. For a fully faithful Daan portrait, request user's reference and approval. See `docs/AI-HANDOFF.md`.
