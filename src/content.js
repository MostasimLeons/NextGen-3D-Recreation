/**
 * All landing-page copy lives here so wording / branding can be changed
 * without touching components. Copy is original placeholder text.
 */
export const content = {
  brand: 'NEXT GEN',
  tagline: 'Made for mornings. Built to last.',
  nav: [
    { label: 'Intro', href: '#intro', active: true },
    { label: 'Features', href: '#features' },
    { label: 'Product', href: '#product' },
    { label: 'Contact', href: '#contact' },
  ],
  sideTab: 'NEXT GEN · Mug 01',
  lead: 'Twice-fired stoneware, balanced to hold heat and sit steady in your hand. NEXT GEN makes the first pour of the day feel considered.',
  card: {
    title: ['Glazed', 'stoneware,', 'fired twice,', 'made to last.'],
    body: 'The next generation of the everyday coffee mug.',
  },
  video: { label: 'Play', caption: 'Watch the NEXT GEN film' },
  menuFoot: { label: 'Studio enquiries', cta: 'Get in touch', href: '#contact' },
  scrollHint: 'Scroll to continue',

  /* Scroll story (Phase 3) — original copy, structure mirrors oryzo.ai */
  story: {
    statement: {
      title: ["Isn't just", 'a mug.'],
      body: "NEXT GEN isn't just a mug. It's what happens when you obsess over the one object you touch first every morning.",
    },
    crafted: {
      title: 'Crafted by fire',
      mark: '*',
      label: 'NEXT GEN-01',
      aside: ['Clay fills in the gaps.', 'Heat does the rest.'],
      footnote: '* and a very patient kiln',
    },
    everyday: {
      label: 'So balanced,',
      word: "it's everyday",
    },
    features: [
      {
        eyebrow: 'Thermal stoneware',
        title: ['Holds the', 'heat'],
        body: 'Thick, twice-fired walls keep the first sip and the last one closer together. Your coffee stays the temperature you meant it to be.',
        stat: { from: 20, to: 72, unit: '°C', label: 'Still above, 20 min after the pour' },
      },
      {
        eyebrow: 'Centred weight',
        title: ['Perfectly', 'weighted'],
        body: 'A low centre of mass and a wide, unglazed foot. It settles where you put it — on the desk, the sofa arm, the stack of notebooks.',
        stat: { value: '340 g', label: 'Weight, balanced low' },
      },
      {
        eyebrow: 'Hand-pulled handle',
        title: ['The signature', 'curve'],
        body: 'One continuous curve, pulled by hand, shaped for three fingers and a thumb. Room for knuckles. No pinch points.',
        stat: { value: 'R 24 mm', label: 'Inner radius of the grip' },
      },
    ],
    material: {
      eyebrow: 'Precision glaze, zero drama',
      title: ['Twice-fired', 'reactive glaze'],
      body: 'A food-safe glaze that pools and breaks over iron speckle, so no two mugs are quite the same.',
      spec: { label: 'Surface gloss (est.)', value: '85 GU' },
    },
    variants: {
      eyebrow: 'Choose your own',
      items: [
        { name: 'Cream', body: 'The original. Warm white glaze over speckled stoneware — quietly at home everywhere.' },
        { name: 'Sand', body: 'A sun-baked glaze with a little more warmth. Same balance, softer mood.' },
        { name: 'Sage', body: 'Muted green, drawn from the cutting mat it was designed on.' },
      ],
    },
    outro: {
      line: 'Made for mornings.',
      body: 'NEXT GEN is a concept product, built as a 3D web experience.',
      cta: { label: 'Back to top', href: '#intro' },
    },
  },
};
