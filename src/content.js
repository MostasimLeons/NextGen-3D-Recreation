/**
 * All page copy lives here so wording can change without touching components.
 *
 * NEXT GEN is a multidisciplinary creative technology team. The coffee mug is
 * the hero visual (an object on the team's desk), not a product for sale.
 * Copy is original; it states capabilities only — no invented clients,
 * team members, projects or achievements.
 */
export const content = {
  brand: 'NEXT GEN',
  tagline: 'Made for players. Built for worlds.',
  nav: [
    { label: 'Intro', href: '#intro', active: true },
    { label: 'Capabilities', href: '#features' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
  sideTab: 'NEXT GEN · Creative Tech',
  lead: 'A multidisciplinary creative technology team. Games, 3D art, VR and design — crafted with the same care as the first coffee of the day.',
  card: {
    title: ['Games,', '3D, VR', '& design by', 'NEXT GEN.'],
    body: 'One team, four disciplines, a lot of coffee.',
  },
  video: { label: 'Soon', caption: 'NEXT GEN showreel — coming soon' },
  menuFoot: { label: 'New projects', cta: 'Get in touch', href: '#contact' },
  scrollHint: 'Scroll to continue',

  /* Scroll story — structure mirrors oryzo.ai section by section */
  story: {
    statement: {
      title: ["Isn't about", 'the mug.'],
      body: 'The mug just got your attention. NEXT GEN is a creative technology team that builds games, 3D worlds, VR experiences and design.',
    },
    crafted: {
      title: 'Powered by play',
      mark: '*',
      label: 'UNITY · UNREAL ENGINE',
      aside: ['Games fill the gaps.', 'Coffee does the rest.'],
      footnote: '* and a lot of playtesting',
    },
    everyday: {
      label: 'So immersive,',
      word: "it's playable",
    },
    features: [
      {
        eyebrow: 'Game development',
        title: ['Built to be', 'played'],
        body: 'Interactive games and real-time experiences, from first prototype to polished build. Mechanics first, then everything that makes them feel good.',
        tags: ['Unity', 'Unreal Engine', 'Interactive games'],
      },
      {
        eyebrow: '3D art & VR',
        title: ['Worlds you can', 'step into'],
        body: 'Models, animation and virtual reality made to be explored — not just looked at. Immersive experiences built around how people actually move.',
        tags: ['3D modeling', '3D animation', 'Virtual reality', 'Immersive experiences'],
      },
      {
        eyebrow: 'Creative design',
        title: ['Every curve', 'considered'],
        body: 'Interfaces, visuals and motion designed with the same precision as a hand-pulled handle. If it moves, it moves for a reason.',
        tags: ['UI/UX design', 'Visual design', 'Motion graphics'],
      },
    ],
    interactive: {
      eyebrow: 'Interactive by default',
      title: ['Smart flip', 'interaction'],
      body: 'Write a message. Flip it. Everything we make should respond when you touch it — even this.',
      placeholder: 'Type a message',
      flip: 'Flip message',
      unflip: 'Flip it back',
      initial: 'Hello from NEXT GEN',
    },
    material: {
      eyebrow: 'Precision detail, zero drama',
      title: ['Detail you', 'can feel'],
      body: 'Materials, light and shaders, obsessed over until a speckle of glaze reads right in real time.',
      spec: { label: 'Coffee per shader (est.)', value: '3 cups' },
    },
    toolkit: {
      eyebrow: 'What we work with',
      title: ['Real-time', 'first'],
      groups: [
        { name: 'Game development', items: ['Unity', 'Unreal Engine', 'Interactive games'] },
        { name: '3D art', items: ['3D modeling', '3D animation'] },
        { name: 'VR', items: ['Virtual reality', 'Immersive experiences'] },
        { name: 'Creative design', items: ['UI/UX design', 'Visual design', 'Motion graphics'] },
      ],
    },
    process: {
      eyebrow: 'How we work',
      title: 'Runs on the edge of play',
      tech: ['Unity', 'Unreal Engine', 'Blender', 'Three.js', 'WebGL', 'VR'],
      tiles: [
        { id: 'lattice', label: 'Voxel wave', meta: 'Engine test', after: 0 },
        { id: 'shader', label: 'Fire shader', meta: 'GLSL · WebGL', after: 2 },
        { id: 'turntable', label: 'Mug turntable', meta: 'Asset review', after: 4 },
      ],
      cards: [
        { kicker: 'Always on', title: 'Runs on coffee', body: 'Fuel: espresso. Uptime: whenever the idea is good.', meta: 'Power draw (est.): 2 cups / hour' },
        { kicker: 'One team', title: 'Four disciplines', body: 'Game development, 3D art, VR and creative design sit at the same desk.', meta: 'Hand-offs: as few as possible' },
        { kicker: 'Playtested', title: 'Fun first', body: "If it isn't fun to use, it isn't finished. We test with real hands early and often.", meta: 'Test conditions: real people' },
        { kicker: 'Real-time', title: 'Built live', body: 'We work inside the engine, so what you see in review is what ships.', meta: 'Engines: Unity · Unreal' },
      ],
    },
    projects: {
      eyebrow: 'Explore what we make',
      note: 'Live real-time previews · case studies coming soon',
      hint: 'Drag to rotate',
      categories: [
        {
          id: 'game',
          name: 'Game Development',
          short: 'Games',
          body: 'Playable worlds and interactive prototypes built in Unity and Unreal Engine — level, loop and feel first.',
          stage: 'Level prototype',
          tags: ['Unity', 'Unreal Engine', 'Interactive games'],
          previews: [
            { id: 'coins', label: 'Coin run', meta: 'Gameplay loop' },
            { id: 'sparks', label: 'Hit sparks', meta: 'VFX pass' },
            { id: 'orbit', label: 'Level orbit', meta: 'Camera study' },
          ],
        },
        {
          id: 'art',
          name: '3D Art & VR',
          short: '3D & VR',
          body: 'Modeled, sculpted and animated assets, and VR spaces made to be stepped into — not just looked at.',
          stage: 'Sculpt & headset',
          tags: ['3D modeling', '3D animation', 'Virtual reality', 'Immersive'],
          previews: [
            { id: 'wire', label: 'Wireframe', meta: 'Topology pass' },
            { id: 'rig', label: 'Rig test', meta: 'Animation' },
            { id: 'vr', label: 'VR headset', meta: 'Hardware study' },
          ],
        },
        {
          id: 'design',
          name: 'Creative Design',
          short: 'Design',
          body: 'Interfaces, visual systems and motion graphics with the same precision as a hand-pulled handle.',
          stage: 'Interface & motion',
          tags: ['UI/UX design', 'Visual design', 'Motion graphics'],
          previews: [
            { id: 'morph', label: 'Shape morph', meta: 'Motion graphics' },
            { id: 'ui', label: 'Interface', meta: 'UI/UX' },
            { id: 'bars', label: 'Kinetic type', meta: 'Visual rhythm' },
          ],
        },
      ],
    },
    outro: {
      line: ['We got you scrolling with a coffee mug.', 'Imagine what we can build for you.'],
      body: 'NEXT GEN — games, 3D art, VR and creative design.',
      cta: { label: 'Get in touch', href: '#contact' },
      back: { label: 'Back to top', href: '#intro' },
    },
  },
};
