> **Day 8 WIP:** Snack Power is a slim per-pet bar directly under the HP bar, charging fast from excess chocolate and very slowly from mob hits or Ellie healing. Next eligible action triggers that pet's signature bonus. Sakura Breeze XP magnet is locked until exactly kill 100 (guaranteed at the milestone), with rare subsequent spawns. No user-visible mechanics explainer or new controls. Review docs/iteration-7.md; automated CI and phone review pending.

> **Day 7C merged into main via PR #18 (green CI):** Tree trunk collision with see-through canopies (players clearer than mobs), Millie's separate double dash charges, and a visible shared XP bar. See docs/iteration-7.md. Mobile owner review remains pending.

> **Day 7B merged to `main` (PR #17, green CI):** PR follow-up adds Tolly's names for all pets, a Rosie/Daan text duet, independent Boink/Bocht bursts with random 1–4s post-recovery, strict no-fire bush stealth, first-hit mob-only crit after leaving cover, and reduced-damage banana 'OW!' knockback through foliage. See `docs/iteration-7.md`; Full Chromium regression passed; owner real-device approval still pending.

> **Day 7 merged into `main` via PR #16, green CI:** Simultaneous Impossible Boink and Bocht red-warning machine-gun volleys, hideable flowering bushes, 30-second secret, nonblocking Tolly/Winston banter with Rosie's wiggle reveal, and six co-op personality dialogues. No guest release until owner phone feedback. See `docs/iteration-7.md`.

> **Day 6C merged (PR #15, green CI):** The owner supplied a reference photograph for Daan. Chibi sprite and dialogue portrait drawn from the reference, distinct gold boulder warning and green limited Tolly heal, plus team XP/P1-P2 alternating perks at team levels 5/10/15. Real-device owner art/attack/heal checks still required. See `docs/iteration-6.md`.

> **Day 6B (15 October 2026):** Follow-up to owner playtest. Hero star ratings persist without hover; art is pre-decoded before clue overlays; Story 4/10 gains a beginner cushion; elite Boink/Bocht are tankier, with exclusive Extreme +/X banana attacks. Battle music gets original legendary-feeling drum/brass/string layers. 12-case hero/difficulty balance regression passed in PR #13. See `docs/iteration-6.md`; merged to `main`, phone/owner approval still outstanding.

> **Day 6 merged:** PR #12 merged into `main` with green Chromium CI. Dialogue scroll fix, fighter stats, character balance, distinct miniboss/Tolly phases and original music, Super-mode aura, and five-level rarity upgrades. Review `docs/iteration-6.md`. Owner mobile review remains outstanding.

> **Day 5C update (15 October 2026):** Fixing real game screenshot feedback: Tolly's chibi was obscured by the portrait-disc decoration; her full-size sprite now renders cleanly. Daan has a *temporary emblem-face action sprite* and the existing Extreme-only phase-two warned shockwave is animated as a "SPITE: boulder slam". His real likeness is not approved. Rosie's dragon deliberately pierces ONE extra enemy (two total), now with swept collision so it cannot silently skip an enemy on a long frame. See `docs/iteration-5.md`. Pending Chromium CI + real phone review.

> **Day 5B update (15 October 2026):** Eight approved real sprite assets (five characters, Bleepling, Boink, Bocht) now exist under `game/assets/sprites/` merged into `main` via PR #10. A loader registers them with strict dimensions; Chibi is ON by default only for this unreleased playtest, and a CLASSIC toggle / `?classic=1` returns to original portrait rendering. Tolly, the pet art, and enemy telegraphs retain original gameplay. Daan still has no approved character sprite. See `docs/iteration-5.md`. Older 'Day 5 not implemented' references below are historical.

> **Day 5 addendum (15 October 2026):** The owner has now authorised starting Day 5. Merged into `main` via PR #9, a reversible sprite renderer and purely visual pose routing are implemented, and was later extended by PR #10 with approved artwork and opt-in classic fallback; this sentence records the *earlier Day 5A state*. Refer to `docs/iteration-5.md`. Any older “Day 5 not implemented” text below refers to the prior state; sprite art/rollout and real-phone Day 4.8 acceptance remain pending.

# AI HANDOFF — LEVEL 32 / Rosie Survivors
Updated: 15 October 2026 after real two-player playtest feedback and Day 4.8 implementation. **Read this first in new AI chats.** Source of truth is the latest `main` + any open pull request; this file records intended design and known acceptance gaps, not a claim that a release is finished.

## Project and event
- Public GitHub: `tollybe/level-32`. Public game: https://tollybe.github.io/level-32/game/ . Standalone invitation: https://tollybe.github.io/level-32/game/invitation.html . Root `/` is a playful password gate forwarding to public `/game/`; not real authentication.
- Birthday is Friday **13 November 2026**, Utrecht. **Mission One:** Broodnodig, Paardenveld 5, 18:15–20:15, chocolate/crafts, dogs welcome. **Mission Two:** Lasergames Utrecht, Biltstraat 4, 20:40, two games, €28.50/person. Guests RSVP/coordinate dogs in existing WhatsApp group. **Ten-minute transfer is unresolved**; don't change event details without user approval.
- Original, editable vanilla HTML/CSS/JS, no build framework, single `game/` directory deployable to GitHub Pages; `tools/build.py` provides optional encrypted export.
- Goal: an affectionate, funny game that invites friends to the real birthday. **Invitation must ALWAYS be available in one click**, before play/during play/after win or defeat. No completion barrier.

## Characters, canonical art, humour
- `game/assets/{rosie,millie,winnifred,ellie,tolly}.webp` are **canonical immutable portraits**. Do not change, overwrite, or invent replacement faces. Character select, dialogue and boss visuals use these images. Daan's **actual** approved portrait has NOT been supplied; `game/assets/daan.svg` is a *labeled temporary emblem*, not his likeness.
- Rosie: curious, snacks/banana/cheese tax, deliberately melodramatic.
- Millie: ball obsessed, but genuinely startled by ANYTHING moving; “BALL! ... AAAAAH!”; her fear should be funny visually, not a damage debuff.
- Ellie: sensible advice, then immediately follows Rosie and Millie out of FOMO; “That's a terrible idea! ...WAIT FOR ME!”
- Winnifred: regal, aristoc*at*ic disdain, relentless wordplay; “pew pew pew” laser misunderstanding makes Rosie/Millie play dead, Ellie corrects them. Dad jokes/paws/puns are central to the invitation's identity.
- Tolly: human boss guarding fridge; **not a cat**. Daan: surprise **static/non-sprite** ally of Tolly, only in Extreme phase two, with clearly telegraphed shockwave. **Do not reveal his joining in difficulty selection**. Replace emblem ONLY after user approves art.
- Day 5 chibi transformation **NOT IMPLEMENTED**; no separate sprite sheets and no redesign until Day 4/4.5/4.6 quality criteria accepted. See `docs/iteration-5.md`.

## Shipped as of prior main and implemented on current Day 4.6 review branch
- Three difficulties: Story (4/10 target), Adventure (7/10 target, default), Extreme (10/10 target). Ratings are DESIGN TARGETS and have not been empirically verified.
- Optional one/two-player local co-op: P1 WASD / Shift dash, P2 arrows / Enter dash; 2 virtual phone thumbsticks and separate dash buttons. Stand near a fallen ally to revive. Auto-attacks.
- Prior main: Q1 tracking three pawprints; Q2 three guardian waves then cutscene plus Boink & Bocht; Q3 guardian waves; boss Tolly, phase two cone and Daan in Extreme.
- **Day 4.6 branch**: Q1 tracking, Q2 shorter two-round sausage ambush followed by Boink & Bocht, Q3 **timed three-terminal laser security puzzle** (red=wait, green=approach). Analog joystick deadzone/proportional speed. Opt-in fullscreen/landscape where browser allows; otherwise manually rotate. Auto-PAWS when tab becomes hidden. Mobile health above playfield and under hero portraits; world rendering culls off-camera scenery. Small CSS dialogue reactions reuse canonical portraits. Extreme phase 2 adds Daan-related original banter without inventing his face. More detailed mechanics in `docs/iteration-4-6.md`.
- **Important**: The Day 4.6 changes might be on a review branch rather than `main`; inspect PR status first. Never assume branch work is deployed to GitHub Pages.
- Scenes are skippable, combat freezes in cutscenes. PAWS overlay and invitation link persist.

## Code locations / flows
- `game/game.js`: `start()`, `update(dt)`, `movePlayers(dt)`, `currentObjective()`, `updateObjective()`, `world()`, `drawQuestDressing()`, `showScene()`, `renderSceneLines()`, `continueScene()`, `togglePause()`.
- `game/index.html`: hero picker, mode selector, mobile HUD, canvas, dialogue overlay, two thumbsticks, invitation anchors, PAWS, Wide Play button.
- `game/style.css`: responsive layout, analog stick shells, mobile status, cutscene order, reduced motion, fullscreen style.
- `tests/smoke.py`: Playwright script injects `window.__rosieTest` into single-file export for deterministic Q1/Q2/Q3 progression, cutscenes, Tolly boss, win/loss and links; update it when quest progression changes.
- `tools/build.py`: `game_as_single_html()` inlines JS/CSS and game asset image URLs; includes SVG support for provisional Daan.
- `game/invitation.html` + `game/birthday.ics`: authoritative invitation/calendar; preserve party times/addresses unless corrected by user.
- `docs/release-checklist.md`: manual acceptance; `docs/iteration-4-6.md`: this pass; `docs/iteration-4-7.md`: quality follow-up; `docs/iteration-5.md`: **plan only**.

## Day 4.7 development status and next action
- Day 4.6 PR #6 **merged into main** 15 October 2026 (commit `d48168c`).
- Day 4.7 branch `iteration-4-7-stability-browser-tests` repairs GitHub Actions YAML parser error, expands Chromium solo/duo/mobile tests, fixes fullscreen boss HP and invitation CTA, and adds `docs/PLAYTEST.md`. Inspect whether this PR is merged before working further.
- Automated Chromium checks passed for the expanded suite on this branch. **Do not confuse simulated mobile viewport tests with real physical phone acceptance.**
- Current unfinished owner dependencies: real iPhone/Android portrait/landscape two-thumb test, approved Daan **static portrait**, party transfer logistics 20:15→20:40, and formal go/no-go for Day 5.

## Real two-player phone feedback — Day 4.8 (15 October 2026)
- The user and Daan actually played together on a phone. Feedback: Tolly too easy, Daan needs an actual character, movement/battle visuals too static, occasional lag, cutscene pages feel too easy to skip into active combat, and P1 Shift/DASH affordance unclear.
- PR #8 branch `iteration-4-8-boss-mobile-cutscene-polish` attempts these changes: stronger cooperative Tolly scaling with last-quarter frenzy, portrait-preserving bounces/hit reactions/dash visuals, a **temporary full-body Daan support actor** bearing the **existing non-likeness emblem**, lower-cost Lite FX default on touch, visible cooldown/Shift/Enter labels, `C` to advance dialogue and deliberate cutscene input. Details and acceptance gates in `docs/iteration-4-8.md`.
- **Daan's actual approved likeness is still NOT supplied.** Never misrepresent the interim Daan actor as his true appearance; ask user for a reference photo or approved character description prior to custom art.
- This feedback is more recent/important than outdated original Day 4 battle expectations; user explicitly has **not released** the invitation. Day 5 separate chibi sheets remain blocked pending acceptance.
- Verify PR #8 / CI and whether merged before applying further edits. Do not assume branch is deployed to main.

## Mandatory validation and unfinished dependencies
- JS syntax/DOM IDs and browser smoke; real Android/iPhone portrait + landscape, two independent simultaneous touch pointers, fullscreen restrictions, PAWS/re-entry, safe laser windows; solo/co-op each difficulty; Tolly stationary exploit; Daan warning clarity; original asset hashes.
- Actual Daan portrait pending user's approval. No fabricated likeness.
- Ensure static images can render in standalone export, and invitation/calendar open correctly.
- Avoid calling the game **released**. User explicitly has NOT released the invitation/game. GitHub Pages hosts an iterative playtest version.
- README and older Day 4 documents contain historical statements (e.g. three waves at every scroll). Where they conflict, rely on current `game/game.js` and this handoff / latest iteration spec; update historical text when implementing new changes.

## Editing practices for future assistants
- Read current repository state and open PRs via GitHub connector before updating. Work on a branch/PR, preserve existing artwork, run tests if possible. User historically asks explicitly to merge PRs after review.
- Prioritize guest experience and comedic clarity over feature scope. Avoid adding timed challenges that make the invitation inaccessible; it always remains directly linked.
- Never start Day 5 sprites merely because planned in docs. User asked for staged acceptance.
