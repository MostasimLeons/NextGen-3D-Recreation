/**
 * Scroll story definition. Order and treatment mirror oryzo.ai section by
 * section; content represents NEXT GEN (a creative technology team):
 *
 *   oryzo                    NEXT GEN
 *   hero                  →  intro (desk + mug hero, Phase 2)
 *   "isn't just a …"      →  statement  "Isn't about the mug."
 *   "Powered by AI*"      →  crafted    "Powered by play*"
 *   "it's wearable"       →  everyday   "it's playable"
 *   features (3 steps)    →  features   game dev / 3D & VR / creative design
 *   encryption (flip)     →  interactive  flip-a-message toy
 *   grip (macro)          →  material   macro detail
 *   sustainability        →  toolkit    real-time first + tool grid
 *   testimonies           →  (omitted: would need invented reviews)
 *   social content        →  process    horizontal "how we work" cards
 *   choose your own       →  projects   4 categories (case studies soon)
 *   footer                →  outro
 *
 * `length`  section height in viewport heights; content is pinned (sticky)
 *           for length − 1 of it.
 * `steps`   3D keyframes; each holds until the next. Fields map to rig.state
 *           (three/sceneConfig.js HERO_STATE). Omitted fields carry over.
 * `bg`      warm background glow { glow 0–1, x %, y % }.
 *
 * World reference (mug scale 1.45): radius 3.55, height 7.8, foot at my = 2,
 * so the mug centre is ≈ (0, 5.9, 0) — the shared "stage" for all actors.
 */

const TAU = Math.PI * 2;
const MUG_ONLY = { mugS: 1, padS: 0, vrS: 0 };

export const STORY = [
  {
    id: 'intro',
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
        ...MUG_ONLY,
        fx: 0, pfx: 0, fy: 6, fz: 0, dist: 36, pitch: 16, yaw: 0, pfy: 2.6, pdist: 1,
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
        key: 3, fill: 0.8, hemi: 0.75, rim: 70, env: 0.5,
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
        // 01 Game development — the gamepad takes the stage, warm glow.
        mugS: 0, padS: 1, vrS: 0, arx: -0.3, ary: -0.45,
        fx: -6.5, fy: 5.9, dist: 30, pitch: 10, pfy: 3.4,
        rx: 0, ry: 0.5 + 2 * TAU, rz: 0,
        key: 2.2, fill: 1.1, hemi: 0.5, rim: 60, heat: 0.7, env: 0.6,
        bg: { glow: 0.55, x: 68, y: 58 },
      },
      {
        // 02 3D art & VR — the headset, three-quarter view showing the strap.
        mugS: 0, padS: 0, vrS: 1, arx: -0.12, ary: 0.6,
        fx: 6.5, fy: 5.9, dist: 30, pitch: 10, pfy: 3.4,
        key: 3, fill: 1.3, hemi: 0.65, rim: 90, heat: 0, env: 0.7,
        bg: { glow: 0.24, x: 32, y: 58 },
      },
      {
        // 03 Creative design — mug handle close-up with the blueprint.
        ...MUG_ONLY,
        fx: 6.5, pfx: 4.86, fy: 6.06, dist: 12, pitch: 4, pfy: 0.6, pdist: 0.8,
        rx: 0, ry: 3 * TAU, rz: 0,
        key: 3, fill: 0.8, hemi: 0.7, rim: 110, env: 0.5,
        bg: { glow: 0.14, x: 55, y: 50 },
      },
    ],
  },
  {
    id: 'interactive',
    length: 2.2,
    steps: [
      {
        // Mug on the right; the flip toy turns it upside down (userFlip).
        fx: -6, pfx: 0, fy: 5.9, fz: 0, dist: 32, pitch: 18, pfy: 3.2, pdist: 1,
        rx: 0.05, ry: 0.5 + 3 * TAU, rz: 0,
        key: 3, fill: 1.2, hemi: 0.7, rim: 80,
        bg: { glow: 0.3, x: 68, y: 56 },
      },
    ],
  },
  {
    id: 'material',
    length: 2.2,
    steps: [
      {
        // Macro over the rim: glaze + coffee below, dark space for the title.
        fx: -0.4, pfx: -0.4, fy: 10.4, fz: 3.0, dist: 8, pitch: 14, pfy: -0.6, pdist: 0.75,
        ry: 0.5 + 3 * TAU, rz: 0, rx: 0,
        key: 2.6, fill: 0.8, hemi: 0.7, rim: 130,
        bg: { glow: 0.1, x: 50, y: 50 },
      },
    ],
  },
  {
    id: 'toolkit',
    length: 2.4,
    steps: [
      {
        // Mug floats high on the right, tool grid sits low across the page.
        fx: -7, pfx: 0, fy: 4.2, fz: 0, dist: 40, pitch: 22, pfy: 6.5, pdist: 1,
        rx: 0.2, ry: 1.5 + 3 * TAU, rz: -0.15,
        key: 3, fill: 1, hemi: 0.7, rim: 80,
        bg: { glow: 0.22, x: 70, y: 35 },
      },
    ],
  },
  {
    id: 'process',
    length: 3,
    steps: [
      {
        // Headset hangs behind the moving cards, slowly turning.
        mugS: 0, padS: 0, vrS: 1, arx: 0.15, ary: -0.9,
        fx: 0, fy: 7.8, dist: 34, pitch: 8, pfy: 2,
        key: 2.4, fill: 0.7, hemi: 0.5, rim: 70,
        bg: { glow: 0.3, x: 50, y: 40 },
      },
      { ary: 0.9, arx: 0.05, bg: { glow: 0.36, x: 50, y: 42 } },
    ],
  },
  {
    id: 'projects',
    length: 4.6,
    steps: [
      {
        // Game projects
        mugS: 0, padS: 1, vrS: 0, arx: -0.25, ary: -0.35,
        fx: -6, fy: 5.9, dist: 30, pitch: 16, pfy: 3.2,
        key: 3, fill: 1.1, hemi: 0.7, rim: 80, heat: 0.3,
        bg: { glow: 0.42, x: 66, y: 58 },
      },
      {
        // 3D projects
        ...MUG_ONLY, heat: 0, glaze: 1, ry: 1.2 + 4 * TAU, rx: 0.1,
        bg: { glow: 0.3, x: 66, y: 58 },
      },
      {
        // VR experiences
        mugS: 0, padS: 0, vrS: 1, arx: -0.1, ary: 0.5,
        bg: { glow: 0.26, x: 66, y: 58 },
      },
      {
        // Creative work
        ...MUG_ONLY, glaze: 2, ry: 2.6 + 4 * TAU, rx: 0.05,
        bg: { glow: 0.3, x: 66, y: 58 },
      },
    ],
  },
  {
    id: 'outro',
    length: 1.6,
    steps: [
      {
        ...MUG_ONLY,
        fx: 0, fy: 8.6, dist: 40, pitch: 14, pfy: 2,
        rx: 0.1, ry: 0.6 + 5 * TAU, rz: 0, glaze: 0,
        key: 3, fill: 1, hemi: 0.75, rim: 70, heat: 0,
        bg: { glow: 0.32, x: 50, y: 70 },
      },
    ],
  },
];

/** Total page length in viewport heights. */
export const STORY_LENGTH = STORY.reduce((sum, s) => sum + s.length, 0);
