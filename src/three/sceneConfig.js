/**
 * Scene layout in world units (1 unit = 1 cutting-mat grid cell).
 * X → screen right, Z → screen down, Y → up toward the camera.
 * Angles are rotation about Y (radians); objects are modelled pointing +X.
 */
export const LAYOUT = {
  mat: { x: 8.4, z: -3.2, rotY: 0.025 },
  coaster: { x: 0.6, z: -0.2 },
  mug: { rotY: 0.3 }, // printed mark faces the camera, handle to the right
  creamPencil: { x: 8.3, z: -7.7, rotY: -0.93 },
  greenPencil: { x: -17.6, z: 3.4, rotY: 0.59 },
  knife: { x: 15.2, z: 7.6, rotY: 2.42 },
  clips: [
    { x: -18.2, z: -5.4, rotY: 1.05 },
    { x: -14.6, z: -9.6, rotY: 0.32 },
  ],
};

/**
 * Animatable scene parameters. The render loop reads these every frame,
 * so GSAP / ScrollTrigger can tween them directly in a later phase, e.g.
 *   gsap.to(rig.params, { zoom: 1.8, tilt: 40, scrollTrigger: { ... } })
 */
export const DEFAULT_PARAMS = {
  tilt: 24, // camera pitch away from straight-down, degrees
  zoom: 1, // >1 moves the camera closer
  focusX: 0, // extra camera target offset (world units)
  focusZ: 0,
  mugSpin: 0, // extra mug rotation (radians) on top of idle sway
  mugLift: 0, // lift mug off the coaster (world units)
  idle: 1, // 0 disables idle sway (e.g. while scroll-scrubbing)
  parallax: 1, // pointer influence
};
