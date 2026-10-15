# Hackathon Day 5 — Chibi Renaissance

**Status: Phase 5B implemented on a review branch: eight owner-approved sprite sheets are included, with original portrait fallback and a CHIBI/CLASSIC game toggle. This is still a playtest project, NOT the birthday-invitation release. Physical-device acceptance is outstanding.**

**15 October 2026:** The owner explicitly authorised beginning Day 5 after the Day 4.8 merge. This supersedes the older *do not start any Day 5 code* scheduling restriction **for this infrastructure slice only**. It does NOT waive the outstanding physical-device acceptance checks, the requirement to approve every derived likeness, or Daan's approved character-art dependency.

## North star

Replace the game-world *portrait discs* with expressive, faithful chibi sprites only when each asset is signed off. Rosie, Millie, Winnifred, Ellie and Tolly must still look like their canonical portraits. Their character selection cards, dialogue portraits and cutscene art are immutable. Keep every invitation link working without game completion.

## Phase 5A — Implemented technical foundation

- `game/sprite-renderer.js` implements a tiny no-dependency sprite-sheet renderer independent of physics and collision handling.
- `game/game.js` records gameplay-facing direction (up/down/left/right), derives animation poses from existing movement/attacks/dashes/hurt/heals/knockouts, and delegates rendering to the sprite engine **only if an approved sheet exists and preview is on**. Tolly uses existing boss states. The provisional Daan battlefield actor stays untouched.
- If the sheet is absent/invalid, preview is off, or the renderer is unavailable, the existing portrait disc and boss portrait continue to draw unchanged.
- The developer preview flag is `?chibiPreview=1`. No sprite art is auto-fetched or shipped until approved. A test-only synthetic sheet exercises the engine.
- The standalone encrypted HTML exporter includes the renderer before the game script.
- The existing birthday invitation links, three modes, solo/co-op, mobile controls, hitboxes, damage, quest progress, and game mechanics remain untouched.

### Sprite-sheet contract for approved assets

Every row is a direction: **down, left, right, up** (top to bottom). Every column is a pose: **idle, walk A, walk B, attack, dash, hurt, knockout, special** (left to right).

| Asset | Size per frame | Total sheet | Path reserved for approved delivery |
| --- | --- | --- | --- |
| Rosie, Millie, Winnifred, Ellie | 64×64 transparent px | 512×256 px | `game/assets/sprites/<name>.png` |
| Tolly | 96×96 transparent px | 768×384 px | `game/assets/sprites/tolly.png` |
| Daan | 96×96 transparent px | 768×384 px | **Await approved character illustration; no sprite until then** |

Use nearest-neighbor *only for sprite sheets*. Regular portrait/cutscene images retain original smoothing. Renderers draw centered on the existing world position; changing their image size must never move any physics collider or attack radius. The `register(id, image)` function rejects invalid dimensions and refuses to draw a missing image. At rest, the engine renders frame 0; walking alternates columns 1/2 at 0.16 seconds a frame. A reversible preview lets each design be inspected before turning it on for players.

**Asset production rule:** Sprite sheets must be separately derived/approved against the existing character art, not invented from memory or taken from a third-party game. Keep originals under `game/assets/*.webp` at the same git blob SHAs. Do not describe the provisional `daan.svg` emblem as his real portrait.

## Phase 5B — Implemented (browser validation and real-device acceptance tracked separately)

1. **Completed:** Approved five main character designs and generated four-direction, eight-pose sheets for Rosie (fully black), Millie (German Shepherd mix based on owner's photo), Winnifred, Ellie and Tolly. Daan remains an unapproved provisional character, unchanged.
2. **Completed:** Added `game/assets/sprites/{rosie,millie,winnifred,ellie,tolly,bleepling,boink,bocht}.webp`, each exact 8×4 frames with 64px characters/enemies and 96px Tolly. `game/sprite-renderer.js` validates, loads and falls back on errors. Chunkling retains original procedural artwork.
3. **Awaiting physical test:** Test individual poses, animation pivots and memory/FPS on actual mobile screens; inspect co-op overlap and revive/knockout states.
4. **Automated tests added; player re-test pending:** Test attack/hurt/dash timing and Tolly boss telegraphs across Story, Adventure and Extreme, including the unchanged provisional Daan hazard.
5. **Implemented for unreleased playtesting:** CHIBI on by default with a visible CLASSIC toggle and `?classic=1` fallback; the static exporter embeds nested sprite paths. Production guest release still needs real-device and event sign-off.

## Acceptance and release gates

- [ ] Day 4.8 real-phone two-human tests pass in portrait and landscape, on at least Android/iPhone as available, with Lite FX ON/OFF.
- [ ] Owner approves Tolly difficulty and all heroes' real-game fairness. Main character illustration concepts and matching sprite sheets have design approval; in-game animation sign-off remains pending.
- [ ] Owner supplies/approves Daan's actual character illustration. Until then, keep the existing *provisional* static actor.
- [x] Canonical five portrait blob SHAs unchanged after sprite branch changes (separate new files under `game/assets/sprites/`).
- [x] Reversible renderer with portrait fallback and separate physics, controls and animation states.
- [x] Chromium tests passed in PR #9 (15 October 2026), including the sprite test and existing quest/character/win/lose/invitation coverage.
- [ ] Approved sheets look crisp at phone scale and don't obstruct HP, boss hazards, timed lasers, PAWS or scene dialogue.
- [ ] Both the original `/game/` page and independently shareable `game/invitation.html` remain available from start, play, win and loss.
- [ ] Calendar file import tested on common phone platforms.
- [x] Owner approved the designs and requested continued sprite integration. Chibi mode is default-on for the iterative *playtest* only, with classic toggle; public guest release is not authorised.

**Non-goals:** new levels/quests, combat balance or difficulty changes, RSVP backends, portrait alteration, copyrighted animation/music, and changes to the Friday 13 November birthday logistics.


## Day 5B asset/build notes (15 October 2026)

- The generated source PNGs were converted to transparent WebP atlases and **actually committed to the review branch**, not merely referenced by broken URLs.
- Portrait art in `game/assets/*.webp` is never overwritten.
- Eight source-atlas columns: idle, walk A, walk B, attack, dash, hurt, knockout, special. Four rows: down, left, right, up. Source image transformations are only resampling/centering each crop into game-compatible cells.
- Enemy artwork: neon slime → Bleepling; garden gremlin → Boink; blue feline sprite → Bocht; Chunkling remains procedural. Characters do not gain any new powers or mechanics.
- On-field enemy health bars, special telegraphs, co-op UI and the independent birthday invitation remain untouched.
- Legacy mode: `/game/?classic=1` or the `CHIBI ON · CLASSIC?` control. If any approved image fails to decode or dimensions mismatch, that actor falls back to its original portrait/shapes.
- `tools/build.py` bundles `assets/sprites/*.webp` in the offline encrypted export so no remote image fetch is required.
- Don't reinterpret computer-emulated touch tests as human two-thumb Android/iOS acceptance. Daan's approved likeness and final release are still outstanding.
