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
                            VideoPreview, ScrollHint, HeroCanvas (+ CSS each)
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

### Animating the scene later (GSAP / ScrollTrigger)

`createHeroScene` resolves to `{ dispose, rig }`. `rig.params` (camera `tilt`, `zoom`,
`focusX/Z`, `mugSpin`, `mugLift`, `idle`, `parallax`) is read every frame, so a
timeline can tween it directly:

```js
gsap.to(rig.params, { zoom: 1.8, tilt: 40, scrollTrigger: { trigger: '#intro', scrub: true } });
```

`HeroCanvas` exposes the rig through its `onSceneReady(rig)` prop.

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
