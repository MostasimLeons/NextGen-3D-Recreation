import { content } from '../content.js';

/**
 * The presentation's script: six scenes on one GSAP timeline (seconds).
 * Every 3D scene, caption, camera move and transition is placed against
 * this table, so changing a duration re-times everything.
 */
const [game, art, design] = content.story.features;

export const TECH = [
  { id: 'unity', name: 'Unity' },
  { id: 'unreal', name: 'Unreal Engine' },
  { id: 'blender', name: 'Blender' },
  { id: 'three', name: 'Three.js' },
  { id: 'webgl', name: 'WebGL' },
  { id: 'vr', name: 'VR' },
];
export const TECH_SLOT = 1.55; // seconds per technology in scene 5

const RAW = [
  {
    id: 'logo',
    label: 'NEXT GEN',
    duration: 6.2,
    kicker: 'A NEXT GEN presentation',
    title: [content.brand],
    line: content.tagline,
  },
  {
    id: 'game',
    label: 'Game development',
    duration: 7,
    kicker: `01 — ${game.eyebrow}`,
    title: game.title,
    line: 'Unity · Unreal Engine · Interactive games',
  },
  {
    id: 'art',
    label: '3D art & VR',
    duration: 7,
    kicker: `02 — ${art.eyebrow}`,
    title: art.title,
    line: art.tags.join(' · '),
  },
  {
    id: 'design',
    label: 'Creative design',
    duration: 6.6,
    kicker: `03 — ${design.eyebrow}`,
    title: design.title,
    line: design.tags.join(' · '),
  },
  {
    id: 'tech',
    label: 'Technology',
    duration: TECH.length * TECH_SLOT + 0.8,
    kicker: '04 — Technology',
    title: ['Runs on the', 'edge of play'],
    line: 'The real-time stack behind every build',
  },
  {
    id: 'final',
    label: 'NEXT GEN',
    duration: 7,
    kicker: 'Creative technology team',
    title: [content.brand],
    line: content.lead,
  },
];

let t = 0;
export const SCENES = RAW.map((s, index) => {
  const scene = { ...s, index, start: t, end: t + s.duration };
  t += s.duration;
  return scene;
});
export const TOTAL = t;

/** Scene at a time, plus its local progress 0–1. */
export function sceneAt(time) {
  const s = SCENES.find((x) => time < x.end) ?? SCENES[SCENES.length - 1];
  return { scene: s, u: Math.min(Math.max((time - s.start) / s.duration, 0), 1) };
}
