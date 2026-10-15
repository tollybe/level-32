# Day 4.6 — Playability & Personality (implementation review)

**Status:** Code changes proposed on `iteration-4-6-playability-quests-banter` for review; not a published release. **Day 5 remains unimplemented.**

## Scope and implementation
1. **Phone co-op:** two independent virtual joysticks, now with central dead zone and proportional thumb displacement; keyboard diagonal remains normalized. Separate dash buttons preserved.
2. **Landscape:** a user-initiated `WIDE PLAY` button requests fullscreen and, where supported, screen orientation lock. This is *not* forced on unsupported browsers; user can rotate manually. Re-entry from another app/new invitation tab auto-PAWS during active play.
3. **Three truly different quests:**
   - **Q1 — The Scent Trail:** follow three glowing pawprint markers sequentially, then read the first scroll.
   - **Q2 — The Sausage Incident:** defend against **two** guardian ambush rounds, read clue two, then fight the Boink & Bocht duo.
   - **Q3 — Laser Security:** visit three different terminals **in order** while each is green; red means retreat/wait and risks a small telegraphed hit. Completing all three unlocks third scroll and the Legendary Laser Pointer. No guardian waves in Q3.
4. **Banter:** Daan's Extreme-only arrival adds an original comic exchange to the existing Tolly phase-two cinematic; brief Millie panic and Rosie/Millie collapse use CSS on unchanged canonical portrait containers; PAWS draws a rotating Winnifred/Ellie joke.
5. **Readability:** player health shown under each portrait plus the above-game HUD; laser console colors/labels and quest objective/status update with stage; no changes to original animal/tolly art.
6. **Performance:** offscreen culling of scenery trees, map tile loops and decorations; smooth frame-time measurements and actual phone FPS remain to do.
7. **Standalone export:** builder inlines existing SVG `daan.svg` for standalone previews.

## Deliberately deferred
- Approved Daan likeness; placeholder stays identified as temporary, never masquerades as an actual image of Daan.
- Detailed difficulty retuning and real phone verification (Day 4.7).
- Day 5 chibi assets, sprite animation/renderer and portrait redesigns.

## Acceptance conditions (manual and automated)
- [ ] `python tests/smoke.py` passes in Chromium with Playwright; mobile portrait AND landscape.
- [ ] Two humans can play 2P on one phone using separate thumbs, including diagonal slow/fast movement.
- [ ] Wide Play correctly degrades when orientation/fullscreen unavailable; returns to playable layout after exit.
- [ ] PAWS works when returning from background and does not cause frame-loop duplication.
- [ ] Q1, Q2, Q3 feel visibly/mechanically distinct and can be completed solo and duo in each difficulty.
- [ ] Red/green Q3 telegraph is clear for colorblind players (also label DANGER/SAFE), and a mistaken touch is recoverable.
- [ ] Daan remains a SURPRISE on Extreme only; approved static artwork still pending.
- [ ] No broken images or JS errors in public and standalone builds.
- [ ] Invitation and calendar remain accessible without completing play.
- [ ] Five original character asset SHA hashes unmodified, and zero new chibi sprites.
- [ ] Run manual phone performance/fps check at battle intensity.

**This is a playtest iteration, not final release.** Historical Day 4 guardian-wave acceptance criteria were superseded by Q1 tracking and Q3 laser puzzles.
