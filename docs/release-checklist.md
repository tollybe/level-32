# Release checklist · Level 32

## Before merging

- [ ] `game/game.js` parses in a JavaScript runtime without syntax errors.
- [ ] Check JS-referenced DOM IDs exist in `game/index.html`; all standalone invitation links resolve.
- [ ] Verify all `game/assets/*.webp` blobs retain their original SHA after gameplay changes.
- [x] Run `python tests/smoke.py` with Playwright, Chromium and `cryptography` installed — automated Ubuntu Chromium runner (15 October 2026).
- [ ] Play solo as Rosie, Millie, Winnifred and Ellie. Try standing still against Tolly.
- [ ] Play local co-op on one keyboard. Test revive, pause, and both dash keys.
- [ ] Test clue 1/2/3 dialogue next buttons and Skip scene. Audio and damage must pause.
- [ ] Verify Millie's ball never damages the same target more than once per projectile.
- [ ] Test the result overlay and invitation CTA after **win and defeat**.
- [ ] Test opening the invitation from the bottom bar *without* playing at all.
- [ ] Verify no password or secret was checked into the repository.

## Publishing

- [ ] Root entry `/` accepts the guest password, decrypts a route token, and navigates to `/game/`.
- [ ] Public `/game/` loads current JS/CSS and canonical asset images.
- [ ] Public `/game/invitation.html` displays both missions, dates, addresses, and links.
- [ ] Confirm new-tab behavior on phones and desktops; popup blockers shouldn't block anchor clicks.
- [ ] Confirm game can be exported by copying the `game/` folder.
- [ ] Verify no browser console errors, broken images, or infinite animation/repaint loops.

## Build modes

**Recommended website mode**: `python tools/build.py --redirect` (with `LEVEL32_PASSWORD` in the environment or entered privately when prompted). The generated root uses an encrypted route marker so guests enter the password and then play the latest `/game/` version.

**Standalone encrypted export mode**: `python tools/build.py` (the original default). This embeds the complete game and its canonical image assets inside a password-encrypted single file. It will be a snapshot at the time of the build.

**Note:** The public `/game/` source is accessible directly by design. The guest code is a playful gate, not authentication for private information.

## Day 4 regression scenarios

- [x] Script-based simulation confirms a new scroll does not immediately grant a clue.
- [x] Script-based simulation confirms all three guardian waves must clear before each cutscene.
- [x] Script-based simulation confirms moving straight to the second scroll does not bypass the first.
- [x] Script-based simulation confirms placing a player directly inside Tolly moves them outside her collision radius; remaining motionless incurs damage.
- [x] JavaScript parsing and DOM id consistency verified; original character files unchanged.
- [ ] Run updated Playwright suite across desktop Adventure, mobile Adventure and mobile Story.
- [ ] Confirm no stationary boss win with **all four heroes** at low, medium and high levels.
- [ ] Verify guardian wave times in solo and co-op; intended Adventure difficulty ≈6–7/10.
- [ ] Confirm browser window links and `birthday.ics` import in common mobile calendar apps.
- [ ] Ensure mobile dash and reduced-motion preferences work on a real touch device.


## Day 4 extension — required before Day 5
- [ ] Verify Extreme Mode appears as a third selectable difficulty in desktop and mobile UI.
- [ ] Verify 10/10 guardian-wave progression, boss HP and increased pressure across solo and co-op.
- [ ] Verify Daan's delayed shockwave in Tolly phase two has a visible safe escape and pauses in cutscenes.
- [ ] Replace the temporary Daan emblem with an **approved** illustration (no fabricated likeness).
- [ ] Run full browser smoke suite and actual physical-phone gameplay checks.
- [ ] Test win, loss and direct invitation/calendar links in all three modes.
- [ ] Accept Day 4 explicitly before starting Day 5: see [Day 5 plan](iteration-5.md).


## Day 4.5 — additional acceptance gates
- [ ] PAWS controls and Escape freeze/restart correctly on phones and desktops.
- [ ] Check persona dialogue and optional banter; no forced delays or copyrighted dialogue.
- [ ] Verify decorations preserve enemy/telegraph visibility.
- [ ] Run Extreme browser smoke and validate Daan warning on a real device.
- [ ] Secure an approved Daan character illustration before final Day 4 acceptance.
- [ ] Confirm Day 5 remains docs-only (no sprite assets/rendering changes).


## Day 4.6 — supersedes historical 3-wave-everywhere checks
- [ ] Three distinct quests: Q1 scent, Q2 two-round ambush + duo, Q3 three timed safe-window terminals.
- [ ] Touch thumbsticks work simultaneously, and a small tilt moves slower than a full tilt.
- [ ] Fullscreen wide play succeeds where supported and degrades gracefully on unsupported devices.
- [ ] Alt-tab / new invitation window automatically triggers PAWS; resume once with no RAF duplication.
- [ ] Verify visible hero HP (mobile HUD and on-field) and readable laser danger/safe labels.
- [ ] Confirm Tolly Extreme scene keeps Daan surprise out of difficulty selector; approved Daan artwork outstanding.
- [ ] Confirm offscreen culling does not hide clue markers, telegraphs or the player.
- [ ] Run automated Chromium tests and real-phone two-player checks before merge/release.
- [ ] Validate scene reactions and reduced-motion; original portrait hashes identical.
- [ ] **Day 5 remains docs-only**, despite being fully specified.

Historical checks above concerning **three guardian waves at each clue** no longer apply after the Day 4.6 branch. Use `docs/AI-HANDOFF.md` and `docs/iteration-4-6.md` for current game intent.


## Day 4.7 — completed in automated tests; real-device acceptance outstanding
- [x] Repair GitHub Actions YAML error and run valid browser jobs.
- [x] Run expanded Chromium smoke tests: Adventure, Story, Extreme; desktop, simulated mobile portrait/landscape; solo and co-op; Q1/Q2/Q3; Tolly and Daan phase; PAWS; win/loss and invitation anchors.
- [x] Check analogue speed is proportional and that P1/P2 movement directions are independent in simulation.
- [x] Keep boss health and invitation visible in fullscreen stylesheet.
- [ ] Two people physically play simultaneous thumbsticks on Android and iPhone, including landscape/fullscreen support and return from invitation.
- [ ] User-approved Daan portrait replaces provisional emblem.
- [ ] All heroes have a fair boss encounter in solo and 2P; all three difficulties have acceptable play times.
- [ ] Confirm opening the ICS file in common mobile calendar apps.
- [ ] Confirm original character asset hashes are unchanged after final release merge.
- [ ] Owner acceptance and explicit authorization to start Day 5 sprites.


## Day 4.8 — real 2P mobile playtest regression
- [ ] Replay two-thumb touch on actual phone with Lite FX ON/OFF, note which scene lags and whether frame time improves.
- [ ] Tolly duo Adventure/Extreme is genuinely challenging while having avoidable telegraphed attacks; Story remains friendly.
- [ ] Tolly new low-HP frenzy is readable on a small screen, with visible warning windows.
- [ ] Daan's temporary support actor visible/animated and explicitly not a true likeness; approved personal character art still needed.
- [ ] No scene can accidentally advance from movement keys; keyboard **C** and mobile Next/Skip buttons work; no immediate damage on resumption.
- [ ] P1 Shift and P2 Enter DASH plus cooldowns are legible and consistent with touch buttons.
- [ ] Existing five immutable portraits exactly preserved and no Day 5 sprites.
- [ ] Win/lose/skip/during play birthday invitation links still work.
- [ ] CI Chromium smoke suite passes and in-person owner review signs off.


## Day 5 — Chibi Renaissance, Phase 5A (foundation only)

- [x] Opt-in rendering flag defaults OFF; no invented sprite/portrait assets ship.
- [x] Preview uses strict 64/96-pixel sheets, cardinal directions, original physics anchors, and unmodified canonical portrait fallback.
- [x] CI green (15 October 2026, PR #9): JavaScript syntax, standalone exporter, and synthetic-browser sprite frame/facing/flag checks.
- [ ] Owner-approved faithful pet/Tolly sheets; Daan's real artwork still required.
- [ ] Physical-device review and owner acceptance of Day 4.8 and of rendered artwork before general activation.
- [ ] Verify sprite sheet exports, loading and failed-asset fallback with real approved files.
- [ ] Re-check all birthday CTA/window/calendar links and canonical portrait hashes at final merge/release.
