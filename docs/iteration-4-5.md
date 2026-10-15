# Hackathon Day 4.5 — Paws, Puns & Polish

**Status:** Implemented on review branch; full acceptance pending. Day 5 is blocked.

## North star
A funny, welcoming invitation game, not an obstacle to viewing the birthday plan. The canonical character art is immutable. Every win, loss or non-player can open the independent invitation.

## Character bible
- Rosie: curious, obsessed with banana and cheese tax, deliberately dramatic; starts chaos.
- Millie: BALL! followed by panic at any unexpected movement. Brave for about three seconds; fear is visual/comedic only, not a new combat debuff.
- Ellie: sounds sensible, then immediately follows everyone into danger for fear of being left out: “Guys, terrible idea. WAIT FOR ME!”
- Winnifred: unimpressed aristo-*cat*-ic nobility, pun-laden disapproval. Cat goes “pew pew pew”; others fall dramatically before Ellie points out it meant the laser.
- Tolly: increasingly exasperated human fridge guardian. Daan: static secondary Extreme-mode defender, never a Day 5 sprite.

## Shipped implementation slice
- PAWS labels, onscreen overlay, Escape / resume flow; existing simulation remains frozen while paused.
- Expanded clue-three dialogue with laser misunderstanding. More atmospheric, occasional contextual banter; avoid constant unskippable interruptions.
- World-space clues differentiated with pawprints, sausage/ball evidence, laser prophecy; fridge-sign and celebration props. Vector effects only, no canonical art edits.
- Existing Extreme Mode, static Daan emblem and independent invitation retained. Daan's **approved likeness is still outstanding**.
- Smoke suite extended for PAWS and Extreme path; execution and actual difficulty validation remain release gates.

## Acceptance checklist
- [ ] Approved Daan illustration supplied and swapped for the labeled temporary emblem.
- [ ] Browser Playwright smoke suite passes desktop, mobile Story, mobile Adventure and desktop Extreme.
- [ ] Manual solo/co-op testing of guardian waves and Tolly/Daan phase; no stationary exploit.
- [ ] Verify dialogue timing and accurate character voices with actual guests.
- [ ] Verify PAWS freezes timer, movement, attacks and enemy damage; Esc and button both work.
- [ ] Verify clue decorations don't obscure hitboxes or telegraphs on small screens.
- [ ] Invitation and calendar tested on physical phones; no popup issue.
- [ ] Confirm unchanged SHA of all canonical pet/Tolly assets and no Day 5 sprite files.
