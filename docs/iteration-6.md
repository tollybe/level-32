# Hackathon Day 6 — Dialogue, Character Balance and Legendary Progression

**Status:** Implementation candidate for automated regression and owner playtest. Not a guest release.

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

- [ ] Confirm Chromium CI passes including new checks for cutscene scroll, level-5 offer, XP multiplier and phase-three Daan.
- [ ] Host approves actual iPhone/Android UI for hover/tap cards, perk dialog, co-op, and readable telegraphs/aura.
- [ ] Host approves 7/10 duo and boss HP timings, and balances all four heroes on real gameplay runs.
- [ ] Test the four new music modes on actual device speakers/headphones at reasonable loudness; all should be original and distinct.
- [ ] Recheck original asset blob SHA unchanged, invite CTA/ICS, reduced motion, and release readiness.
- [ ] Daan still needs an approved real likeness; existing animated emblem-face actor remains provisional.

The word “Legendary has no perks” was interpreted as **no debuff**; this matches the requested rarity as an exceptionally valuable choice. Revisit if the user intended a different mechanic.
