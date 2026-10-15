# Day 4.7 — Stability, balancing, and art approval (next pass)

**Status: PLANNED / NOT IMPLEMENTED as a completed iteration.** Day 4.6 code is a proposed review branch. Day 5 remains documentation-only.

## Immediate test and stability tasks
1. Execute Playwright smoke suite automatically in GitHub Actions on every pull request and push to main, including 390×844 phone portrait and 844×390 landscape.
2. Play physical Android/iPhone: fullscreen/rotation permissions, two fingers controlling P1/P2 at once, dash responsiveness, safe visual targets and tab-switch PAWS.
3. Exercise all three difficulty settings in solo and local co-op, each hero as player 1, including guardians, laser puzzle, boss chase/anti-camp, and Daan hazard.
4. Measure frame rate and battery/CPU load on a phone after scene culling. Keep readable telegraphs over decorations.
5. Do accessibility pass for small text, color-independent laser labels, reduced-motion reactions, focus, mute/PAWS, and moving-control input alternatives.
6. Confirm exact birthday invitation details, two mission addresses and calendar imports; validate the ten-minute transfer as a host logistics item, not an in-game hurdle.
7. Obtain actual, user-approved static Daan illustration to replace provisional `daan.svg`; no speculative portrait creation.
8. Correct remaining release checklist and docs after playtesting. Preserve original artwork hashes.
9. Explicit sign-off from owner before merging any Day 5 sprites.

## Explicit exclusions
No chibi implementation yet. No online multiplayer, new collection back end, pricing/RSVP collection, property tracking, rewritten canon portraits or involuntary phone rotation.

## Current release gates
- [ ] GitHub Actions green on branch PR.
- [ ] Physical phone portrait and landscape co-op accepted.
- [ ] Extreme Daan telegraph balanced and tested; approved Daan portrait.
- [ ] Invitations fully functional without gameplay.
- [ ] Day 5 still not started.
