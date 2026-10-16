# Vanille — the Reluctant Bush Support
Status: development/playtest, not guest-release approved. Added as the fifth selectable hero without altering Rosie, Millie, Winnifred, Ellie or Tolly's canonical assets.

## Visual assets
- `game/assets/vanille.svg`: self-contained, compressed version of the chosen illustrated Vanille portrait, with her outward-looking amber eyes.
- `game/assets/sprites/vanille.svg`: original transparent 512×256 directional 8×4 game atlas (64×64 cells), with poses `idle / walk / walk / attack / Ploff / hurt / knockout / special` and rows down, left, right, up.
- The existing CHIBI / CLASSIC toggle works for Vanille as for other heroes; scene portraits reuse character-select images.
- The sprite art must be reviewed at actual phone-game scale before guest release.

## Stats and moves
| Stat | Vanilla JS base value |
|---|---:|
| HP | 180 (5/5) |
| Speed | 185 (2/5) |
| Damage | 10 per glare target before level scaling (2/5) |
| Range | 315, beyond Winnifred's 96 |
| Attack rate | 1.12 seconds |
| Self regeneration | 2.5 HP/second |
| Ploff cooldown | 6.8 seconds |
| Ploff effective radius | 110 + target collision size |
| Ploff knockback | 85 px regular enemies, 20 px boss |

**Death Glare:** auto-targeted rectangular/trapezoid eye-laser hitting at most four creatures per cast, with a 10 px near half-width expanding by 0.09 px per distance and minor size allowance. Low damage, long range. No attacks while hidden.

**Ploff:** replaces Dash on Shift, Enter or the mobile action button. Pushes enemies around a stationary Vanille; no dash movement is ever assigned. Brief invulnerability covers the non-moving cast.

**Bush support:** entering her own bush grants nearby teammates a .32-second protection pulse; while Vanille hides, allies within 150 px reduce their dash cooldown an additional 25% per second; exiting gives nearby allies a 15% movement buff for 2.5 seconds. Buffs don't introduce new mobile buttons.

**Personal space:** when *another player enters a bush already occupied by Vanille*, she jumps outside its 51-px concealment radius, gives exit buffs, enters a short re-entry lock and shouts: “HAVE YOU NOT HEARD OF A THING CALLED PERSONAL SPACE?!” It does not trigger when they approach outside the bush or when both enter simultaneously.

## Acceptance checklist
- [ ] Portrait and animation review on real Android and desktop.
- [ ] Solo Vanille survives prolonged fights without bypassing normal pause/damage handling.
- [ ] Ploff does not move Vanille, knocks back regular foes; mobile and keyboard action labels say PLOFF.
- [ ] In co-op, the other player entering Vanille's bush causes exactly one personal-space event.
- [ ] Re-entering another bush, pause/unpause, cutscenes, boss phases and classic toggle are stable.
- [ ] Invitations, RSVP details, difficulty settings and existing character portraits are unchanged.
