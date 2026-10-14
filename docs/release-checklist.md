# Release checklist · Level 32

## Before merging

- [ ] `game/game.js` parses in a JavaScript runtime without syntax errors.
- [ ] Check JS-referenced DOM IDs exist in `game/index.html`; all standalone invitation links resolve.
- [ ] Verify all `game/assets/*.webp` blobs retain their original SHA after gameplay changes.
- [ ] Run `python tests/smoke.py` with Playwright, Chromium and `cryptography` installed.
- [ ] Play solo as Rosie, Millie, Winnifred and Ellie. Try standing still against Tolly.
- [ ] Play local co-op on one keyboard. Test revive, pause, and both dash keys.
- [ ] Test clue 1/2/3 dialogue next buttons and Skip scene. Audio and damage must pause.
- [ ] Verify Millie's ball never damages the same target more than once per projectile.
- [ ] Test the result overlay and invitation CTA after **win and defeat**.
- [ ] Test opening the invitation from the bottom bar *without* playing at all.
- [ ] Verify no password or secret was checked into the repository.

## Publishing

- [ ] Root entry `/` accepts the guest password, decrypts a route token, and navigates to `/game/`.
- [ ] Public `/game/` loads current JS/CSS and canonical asset images.
- [ ] Public `/game/invitation.html` displays both missions, dates, addresses, and links.
- [ ] Confirm new-tab behavior on phones and desktops; popup blockers shouldn't block anchor clicks.
- [ ] Confirm game can be exported by copying the `game/` folder.
- [ ] Verify no browser console errors, broken images, or infinite animation/repaint loops.

## Build modes

**Recommended website mode**: `python tools/build.py --redirect` (with `LEVEL32_PASSWORD` in the environment or entered privately when prompted). The generated root uses an encrypted route marker so guests enter the password and then play the latest `/game/` version.

**Standalone encrypted export mode**: `python tools/build.py` (the original default). This embeds the complete game and its canonical image assets inside a password-encrypted single file. It will be a snapshot at the time of the build.

**Note:** The public `/game/` source is accessible directly by design. The guest code is a playful gate, not authentication for private information.
