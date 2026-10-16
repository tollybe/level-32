/* Hackathon Day 5: reversible sprite-sheet renderer.
 * Loads owner-approved Day 5 gameplay sheets, with strict dimension checks.
 * Missing or invalid art always leaves the original portrait renderer.
 * This file never touches game physics, collisions, hitboxes or state updates.
 */
(function () {
  'use strict';

  const FRAME_SIZE = Object.freeze({rosie:64, millie:64, winnifred:64, ellie:64, vanille:64, tolly:96, daan:96, bleepling:64, boink:64, bocht:64});
  const APPROVED = Object.freeze({
    rosie:'assets/sprites/rosie.webp', millie:'assets/sprites/millie.webp',
    winnifred:'assets/sprites/winnifred.webp', ellie:'assets/sprites/ellie.webp',vanille:'assets/sprites/vanille.svg',
    tolly:'assets/sprites/tolly.webp', daan:'assets/sprites/daan.svg', bleepling:'assets/sprites/bleepling.webp',
    boink:'assets/sprites/boink.webp', bocht:'assets/sprites/bocht.webp'
  });
  const ROW = Object.freeze({down:0, left:1, right:2, up:3});
  const ANIMATIONS = Object.freeze({
    idle: [0], walk: [1, 2], attack: [3], dash: [4],
    hurt: [5], knockout: [6], special: [7]
  });
  const sheets = new Map();
  // Owner approved the Day 5 artwork for playtest. Guests can revert at any time
  // with CLASSIC PORTRAITS or ?classic=1. Daan is an EXPLICITLY PROVISIONAL
  // reference-photo-inspired chibi actor; pending owner visual approval.
  const params=new URLSearchParams(location.search);
  let preview=params.get('classic')!=='1' && params.get('chibiPreview')!=='0';

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

  // All loads are optional and asynchronous. A corrupt or missing sheet leaves
  // the original portrait-based game perfectly playable.
  function loadApproved() {
    return Promise.all(Object.entries(APPROVED).map(([id,src])=>new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>resolve(register(id,image));
      image.onerror=()=>resolve(false);
      image.src=src;
    })));
  }
  window.Level32Sprites = Object.freeze({
    register, draw, loadApproved,
    setPreviewEnabled(value) { preview = Boolean(value); },
    get previewEnabled() { return preview; },
    get loadedCharacters() { return [...sheets.keys()]; },
    approvedFiles: APPROVED,
    frameSize: FRAME_SIZE
  });
  // Images may be embedded data URLs in the password-encrypted standalone export.
  loadApproved();
})();
