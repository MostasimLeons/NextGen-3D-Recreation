/**
 * Visual identities for the three creative categories. Plain data, shared by
 * the DOM (panel colours, typography) and the 3D stage (lights, fog, camera,
 * particles). All stay inside the NEXT GEN palette: warm near-black, cream,
 * burnt orange — each category leans a different way.
 */
export const THEMES = {
  game: {
    label: 'Arcade Ember',
    index: '01',
    accent: '#ff6a1f',
    // DOM panel
    panelA: 'rgba(220, 80, 0, 0.34)',
    panelB: 'rgba(58, 10, 3, 0.62)',
    // 3D
    ambient: '#ff9a6a',
    ambientI: 0.22,
    key: '#ffb27a',
    keyI: 2.6,
    rim: '#ff3d14',
    rimI: 2.4,
    fog: '#240703',
    fogNear: 10,
    fogFar: 26,
    camera: [0.6, 1.3, 10.6], // low, heroic
    target: [0, 0.3, 0],
  },
  art: {
    label: 'Holo Studio',
    index: '02',
    accent: '#f3e9da',
    panelA: 'rgba(214, 224, 232, 0.16)',
    panelB: 'rgba(16, 12, 14, 0.72)',
    ambient: '#cdd8e2',
    ambientI: 0.2,
    key: '#e6eef5', // cool moonlit key
    keyI: 2.2,
    rim: '#ff7a2a', // brand warmth on the rim
    rimI: 1.6,
    fog: '#0d0a0c',
    fogNear: 9,
    fogFar: 22,
    camera: [-1.2, 2.6, 10.2], // slightly high, orbiting
    target: [0, 0.2, 0],
  },
  design: {
    label: 'Blueprint',
    index: '03',
    accent: '#d8b48a',
    panelA: 'rgba(216, 180, 138, 0.22)',
    panelB: 'rgba(26, 18, 10, 0.62)',
    ambient: '#fff1dd',
    ambientI: 0.42,
    key: '#fff1dd', // soft, even studio
    keyI: 1.9,
    rim: '#dc5000',
    rimI: 1.1,
    fog: '#1a1209',
    fogNear: 12,
    fogFar: 30,
    camera: [0, 0.6, 10.4], // flat, front-on like a layout board
    target: [0, 0.1, 0],
  },
};
