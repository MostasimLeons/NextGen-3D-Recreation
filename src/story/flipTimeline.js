import gsap from 'gsap';

/**
 * Plays the mug flip as a GSAP timeline and drives the coffee from it.
 *
 *   rig.state.userFlip 0 → 1   upright → upside down (rendered as rz += π,
 *                              pivoting about the mug's centre)
 *   crossing 0.5 (90°)         → rig.coffee.burst(): the "glug" as the
 *                              surface passes the lip (continuous pouring is
 *                              driven by the live tilt inside the scene)
 *   back to 0, on complete     → rig.coffee.refill()
 *
 * Any running flip is killed first, so rapid clicks reverse smoothly from
 * the current angle instead of stacking tweens.
 */
export function playFlip(rig, flipped, { reduced = false } = {}) {
  if (!rig) return null;
  rig.flipTimeline?.kill();

  const from = rig.state.userFlip;
  const to = flipped ? 1 : 0;
  const duration = reduced ? 0 : Math.max(0.35, 1.6 * Math.abs(to - from));
  let prev = from;

  const tl = gsap.timeline({
    onComplete: () => {
      if (!flipped) rig.coffee?.refill();
    },
  });
  tl.to(rig.state, {
    userFlip: to,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const cur = rig.state.userFlip;
      // Fire exactly once, the moment the rim passes horizontal going down.
      if (prev < 0.5 && cur >= 0.5) rig.coffee?.burst(1);
      prev = cur;
    },
  });

  rig.flipTimeline = tl;
  return tl;
}
