/**
 * Scene layout in world units (1 unit = 1 cutting-mat grid cell).
 * X → screen right, Z → screen down, Y → up toward the camera.
 * Angles are rotation about Y (radians); objects are modelled pointing +X.
 */
export const LAYOUT = {
  mat: { x: 8.4, z: -3.2, rotY: 0.025 },
  coaster: { x: 0, z: 1.4 }, // product sits dead-centre, like the reference
  mug: { rotY: 0.62, decalAngle: -0.5 }, // handle up-right (clear of the text); mark faces camera
  creamPencil: { x: 8.3, z: -7.7, rotY: -0.93 },
  greenPencil: { x: -17.6, z: 3.4, rotY: 0.59 },
  knife: { x: 15.2, z: 7.6, rotY: 2.42 },
  clips: [
    { x: -18.2, z: -5.4, rotY: 1.05 },
    { x: -14.6, z: -9.6, rotY: 0.32 },
  ],
};

export const MUG_SCALE = 1.45;

/** Glaze tints, multiplied over the speckled glaze texture: cream, sand, sage. */
export const GLAZES = ['#ffffff', '#e8c39a', '#b9c7a2'];

/**
 * Hero-only tuning. Kept from Phase 2 as `rig.params`.
 */
export const DEFAULT_PARAMS = {
  tilt: 22, // hero camera pitch away from straight-down, degrees
  zoom: 1, // >1 moves the hero camera closer
  focusX: 0, // extra hero camera target offset (world units)
  focusZ: 0,
  idle: 1, // 0 disables idle sway
  parallax: 1, // pointer influence
};

/**
 * Scroll-animated scene state (`rig.state`). Every field is a plain number so
 * GSAP can tween it; the render loop reads it each frame.
 *
 *   hero   1 = camera + mug use the responsive hero (desk) framing,
 *          0 = they use the story values below (blended in between)
 *   desk   opacity of desk, mat, coaster and props (hidden at 0)
 *
 * Story camera orbits a focus point f(x,y,z) at `dist`, `pitch`/`yaw` in degrees.
 * Story mug: foot position m(x,y,z), Euler rotation r(x,y,z) in radians.
 * Portrait screens: focus X moves to `pfx`, distance grows (× pdist), `pfy` shifts focus Y.
 */
export const HERO_STATE = {
  hero: 1,
  desk: 1,
  fx: 0,
  pfx: 0,
  fy: 5.9,
  fz: 0,
  dist: 30,
  pitch: 12,
  yaw: 0,
  pfy: 0,
  pdist: 1,
  mx: 0,
  my: 2,
  mz: 0,
  rx: 0,
  ry: 0.62,
  rz: 0,
  key: 3.2,
  fill: 0.5,
  hemi: 0.9,
  rim: 60,
  heat: 0,
  env: 0.4,
  glaze: 0,
  // Stage actors sharing the centre (0, 5.9, 0): visibility as scale 0–1.
  mugS: 1,
  padS: 0,
  vrS: 0,
  arx: 0, // actor rotation (gamepad / headset), radians
  ary: 0,
  // Background shader (GLSL backdrop): glow amount, glow position (0–1,
  // y measured from the top), deep-red tint.
  glow: 0,
  gx: 0.5,
  gy: 0.6,
  tint: 0,
  // Atmosphere intensities 0–1.
  embers: 0,
  smoke: 0,
  trails: 0,
  voxels: 0,
  // Immersive world (after the hero): presence 0–1, plus section actors.
  world: 0, // corridor floor / gates / monoliths / shards
  steam: 0, // steam rising from the upright mug
  orbit: 0, // capability orbit (toolkit)
  formation: 0, // outro: gamepad + headset flank the mug
  // Driven by UI interaction, never by the scroll timeline (prefix "user").
  userFlip: 0,
  userPortal: 0, // page transition: 0 = idle, 1 = camera dived into the scene
};

/** Keys the scroll timeline must not touch (owned by UI interactions). */
export const isUserKey = (k) => k.startsWith('user');
