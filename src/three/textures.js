import * as THREE from 'three';

/**
 * Procedural canvas textures. Everything here is generated at runtime,
 * so the project ships with no third-party image assets.
 */

// Small deterministic PRNG so textures look identical on every load.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { srgb = true, anisotropy = 8, repeat } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Wood desk                                                           */
/* ------------------------------------------------------------------ */
export function createWoodTextures() {
  const W = 2048;
  const H = 1024;
  const rand = mulberry32(7);
  const color = makeCanvas(W, H);
  const ctx = color.getContext('2d');

  // Warm base with slow tonal variation along the boards.
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#8e5b31');
  base.addColorStop(0.5, '#9e693a');
  base.addColorStop(1, '#84522b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Long grain strands (run along X).
  for (let i = 0; i < 520; i++) {
    const y0 = rand() * H;
    const amp = 4 + rand() * 18;
    const freq = 0.0015 + rand() * 0.004;
    const phase = rand() * Math.PI * 2;
    const dark = rand() > 0.45;
    ctx.strokeStyle = dark
      ? `rgba(60, 30, 14, ${0.05 + rand() * 0.12})`
      : `rgba(190, 120, 70, ${0.03 + rand() * 0.08})`;
    ctx.lineWidth = 0.6 + rand() * 2.6;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Pores / fine speckle.
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = `rgba(40, 20, 8, ${rand() * 0.12})`;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 6, 1);
  }

  const map = toTexture(color, { repeat: [1, 1] });

  // Roughness: mostly satin, grain slightly rougher.
  const rough = makeCanvas(512, 256);
  const rctx = rough.getContext('2d');
  rctx.fillStyle = 'rgb(165,165,165)';
  rctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    rctx.fillStyle = `rgba(220,220,220,${rand() * 0.25})`;
    rctx.fillRect(0, rand() * 256, 512, 1 + rand() * 2);
  }
  const roughnessMap = toTexture(rough, { srgb: false, repeat: [1, 1] });

  return { map, roughnessMap };
}

/* ------------------------------------------------------------------ */
/* Self-healing cutting mat                                            */
/* ------------------------------------------------------------------ */
export function createMatTexture({ cols, rows, border }) {
  const PX = 64; // pixels per grid cell
  const W = Math.round((cols + border * 2) * PX);
  const H = Math.round((rows + border * 2) * PX);
  const rand = mulberry32(21);
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Olive-green base with soft mottling.
  ctx.fillStyle = '#2a4a34';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const r = 80 + rand() * 260;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(20, 30, 18, 0.05)' : 'rgba(110, 125, 90, 0.035)';
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fine grain.
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,230,0.035)';
    ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  }

  const ox = border * PX;
  const oy = border * PX;
  const gw = cols * PX;
  const gh = rows * PX;

  // Grid lines.
  ctx.lineCap = 'butt';
  for (let c = 0; c <= cols; c++) {
    const major = c % 5 === 0;
    ctx.strokeStyle = major ? 'rgba(236, 226, 196, 0.62)' : 'rgba(226, 216, 186, 0.36)';
    ctx.lineWidth = major ? 2.6 : 1.4;
    const x = ox + c * PX;
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + gh);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const major = r % 5 === 0;
    ctx.strokeStyle = major ? 'rgba(236, 226, 196, 0.62)' : 'rgba(226, 216, 186, 0.36)';
    ctx.lineWidth = major ? 2.6 : 1.4;
    const y = oy + r * PX;
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + gw, y);
    ctx.stroke();
  }

  // Half-cell ticks along the ruler edges.
  ctx.strokeStyle = 'rgba(236, 226, 196, 0.55)';
  ctx.lineWidth = 1.4;
  for (let c = 0; c < cols * 2; c++) {
    const x = ox + (c * PX) / 2;
    const len = c % 2 === 0 ? 14 : 8;
    ctx.beginPath();
    ctx.moveTo(x, oy + gh);
    ctx.lineTo(x, oy + gh + len);
    ctx.stroke();
  }
  for (let r = 0; r < rows * 2; r++) {
    const y = oy + (r * PX) / 2;
    const len = r % 2 === 0 ? 14 : 8;
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox - len, y);
    ctx.stroke();
  }

  // Ruler numbers (bottom + left).
  ctx.fillStyle = 'rgba(236, 226, 196, 0.72)';
  ctx.font = '500 22px "DM Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 0; c <= cols; c++) {
    ctx.fillText(String(c * 10), ox + c * PX, oy + gh + 34);
  }
  for (let r = 0; r <= rows; r++) {
    ctx.save();
    ctx.translate(ox - 34, oy + gh - r * PX);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(String(r * 10), 0, 0);
    ctx.restore();
  }

  // Subtle knife scores — makes it feel used.
  for (let i = 0; i < 28; i++) {
    const x = ox + rand() * gw;
    const y = oy + rand() * gh;
    const a = rand() * Math.PI;
    const l = 40 + rand() * 220;
    ctx.strokeStyle = `rgba(20, 28, 18, ${0.15 + rand() * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }

  return toTexture(canvas, { anisotropy: 16 });
}

/* ------------------------------------------------------------------ */
/* Cork                                                                */
/* ------------------------------------------------------------------ */
export function createCorkTextures() {
  const S = 1024;
  const rand = mulberry32(99);
  const color = makeCanvas(S, S);
  const bump = makeCanvas(S, S);
  const c = color.getContext('2d');
  const b = bump.getContext('2d');

  c.fillStyle = '#a8622f';
  c.fillRect(0, 0, S, S);
  b.fillStyle = 'rgb(128,128,128)';
  b.fillRect(0, 0, S, S);

  const palette = ['#7d4320', '#9a5527', '#b8733c', '#c98a52', '#d69a62', '#6b3818', '#a9632f'];
  // Cork granules: many small irregular blobs.
  for (let i = 0; i < 42000; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 0.8 + Math.pow(rand(), 2.2) * 5.5;
    const col = palette[(rand() * palette.length) | 0];
    c.fillStyle = col;
    c.globalAlpha = 0.35 + rand() * 0.5;
    c.beginPath();
    c.ellipse(x, y, r, r * (0.6 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
    c.fill();

    const v = 70 + rand() * 120;
    b.fillStyle = `rgb(${v},${v},${v})`;
    b.globalAlpha = 0.6;
    b.beginPath();
    b.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
    b.fill();
  }
  // Dark pits.
  for (let i = 0; i < 5000; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 0.5 + rand() * 1.8;
    c.globalAlpha = 0.55;
    c.fillStyle = '#4a2610';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    b.globalAlpha = 0.9;
    b.fillStyle = 'rgb(20,20,20)';
    b.beginPath();
    b.arc(x, y, r, 0, Math.PI * 2);
    b.fill();
  }
  c.globalAlpha = 1;
  b.globalAlpha = 1;

  return {
    map: toTexture(color),
    bumpMap: toTexture(bump, { srgb: false }),
  };
}

/* ------------------------------------------------------------------ */
/* Ceramic mug                                                         */
/* ------------------------------------------------------------------ */

/** Warm white glaze with fine iron speckle (reactive-glaze stoneware look). */
export function createGlazeTexture() {
  const W = 1024;
  const H = 512;
  const rand = mulberry32(314);
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#efe6d8';
  ctx.fillRect(0, 0, W, H);
  // Very soft tonal pooling.
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(220, 205, 182, 0.12)' : 'rgba(255, 252, 245, 0.12)';
    ctx.beginPath();
    ctx.ellipse(rand() * W, rand() * H, 40 + rand() * 120, 20 + rand() * 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Iron speckles.
  for (let i = 0; i < 1100; i++) {
    const r = 0.5 + Math.pow(rand(), 3) * 1.6;
    ctx.fillStyle = `rgba(${70 + rand() * 40}, ${45 + rand() * 25}, ${30 + rand() * 20}, ${0.35 + rand() * 0.5})`;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas);
}

/** Transparent decal texture carrying the printed product mark. */
export function createMugDecalTexture(text) {
  const W = 1024;
  const H = 512;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1d140d';
  ctx.font = '700 150px "Outfit", "Hanken Grotesk", sans-serif';
  ctx.fillText(text, W / 2, H / 2 - 20);
  ctx.fillStyle = '#e0601c';
  ctx.fillRect(W / 2 - 150, H / 2 + 80, 300, 8);
  ctx.fillStyle = '#1d140d';
  ctx.font = '500 34px "DM Mono", monospace';
  ctx.fillText('STONEWARE  ·  NO. 01', W / 2, H / 2 + 140);
  return toTexture(canvas);
}

/** Top-down coffee surface with a soft crema ring. */
export function createCoffeeTexture() {
  const S = 512;
  const rand = mulberry32(55);
  const canvas = makeCanvas(S, S);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#140803');
  g.addColorStop(0.62, '#1f0d05');
  g.addColorStop(0.86, '#4a2810');
  g.addColorStop(0.97, '#8a5a30');
  g.addColorStop(1, '#5b3218');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1800; i++) {
    const a = rand() * Math.PI * 2;
    const r = S * (0.3 + rand() * 0.2);
    ctx.fillStyle = `rgba(190, 140, 90, ${rand() * 0.12})`;
    ctx.fillRect(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 2, 2);
  }
  return toTexture(canvas);
}
