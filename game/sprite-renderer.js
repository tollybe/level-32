/* Hackathon Day 5: opt-in sprite-sheet renderer.
 * No character likenesses are defined here. Approved sheets must be registered
 * separately; missing/invalid art always leaves the existing portrait renderer.
 * This file never touches game physics, collisions, hitboxes or state updates.
 */
(function () {
  'use strict';

  const FRAME_SIZE = Object.freeze({rosie:64, millie:64, winnifred:64, ellie:64, tolly:96, daan:96});
  const ROW = Object.freeze({down:0, left:1, right:2, up:3});
  const ANIMATIONS = Object.freeze({
    idle: [0], walk: [1, 2], attack: [3], dash: [4],
    hurt: [5], knockout: [6], special: [7]
  });
  const sheets = new Map();
  // Only preview URLs opt in; ordinary /game/ remains visually unchanged.
  let preview = new URLSearchParams(location.search).get('chibiPreview') === '1';

  // Sprite contract: eight columns (idle/walk1/walk2/attack/dash/hurt/
  // knockout/special), four rows (down/left/right/up). Transparent PNG or
  // WebP at exact 64×64 hero / 96×96 boss frame resolution.
  function register(id, image) {
    const frame = FRAME_SIZE[id];
    if (!frame || !image || !image.complete ||
        image.naturalWidth !== frame * 8 || image.naturalHeight !== frame * 4) {
      return false;
    }
    sheets.set(id, image);
    return true;
  }

  function draw(ctx, id, pose, x, y, size, elapsedSeconds) {
    if (!preview || !sheets.has(id)) return false;
    const image = sheets.get(id), frame = FRAME_SIZE[id];
    if (!image.complete || image.naturalWidth !== frame * 8 ||
        image.naturalHeight !== frame * 4) return false;

    const direction = Object.prototype.hasOwnProperty.call(ROW, pose?.direction)
      ? pose.direction : 'down';
    const state = Object.prototype.hasOwnProperty.call(ANIMATIONS, pose?.state)
      ? pose.state : 'idle';
    const cells = ANIMATIONS[state];
    const time = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
    const column = cells[Math.floor(time / 0.16) % cells.length];
    const dimension = Math.max(1, size);
    const previousSmoothing = ctx.imageSmoothingEnabled;
    try {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, column * frame, ROW[direction] * frame,
        frame, frame, Math.round(x - dimension / 2),
        Math.round(y - dimension / 2), dimension, dimension);
    } finally {
      ctx.imageSmoothingEnabled = previousSmoothing;
    }
    return true;
  }

  // Preview is reversible without mutating gameplay state. register() is also
  // used by synthetic browser tests; no unapproved character sheets ship.
  window.Level32Sprites = Object.freeze({
    register, draw,
    setPreviewEnabled(value) { preview = Boolean(value); },
    get previewEnabled() { return preview; },
    get loadedCharacters() { return [...sheets.keys()]; },
    frameSize: FRAME_SIZE
  });
})();
