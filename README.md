# Oryzo 3D Recreation — NEXT GEN landing page

A premium, Oryzo.ai-inspired landing page for **NEXT GEN**, a ceramic coffee mug.
The hero is a real-time Three.js scene: a glazed stoneware mug on a cork coaster,
sitting on a green cutting mat with desk props, behind minimal cinematic typography.

All 3D models and textures are generated in code (no third-party image or model assets).

## Tech stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [Three.js](https://threejs.org) (vanilla, mounted from a React component)
- Plain CSS with design tokens (`src/styles/tokens.css`)

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Project structure

```
src/
  App.jsx, main.jsx         App entry
  content.js                All page copy / branding (edit text here)
  components/               Hero overlay UI: Header, SideTab, InfoCard,
                            VideoPreview, ScrollHint, MobileMenu, SceneLayer,
                            HeroCanvas (+ CSS each)
    story/                  Scroll-story sections + story.css
  story/                    storyConfig.js (sections + 3D keyframes),
                            useScrollStory.js (GSAP / ScrollTrigger wiring)
  styles/                   tokens.css (colors, fonts, spacing), global.css
  three/
    createHeroScene.js      Renderer, lights, camera, render loop, cleanup
    sceneConfig.js          Object layout + animatable params (GSAP-ready)
    textures.js             Procedural canvas textures (wood, mat, cork, glaze…)
    objects/                mug, coaster, cuttingMat, desk, pencil,
                            utilityKnife, paperClip, shapes helpers
scripts/
  git-sync.ps1              Safe pull / commit / push helper (Windows PowerShell)
```

### Scroll story (GSAP + ScrollTrigger)

NEXT GEN is presented as a multidisciplinary creative technology team (game development,
3D art & VR, creative design); the coffee mug is the hero visual, not a product.
After the hero, the page scrolls through pinned sections that mirror oryzo.ai one-to-one:
**statement → "powered by play" → "it's playable" → capabilities (gamepad / VR headset /
handle-curve blueprint) → interactive flip toy → material macro → toolkit → how-we-work
cards → projects (categories, case studies coming soon) → outro**. Oryzo's testimonials
section is intentionally omitted (no invented reviews or clients). The full mapping is
documented at the top of `src/story/storyConfig.js`.

- `src/story/storyConfig.js` defines each section's length (viewport heights) and its
  3D keyframes (camera orbit, mug transform, lights, glaze, background glow).
- `src/story/useScrollStory.js` builds **one master GSAP timeline** (positions in scroll
  pixels) that tweens `rig.state`, plus per-section text reveals. Rebuilt on real resizes.
- `src/three/createHeroScene.js` renders one persistent scene in a fixed layer and eases
  its displayed values toward `rig.state` every frame (smooth, never conflicting).
- Sections pin with CSS `position: sticky`; React never re-renders on scroll.
- `prefers-reduced-motion`: no scrubbed motion; the scene cuts between section states.

To retune a section, edit its keyframe in `storyConfig.js`. Fields are documented in
`src/three/sceneConfig.js` (`HERO_STATE`).

## Git workflow

Branches: **`main`** is the stable branch, and day-to-day work happens on **`feature/landing-page`**
(or other `feature/*` branches). Changes reach `main` through a Pull Request.

Helper commands (PowerShell, from the project root):

| Task | Command |
| --- | --- |
| See changed files | `npm run git:status` |
| Get latest changes | `npm run git:pull` |
| Commit (asks to confirm) | `.\scripts\git-sync.ps1 commit -Message "What and why"` |
| Push (asks to confirm) | `npm run git:push` |
| Pull + commit + push | `.\scripts\git-sync.ps1 sync -Message "What and why"` |

Safety rules built into the script:

- Pull is fast-forward only (`--ff-only --autostash`): it never creates surprise merges.
- Commit and push always ask for confirmation.
- Never force-pushes. If a push is rejected, pull first.
- Refuses to commit `.env`, `*.key`, `*.pem` and similar secret files.
- No credentials are stored in the repo. Sign-in is handled by Git Credential Manager / `gh auth login`.
