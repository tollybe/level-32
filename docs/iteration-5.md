# Hackathon Day 5 — Chibi Renaissance

**Status: Phase 5A (sprite-engine foundation) implemented behind a reversible preview flag. No new chibi character sprites are approved or shipped. The live game still renders its original canonical portraits. This is a playtest project, not a birthday-invitation release.**

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

## Phase 5B — NOT YET IMPLEMENTED

1. Obtain and sign off faithful chibi designs for each animal and Tolly, with four clearly legible facings and essential poses. An approved Daan illustration is a separate prerequisite for his sprite.
2. Put only accepted sprite files in `game/assets/sprites/` and introduce an explicit approved sprite manifest/loader. There is intentionally **no active manifest or downloadable placeholder art** yet.
3. Test individual poses and animation pivots on an actual mobile screen (no tilting of hitboxes/HP labels); inspect co-op overlap and revive/knockout states.
4. Test attack/hurt/dash timing and Tolly boss telegraphs across Story 4/10, Adventure 7/10 and Extreme 10/10, including Daan's phase-two hazard in Extreme.
5. Give final go/no-go for turning on sprite rendering for guests and update the static exporter to bundle approved nested-sheet URLs.

## Acceptance and release gates

- [ ] Day 4.8 real-phone two-human tests pass in portrait and landscape, on at least Android/iPhone as available, with Lite FX ON/OFF.
- [ ] Owner approves Tolly difficulty, all heroes' fairness and each sprite likeness.
- [ ] Owner supplies/approves Daan's actual character illustration. Until then, keep the existing *provisional* static actor.
- [ ] Canonical five `*.webp` assets verified unchanged.
- [x] Reversible renderer with portrait fallback and separate physics, controls and animation states.
- [x] Chromium tests passed in PR #9 (15 October 2026), including the sprite test and existing quest/character/win/lose/invitation coverage.
- [ ] Approved sheets look crisp at phone scale and don't obstruct HP, boss hazards, timed lasers, PAWS or scene dialogue.
- [ ] Both the original `/game/` page and independently shareable `game/invitation.html` remain available from start, play, win and loss.
- [ ] Calendar file import tested on common phone platforms.
- [ ] Owner authorises a visual rollout; until then `chibiPreview` remains off by default.

**Non-goals:** new levels/quests, combat balance or difficulty changes, RSVP backends, portrait alteration, copyrighted animation/music, and changes to the Friday 13 November birthday logistics.
