# Hackathon Day 7 — Bush Stealth, Winston & Impossible Crossfire

**Status: feature branch, under Chromium CI; no guest release.** Builds on Day 6C. Canonical five pet/Tolly portraits and approved game sprite files are unchanged; the bush asset is new and separate.

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

- [ ] Green Chromium tests: 12-way existing hero/difficulty matrix, synchronized warning+rapid 24 shots, precise + and X vectors.
- [ ] Green Chromium tests: concealed targeting and attack suppression, mob question marks, 30-second secret, safe exit, and all six co-op banter pairings.
- [ ] Green Chromium tests: Tolly's first/second bush-entry dialogue and continuous ten-second Winston sequence through shaking and reveal, with no boss soft-lock.
- [ ] Existing quest/cutscene/health/heal/level/ending/invitation and solo/mobile tests remain green.
- [ ] Owner playtests red warning visibility on real phones, visual concealment depth and bush sound/easter-egg pacing, balanced Impossible bullet density and pet chemistry.
- [ ] Original game portraits/art SHA unchanged and game invitation remains independently accessible.
