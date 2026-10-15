# Rosie Survivors: The Great Snack Rift · LEVEL 32

A tiny, original, shareable birthday adventure featuring four real furry friends: **Rosie, Millie, Winnifred and Ellie**. Find three story clues, escape the ridiculously cute Bleepling Menace, survive Boink & Bocht, then face **Tolly, Guardian of the Fridge** and unlock the real second mission: **laser tag**.

**Password-gated start:** https://tollybe.github.io/level-32/  
**Public game / exportable source:** https://tollybe.github.io/level-32/game/  
**Birthday invitation (always accessible):** https://tollybe.github.io/level-32/game/invitation.html

The homepage uses an encrypted password gate to send guests to the latest `/game/` version. The game and standalone invitation are public by design and do not require a password; the gate is a playful part of the quest, not a security boundary.

## Play

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | WASD | Arrow keys |
| Dash | Shift | Enter |
| Attack | Automatic | Automatic |
| Revive a friend | Stand over them for 1.85 seconds | Same |
| Pause | Escape | Escape |

Mobile has two independent virtual thumbsticks and dash buttons; in the current Day 4.6 branch the joysticks have analogue speed and the game offers optional fullscreen wide play. Off-screen arrows point toward separated teammates. Toggle original Web Audio music and sound effects with the sound button.

### Meet the heroes

- **Rosie, the Shadow Scout:** stuffed dragon toy, quick movement, and an unshakeable interest in banana.
- **Millie, the Ball Berserker:** ricocheting dog ball, sturdy and exuberant.
- **Winnifred, the Floof Duelist:** sausage sword, regal judgement, rapid close-range attacks.
- **Ellie, the Zoomie Medic:** frozen Kong projectiles that slow enemies, passive self-healing, and a green AoE healing circle that restores the health of *all allies standing inside it*.

### Day 2 gameplay

- Four visually distinct **Bleepling Menace** enemies: standard Bleeplings, bouncing/knockback **Boink**, weaving/slowing **Bocht**, and hefty **Chunklings**.
- **Three illustrated, paused clue cutscenes**. Their character dialogue uses the **exact same portrait assets as character selection**, not newly imagined pet faces.
- After clue two, **Boink & Bocht** appear as a small paired encounter and must be defeated before the last scroll unlocks.
- After clue three, the party receives a **Legendary Laser Pointer** that fires a satisfying occasional beam—foreshadowing the actual laser-tag birthday activity.
- **Tolly** remains the human fridge boss, not a cat. Phase two adds an actively dodgeable **Cone of Shame** with a visible warning arc.
- Pause/cutscenes freeze enemy AI, hazards, HP damage and the in-game timer. Co-op revives remain enabled.
- Winning **or losing** reveals **Mission Two: Laser Tag — The Human Edition** and a direct link to a standalone birthday invitation.
- A gentle original 3/4 storybook waltz rearranges into more dramatic boss music. The audio is synthesized locally and is not taken from any film score.

## Birthday missions

**Friday, 13 November 2026 · Utrecht**

**Mission One (18:30–20:30):** Broodnodig, Paardenveld 5, 3511 RD Utrecht — chocolate balls, crafts, photos and food. **Dogs are welcome for this first half**, then may relax at the host's home during laser tag; arrange **earlier drop-off** in the WhatsApp group because the transfer is tight. Keep chocolate out of reach of dogs.

**Mission Two (20:40):** Lasergames Utrecht, Biltstraat 4, 3572 BA Utrecht — two rounds at €28.50 per person; action-character outfits encouraged. RSVPs and other logistics stay in the existing WhatsApp group.

## Run and export your own copy

This is vanilla HTML, CSS and JavaScript with WebP illustrations. It has no NPM, backend, telemetry, dependencies, hosted services or third-party audio.

```bash
# From the repository root
python -m http.server 8000
# Then visit http://localhost:8000/game/
```

To export a standalone public version, simply copy `game/` including its `assets/` folder. To rebuild the **recommended password-gated start page**, which redirects to the latest public game:

```bash
python -m pip install cryptography
LEVEL32_PASSWORD='your-secret-guest-code' python tools/build.py --redirect
```

On Windows PowerShell:

```powershell
$env:LEVEL32_PASSWORD = 'your-secret-guest-code'
python tools/build.py --redirect
```

The redirect gate stores an encrypted route marker, not the password or a stale copy of the game. If you need a **fully standalone password-encrypted game** for offline export, run `python tools/build.py` without `--redirect`: that mode inlines CSS, JS and character images. Both modes use PBKDF2-SHA256 and AES-256-GCM. **Don't commit the password** to any tracked file. Note that the password is a playful entry screen only: the source lives openly in `/game/` and cannot be treated as private access control.

### Repository layout

```text
index.html                generated encrypted landing page
game/index.html           public playable game with invitation links
game/invitation.html      standalone birthday invitation, opens in a new tab
game/style.css            responsive storybook styling
game/game.js              player, enemy, mini-boss and scene logic
game/assets/             canonical portraits + illustrated cutscenes
tools/build.py            create small redirect gate or all-in-one encrypted build
tools/gate_template.html  guest password UI
tests/smoke.py            automated solo/co-op scene smoke test
docs/release-checklist.md  manual and automated release validation
docs/iteration-4.md       proposed Day 4 scope and acceptance criteria
```

### Design intent

This is an affectionate game about specific animals, created for one birthday party. Keep the animal portraits consistent across every menu and cutscene. Keep the comedy gentle and the scenes skippable/paused; nobody needs to defeat the boss to find the party details. Minecraft-adjacent cuteness is an inspiration, but the mob designs here are original and not official Minecraft assets. This project includes original party-specific artwork and real pet likenesses; don't assume they are freely licensed for commercial reuse.

### Day 3: invitation experience, dialogue and difficulty

- Cutscenes now have character-by-character, asterisk-prefixed banter with an explicit skip control and original matching character portraits.
- Clue 3's original art is prevented from upscaling above natural width; the underlying file is not changed.
- Millie's ricochet can only hit a target once per ball and is balanced with lower damage and range. Winnifred gets longer sword reach, more HP and reduced close-range contact damage.
- Tolly's in-game avatar uses the canonical Tolly image, and a telegraphed fridge-rejection shockwave punishes standing directly on her without creating unavoidable attacks.
- The result screen, game controls, and the game footer point to `game/invitation.html` in a separate tab. The invitation is accessible without winning the game.
- **Publishing:** the root `index.html` now holds a small encrypted route marker; after the correct password it redirects to current `/game/`. The guest password is never committed, and `/game/` remains public and independently exportable.

### Day 4: implemented gameplay and guest experience

Day 4 applies the [Iteration 4 roadmap](docs/iteration-4.md), motivated by playtest reports that the combat felt about 4/10 and the game could be rushed in under 30 seconds:

- **Original Day 4 implementation** used three stages of scroll guardians at each clue; this quest flow has since changed in Day 4.6. Reaching the coordinates only starts a battle; players must finish all three waves and return to the scroll before the cutscene unlocks. Boink & Bocht still block the final clue after the second cutscene.
- **Original Day 4 had two modes, since extended to three:** **Adventure** (default, aiming for 6–7/10) with more enemies, fast waves, stronger bosses; and **Story** (roughly the previous 4/10) with fewer guardians, reduced damage, and fewer wild spawns. Both grant the same birthday invitation.
- **No standing inside Tolly:** an explicit collision radius moves overlapping players outside her sprite. Tolly now pursues players more closely, uses a shorter-cooldown knockback ring, telegraphs her orange banana burst and retains the phase-two Cone of Shame. Melee characters still attack from just outside her collision ring.
- **Better character-led finale:** the selected player hero adds personalized ending dialogue using the unchanged canonical portrait art.
- **One-click guest journey:** the invitation is linked above the fold, next to character selection, below the game and at the result screen—regardless of victory, defeat or whether the game was played at all.
- **Phone-friendly challenge:** each player has an on-screen DASH action with large tap targets; reduced-motion preference and keyboard focus indicators are supported.
- **Calendar:** [add both birthday missions](game/birthday.ics). Mission Two's end time is deliberately unspecified until confirmed.
- **Sharing:** the copied score includes the birthday invitation URL.

**Verification:** the JavaScript parses; scripted gameplay simulation covered all three guardian gates, an attempted quest skip and Tolly's stationary-player exploit. Browser smoke coverage exists in `tests/smoke.py` but still needs execution in Chromium and hands-on playtesting before claiming a measured 7/10. See the [release checklist](docs/release-checklist.md).

**Artist constraint:** no existing files in `game/assets/` were changed.


### Day 4 extension: Extreme and Daan
- Extreme (10/10 target) adds denser guardian waves, stronger foes, faster Tolly and extra pressure.
- In Extreme, Daan arrives in Tolly's second phase as a static-asset encounter, warning of a dodgable shockwave.
- **Daan asset is provisional:** `game/assets/daan.svg` is a labeled emblem pending an approved likeness; it is not a chibi sprite. All original character portraits remain untouched.
- See `docs/iteration-5.md` for Day 5, **documentation only**. Day 5 implementation is blocked on Day 4 testing and asset approval.


### Day 4.5 — Paws, Puns & Polish (merged)
- PAWS button and themed overlay with resumption via the button or Escape.
- Extra authored laser/character banter and occasional character quips during exploration.
- Distinct clue-site ground details and birthday/fridge decorations, rendered without modifying canonical portraits.
- Includes new desktop Extreme smoke test scenario; full browser/manual validation is still required.
- Day 5 stays **documentation-only** until Day 4 and 4.5 are accepted. See `docs/iteration-4-5.md` and `docs/iteration-5.md`.


### Day 4.6 — Playability & Personality (merged into main)

The original three-waves-per-scroll design is **historical**, not the latest rules. In the current game: Q1 follows three pawprints; Q2 has two ambush rounds, then Boink & Bocht; Q3 has three timed red/green laser terminals (no guardian waves). The joysticks gain proportional movement and a dead zone; the phone gets optional fullscreen wide play with graceful rotation fallback. Returning from another tab PAWSes the active game. Portraits remain canonical; banter, small reaction animations, visible in-world HP and off-screen scene culling improve the experience.

**Start new AI sessions by reading [docs/AI-HANDOFF.md](docs/AI-HANDOFF.md).** See [Day 4.6 spec](docs/iteration-4-6.md), [Day 4.7 QA backlog](docs/iteration-4-7.md), and [Day 5 (not implemented)](docs/iteration-5.md). Day 4.6 is still a review/playtest change, not an official release. Daan's character emblem is temporary pending an approved portrait. The game's invitation links remain accessible regardless of progress.


### Day 4.7 — Automated stability & physical playtest (in progress)

- GitHub Actions now runs Chromium Playwright smoke tests automatically, with syntax validation, Story/Adventure/Extreme modes, simulated phone portrait/landscape, solo and co-op path, independent joystick movement, timed laser security, Daan's Extreme trigger and invitation links.
- Fixed Wide Play CSS so fullscreen no longer hides the **boss health bar** or **direct invitation link**.
- Use [the real-phone playtest checklist](docs/PLAYTEST.md) before any real release. Passing desktop/headless tests does **not** validate a real touch device, Safari screen orientation, or game balance.
- See [the up-to-date AI context handoff](docs/AI-HANDOFF.md) and [Day 4.7 release criteria](docs/iteration-4-7.md).
- No approved Daan portrait yet; the placeholder SVG is temporary. Day 5 sprite development **still not started**.


### Day 4.8 — Real two-player phone feedback (under review)

The host and Daan played together and reported easy Tolly combat, insufficient character animation, occasional phone lag, confusing scene-to-combat transitions and hard-to-find Shift DASH controls. The Day 4.8 branch makes Tolly harder in co-op, adds a last-quarter telegraphed frenzy, gives canonical portrait discs gentle movement/dash animation, and adds a provisional *on-field* Daan support actor. It does NOT create/claim an approved likeness of Daan, and introduces **no Day 5 sprites**. Dialogue advances with `C` (not movement keys), retains touch NEXT/SKIP controls, and grants brief safety after scenes. DASH labels and cooldowns are more prominent. Lite FX defaults on for touch to reduce rendering overhead.

See [Day 4.8 details](docs/iteration-4-8.md) and [AI handoff](docs/AI-HANDOFF.md). This is an iterative playtest, not guest release. Real-device FPS/boss balance and Daan's approved portrait are outstanding.


### Hackathon Day 5 — Chibi Renaissance (opt-in engineering foundation)

The early Day 5 pass adds a separate sprite-sheet renderer and presentation-only pose tracking for the four pets and Tolly. It changes **no gameplay physics, combat numbers or original portraits**, and includes synthetic browser tests. There are **no approved sprite sheets in the repo yet**; even `/game/?chibiPreview=1` correctly falls back to the existing canonical portraits until approved art is added. Daan's actual likeness remains pending. The existing playable site is still a **playtest**, not the party release. See [Day 5 development and art criteria](docs/iteration-5.md).
