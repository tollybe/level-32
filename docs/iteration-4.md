# Hackathon Day 4 · From playable game to memorable birthday invitation

**Status:** Day 4 merged into `main` on 15 October 2026. Scripted progression checks passed; full Playwright browser testing and human difficulty validation remain pending. **Target:** Friday 13 November 2026 in Utrecht.

## North star

The game is an affectionate way to invite friends to a birthday—not an obstacle people must overcome to find a date, address or RSVP instructions. Every player, including someone who loses, skips, arrives on mobile or dislikes games, must reach the real invitation quickly.

**One-sentence pitch:** A small, funny rescue adventure starring Rosie, Millie, Winnifred and Ellie, whose journey to challenge Tolly accidentally recruits the player to two real-world birthday missions.

### Invariants

1. Never alter existing canonical files in `game/assets/` for Rosie, Millie, Winnifred, Ellie or Tolly, or introduce redesigned versions of those characters without explicit approval. Animation, shaders, layout, crops and effects may be composed **around** the existing originals. Cutscene speaker portraits come from those exact assets.
2. The real invitation is always available; neither winning nor finishing the game is a prerequisite. It must remain a standalone shareable page at `game/invitation.html`.
3. Keep a playful, original score and enemies. Don't ship or directly reproduce Minecraft, Undertale or Studio Ghibli music, art or intellectual property. Take only high-level inspiration from cozy waltzes and witty dialogue pacing.
4. Retain optional 1–2 local co-op and mobile navigation. Preserve no-dependency vanilla HTML/CSS/JS and GitHub Pages exportability.
5. No server-side scores, RSVP database, or personal-data collection; RSVP coordination stays in the existing WhatsApp group.

## What Day 3 already solved

- Millie's one-ball/many-hit bug and Winnifred's overly risky close-range combat.
- More readable per-speaker cutscene dialogue and a way to skip.
- A telegraphed, dodgeable anti-camping counterattack and canonical portrait for the human Tolly boss.
- An independent invitation page and clear invitation links from gameplay/results.
- Password gate that authenticates then redirects to the current `/game/` source, avoiding stale encrypted game copies.

## Day 4 priorities

### P0 · Make the invitation impossible to miss

**Goal:** Guests can view the entire event plan without completing any gameplay.

- A first-screen **View invitation** action alongside **Begin hunt** on mobile and desktop.
- In ending overlays, make **Go to birthday invite** the primary action and replay secondary. Preserve direct accessibility via the persistent game button.
- Add a short, distinctive post-boss punchline that explicitly connects the recovered laser pointer to the real-life laser-tag mission.
- Offer an optional **Add to calendar** link/file containing both activities, with full addresses and a reminder to check WhatsApp for transport/RSVP. Don't invent a WhatsApp invite URL.
- Add accessible title/description, navigable links and readable opening times on the standalone invitation.

**Acceptance:** A visitor can reach the invitation in **one click** from initial character select, during play, after victory, after defeat, and from a mobile screen. Browser popup blocking does not prevent navigation because links use actual `<a target="_blank">` elements.

### P0 · Quality and test gate

- Fix any failures in solo, co-op, and mobile automated smoke flows before design polish.
- Automated checks for three clue triggers, Boink & Bocht, boss phase transition, win/loss states, cutscene skip, canonical portrait references, no duplicate ball damage, and invitation links.
- Test browser compatibility of password-gated root, public `/game/`, and `/game/invitation.html`.
- Verify character asset hashes are unchanged. Evaluate input handling on blur/restart/pause; verify timers and damage freeze during dialogue.
- Add keyboard focus states, reduced-motion support and larger mobile text/click areas. No cutscene should block progress.

**Acceptance:** Tests pass; no errors in the browser console; neither opening nor closing the invitation resets the running game.

### P1 · Tolly becomes a characterful boss, not just a health bar

**Goal:** Make the fight feel like a funny finale instead of a long damage race.

- Make the fridge-refusal **shockwave**, banana fan, and phase-two **Cone of Shame** visually distinct with telegraphed safe zones.
- Add attack cadence and recovery windows so players can dodge and reposition, especially Winnifred; no instant damage without warning.
- Show clear Tolly portrait staging / animation with only the **existing character file**, alongside title cards, fridge seal and signature banter.
- Tune HP, summon frequency, reach and ability cooldowns after timing sample runs; assess stationary exploitation for all four heroes.
- Allow a **Story Mode** / **Challenge Mode** choice if varied ability levels test poorly. Both should show the same birthday invitation.

**Acceptance:** Stationary melee is unsafe but beatable with movement; attacks feel fair on a phone; boss defeats do not depend on the perfect hero.

### P1 · Dialogue with charming payoffs

- Draft three-scene callbacks (banana/cheese tax, alleged sausage evidence, the suspicious laser, the absurd real-world second mission).
- Use concise one-beat dialogue and purposeful speaker swaps; retain explicit Skip scene and no dialogue typing delay that traps fast readers.
- Give each animal a recognizable voice: curious Rosie, ball-obsessed Millie, pompous Winnifred and affectionate-speedster Ellie. Tolly remains the human Guardian of the Fridge.
- Add an optional **character-select banter** or small ending variation depending on the actual selected heroes, without creating new character portraits.

**Acceptance:** One-minute players understand why the game reveals the birthday invitation; story and player choices are connected.

### P2 · Presentation and delight (only after P0/P1 pass)

- Crisp scene 3: audit the native WebP size, CSS scaling and source fidelity; do not invent or retouch the existing character designs.
- Improve visual hierarchy and transitions with CSS and tasteful particle effects rather than more unapproved character art.
- Audio: original light 3/4 melody, playful boss variation and gentle transition to victory/invitation; verify mute state and accessibility.
- An optional shareable mission-card message (not a backend leaderboard) that includes the invitation link and birthday date.

## Suggested implementation order

| Slice | Deliverable | Dependencies |
| --- | --- | --- |
| 4A — Guest journey | Entry CTA, result CTA hierarchy, direct share link, calendar | Independent |
| 4B — Boss feel | Attack state machine/telegraphs, portrait presentation, hero balance | Day 3 |
| 4C — Narrative | Better dialog beats, hero-aware lines, ending callback | Day 3 |
| 4D — Polish/release | Device testing, accessible UI, regression checks, updated docs | 4A–4C |

## Definition of done

A guest opens the URL, chooses to play or skip, understands why Rosie and friends were searching for Tolly, and has the actual birthday details open in a separate window. No matter how the encounter ends, the evening's two real-world missions are clearer and more appealing than the score.

## Not in Day 4

A hosted leaderboard, online multiplayer, login/accounts, payment collection, automated RSVPs, redesigned pet assets, or copyrighted game/film music.

## Day 4 implementation notes · 15 October 2026

The focus changed after playtesting revealed that combat felt **4/10** and guests could race through all clues in under 30 seconds.

| Priority | Implementation | Remaining validation |
| --- | --- | --- |
| Guest-first invitation | First-screen and character-select CTA; persistent game and win/loss CTA; separate invitation | Check mobile browser/window behavior |
| Calendar | `game/birthday.ics` contains both missions; no fabricated end time for laser tag | Import into calendar apps |
| Clue pacing | Three waves at every scroll, player must return for the scene; Boink and Bocht still required | Timing and difficulty with actual players |
| Combat rebalance | Increased enemy mobility/spawn intensity; mode choice: Adventure or Story | Measure solo and 2-player completion rates |
| Tolly | Boss collider, chase, faster telegraphed knockback, orange banana warning, cone phase | Check safe dodges and no stationary-win exploit |
| Dialogue | Hero-dependent ending quip with canonical portraits | Content/proofreading |
| Mobile/accessibility | Two mobile dash buttons, keyboard focus and reduced-motion CSS | Real touch-device testing |
| Tests | Expanded Playwright smoke suite and script-level simulation | Run Chromium automation on desktop/mobile |

**Difficulty numbers are targets, not measured ratings.** If the challenge becomes punishing for first-time guests, adjust wave health and spawn rate before touching base character art. The invitation always remains accessible without completion.
