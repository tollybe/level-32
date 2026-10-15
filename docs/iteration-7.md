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

## Day 7C — Millie zoomies, tree depth and shared XP

- Millie has two Shift/Enter (or mobile dash) charges, each independently recharging after 3.3 seconds. Her second dash can be used immediately; her third cannot trigger until a charge refills. The HUD shows two lightning pips. Other pets' dash cooldowns are unchanged.
- Cherry trees have small solid trunk colliders, not solid canopies. Player dash movement uses short substeps plus axis sliding to avoid tunneling. Mobs and Tolly use local tangent steering and the same trunk collision; random placement still avoids quest paths.
- Players and mobs can pass behind blossom crowns. A canopy is redrawn on top at 22% opacity when hiding a player, or 57% when hiding only a mob; the player has priority. Unobscured canopies remain fully opaque.
- A slim shared XP progress meter is shown over the game canvas, displaying level, current/required experience, and next five-level perk threshold. It uses actual team XP, updates with the existing HUD, and exposes accessible progress values. Co-op P1/P2 alternating perk turns remain unchanged.
- Browser tests cover straight-line collision, sliding, mob steering, depth fade, Millie's two dashes and recharge, Rosie single-dash behavior, and accessible team XP progress.
- Owner playtest: mobile movement, canopy art and XP readability, tree traversal feel, and invitation regression. All character designs and birthday event details remain unchanged.

**Day 7C status:** Merged into `main` via PR #18 (15 October 2026). Full JavaScript syntax and Chromium desktop/portrait/landscape/Extreme gameplay CI passed, including collision/steering, dash charges and accessible XP meter. Owner phone playtest and final birthday guest release remain pending.

## Day 7D — Conversations, readable XP and invitation timing

- All six co-op pairs now have three **different** small dialogue scenes that advance from one encounter to the next instead of repeating the same two lines. A conversation reveals one bubble at a time (roughly every 2.75 seconds), then waits before triggering again. Walking into cover, death or leaving co-op cancels pending lines; starting a fresh game resets the sequence. Rosie and Winnifred's second meeting reverses the boop; Ellie and Millie's zoomie conversation escalates into the 'you're forgetting me!' joke.
- The shared team XP HUD has two clearly separated headline values (TEAM LV and current XP), a progress track, then a dedicated bottom line for NEXT PERK. CSS grid prevents labels touching or wrapping into each other; mobile and desktop browser checks verify separate bounding boxes. XP calculations and P1/P2 perk distribution remain unchanged.
- **Mission One is now 18:15–20:15 on Friday 13 November 2026**, at Broodnodig. The public birthday invitation, game hint, README, handoff guide and downloadable `game/birthday.ics` are updated. **Laser tag remains 20:40**, with its calendar entry unchanged. No other date, price or address is changed.
- Browser regression verifies that each of six pairings unlocks three distinct scenes in order, that turn-taking draws one line at a time, that the XP elements stay spatially separated even on simulated phones, and that calendar and invitation times match.
- Owner acceptance: judge dialogue pacing and legibility during actual co-op gameplay, and check the updated WhatsApp details before inviting guests.

## Day 7D follow-up — Add both missions to calendar

- Added a prominent **Add both missions to calendar** link on the separate invitation and the main game's party-details panel. Both download the same existing `game/birthday.ics` file, which contains **two** independent calendar events; guests open/import it to add them to their own calendar app. This is not an automatic calendar-account write.
- Event 1: Broodnodig, Friday 13 November 2026, 18:15–20:15. Event 2: Lasergames Utrecht, starting 20:40 (no unconfirmed end time invented).
- CI asserts that the public invite and game link to that same calendar file and the ICS has exactly two events with the correct start/end fields.
