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

Mobile has touch controls. Off-screen arrows point toward separated teammates. Toggle original Web Audio music and sound effects with the sound button.

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

### Day 4 (proposed, not implemented)

See [Iteration 4 plan](docs/iteration-4.md) for a guest-first roadmap: persistent invitation access, more readable Tolly combat, story callbacks, accessible mobile play and test coverage. The [release checklist](docs/release-checklist.md) records validation steps before inviting guests.
