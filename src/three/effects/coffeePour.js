import * as THREE from 'three';

const POUR_START = 1.35; // ≈ 77°: the surface reaches the lip
const POUR_FULL = 2.4; // ≈ 138°: full flow
const DROPS_PER_SEC = 260; // at full flow
const smoothstep = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Couples the mug's flip rotation to the coffee:
 *   tilt → pour rate → drain level + emit drops from the lowest rim point
 *   (sliding to "the whole opening" as the mug goes fully upside down),
 *   with the rim's tangential velocity (ω × r) added to every drop.
 *
 * Exposes an imperative API for animation timelines:
 *   burst(strength)  queue an extra "glug" (called at the 90° moment)
 *   refill()         refill once the mug is upright again
 */
export function createCoffeePour({ mug, spill, reducedMotion = false }) {
  const liquid = mug.userData.liquid;
  const { height: RIM_H, innerRadius: RIN } = mug.userData.rim;
  const CENTER_LOCAL = new THREE.Vector3(0, 3.9 / 1.45, 0); // mug centre (local)

  let level = 1;
  let prevAngle = 0;
  let emitAcc = 0;
  let burstQueue = 0;
  let refilling = false;
  let lastPour = 0;

  // Scratch
  const q = new THREE.Quaternion();
  const gLocal = new THREE.Vector3();
  const low = new THREE.Vector3();
  const local = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const lipWorld = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const center = new THREE.Vector3();
  const base = new THREE.Vector3();
  const euler = new THREE.Euler();
  const DOWN = new THREE.Vector3(0, -1, 0);

  function emitFromRim(n, angle, angVel, pour) {
    mug.updateMatrixWorld(true);
    mug.getWorldQuaternion(q);
    // Gravity expressed in the mug's frame → which way is "down" at the lip.
    gLocal.copy(DOWN).applyQuaternion(q.clone().invert());
    low.set(gLocal.x, 0, gLocal.z);
    if (low.lengthSq() < 1e-6) low.set(1, 0, 0);
    low.normalize();
    lipWorld.copy(low).applyQuaternion(q); // outward lip direction (world)

    // 0 → pours over the lowest lip point; 1 → falls out of the whole opening.
    const u = smoothstep(1.7, 2.9, angle);

    // Rim velocity from the flip: ω × r, ω along the mug's flip axis (world).
    euler.set(mug.rotation.x, mug.rotation.y, 0);
    axis.set(0, 0, 1).applyEuler(euler).multiplyScalar(angVel);
    center.copy(CENTER_LOCAL);
    mug.localToWorld(center);

    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * RIN * 0.9;
      local.set(0, RIM_H - 0.05, 0);
      local.addScaledVector(low, RIN * (1 - u) * (0.86 + Math.random() * 0.12));
      local.x += Math.cos(a) * r * u;
      local.z += Math.sin(a) * r * u;
      origin.copy(local);
      mug.localToWorld(origin);

      base.subVectors(origin, center);
      base.crossVectors(axis, base).multiplyScalar(0.45);

      dir.copy(DOWN).addScaledVector(lipWorld, 0.55 * (1 - u)).normalize();
      spill.emit(origin, dir, 1, {
        speed: 2.2 + pour * 3.2,
        spread: 1.1 + pour * 0.9,
        base,
        size: 0.1 + pour * 0.03,
        jitter: 0.18,
      });
    }
  }

  return {
    get level() {
      return level;
    },
    /** Queue an extra burst of coffee (e.g. at the 90° keyframe). */
    burst(strength = 1) {
      if (!reducedMotion && level > 0.05) burstQueue += Math.round(70 * strength);
    },
    /** Refill smoothly once the mug is upright again. */
    refill() {
      refilling = true;
    },

    /**
     * @param dt     frame delta (s)
     * @param time   shader clock (s)
     * @param angle  current flip angle (rad, 0 = upright, π = upside down)
     */
    update(dt, time, angle) {
      const angVel = dt > 0 ? (angle - prevAngle) / dt : 0;
      prevAngle = angle;

      let pour = 0;
      if (angle > POUR_START && level > 0) {
        pour = smoothstep(POUR_START, POUR_FULL, angle);
        level = reducedMotion ? 0 : Math.max(0, level - (0.25 + pour * 0.75) * dt);
        if (!reducedMotion) emitAcc += pour * DROPS_PER_SEC * dt;
      }
      if (burstQueue > 0 && level > 0 && angle > POUR_START * 0.8) {
        const take = Math.min(burstQueue, Math.ceil(240 * dt));
        burstQueue -= take;
        emitAcc += take;
        level = Math.max(0, level - take * 0.0015);
      }
      if (level <= 0) burstQueue = 0;

      if (refilling && angle < 0.05) {
        level = reducedMotion ? 1 : Math.min(1, level + dt * 0.55);
        if (level >= 1) refilling = false;
      }

      const n = Math.floor(emitAcc);
      emitAcc -= n;
      if (n > 0) emitFromRim(n, angle, angVel, Math.max(pour, 0.5));

      liquid.setLevel(level);
      liquid.update(dt, { tilt: angle, angVel, pour: Math.max(pour, lastPour * 0.9), time });
      lastPour = pour;
      spill.update(dt);
    },
  };
}
