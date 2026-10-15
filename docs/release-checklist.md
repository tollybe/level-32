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


## Day 5B — Approved artwork integration
- [x] Commit eight owner-approved chibi WebP sheets; five main characters + Bleepling, Boink, Bocht.
- [x] Rosie all-black, Millie German Shepherd mix based on owner's supplied photo; all main character portraits unchanged.
- [x] Runtime load and validate every 8×4 sheet and fall back automatically when missing or corrupt.
- [x] Chibi/classic toggle available during solo, co-op, boss and mobile; original invitation links persist.
- [x] Standalone build includes `assets/sprites/*.webp` as data URLs without fetching remote images.
- [x] Day 5B Chromium and JS validation green on GitHub Actions (PR #10; 15 October 2026).
- [ ] Actual iPhone/Android 2-person test confirms FPS, readability, no sprite clipping and health bar visibility (both Lite FX settings).
- [ ] Daan's real portrait/sprite approved; provisional non-likeness actor is unchanged.
- [ ] Final event logistics, physical-device acceptance and owner release sign-off before distributing invitations.

## Day 5C — visual and collision corrections

- [x] Implement larger full-body Tolly art with old portrait disc only in classic/fallback mode.
- [x] Add 8-pose, 4-direction *provisional* Daan badge-face sprite and visual SPITE slam warning; real likeness still unapproved.
- [x] Preserve Extreme-only surprise after Tolly's half-health cutscene; no cameo in Adventure/Story.
- [x] Fix Rosie dragon projectile tunnelling via swept collision, retaining exactly two possible enemy hits.
- [ ] GitHub Actions Chromium tests green for Daan sprite, two-hit projectile, Story/Adventure/Extreme and invitation paths.
- [ ] Two people retest on real phone: Tolly readability, Daan warning, mobile frame rate, cutscene/PAWS, dragon hit indication.
- [ ] Owner supplies/approves Daan likeness; placeholder must never be presented as authentic portrait.


## Day 6 — Dialogue, original music, combat balance and legendary progression

- [x] Chromium CI passing for first scene scroll and C/Next/Skip controls (PR #12).
- [ ] Hero card stats hover/tap/focus properly, including keyboard and mobile.
- [ ] Rosie secondary pierce exactly 50%, Millie ball single-hit, Winnifred highest DPS and melee, Ellie lowest DPS with slow/heal.
- [ ] Tolly boss phase changes at 67%/33%; Daan Extreme-only in third phase; music tracks distinct and original.
- [ ] Boink and Bocht spawn apart, remain distinct and challenging on Adventure.
- [x] Automated coverage for first five-level offer, alternating co-op player selection, rarity bounds and tiered XP; real playtest for levels 10/15 still pending.
- [ ] Super aura/health labels do not obscure telegraphs, mobile performance/reduced motion sound.
- [ ] Real-device balance, invitation and ICS signoff.

## Day 6B — Player-feedback corrections

- [x] PR #13 Chromium CI passed for displayed hero stats, decoded cutscene opening, and the 12-way hero × difficulty matrix.
- [ ] Confirm Story 4/10 is approachable for first-time solo and local co-op guests.
- [ ] Owner checks Adventure elite duo survives long enough to feel threatening, but not tedious.
- [ ] Owner tests Extreme banana +/X telegraphs, collision and safe gaps on real devices.
- [ ] Owner listens to original legendary-style battle arrangements and approves actual loudness/mood.
- [ ] Existing invitation routes, all canonical art SHA checks, and Day 6 full regression suite remain green.

## Day 6C — Rotating perks and Daan photo reference

- [x] GitHub Actions passed co-op P1/P2/P1 perk rotation (levels 5/10/15) and solo checks (PR #15).
- [x] GitHub Actions verified new Daan sprite and phase-three dialogue portrait render (PR #15).
- [x] GitHub Actions verified Daan heals Tolly at most twice, up to 5% per cast, capped at 43% HP (PR #15).
- [ ] Owner validates Daan's appearance, boulder countdown, and green heal telegraph on physical devices.
- [ ] Owner confirms Ellie/Winnifred upgrade fairness in an actual co-op session, and no perceived XP stall at level 10.


## Day 7 — Bush stealth and Impossible machine-gun bursts

- [x] CI proves 0.5-second warning, both 12-banana machine-gun volleys, and cooldown after all shots (PR #16).
- [x] CI proves 30-second secret, stealth disables attacks, mobs search with question marks and exit restores combat (PR #16).
- [x] CI proves first/second boss-bush visits, Winston dialogue, Rosie wiggle, ten-second forced reveal (PR #16).
- [x] CI proves all six relationship-specific co-op dialogue pairs and retains previous birthday invite/quests (PR #16).
- [ ] Owner confirms real-device attack pacing and bubble legibility; no stage overlaps or invitation regression.

## Day 7B — Owner feedback: nicknames, independent crossfire, ambush

- [x] PR #17 CI: Boink/Bocht warnings are independent yet may overlap; independently rolled 1–4s delay after distinct recovery and all twelve shots per enemy.
- [x] PR #17 CI: every bush blocks normal weapons, active projectiles, laser, dash and Ellie support while hiding.
- [x] PR #17 CI: one 2× critical after leaving cover against ordinary mobs; none for Tolly/elite duo.
- [x] PR #17 CI: banana impact through bushes causes only 25% projectile damage, 'OW!' bubble, and a knockback outside concealment.
- [x] PR #17 CI: Tolly nicknames and Rosie/Daan shared lyrics appear without disrupting existing cinematics.
- [ ] Owner evaluates in real play: random volley fairness, bush hitboxes, song presentation and all four nicknames.

## Day 7C — Traversal, Millie and XP

- [x] Chromium CI passed in PR #18: trees block through-travel, support sliding and mob steering.
- [x] Chromium CI passed in PR #18: canopies fade more for players than mobs.
- [x] Chromium CI passed in PR #18: Millie can dash twice quickly, never three times without recharge; other pets keep single dash.
- [x] Chromium CI passed in PR #18: team XP meter has correct visible fill, label and accessibility progress.
- [ ] Owner checks phone/tree behavior and preserves invitation.

## Day 7D — Chatty pets, XP clarity, schedule correction

- [ ] Green browser CI: each pair has multiple sequential dialogue scenes that change on subsequent encounters.
- [ ] Green desktop and phone browser CI: TEAM LV, numerical XP and NEXT PERK appear on separate uncluttered lines.
- [ ] Green regression: invitation, calendar ICS, game and README agree on Mission One **18:15–20:15**, while laser tag stays **20:40**.
- [ ] Host confirms party schedule, co-op chat pacing, and mobile UX before public release.

- [ ] CI: **Add both missions to calendar** downloads the same two-event ICS from both the game and the invitation, with updated Mission One hours and unchanged laser-tag time.

## Day 8 — Snack Power & Sakura Breeze

- [x] PR #21 CI passed: overflowing chocolate fills the small below-HP meter; linear fill verified at 0/50/100 and healing is preserved.
- [x] PR #21 CI passed: hits and actual teammate healing grow charge slowly with the hit-rate limit.
- [x] PR #21 CI passed: all four role-specific full-charge benefits trigger correctly without manual inventory or extra buttons.
- [x] PR #21 CI passed: Sakura Breeze cannot appear before 100 kills, is guaranteed at 100, rare afterward, and attracts stars only.
- [ ] Owner: physical phone test for meter visibility, magnet timing, effect pacing, and fair co-op behavior.

## Day 8B — Cleared scroll and solo recovery

- [ ] CI: Scroll-unsealed overlay visible and aligned for clues one, two and three, then hidden after reading or in boss phases.
- [ ] CI: Solo open-ground +2.4 HP after each 5 damage-free seconds; taking damage resets timer.
- [ ] CI: Bushes grant only 0.1 HP/s while hiding; entering cover does not bank recovery ticks.
- [ ] CI: Max HP cap, no resurrection, co-op Ellie unchanged and no generic multiplayer regen.
- [ ] Owner checks mobile visibility, pacing and boss survivability.

- [ ] Day 8B CI: Remove dense top metadata chips; invitation is the visually primary direct link with a separate optional play action and a no-game-required explanation on desktop and phone.
- [ ] Host non-gamer playtest: guests can find party schedule and add both events without clicking Play.

- [ ] Guest-first onboarding CI: solo mode starts unchecked with Rosie still selected for P1; P2 controls are inactive until guests explicitly enable two-player mode; solo and duo playthroughs both green.

## Day 8C — Phone fullscreen, legible controls and compact perk menus

- [x] PR #23 CI passed: tapping Play enables full-viewport phone game, preserving portrait and rotated landscape view, with visible EXIT, PAWS/UNPAWS and INVITE actions.
- [x] PR #23 CI passed: landscape HUD containers have approximately 10% background opacity, with text and health/XP indicators still legible; overlay never blocks the whole game.
- [x] PR #23 CI passed: solo gameplay shows only P1 joystick and dash; enabling co-op shows both; original controls still function.
- [x] PR #23 CI passed: phone-level-up pause displays a compact, scrollable, two-choice touch panel rather than a fullscreen opaque dialog; no combat advances during selection.
- [x] PR #23 CI passed: PAWS tap updates to UNPAWS, second tap resumes play and resets on a new game.
- [ ] Owner tests native Android fullscreen/autorotation and iOS Safari fixed-viewport fallback, safe-area cutouts, control comfort, upgrade text readability and return to birthday invitation.


## Day 8D — Phone scene and opposite-seat co-op layout

- [x] PR #24 Chromium: full mobile landscape and portrait browser tests: story illustration, dialogue, NEXT/Skip controls fit without scrolling; game phase and HP stay frozen while reading.
- [x] PR #24 Chromium: solo phone joystick at left, DASH at right. Player 2 inputs hidden.
- [x] PR #24 Chromium: phone co-op P1 controls at bottom, P2 controls at top rotated 180°, with both guests' thumbsticks on their left and dash on their right from their respective perspectives. P2 input axes flip accordingly.
- [x] PR #24 Chromium: shared XP, both HP displays, boss and phone Invite/Pause/Exit remain available between the two players without changing desktop layout.
- [ ] Owner physically tries one shared phone across a table (portrait and landscape) and reviews touch comfort, scene readability, damage-free dialogue.

**Day 8D integration:** PR #24 merged to `main` on 15 October 2026 after green JS syntax, desktop/portrait/landscape/Extreme gameplay smoke tests. Real handheld opposite-seat controls and visual scene size still need owner approval.

## Day 8E — Mobile Dash thumb position after auto-rotation

- [ ] Chromium portrait and landscape checks: P1 joystick is within 46 px of the physical left edge and Dash within 46 px of the physical right edge, with both anchored near the bottom and safe-area padding.
- [ ] Chromium: rotate the **existing open game** from portrait to landscape and back, verify Dash follows the right edge without refreshing the page. Exercise solo and co-op layouts; P2 stays opposite-facing.
- [ ] Host phone test: rotate while running, place right thumb comfortably on Dash, confirm no clash with system gesture/navigation area.
- [ ] Desktop CSS and controls unchanged.
