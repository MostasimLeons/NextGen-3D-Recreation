/**
 * Damped springs for physical-feeling motion. Frame-rate independent
 * (semi-implicit Euler, sub-stepped for stiff springs).
 *
 *   const s = createSpring({ stiffness: 120, damping: 14 });
 *   s.target = 1;  s.update(dt);  s.value  // eases with a little overshoot
 *
 * damping = 2·√stiffness is critical (no overshoot); lower overshoots.
 */
export function createSpring({ value = 0, stiffness = 120, damping = 14 } = {}) {
  const s = {
    value,
    velocity: 0,
    target: value,
    stiffness,
    damping,
    /** Add an instantaneous velocity kick (an impulse per unit mass). */
    kick(v) {
      s.velocity += v;
    },
    update(dt) {
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = (s.target - s.value) * s.stiffness - s.velocity * s.damping;
        s.velocity += a * h;
        s.value += s.velocity * h;
      }
      return s.value;
    },
    snap(v) {
      s.value = s.target = v;
      s.velocity = 0;
    },
  };
  return s;
}

/** Two springs sharing settings — used for 2D pointer inertia. */
export function createSpring2D(opts) {
  const x = createSpring(opts);
  const y = createSpring(opts);
  return {
    x,
    y,
    setTarget(tx, ty) {
      x.target = tx;
      y.target = ty;
    },
    update(dt) {
      x.update(dt);
      y.update(dt);
    },
  };
}
