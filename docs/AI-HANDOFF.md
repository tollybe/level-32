# AI HANDOFF — LEVEL 32 / Rosie Survivors
Updated: 15 October 2026. **Read this first in new AI chats.** Source of truth is the latest `main` + any open pull request; this file records intended design and known acceptance gaps, not a claim that a release is finished.

## Project and event
- Public GitHub: `tollybe/level-32`. Public game: https://tollybe.github.io/level-32/game/ . Standalone invitation: https://tollybe.github.io/level-32/game/invitation.html . Root `/` is a playful password gate forwarding to public `/game/`; not real authentication.
- Birthday is Friday **13 November 2026**, Utrecht. **Mission One:** Broodnodig, Paardenveld 5, 18:30–20:30, chocolate/crafts, dogs welcome. **Mission Two:** Lasergames Utrecht, Biltstraat 4, 20:40, two games, €28.50/person. Guests RSVP/coordinate dogs in existing WhatsApp group. **Ten-minute transfer is unresolved**; don't change event details without user approval.
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
