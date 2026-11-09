/**
 * Scroll story definition — the order mirrors oryzo.ai's product sections:
 *
 *   hero → statement ("isn't just a …") → crafted ("Powered by …")
 *   → everyday (giant word) → features (3 pinned steps: heat / weight / curve)
 *   → material macro (≈ "grip" close-up) → variants ("choose your own") → outro
 *
 * `length`  section height in viewport heights (its content is pinned via
 *           CSS sticky for the whole length).
 * `steps`   one or more 3D keyframes reached as the section scrolls; each
 *           holds until the next one. Fields map 1:1 to rig.state (see
 *           three/sceneConfig.js HERO_STATE). Omitted fields keep their value.
 * `bg`      warm background glow: { glow 0–1, x %, y % }.
 *
 * World reference (mug scale 1.45): radius 3.55, height 7.8, foot at my,
 * so the mug centre is at my + 3.9.
 */

const TAU = Math.PI * 2;

export const STORY = [
  {
    id: 'intro', // the Phase 2 hero, already on screen
    length: 1,
    steps: [{ bg: { glow: 0, x: 50, y: 60 } }],
  },
  {
    id: 'statement',
    length: 2.4,
    steps: [
      {
        hero: 0,
        desk: 0,
        fx: 0, fy: 6, fz: 0, dist: 36, pitch: 16, yaw: 0, pfy: 2.6, pdist: 1,
        mx: 0, my: 2, mz: 0, rx: 0.55, ry: 2.65, rz: -0.3,
        key: 2.4, fill: 1.5, hemi: 0.5, rim: 95, heat: 0, env: 0.6,
        bg: { glow: 0.28, x: 50, y: 62 },
      },
    ],
  },
  {
    id: 'crafted',
    length: 2.2,
    steps: [
      {
        fx: 0, fy: 8.6, dist: 33, pitch: 62, pfy: 2.5,
        rx: 0, ry: 3.6, rz: 0,
        key: 3, hemi: 0.75, rim: 70, env: 0.5,
        bg: { glow: 0.38, x: 50, y: 64 },
      },
    ],
  },
  {
    id: 'everyday',
    length: 2.4,
    steps: [
      {
        fx: 0, fy: 5.9, dist: 34, pitch: 6, pfy: 0,
        rx: 0, ry: 3.6 + TAU, rz: 0.08,
        key: 3, hemi: 0.7, rim: 85,
        bg: { glow: 0.2, x: 50, y: 55 },
      },
    ],
  },
  {
    id: 'features',
    length: 4.2,
    steps: [
      {
        // Holds the heat — mug right, orange heat light.
        fx: -6.5, fy: 5.9, dist: 31, pitch: 10, pfy: 3.2,
        rx: 0, ry: 0.5 + 2 * TAU, rz: 0,
        key: 1.6, fill: 0.6, hemi: 0.45, rim: 40, heat: 1, env: 0.45,
        bg: { glow: 0.6, x: 68, y: 58 },
      },
      {
        // Perfectly weighted — mug left, tipped on its foot.
        fx: 5, fy: 5.9, dist: 31, pitch: 10, pfy: 3.2,
        rx: 0.1, ry: 1.3 + 2 * TAU, rz: 0.2,
        key: 3.2, fill: 1.3, hemi: 0.7, rim: 80, heat: 0, env: 0.45,
        bg: { glow: 0.22, x: 32, y: 58 },
      },
      {
        // The signature curve — handle close-up in profile, framed left
        // of centre (handle ≈ 34% across) so the copy sits on dark space.
        fx: 6.5, pfx: 4.86, fy: 6.06, dist: 12, pitch: 4, pfy: 0.6, pdist: 0.8,
        rx: 0, ry: 3 * TAU, rz: 0,
        key: 3, hemi: 0.7, rim: 110,
        bg: { glow: 0.14, x: 55, y: 50 },
      },
    ],
  },
  {
    id: 'material',
    length: 2.2,
    steps: [
      {
        // Macro over the rim: glaze wall + coffee below, dark space above
        // for the headline (like oryzo's grip close-up).
        fx: -0.4, pfx: -0.4, fy: 10.4, fz: 3.0, dist: 8, pitch: 14, pfy: -0.6, pdist: 0.75,
        ry: 0.5 + 3 * TAU, rz: 0, rx: 0,
        key: 2.6, hemi: 0.7, rim: 130,
        bg: { glow: 0.1, x: 50, y: 50 },
      },
    ],
  },
  {
    id: 'variants',
    length: 3.6,
    steps: [
      {
        fx: -6, pfx: 0, fy: 5.9, fz: 0, dist: 31, pitch: 10, pfy: 3, pdist: 1,
        ry: 1.1 + 3 * TAU, rz: 0, glaze: 0,
        key: 3.2, hemi: 0.75, rim: 80,
        bg: { glow: 0.26, x: 66, y: 58 },
      },
      { ry: 2.7 + 3 * TAU, glaze: 1, bg: { glow: 0.34, x: 66, y: 58 } },
      { ry: 4.3 + 3 * TAU, glaze: 2, bg: { glow: 0.24, x: 66, y: 58 } },
    ],
  },
  {
    id: 'outro',
    length: 1.6,
    steps: [
      {
        fx: 0, fy: 8.6, dist: 40, pitch: 14, pfy: 2,
        rx: 0.1, ry: 0.6 + 4 * TAU, rz: 0, glaze: 0,
        key: 3, hemi: 0.75, rim: 70,
        bg: { glow: 0.32, x: 50, y: 70 },
      },
    ],
  },
];

/** Total page length in viewport heights. */
export const STORY_LENGTH = STORY.reduce((sum, s) => sum + s.length, 0);
