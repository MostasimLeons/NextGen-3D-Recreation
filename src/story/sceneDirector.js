import { HERO_STATE, isUserKey } from '../three/sceneConfig.js';

/**
 * Scene director: turns a page's story config into concrete 3D states.
 *
 * Every page (home, category pages, 404) describes its scroll story the same
 * way as storyConfig.js — sections with `length` and `steps`. The first step
 * of a page's first section is that page's *preset*: the state the shared
 * scene snaps to when the page opens. Category pages build their presets
 * from the home story's own keyframes (stateAt), so the gamepad / headset /
 * mug framings stay identical between the home page and the deep pages.
 */

export const STATE_KEYS = Object.keys(HERO_STATE).filter((k) => !isUserKey(k));

/** Only the scroll-animated fields (never the "user*" UI-driven ones). */
export const pick = (obj) => Object.fromEntries(STATE_KEYS.map((k) => [k, obj[k]]));

/** Story `bg` ({ glow, x %, y %, tint }) → backdrop shader state fields. */
export const bgToState = (bg, prev) => ({
  glow: bg.glow,
  gx: bg.x / 100,
  gy: bg.y / 100,
  tint: bg.tint ?? prev.tint ?? 0,
});

function merge(prev, step) {
  const next = { ...prev, ...step };
  if (step.bg) Object.assign(next, bgToState(step.bg, prev));
  delete next.bg;
  return next;
}

/** The page preset: HERO_STATE overridden by the first step of the story. */
export function basePreset(story) {
  return merge({ ...HERO_STATE }, story[0].steps[0]);
}

/**
 * Resolve every step into a full state (each step inherits the previous one)
 * plus its scroll window inside its section, in viewport-height units.
 * The very first step is the preset itself (no tween; applied on open).
 */
export function resolveSteps(story) {
  const out = [];
  let prev = basePreset(story);
  story.forEach((section, si) => {
    const n = section.steps.length;
    section.steps.forEach((step, j) => {
      if (si === 0 && j === 0) {
        out.push({ section: section.id, index: 0, base: true, from: 0, to: 0, prev, next: prev });
        return;
      }
      const next = merge(prev, step);
      let from;
      let to;
      if (j === 0) {
        // Transition while the section scrolls in (top at 75% → 15% above top).
        from = -0.75;
        to = 0.15;
      } else {
        // Spread steps over the pinned range only (the stage unpins at length − 1).
        const pinned = section.length - 1;
        const c = (j * pinned) / n;
        const half = Math.min(0.45, pinned / n / 2 - 0.03, section.length - 0.75 - c);
        from = c - half;
        to = c + half;
      }
      out.push({ section: section.id, index: j, from, to, prev, next });
      prev = next;
    });
  });
  return out;
}

/** Full resolved state at a given step of a story (for building presets). */
export function stateAt(story, sectionId, stepIndex = 0) {
  const s = resolveSteps(story).find((x) => x.section === sectionId && x.index === stepIndex);
  if (!s) throw new Error(`stateAt: no step ${sectionId}[${stepIndex}]`);
  const { ...state } = s.next;
  return state;
}

/** Snap the shared scene to a page's preset (target + rendered values). */
export function applyPreset(rig, story) {
  if (!rig) return;
  Object.assign(rig.state, pick(basePreset(story)));
  rig.snap?.();
}
