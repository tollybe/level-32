# Hackathon Day 7 — Bush Stealth, Winston & Impossible Crossfire

**Status: Day 7B merged to `main` via PR #17 (15 October 2026) with green syntax and full Chromium gameplay CI. Still a playtest pending owner real-device approval; not a guest release.** Builds on Day 6C. Canonical five pet/Tolly portraits and approved game sprite files are unchanged; the bush asset is new and separate.

## World and bush stealth

- Five hideable flowering sakura bushes are introduced as actual world-space objects, not decorative scenery. Sprite: `game/assets/sprites/bush.svg` (96×96). Players inside 51 world units are visually covered by leaves and labeled **HIDDEN** with their current concealment timer.
- While hidden, players cannot auto-attack, use laser, dash, revive or pulse Ellie’s healing aura. Nearby enemies cannot target or damage them; once every teammate is hidden, mobs display a **?** and begin investigating the bush after four seconds. Unconcealed teammates remain valid targets.
- Remaining hidden for 30 cumulative *continuous* seconds in a bush during normal exploration triggers exactly one illustrated secret story cutscene. Hiding in the boss arena never opens a blocking cutscene.
- Tolly’s boss stealth dialogue is a fully in-world, time-driven sequence: first bush visit she is confused; **second distinct entry** she yells **“WHERE'S WINSTON?!”**; Rosie says they’re in trouble; a teammate says **don't give us away**; Tolly calls again; Rosie shakes/wiggles after eight seconds of continuous hiding; on the tenth second the group is exposed for four seconds, Tolly says **“AHAHAHAH! WORKS EVERY TIME!!”** and resumes combat. Rosie can appear as a decorative cameo even when not selected, without adding a third playable character. Exposed characters get a short 1.1s grace shield to avoid an unavoidable surprise hit.
- Speech bubbles do not pause world physics, capture focus or require the C key. Quest cutscenes still preserve their prior explicitly controlled dialogue behavior.

## Impossible 10/10 Boink & Bocht

- The two elite mini-bosses spawn on the same encounter and initialize the same 1.6-second volley cooldown (and remain spatially separated). At each round, both flash **red for 0.5 seconds**, then rapidly launch twelve bananas each across + (Boink) and X (Bocht) axes: a machine-gun rhythm at 0.085-second intervals.
- Cooldown of 2 seconds begins **after the final shot**, then the red flash / **PEW PEW PEW** cycle repeats. The total burst is 24 bullets across the two creatures; each shot deals 8 damage, subject to existing player invulnerability. Projectile speed is 255; no new patterns on Story or Adventure.
- Existing separate boss health bars, warning controls, quests and difficulty scaling remain unchanged.

## Co-op personalities

Banter triggers when both heroes are alive, visible and within 165 world units. It is in-world dialogue, limited to every 19 seconds, with no gameplay buff/debuff:

| Pair | Relationship |
|---|---|
| Rosie & Winnifred | Curious but awkward; keep a respectful distance |
| Rosie & Millie | Tuesday/Thursday playmates; Millie always wants BALL and Rosie wants quiet |
| Rosie & Ellie | Ellie wants to lick Rosie; Rosie babies Ellie |
| Millie & Winnifred | Playful Millie spooks the reserved cat, without aggression |
| Ellie & Winnifred | Protective Ellie and cat prudently avoid one another |
| Millie & Ellie | Endless running/zoomies |

## Automated and owner acceptance gates

- [x] Green Chromium tests (PR #16): 12-way existing hero/difficulty matrix, synchronized warning+rapid 24 shots, precise + and X vectors.
- [x] Green Chromium tests (PR #16): concealed targeting and attack suppression, mob question marks, 30-second secret, safe exit, and all six co-op banter pairings.
- [x] Green Chromium tests (PR #16): Tolly's first/second bush-entry dialogue and continuous ten-second Winston sequence through shaking and reveal, with no boss soft-lock.
- [x] Existing quest/cutscene/health/heal/level/ending/invitation and solo/mobile tests remain green (PR #16).
- [ ] Owner playtests red warning visibility on real phones, visual concealment depth and bush sound/easter-egg pacing, balanced Impossible bullet density and pet chemistry.
- [ ] Original game portraits/art SHA unchanged and game invitation remains independently accessible.

## Day 7B — Tolly's nicknames, variable crossfire and bush ambush

- **Tolly's personal nicknames** (used in the intro when that hero is selected and in boss battle speech bubbles): Rosie **"Rosie the Dog"**, Millie **"Silly Millie"**, Ellie **"Ellie Bellie"**, and Winnifred **"Princess Winnifred, floof of her name."**
- **Rosie's theme song** appears as playful phase-three dialogue: Rosie begins *"She's the rosiest of rosies, the tosiest of tosies..."* and Daan joins *"The nosiest of nosies... IT'S ROSIE THE DOOOOOOG!"* Daan also calls out his line on joining the final fight. It is displayed through text, not prerecorded human singing.
- **Independent 10/10 mini-boss volleys**: Boink and Bocht still enter together, but start on different warning clocks (Boink 0.7–1.3s; Bocht 1.65–2.4s). Boink fires twelve + bananas every 0.07s, Bocht twelve X bananas every 0.115s. Both flash red for 0.5s before each burst. Each **completed** burst starts its *own* recovery timer: Boink 1.1s + independent random 1–4s, Bocht 1.7s + independent random 1–4s. Their bursts can naturally overlap, but are not synchronized. Their projectiles can continue even if the players hide.
- **No attacks under cover**: all normal weapons, laser attacks and dashes are disabled inside bushes. Existing live projectiles and laser beams owned by a character are cancelled when they enter cover. Cooldowns do not fire while hidden.
- **Ambush crit**: after hiding for at least 0.3s, stepping out arms a 2.1-second window for a **single 2× critical hit** against an *ordinary mob*. Tolly and elite minibosses are immune. The bonus is consumed only when an eligible mob is hit; Rosie's second-target pierce modifier remains intact. Re-entering cover resets the bonus.
- **Banana hits through foliage**: an elite Boink/Bocht banana may strike a bush containing a player. Foliage absorbs 75% of that projectile's damage, while the player gets knocked outside the bush, gains 0.9s post-hit invulnerability, and exclaims **"OW!"**. Knockout by banana cancels the pending ambush crit. A single projectile can hit only one hiding player.
- **Acceptance:** green PR #17 automated tests verify separate and sometimes overlapping bursts, cooldown bounds, all twelve bananas per enemy, firing suppression on entry, mob-only crit (including boss/elite immunity), reduced damage and displacement, plus the names and duet. The full Story/Adventure/Extreme and co-op regression suite passed before merge. Real-device feel, readability and audio remain for owner approval.

## Garden atmosphere

Each new run places up to nine decorative, non-colliding cherry trees at randomized safe positions. The placement logic leaves generous clearance around the main winding path, hiding bushes, clues, laser terminals and shrine, and spreads the trees apart. A new original cherry-tree SVG supplies the artwork. Gentle falling petals are animated in normal graphics mode, reduced in Lite FX, and disabled with reduced motion.

The ground gains 180 little grass tufts that part when a moving player brushes past. Grass has no collision and appears at reduced density in Lite FX. Automated checks regenerate the world repeatedly and verify positioning and proximity response. Real-device review remains pending.
