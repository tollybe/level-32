# Rosie Survivors · LEVEL 32 🐾

A tiny, playable, co-op birthday game featuring **Rosie, Millie, Winnifred and Ellie**. Explore the sakura gardens, bonk a horde of pugs, follow the golden clue compass and locate Tolly guarding the fridge.

**Play:** `https://tollybe.github.io/level-32/` (guest password).  
**Public export:** `https://tollybe.github.io/level-32/game/` (no password; it is the readable game source). 

## Controls

| | Player 1 | Player 2 |
|---|---|---|
| Move | W A S D | Arrow keys |
| Dash | Shift | Enter |
| Fight | Automatic | Automatic |
| Revive | Stand on the fallen teammate for 1.85 seconds | Same |

On touch devices, use the on-screen pads. Escape pauses the game. The sound button toggles original music and effects. Exploration plays a breezy **3/4 garden waltz** with woodwind-like lead, music-box accents and plucked-string accompaniment; the fridge cutscenes use a softer variation, and Tolly has a faster, dramatic companion theme. Everything is synthesized in JavaScript, without third-party recordings.

## Mission and heroes

**Rosie** carries her stuffed dragon; **Millie** throws the bouncing dog ball; **Winnifred** wields the sausage sword; **Ellie** throws frozen Kong treats, slows pugs and heals teammates standing inside her green aura. Find three scrolls and follow the golden compass to Tolly's fridge. Enjoy the illustrated boss reveal and the Cone of Shame scene: enemies and damage freeze while the scenes are open.

## How to run or export

This is a vanilla HTML/CSS/JavaScript game: no npm, servers or API calls are required to run the code. For local testing, run from the repository root:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/game/`. To keep your own standalone copy, download the `game/` folder with its `assets/`, `style.css` and `game.js` files.

To rebuild the single-file encrypted homepage:

```sh
python -m pip install cryptography
LEVEL32_PASSWORD='choose-your-guest-code' python tools/build.py
```

On Windows PowerShell:

```powershell
$env:LEVEL32_PASSWORD = 'choose-your-guest-code'
python tools/build.py
```

Commit the new root `index.html` to publish the password gate. **Do not commit the guest password** into source or CI configuration.

### Project layout

```text
index.html              encrypted homepage (generated)
game/index.html         public playable game
game/style.css          responsive styling
game/game.js            game logic, combat, revives and scenes
game/assets/            pet portraits and illustrated story panels
tools/build.py          build the encrypted single-file homepage
tools/gate_template.html  guest password UI
```

## Security and licensing notes

This GitHub repository is **public**. The guest password on the homepage is a playful invitation gate, **not access control**: anyone can inspect the source or visit `/game/` directly. Don't place secrets or anything you need hidden in this project. Artwork and character likenesses are original assets for this party game; do not assume they are freely licensed for resale or reuse.

## Game-jam design goals

- **Instantly recognisable heroes** — four real furry friends, their own abilities and jokes.
- **Low-friction discovery** — only the *next* clue appears; a golden compass and quest bar point players toward it.
- **Local co-op fun** — shared camera, off-screen teammate arrows, revives and Ellie healing.
- **Story rewards** — illustrated fridge and Cone of Shame cutscenes pause all gameplay.
- **Replayability** — local best score and a copy-to-WhatsApp result after a run.
- **A real invitation** — the same website includes the evening's venues, times, and dog-friendly plan.

Birthday: **Friday 13 November 2026**. Dogs are welcome for the first half at Broodnodig and can stay at the host's place for the laser-tag portion; coordinate drop-off in the WhatsApp group.