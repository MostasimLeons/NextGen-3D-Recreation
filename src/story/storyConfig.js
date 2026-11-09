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
 *   social content        →  process    6 immersive technology chapters (R3F)
 *   choose your own       →  projects   interactive category showcase (R3F)
 *   footer                →  outro
 *
 * `length`  section height in viewport heights; content is pinned (sticky)
 *           for length − 1 of it.
 * `steps`   3D keyframes; each holds until the next. Fields map to rig.state
 *           (three/sceneConfig.js HERO_STATE). Omitted fields carry over.
 * `bg`      GLSL backdrop { glow 0–1, x %, y %, tint 0–1 (deep red) }.
 * Atmosphere: embers / smoke / trails / voxels intensities 0–1.
 *
 * World reference (mug scale 1.45): radius 3.55, height 7.8, foot at my = 2,
 * so the mug centre is ≈ (0, 5.9, 0) — the shared "stage" for all actors.
 */

const TAU = Math.PI * 2;
const MUG_ONLY = { mugS: 1, padS: 0, vrS: 0 };

export const STORY = [
  {
    id: 'intro',
    label: 'Intro',
    length: 1,
    steps: [{ bg: { glow: 0, x: 50, y: 60 } }],
  },
  {
    id: 'statement',
    label: 'Concept',
    length: 2.4,
    steps: [
      {
        hero: 0,
        desk: 0,
        ...MUG_ONLY,
        world: 1, steam: 1, orbit: 0, formation: 0,
        fx: 0, pfx: 0, fy: 6, fz: 0, dist: 36, pitch: 16, yaw: 0, pfy: 2.6, pdist: 1,
        mx: 0, my: 2, mz: 0, rx: 0.55, ry: 2.65, rz: -0.3,
        key: 2.4, fill: 1.5, hemi: 0.5, rim: 95, heat: 0, env: 0.6,
        bg: { glow: 0.28, x: 50, y: 62, tint: 0.1 },
        embers: 0.55, smoke: 0.6, trails: 0.5, voxels: 0.5,
      },
    ],
  },
  {
    id: 'crafted',
    label: 'Powered by play',
    length: 2.2,
    steps: [
      {
        fx: 0, fy: 8.6, dist: 33, pitch: 62, pfy: 2.5,
        rx: 0, ry: 3.6, rz: 0, steam: 1.3,
        key: 3, fill: 0.8, hemi: 0.75, rim: 70, env: 0.5,
        bg: { glow: 0.38, x: 50, y: 64, tint: 0.12 },
        embers: 0.9, smoke: 0.8, trails: 0.2, voxels: 0.4,
      },
    ],
  },
  {
    id: 'everyday',
    label: 'Playable',
    length: 2.4,
    steps: [
      {
        fx: 0, fy: 5.9, dist: 34, pitch: 6, pfy: 0,
        rx: 0, ry: 3.6 + TAU, rz: 0.08, steam: 0.7,
        key: 3, hemi: 0.7, rim: 85,
        bg: { glow: 0.2, x: 50, y: 55, tint: 0.2 },
        embers: 0.4, smoke: 0.4, trails: 1, voxels: 0.8,
      },
    ],
  },
  {
    id: 'features',
    label: 'Capabilities',
    length: 4.2,
    steps: [
      {
        // 01 Game development — the gamepad takes the stage, warm glow.
        mugS: 0, padS: 1, vrS: 0, arx: -0.3, ary: -0.45, steam: 0,
        fx: -6.5, fy: 5.9, dist: 30, pitch: 10, pfy: 3.4,
        rx: 0, ry: 0.5 + 2 * TAU, rz: 0,
        key: 2.2, fill: 1.1, hemi: 0.5, rim: 60, heat: 0.7, env: 0.6,
        bg: { glow: 0.55, x: 68, y: 58, tint: 0.55 },
        embers: 1.1, smoke: 0.7, trails: 1, voxels: 0.6,
      },
      {
        // 02 3D art & VR — the headset, three-quarter view showing the strap.
        mugS: 0, padS: 0, vrS: 1, arx: -0.12, ary: 0.6,
        fx: 6.5, fy: 5.9, dist: 30, pitch: 10, pfy: 3.4,
        key: 3, fill: 1.3, hemi: 0.65, rim: 90, heat: 0, env: 0.7,
        bg: { glow: 0.24, x: 32, y: 58, tint: 0.15 },
        embers: 0.3, smoke: 0.3, trails: 0.6, voxels: 1,
      },
      {
        // 03 Creative design — mug handle close-up with the blueprint.
        ...MUG_ONLY,
        fx: 6.5, pfx: 4.86, fy: 6.06, dist: 12, pitch: 4, pfy: 0.6, pdist: 0.8,
        rx: 0, ry: 3 * TAU, rz: 0,
        key: 3, fill: 0.8, hemi: 0.7, rim: 110, env: 0.5,
        bg: { glow: 0.14, x: 55, y: 50, tint: 0 },
        embers: 0.15, smoke: 0.2, trails: 0.3, voxels: 0.3,
      },
    ],
  },
  {
    id: 'interactive',
    label: 'Interactive',
    length: 2.2,
    steps: [
      {
        // Mug on the right; the flip toy turns it upside down (userFlip).
        fx: -6, pfx: 0, fy: 5.9, fz: 0, dist: 32, pitch: 18, pfy: 3.2, pdist: 1,
        rx: 0.05, ry: 0.5 + 3 * TAU, rz: 0, steam: 0.8,
        key: 3, fill: 1.2, hemi: 0.7, rim: 80,
        bg: { glow: 0.3, x: 68, y: 56, tint: 0.1 },
        embers: 0.4, smoke: 0.3, trails: 0.5, voxels: 0.5,
      },
    ],
  },
  {
    id: 'material',
    label: 'Detail',
    length: 2.2,
    steps: [
      {
        // Macro over the rim: glaze + coffee below, dark space for the title.
        fx: -0.4, pfx: -0.4, fy: 10.4, fz: 3.0, dist: 8, pitch: 14, pfy: -0.6, pdist: 0.75,
        ry: 0.5 + 3 * TAU, rz: 0, rx: 0, steam: 0.45,
        key: 2.6, fill: 0.8, hemi: 0.7, rim: 130,
        bg: { glow: 0.1, x: 50, y: 50, tint: 0 },
        embers: 0, smoke: 0, trails: 0, voxels: 0,
      },
    ],
  },
  {
    id: 'toolkit',
    label: 'Toolkit',
    length: 2.4,
    steps: [
      {
        // Mug floats high on the right, tool grid sits low across the page.
        fx: -2.5, pfx: 0, fy: 5.4, fz: 0, dist: 46, pitch: 18, pfy: 1.5, pdist: 1,
        rx: 0.12, ry: 1.5 + 3 * TAU, rz: -0.1, orbit: 1, steam: 0.8,
        key: 3, fill: 1, hemi: 0.7, rim: 80,
        bg: { glow: 0.22, x: 70, y: 35, tint: 0.15 },
        embers: 0.5, smoke: 0.5, trails: 0.7, voxels: 0.9,
      },
    ],
  },
  {
    id: 'process',
    label: 'Edge of play',
    // Six technology chapters (Unity → VR), one step each; the R3F tech stage
    // takes the screen, the main scene supplies glow, smoke and embers.
    length: 7.6,
    steps: [
      {
        mugS: 0, padS: 0, vrS: 0, arx: 0.15, ary: -0.9, orbit: 0, steam: 0,
        fx: 0, pfx: 0, fy: 7.8, dist: 34, pitch: 8, pfy: 2,
        key: 2.4, fill: 0.7, hemi: 0.5, rim: 70, heat: 0,
        bg: { glow: 0.42, x: 62, y: 46, tint: 0.45 },
        embers: 0.9, smoke: 0.9, trails: 0.7, voxels: 0.6,
      },
      { bg: { glow: 0.5, x: 40, y: 40, tint: 0.6 }, embers: 1.1, smoke: 1.1, trails: 0.9, voxels: 0.3 },
      { bg: { glow: 0.36, x: 58, y: 52, tint: 0.35 }, embers: 0.6, smoke: 0.7, trails: 0.5, voxels: 0.5 },
      { bg: { glow: 0.44, x: 50, y: 44, tint: 0.4 }, embers: 0.8, smoke: 0.6, trails: 1.2, voxels: 0.4 },
      { bg: { glow: 0.62, x: 50, y: 62, tint: 0.7 }, embers: 1.3, smoke: 1.0, trails: 0.8, voxels: 0.2 },
      { bg: { glow: 0.4, x: 55, y: 45, tint: 0.4 }, embers: 0.8, smoke: 0.8, trails: 1.0, voxels: 0.8 },
    ],
  },
  {
    id: 'projects',
    label: 'Explore',
    length: 3.2,
    steps: [
      {
        // Interactive showcase: the R3F views take the stage, so the main
        // scene's actors step aside and only atmosphere remains.
        mugS: 0, padS: 0, vrS: 0,
        fx: 0, pfx: 0, fy: 5.9, dist: 30, pitch: 10, pfy: 0,
        key: 3, fill: 1, hemi: 0.7, rim: 80, heat: 0, glaze: 0,
        bg: { glow: 0.26, x: 62, y: 46, tint: 0.2 },
        embers: 0.35, smoke: 0.35, trails: 0.25, voxels: 0.35,
      },
    ],
  },
  {
    id: 'outro',
    label: 'Contact',
    length: 1.6,
    steps: [
      {
        mugS: 1, padS: 1, vrS: 1, formation: 1, arx: 0.15, ary: 0.5, steam: 1,
        fx: 0, fy: 8.2, dist: 42, pitch: 12, pfy: 2,
        rx: 0.1, ry: 0.6 + 5 * TAU, rz: 0, glaze: 0,
        key: 3, fill: 1, hemi: 0.75, rim: 70, heat: 0,
        bg: { glow: 0.32, x: 50, y: 70, tint: 0.35 },
        embers: 1.2, smoke: 0.9, trails: 1, voxels: 0.6,
      },
    ],
  },
];

/** Total page length in viewport heights. */
export const STORY_LENGTH = STORY.reduce((sum, s) => sum + s.length, 0);
