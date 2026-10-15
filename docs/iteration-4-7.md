# Day 4.7 — Stability, balancing, and art approval (next pass)

**Status: Day 4.7 automated-stability slice implemented in review branch (15 October 2026); real-device validation remains open.** Day 4.6 was merged into main as PR #6. Day 5 remains documentation-only.

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


## 15 October 2026: implemented 4.7 stability changes
- Repaired YAML syntax in `.github/workflows/rosie-smoke.yml`: an unquoted colon in a workflow step title stopped GitHub Actions from creating jobs. A valid workflow now runs browser tests on PRs and branch pushes.
- Automated Chromium smoke tests now cover desktop and mobile portrait/landscape, Adventure/Story/Extreme, solo and local co-op paths, two independent joystick axes, laser safety/failure/success, Daan's Extreme-only arrival, Tolly anti-camping, cutscene skipping, PAWS, and both winning/losing invitation links.
- Fixed a **fullscreen regression** where the responsive stylesheet hid the boss HP bar and invitation action while playing in Wide Play. Both are explicitly visible now.
- Added `docs/PLAYTEST.md` with a compact physical-phone scenario checklist and feedback matrix.
- Unchanged canonical character asset blobs verified in PR #6. No new sprites or artwork introduced by 4.7.

**Automated regression suite:** success in Chromium on branch after the test expansion; see GitHub Actions tab for latest run. This does **not** prove touch ergonomics on an actual Android/iPhone, real-world balance, an approved Daan portrait, or all mobile calendar behavior.

**Remaining sign-off:** owner phone playtest, approved Daan character illustration, device and calendar validation, solo/co-op difficulty balance, and invitation logistics. Keep the project in playtest state until expressly released.
