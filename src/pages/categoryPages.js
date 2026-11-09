import { STORY } from '../story/storyConfig.js';
import { stateAt } from '../story/sceneDirector.js';
import { content } from '../content.js';

/**
 * Deep pages (/game-development, /3d-art-vr, /creative-design, /technology)
 * and the 404, as data. Phase 2 ships the shell: cover, chapter index and the
 * portal to the next page. Each chapter is a planned interactive scene
 * (Phases 4–7) and is labelled as in production — nothing here claims
 * finished client work.
 *
 * Scene presets reuse the home story's own keyframes (sceneDirector.stateAt),
 * so each page opens on the exact framing its category has on the home page.
 */
const [game, art, design] = content.story.features;

const MUG_GUIDE = stateAt(STORY, 'statement', 0); // the mug alone, mid-world
const TECH_ORBIT = stateAt(STORY, 'toolkit', 0); // the capability orbit

/** Cover (preset) → chapter index (camera pulls back) → next (mug guide). */
function categoryStory(preset, { tint = 0.3, glow = 0.4, x = 62, side = 'left' } = {}) {
  // Chapter index: pull back and slide the subject away from the text column.
  const away = side === 'left' ? -4.5 : 4.5;
  return [
    {
      id: 'cover',
      label: 'Cover',
      length: 1.8,
      steps: [{ ...preset, bg: { glow, x, y: 46, tint } }],
    },
    {
      id: 'chapters',
      label: 'Chapters',
      length: 2.4,
      steps: [
        {
          dist: preset.dist * 1.35,
          fx: preset.fx + away,
          // portrait: the sideways push is ignored, so shrink + lower instead
          pdist: preset.pdist * 1.6,
          pfy: preset.pfy + 2.5,
          fy: preset.fy + 1.2,
          pitch: preset.pitch + 8,
          embers: 0.9,
          smoke: 0.7,
          bg: { glow: glow * 0.8, x: 100 - x, y: 52, tint },
        },
      ],
    },
    {
      id: 'next',
      label: 'Next',
      length: 1.6,
      steps: [{ ...MUG_GUIDE, steam: 1, bg: { glow: glow * 1.1, x: 50, y: 64, tint } }],
    },
  ];
}

export const CATEGORY_PAGES = {
  game: {
    index: '01',
    side: 'left', // header column (the 3D subject takes the other side)
    eyebrow: game.eyebrow,
    title: game.title,
    lead: game.body,
    tags: game.tags,
    next: 'art',
    story: categoryStory(stateAt(STORY, 'features', 0), { tint: 0.25, glow: 0.42, x: 66 }),
    chapters: [
      { title: 'Gameplay feel', body: 'A playable coin-run you steer with keyboard or touch.' },
      { title: 'Level building', body: 'A voxel island that assembles itself as you scroll.' },
      { title: 'Effects lab', body: 'Hit sparks, trails and shaders, tuned live in the browser.' },
      { title: 'Engines', body: 'How we work across Unity and Unreal Engine.' },
    ],
  },
  art: {
    index: '02',
    side: 'right', // header column (the 3D subject takes the other side)
    eyebrow: art.eyebrow,
    title: art.title,
    lead: art.body,
    tags: art.tags,
    next: 'design',
    story: categoryStory(stateAt(STORY, 'features', 1), { tint: 0.4, glow: 0.38, x: 34, side: 'right' }),
    chapters: [
      { title: 'Sculpt to surface', body: 'Wireframe to clay to final material, blended as you scroll.' },
      { title: 'Lighting studio', body: 'Drag the lights around a turntable model.' },
      { title: 'Rig & motion', body: 'A rigging and animation test you can pose.' },
      { title: 'Room-scale VR', body: 'A space designed around how people move, look and reach.' },
    ],
  },
  design: {
    index: '03',
    side: 'right', // header column (the 3D subject takes the other side)
    eyebrow: design.eyebrow,
    title: design.title,
    lead: design.body,
    tags: design.tags,
    next: 'technology',
    // the handle macro is framed for landscape; pull back on portrait
    story: categoryStory({ ...stateAt(STORY, 'features', 2), pdist: 1.9, pfy: 2.2 }, { tint: 0.2, glow: 0.34, x: 60, side: 'right' }),
    chapters: [
      { title: 'Grid in space', body: 'A layout grid you can travel through.' },
      { title: 'Kinetic type', body: 'Typography driven by shaders and scroll.' },
      { title: 'Colour systems', body: 'Palettes explored on live 3D surfaces.' },
      { title: 'Brand to 3D', body: 'From a flat identity to a real-time object.' },
    ],
  },
  technology: {
    index: '04',
    side: 'left', // header column (the 3D subject takes the other side)
    eyebrow: 'Technology',
    title: ['The real-time', 'universe'],
    lead: 'Unity, Unreal Engine, Blender, Three.js, WebGL and VR — the stack every NEXT GEN project runs on, mapped as one connected system.',
    tags: ['Unity', 'Unreal Engine', 'Blender', 'Three.js', 'WebGL', 'VR'],
    next: 'game',
    story: categoryStory(TECH_ORBIT, { tint: 0.5, glow: 0.46, x: 70 }),
    chapters: [
      { title: 'The universe', body: 'Every tool we use as a planet you can visit.' },
      { title: 'Shader playground', body: 'Live GLSL you can tweak right in the page.' },
      { title: 'Performance', body: 'Real frame-rate and render stats from this very page.' },
      { title: 'Pipeline', body: 'From Blender to engine to browser, laid out in 3D.' },
    ],
  },
  'not-found': {
    index: '404',
    side: 'left', // header column (the 3D subject takes the other side)
    eyebrow: 'Off the map',
    title: ['Lost in', 'the world'],
    lead: 'This page does not exist — but the coffee is still warm. Head back and pick a world.',
    tags: [],
    next: null,
    story: [
      // mug pushed right of the text column (camera aims left of it)
      { id: 'cover', label: 'Lost', length: 1, steps: [{ ...MUG_GUIDE, fx: MUG_GUIDE.fx - 7, steam: 1, bg: { glow: 0.3, x: 62, y: 60, tint: 0.5 } }] },
    ],
    chapters: [],
  },
};
