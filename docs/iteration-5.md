# Hackathon Day 5 — Chibi Renaissance (PLANNED ONLY)

**Status: NOT IMPLEMENTED. Blocked on Day 4 + Day 4.5 + Day 4.6 / 4.7 owner acceptance (see `iteration-4-6.md` and `iteration-4-7.md`).**

## North star
Convert the round gameplay representations into faithful chibi overworld sprites while maintaining the recognizable canonical characters and the purpose of the game: invite friends to the birthday. Portrait art remains used in dialogue, selection and dramatic scenes.

## Immutable asset policy
- **Do not modify or replace** current canonical portraits for Rosie, Millie, Winnifred, Ellie or Tolly.
- Daan's Day 4 approved character art must exist before deriving a Day 5 gameplay sprite. The temporary Day 4 Daan emblem is not an approved character design.
- New chibi sprites belong in `game/assets/sprites/` separate from immutable originals and must be approved against those originals before use.

## Art & engine specification
- 64×64-pixel transparent canvas for heroes, 96×96 for large bosses; scale the source art faithfully, without redrawing distinctive features.
- Four cardinal facings; idle, two-frame walk, attack, dash, hurt, knockout and special. Target 20–24 frames per hero only where justified; minimize frames on enemies.
- Gameplay uses sprite sheets and a renderer/state machine separated from physics, colliders, damage, AI and controls. Pixel sheets use nearest-neighbor rendering; source portraits remain normally sampled.
- First pass: Rosie, Millie, Winnifred, Ellie, Tolly, Daan. Later pass: Boink, Bocht, Chunklings and ordinary mobs if time remains.
- Preserve existing round portrait/dialogue treatment with one-beat Undertale-inspired (original) banter. No copyrighted sprite or music copying.

## Acceptance & release gates
1. **Day 4 release checklist must be fully signed off first**, including Extreme Mode, Daan character-art approval, desktop/mobile smoke tests, and real solo/co-op playtests.
2. Implement the renderer behind a reversible feature flag with original shapes as fallback.
3. Verify original asset SHA hashes are unchanged, sprite anchoring and hitboxes do not drift, and animations remain legible on a phone.
4. Ensure Tolly, Daan, bosses, revival, cutscenes and all three difficulty modes retain behavior.
5. Maintain the one-click birthday invitation from selection, game, win and defeat, plus calendar and independent invitation page.

**Explicit non-goals for Day 5:** new story arcs, level mechanics, mode changes, RSVP backend, payment, online multiplayer, changing event details, rewriting combat balance.

**No Day 5 code or art should be generated or merged until Day 4, 4.5, 4.6 and 4.7 are accepted.**
