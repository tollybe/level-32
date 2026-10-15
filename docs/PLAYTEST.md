# Level 32 — Owner playtest guide (Day 4.7)

The project is still a **playtest**, not an invitation release. The public page is at https://tollybe.github.io/level-32/game/ . Day 5 is still documentation-only.

## Five-minute phone checks
1. Open game on a phone in normal portrait; select **two different pets** and Adventure. Check P1/P2 health and current objective above the canvas. Hold both thumbsticks at the same time: can you independently move both pets? Try small tilts and full tilts, then release each. Dash.
2. Choose **WIDE PLAY**. Rotate phone if it doesn't auto-rotate. The game is not allowed to force orientation on all platforms. Confirm **PAWS**, invitation CTA and boss HP remain visible, especially when entering Tolly's fight.
3. Follow **three golden pawprints** for Q1. The first illustrated conversation must appear. Tap **NEXT LINE** and try **Skip scene**.
4. In Q2, survive the **two sausage-ambush rounds** and then the **Boink & Bocht duo**. It should feel different from Q1. In Q3, visit three red/green laser terminals: **DANGER · WAIT!** is unsafe; **SAFE · TOUCH!** is the completion window. Then read the laser scene. Expect the ridiculous **pew pew pew / panic / Oh** exchange.
5. Enter Tolly's fight. Check banana burst, knockback and cone warnings; **Extreme** adds a surprise static Daan support attack during boss phase 2, not disclosed in the difficulty selector.
6. Tap the invitation during gameplay, return to the game, and resume from PAWS. Win/lose should also provide the invitation instantly.

## Playtest matrix to record
| Device/browser | Orientation | Player count | Difficulty | Quest where failed | Unexpected behaviour | Repro steps |
| --- | --- | --- | --- | --- | --- | --- |
|  | Portrait | 2 | Adventure |  |  |  |
|  | Landscape | 2 | Adventure |  |  |  |
|  | Portrait | 1 | Story |  |  |  |
|  | Landscape | 1 or 2 | Extreme |  |  |  |

## Hard requirements
- Keep canonical portraits of Rosie, Millie, Winnifred, Ellie and Tolly immutable.
- Do **not** fake Daan's physical likeness: existing `assets/daan.svg` is only a provisional emblem.
- Confirm invitation dates and venue addresses; the 20:30–20:40 transfer remains tight and needs host planning.
- Birthday details must always be accessible without winning. The game is never a gatekeeper.
- Day 5 chibi sprite overhaul is not authorized until the user accepts Day 4.7.
