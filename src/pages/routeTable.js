/**
 * Every route of the site, as plain data (no JSX), so both the app and the
 * build (vite.config.js — one prerendered HTML per route, per-route <title>
 * and description) read the same list.
 */
export const SITE_NAME = 'NEXT GEN';

export const ROUTE_TABLE = [
  {
    path: '/',
    id: 'home',
    label: 'Home',
    title: 'NEXT GEN — Games, 3D, VR & Creative Design',
    description:
      'NEXT GEN is a multidisciplinary creative technology team: game development, 3D art & VR, and creative design.',
  },
  {
    path: '/game-development',
    id: 'game',
    label: 'Game Development',
    title: 'Game Development — NEXT GEN',
    description: 'Playable worlds and interactive prototypes built in Unity and Unreal Engine by NEXT GEN.',
  },
  {
    path: '/3d-art-vr',
    id: 'art',
    label: '3D Art & VR',
    title: '3D Art & VR — NEXT GEN',
    description: 'Models, animation and virtual reality made to be explored — 3D art and VR by NEXT GEN.',
  },
  {
    path: '/creative-design',
    id: 'design',
    label: 'Creative Design',
    title: 'Creative Design — NEXT GEN',
    description: 'Interfaces, visual identities and motion with the same attention to detail — creative design by NEXT GEN.',
  },
  {
    path: '/technology',
    id: 'technology',
    label: 'Technology',
    title: 'Technology — NEXT GEN',
    description: 'Unity, Unreal Engine, Blender, Three.js, WebGL and VR: the real-time stack behind NEXT GEN.',
  },
];

export const NOT_FOUND = {
  path: null,
  id: 'not-found',
  label: 'Not found',
  title: 'Lost in the world — NEXT GEN',
  description: 'This page does not exist. Head back to NEXT GEN.',
};

/** "/game-development/" → "/game-development"; "" → "/". */
export function normalizePath(pathname) {
  const p = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function findRoute(pathname) {
  const p = normalizePath(pathname);
  return ROUTE_TABLE.find((r) => r.path === p) ?? NOT_FOUND;
}
