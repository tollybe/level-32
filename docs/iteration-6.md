# Hackathon Day 6 — Dialogue, Character Balance and Legendary Progression

**Status:** Merged to `main` in PR #12 (15 October 2026), GitHub Actions Chromium CI passed. Awaiting real-phone owner playtest; not a guest release.

## Requested changes and implementation

- **First dialogue jump:** No `scrollIntoView` on the first scene beat; dialogue remains frozen and only C/Next/Skip advances it. The scroll position is tested.
- **Hero selection hover/focus:** All four cards expose a readable five-star Damage/Health/Speed comparison with a one-line explanation. Tap/focus supports touch and keyboard.
- **Combat:** Rosie 17 damage / .56s with a two-target cap; her second pierced enemy receives 50% damage. Millie 18 damage / .56s ball, hits only the first enemy. Winnifred 30 damage / .34s within 96 world units (highest sustained DPS, shortest range). Ellie 8 damage / .92s, slowing projectile and existing healing aura (lowest DPS).
- **Tolly:** HP increased to 1450 solo/2040 co-op before difficulty scaling. Distinct phases at 67% (cone and extra attacks) and 33% (frenzy plus Daan's Extreme-only SPITE). No Daan on phase two; preserved both explicit cutscenes.
- **Boink and Bocht:** Spawn on opposite diagonals, get difficulty-scaled extra health/damage, and repel each other if too close. Both must still be beaten. Separate low-tier miniboss music.
- **Original music:** WebAudio arrangements written for Level 32, with light arcade combat in Tolly phase 1, darker phase 2, layered string/brass-style heroic finale, and a playful minor-key mini-boss theme. Do not use Pokémon recordings or reproduce recognizable melodies.
- **Super-mode animation:** Rarity-colored pulsing ring around heroes for eight seconds after upgrade; Legendary persists. Transformed Tolly has a boss aura. Lite FX and reduced-motion preference minimize animation.
- **Five-level perks:** Every level divisible by 5 pauses to offer HP or Damage to one randomly selected active hero. Each card rolls independently: Normal 75% (small buff/small drawback), Epic 21% (stronger buff/debuff), Legendary 4% (strongest buff/no drawback). After level 5, XP gains are slower in Adventure (78%) and Extreme (60%); Story remains 100%. Up to level 5, all tiers gain the same XP. Routine levels still add small baseline increments. Perks are chosen locally without a backend.

## Acceptance and safety

- [x] Chromium CI passed, including new checks for cutscene scroll, level-5 offer, XP multiplier and phase-three Daan.
- [ ] Host approves actual iPhone/Android UI for hover/tap cards, perk dialog, co-op, and readable telegraphs/aura.
- [ ] Host approves 7/10 duo and boss HP timings, and balances all four heroes on real gameplay runs.
- [ ] Test the four new music modes on actual device speakers/headphones at reasonable loudness; all should be original and distinct.
- [ ] Recheck original asset blob SHA unchanged, invite CTA/ICS, reduced motion, and release readiness.
- [ ] Daan still needs an approved real likeness; existing animated emblem-face actor remains provisional.

The word “Legendary has no perks” was interpreted as **no debuff**; this matches the requested rarity as an exceptionally valuable choice. Revisit if the user intended a different mechanic.

## Day 6B — Owner playtest fixes (15 October 2026)

- **Character stats visible without hover:** All four hero cards now permanently show Damage, Health and Speed out of five. Hover/focus expands the role explanation; this works even on touch-only devices. CSS/rendered visibility, not merely DOM existence, is covered in browser smoke tests.
- **First dialogue no longer flashes old artwork:** Clue and boss story art are preloaded/decoded. The full-screen cinematic only becomes visible after the new frame and speaker dialogue are ready. A monotonically increasing scene token rejects late image loads after restart/skip, and the game is frozen throughout.
- **Story 4/10 becomes newcomer-friendly:** Every hero starts with 25% more HP, guardian HP/speed/damage are softer, ambient spawn spacing is increased with a six-second grace and reduced cap, and the random surprise stampede is disabled. Adventure 7/10 and Extreme 10/10 remain progressively harder.
- **Tougher elite Boink/Bocht:** Special clue-two duo HP now scales at 0.9× Story, 2.4× Adventure, 3.2× Extreme of their pre-existing 3× elite HP baseline. They remain physically separate; ordinary ambient Boink/Bocht retain their current balancing.
- **Extreme 10/10 banana volley:** Boink telegraphs a four-banana world-axis **+** pattern, while Bocht telegraphs four diagonal **X** bananas; 0.78-second windups, 11 damage per banana, staggered cooldowns and existing player invulnerability permit dodging. This mechanic is not active on Story or Adventure, and banana hazards clear on final duo defeat.
- **Legendary-feeling boss music:** The existing original battle melodies receive drums, an ascending ostinato, additional bass, brass responses and detuned string harmonies, with distinct phases and a visible Now Playing label. This is *inspired by the energy* of classic monster-battling RPGs; no copyrighted Pokémon melody or audio recording is included.
- **Regression tests:** A 12-entry matrix (4 pets × 3 difficulty modes) verifies actual player starting HP, guardian health/damage/count, special duo HP and Exclusive-Extreme +/X shot-vector geometry. Separate browser checks test visible/focus/hover stats and that clue art is loaded before the cinematic opens.
- **Still needs owner review:** New music through real speakers, beginner playtest without developer invincibility, 7/10 mini-boss challenge, the readability of +/X warning zones, physical phone animation performance, and Daan's approved actual likeness.

**Release status:** PR #15 merged into `main` (15 October 2026), green JavaScript/Chromium regression checks for alternating perks, reference-based Daan art, two bounded heals, and existing quest/invitation flows. Still a playtest pending real-device feedback. Original portrait/image hashes, guest invitation access, and birthday location/timing information are unchanged.

## Day 6C — Co-op turn fairness and Daan reference artwork

- XP and routine level bonuses are **shared** by the whole squad. Previously the single special perk at team levels 5, 10, 15, etc., was assigned randomly; the same player could be chosen indefinitely. Now P1 receives the level-5 offer, P2 the level-10 offer, P1 the level-15 offer, and so on; solo still receives every perk. Both remain free to choose HP or Damage, with independent rarity chances. The HUD identifies **TEAM LV**, **XP to next level**, and **NEXT PERK**.
- The upgrade panel clarifies whose turn it is and who goes next. Consuming the selected perk also resumes any banked XP, rather than appearing stuck at level 10 until another pickup.
- Daan's old abstract insignia is replaced in `game/assets/sprites/daan.svg` with a **new illustrated 768×384 sprite sheet** referencing the supplied photograph: short blond hair, dark charcoal hiking top, red trousers and a hiking backpack. `game/assets/daan.svg` contains the matching chibi cutscene portrait. These are original vector art, not a photo or a claim of a photographic likeness; visual owner approval remains open.
- Daan joins **only in Extreme phase three**. The phase-three cinematic includes one brief Daan speech bubble with his matching portrait. Golden boulder markers show countdown seconds and a rock icon; on impact a shockwave animation appears. He also channels a green healing beam for 1.45 seconds, then heals Tolly by **up to 5% max HP per cast**, **two casts maximum** in the entire fight, and **never above 43% max HP**. No heal occurs when Tolly has died. These are readable audiovisual cues, not extra unseen attacks.
- Automated regression covers P1/P2/P1 selection, solo-only choice, upgrade text, Daan's sprite load + dialogue portrait, two bounded heals, and existing boss/invitation flows.

**Remaining gates:** owner accepts Daan art and telegraph clarity on desktop/phone; verify the heal pacing in a full physical playtest. The original five pet/Tolly portrait files and event details are unchanged.


## Day 7 — Next world iteration

A new dedicated [Day 7](iteration-7.md) outlines simultaneous Impossible-mode Boink/Bocht machine-gun volleys, hideable sakura bushes, a 30-second Easter-egg scene, Tolly's nonblocking Winston search and co-op relationship dialogues. These are features under test; prior real-device acceptance gates remain.
