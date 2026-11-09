import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LAYOUT, DEFAULT_PARAMS } from './sceneConfig.js';
import { createDesk } from './objects/desk.js';
import { createCuttingMat } from './objects/cuttingMat.js';
import { createCoaster } from './objects/coaster.js';
import { createMug } from './objects/mug.js';
import { createPencil } from './objects/pencil.js';
import { createUtilityKnife } from './objects/utilityKnife.js';
import { createPaperClip } from './objects/paperClip.js';

const COASTER = { radius: 4.5, height: 0.6 };
const MUG_SCALE = 1.3;

/**
 * Camera framing for a given viewport aspect. Wide screens show the whole
 * desk composition; narrow (phone) screens zoom onto the mug.
 */
function framingFor(aspect) {
  const t = THREE.MathUtils.clamp((aspect - 0.5) / (1.4 - 0.5), 0, 1);
  const e = t * t * (3 - 2 * t); // smoothstep
  const width = Math.max(THREE.MathUtils.lerp(14, 38, e), aspect * 22 * e);
  const target = new THREE.Vector3(
    THREE.MathUtils.lerp(LAYOUT.coaster.x + 0.6, 0, e),
    0,
    THREE.MathUtils.lerp(LAYOUT.coaster.z - 2.4, 0, e),
  );
  return { width, target };
}

async function waitForFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('500 22px "DM Mono"'),
        document.fonts.load('700 150px "Outfit"'),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

/**
 * Builds the hero desk scene inside `container`.
 * Resolves to { dispose, rig } — `rig` exposes the camera, key objects and
 * animatable `params` for future GSAP / ScrollTrigger timelines.
 */
export async function createHeroScene(container, { onReady } = {}) {
  await waitForFonts();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = { ...DEFAULT_PARAMS };

  /* Renderer ---------------------------------------------------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  /* Scene ------------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#24140a');

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.4;

  /* Lights ------------------------------------------------------------ */
  scene.add(new THREE.HemisphereLight('#ffe2c2', '#4a2c18', 0.9));

  const key = new THREE.DirectionalLight('#ffd6a8', 3.2);
  key.position.set(-16, 25, -12);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -34, right: 34, top: 26, bottom: -26, near: 1, far: 90 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight('#ffb27a', 0.5);
  fill.position.set(18, 12, 20);
  scene.add(fill);

  // Soft warm rim light so the glaze picks up a highlight along its edge.
  const rim = new THREE.SpotLight('#ffe6c8', 60, 40, 0.5, 0.8, 1.6);
  rim.position.set(LAYOUT.coaster.x + 9, 14, LAYOUT.coaster.z + 6);
  rim.target.position.set(LAYOUT.coaster.x, 3, LAYOUT.coaster.z);
  scene.add(rim, rim.target);

  /* Objects ----------------------------------------------------------- */
  scene.add(createDesk());

  const mat = createCuttingMat();
  mat.position.set(LAYOUT.mat.x, 0.002, LAYOUT.mat.z);
  mat.rotation.y = LAYOUT.mat.rotY;
  scene.add(mat);
  const matTop = mat.userData.topY;

  const coaster = createCoaster(COASTER);
  coaster.position.set(LAYOUT.coaster.x, matTop, LAYOUT.coaster.z);
  scene.add(coaster);

  // The mug sits in the coaster's recessed floor.
  const mugBaseY = matTop + COASTER.height * 0.55;
  const mug = createMug({ mark: 'NEXT GEN' });
  mug.position.set(LAYOUT.coaster.x, mugBaseY, LAYOUT.coaster.z);
  mug.rotation.y = LAYOUT.mug.rotY;
  mug.scale.setScalar(MUG_SCALE);
  scene.add(mug);

  const creamPencil = createPencil({ length: 12, radius: 0.38, bodyColor: '#eab988', woodColor: '#e2b98a' });
  creamPencil.position.set(LAYOUT.creamPencil.x, matTop, LAYOUT.creamPencil.z);
  creamPencil.rotation.y = LAYOUT.creamPencil.rotY;
  scene.add(creamPencil);

  const greenPencil = createPencil({
    length: 12,
    radius: 0.36,
    bodyColor: '#2f3b2c',
    woodColor: '#d6ad7a',
    endColor: '#e9d3a8',
  });
  greenPencil.position.set(LAYOUT.greenPencil.x, 0, LAYOUT.greenPencil.z);
  greenPencil.rotation.y = LAYOUT.greenPencil.rotY;
  scene.add(greenPencil);

  const knife = createUtilityKnife({ length: 10, width: 1.8, height: 0.8 });
  knife.position.set(LAYOUT.knife.x, matTop, LAYOUT.knife.z);
  knife.rotation.y = LAYOUT.knife.rotY;
  scene.add(knife);

  for (const c of LAYOUT.clips) {
    const clip = createPaperClip();
    clip.position.set(c.x, 0, c.z);
    clip.rotation.y = c.rotY;
    scene.add(clip);
  }

  /* Camera ------------------------------------------------------------ */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
  const lookTarget = new THREE.Vector3();
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function placeCamera() {
    const { width, target } = framingFor(camera.aspect);
    const tilt = THREE.MathUtils.degToRad(params.tilt);
    const visibleH = width / camera.aspect;
    const dist = visibleH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / params.zoom;
    const px = pointer.sx * 0.7 * params.parallax;
    const pz = pointer.sy * 0.5 * params.parallax;
    const tx = target.x + params.focusX;
    const tz = target.z + params.focusZ;
    lookTarget.set(tx + px * 0.3, 0, tz + pz * 0.3);
    camera.position.set(tx + px, Math.cos(tilt) * dist, tz + Math.sin(tilt) * dist + pz);
    camera.lookAt(lookTarget);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  if (!reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true });

  /* Loop -------------------------------------------------------------- */
  const timer = new THREE.Timer();
  timer.connect(document);
  let raf = 0;
  let first = true;

  function tick() {
    timer.update();
    const t = timer.getElapsed();
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    const idle = reducedMotion ? 0 : params.idle;
    // Slow turntable sway + mouse-driven turn; handle swings into view.
    mug.rotation.y =
      LAYOUT.mug.rotY + params.mugSpin + Math.sin(t * 0.35) * 0.22 * idle + pointer.sx * 0.45 * params.parallax;
    mug.position.y = mugBaseY + params.mugLift;
    mug.rotation.x = pointer.sy * 0.025 * params.parallax;

    placeCamera();
    renderer.render(scene, camera);

    if (first) {
      first = false;
      onReady?.();
    }
    raf = requestAnimationFrame(tick);
  }
  tick();

  const rig = { scene, camera, renderer, params, objects: { mug, coaster, mat, knife, creamPencil, greenPencil } };

  /* Cleanup ----------------------------------------------------------- */
  function dispose() {
    cancelAnimationFrame(raf);
    timer.dispose();
    ro.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { dispose, rig };
}
