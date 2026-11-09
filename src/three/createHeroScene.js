import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LAYOUT, MUG_SCALE, GLAZES, DEFAULT_PARAMS, HERO_STATE, isUserKey } from './sceneConfig.js';
import { createDesk } from './objects/desk.js';
import { createCuttingMat } from './objects/cuttingMat.js';
import { createCoaster } from './objects/coaster.js';
import { createMug } from './objects/mug.js';
import { createPencil } from './objects/pencil.js';
import { createUtilityKnife } from './objects/utilityKnife.js';
import { createPaperClip } from './objects/paperClip.js';
import { createGamepad } from './objects/gamepad.js';
import { createVrHeadset } from './objects/vrHeadset.js';
import { createBackdrop } from './effects/backdrop.js';
import { createPost } from './effects/post.js';
import { createEmbers } from './effects/embers.js';
import { createSmoke } from './effects/smoke.js';
import { createLightTrails } from './effects/lightTrails.js';
import { createVoxels } from './effects/voxels.js';
import { createCoffeeSpill } from './effects/coffeeSpill.js';
import { createCoffeePour } from './effects/coffeePour.js';

const COASTER = { radius: 5, height: 0.62 };
const { lerp, clamp, degToRad } = THREE.MathUtils;

/**
 * Hero camera framing for a given viewport aspect. Wide screens show the
 * whole desk composition; narrow (phone) screens zoom onto the mug.
 */
function framingFor(aspect) {
  const t = clamp((aspect - 0.5) / (1.4 - 0.5), 0, 1);
  const e = t * t * (3 - 2 * t); // smoothstep
  const width = Math.max(lerp(16.5, 38, e), aspect * 22 * e);
  const target = new THREE.Vector3(
    lerp(LAYOUT.coaster.x + 0.8, 0, e),
    0,
    lerp(LAYOUT.coaster.z - 2.6, 0, e),
  );
  return { width, target };
}

async function waitForFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('500 22px "DM Mono"'), document.fonts.load('700 150px "Outfit"')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

/**
 * Builds the persistent 3D scene inside `container` (a fixed, full-screen
 * layer behind the whole page).
 * Resolves to { dispose, rig }:
 *   rig.state  – scroll-animated values (see HERO_STATE), tweened by GSAP
 *   rig.params – hero tuning (tilt, zoom, parallax…)
 */
export async function createHeroScene(container, { onReady } = {}) {
  await waitForFonts();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = { ...DEFAULT_PARAMS };
  const state = { ...HERO_STATE }; // target values (written by GSAP)
  const view = { ...HERO_STATE }; // smoothed values actually rendered
  const stateKeys = Object.keys(HERO_STATE);
  // UI-driven values ("user*") already carry their own GSAP easing: no extra smoothing.
  const userKey = Object.fromEntries(stateKeys.map((k) => [k, isUserKey(k)]));

  /* Renderer ---------------------------------------------------------- */
  // Post-processing owns AA (multisampling) and tone mapping (ACES effect),
  // so the renderer itself renders linear HDR without either.
  const lowPower = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    stencil: false,
    depth: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 1.75));
  renderer.setClearColor('#100904', 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.localClippingEnabled = true; // coffee surface is clipped to the mug
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  /* Scene ------------------------------------------------------------- */
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = state.env;

  // GLSL backdrop (warm gradient, scroll-driven glow, smoke, grain).
  const backdrop = createBackdrop();
  scene.add(backdrop);
  const bgU = backdrop.material.uniforms;

  /* Lights ------------------------------------------------------------ */
  const hemi = new THREE.HemisphereLight('#ffe2c2', '#4a2c18', state.hemi);
  scene.add(hemi);

  const key = new THREE.DirectionalLight('#ffd6a8', state.key);
  key.position.set(-16, 25, -12);
  key.castShadow = true;
  const bigShadow = Math.min(window.innerWidth, window.innerHeight) > 700;
  key.shadow.mapSize.set(bigShadow ? 4096 : 2048, bigShadow ? 4096 : 2048);
  Object.assign(key.shadow.camera, { left: -34, right: 34, top: 26, bottom: -26, near: 1, far: 90 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight('#ffb27a', 0.5);
  fill.position.set(18, 12, 20);
  scene.add(fill);

  // Warm rim light so the glaze picks up a highlight along its edge.
  const rim = new THREE.SpotLight('#ffe6c8', state.rim, 40, 0.5, 0.8, 1.6);
  rim.position.set(LAYOUT.coaster.x + 9, 14, LAYOUT.coaster.z + 6);
  rim.target.position.set(LAYOUT.coaster.x, 3, LAYOUT.coaster.z);
  scene.add(rim, rim.target);

  // Burnt-orange "heat" light for the thermal feature (off by default).
  const heat = new THREE.PointLight('#ff6a1f', 0, 26, 1.4);
  scene.add(heat);

  /* Desk group (fades out as the story begins) ------------------------- */
  const deskGroup = new THREE.Group();
  deskGroup.name = 'desk';
  scene.add(deskGroup);
  deskGroup.add(createDesk());

  const mat = createCuttingMat();
  mat.position.set(LAYOUT.mat.x, 0.002, LAYOUT.mat.z);
  mat.rotation.y = LAYOUT.mat.rotY;
  deskGroup.add(mat);
  const matTop = mat.userData.topY;

  const coaster = createCoaster(COASTER);
  coaster.position.set(LAYOUT.coaster.x, matTop, LAYOUT.coaster.z);
  deskGroup.add(coaster);

  const creamPencil = createPencil({ length: 12, radius: 0.38, bodyColor: '#eab988', woodColor: '#e2b98a' });
  creamPencil.position.set(LAYOUT.creamPencil.x, matTop, LAYOUT.creamPencil.z);
  creamPencil.rotation.y = LAYOUT.creamPencil.rotY;
  deskGroup.add(creamPencil);

  const greenPencil = createPencil({
    length: 12,
    radius: 0.36,
    bodyColor: '#2f3b2c',
    woodColor: '#d6ad7a',
    endColor: '#e9d3a8',
  });
  greenPencil.position.set(LAYOUT.greenPencil.x, 0, LAYOUT.greenPencil.z);
  greenPencil.rotation.y = LAYOUT.greenPencil.rotY;
  deskGroup.add(greenPencil);

  const knife = createUtilityKnife({ length: 10, width: 1.8, height: 0.8 });
  knife.position.set(LAYOUT.knife.x, matTop, LAYOUT.knife.z);
  knife.rotation.y = LAYOUT.knife.rotY;
  deskGroup.add(knife);

  for (const c of LAYOUT.clips) {
    const clip = createPaperClip();
    clip.position.set(c.x, 0, c.z);
    clip.rotation.y = c.rotY;
    deskGroup.add(clip);
  }

  const deskMaterials = new Set();
  deskGroup.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) deskMaterials.add(m);
  });
  let appliedDesk = 1;
  function applyDeskFade(d) {
    if (Math.abs(d - appliedDesk) < 0.001) return;
    const wasOpaque = appliedDesk >= 0.999;
    const nowOpaque = d >= 0.999;
    for (const m of deskMaterials) {
      m.opacity = d;
      if (wasOpaque !== nowOpaque) {
        m.transparent = !nowOpaque;
        m.needsUpdate = true;
      }
    }
    deskGroup.visible = d > 0.002; // skip draw + shadow pass entirely when gone
    appliedDesk = d;
  }

  /* Mug (the persistent hero product) ---------------------------------- */
  const mugBaseY = matTop + COASTER.height * 0.55; // sits in the coaster recess
  const mug = createMug({ mark: 'NEXT GEN', decalAngle: LAYOUT.mug.decalAngle });
  mug.scale.setScalar(MUG_SCALE);
  scene.add(mug);
  const glazeMat = mug.userData.glaze;

  /* Capability actors (swap in at the centre stage by scale) ----------- */
  const STAGE = new THREE.Vector3(0, 5.9, 0);
  const pad = createGamepad();
  const vr = createVrHeadset();
  for (const a of [pad, vr]) {
    a.position.copy(STAGE);
    a.scale.setScalar(0.001);
    a.visible = false;
    scene.add(a);
  }
  const ease = (x) => x * x * (3 - 2 * x); // smoothstep for scale pops

  /* Atmosphere: embers, smoke, light trails, voxels -------------------- */
  const embers = createEmbers({ count: lowPower ? 420 : 900, center: STAGE });
  const smoke = createSmoke({ count: lowPower ? 24 : 40 });
  const trails = createLightTrails({ center: STAGE });
  const voxels = createVoxels({ count: lowPower ? 40 : 70, center: STAGE });
  for (const fx of [embers, smoke, trails, voxels]) scene.add(fx.object);

  /* Coffee spill (flip interaction): drops + splashes + puddle ---------- */
  const spill = createCoffeeSpill({
    maxDrops: lowPower ? 360 : 600,
    maxSplash: lowPower ? 240 : 420,
    floorY: -0.8,
  });
  scene.add(spill.object);
  const coffee = createCoffeePour({ mug, spill, reducedMotion });
  const flipOffset = new THREE.Vector3();
  const flipEuler = new THREE.Euler();
  const glazeColors = GLAZES.map((c) => new THREE.Color(c));

  /* Camera ------------------------------------------------------------ */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.3, 400);
  const post = createPost(renderer, scene, camera, { lowPower });
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const heroPos = new THREE.Vector3();
  const heroTarget = new THREE.Vector3();
  const storyPos = new THREE.Vector3();
  const storyTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    post.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgU.uAspect.value = w / h;
  }

  function computeHeroCamera() {
    const { width, target } = framingFor(camera.aspect);
    const tilt = degToRad(params.tilt);
    const visibleH = width / camera.aspect;
    const dist = visibleH / 2 / Math.tan(degToRad(camera.fov / 2)) / params.zoom;
    const px = pointer.sx * 0.7 * params.parallax;
    const pz = pointer.sy * 0.5 * params.parallax;
    const tx = target.x + params.focusX;
    const tz = target.z + params.focusZ;
    heroTarget.set(tx + px * 0.3, 0, tz + pz * 0.3);
    heroPos.set(tx + px, Math.cos(tilt) * dist, tz + Math.sin(tilt) * dist + pz);
  }

  function computeStoryCamera() {
    // 0 on landscape → 1 on narrow portrait screens.
    const p = clamp((1.0 - camera.aspect) / 0.45, 0, 1);
    const fx = lerp(view.fx, view.pfx, p);
    const fy = view.fy + view.pfy * p;
    const portraitDist = Math.max(1, 0.95 / camera.aspect) * view.pdist;
    const dist = view.dist * lerp(1, portraitDist, p);
    const pitch = degToRad(view.pitch);
    const yaw = degToRad(view.yaw);
    storyTarget.set(fx + pointer.sx * 0.25 * params.parallax, fy - pointer.sy * 0.2 * params.parallax, view.fz);
    storyPos.set(
      storyTarget.x + dist * Math.cos(pitch) * Math.sin(yaw),
      storyTarget.y + dist * Math.sin(pitch),
      storyTarget.z + dist * Math.cos(pitch) * Math.cos(yaw),
    );
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
  let rig = null; // assigned below; read by tick for the smoothing flag
  const timer = new THREE.Timer();
  timer.connect(document);
  let raf = 0;
  let first = true;

  function tick() {
    timer.update();
    const t = timer.getElapsed();
    const dt = Math.min(timer.getDelta(), 0.1);

    // Ease rendered values toward the scroll targets (cinematic lag, and
    // fast scrolls never jump). rig.smoothing = 0 → exact (reduced motion).
    const k = (rig?.smoothing ?? 1) && !reducedMotion ? 1 - Math.exp(-dt * 6) : 1;
    for (const key of stateKeys) view[key] += (state[key] - view[key]) * (userKey[key] ? 1 : k);
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    const h = clamp(view.hero, 0, 1);
    const idle = reducedMotion ? 0 : params.idle;

    // Camera: blend responsive hero framing → story orbit.
    if (h > 0) computeHeroCamera();
    if (h < 1) computeStoryCamera();
    camera.position.lerpVectors(storyPos, heroPos, h);
    lookTarget.lerpVectors(storyTarget, heroTarget, h);
    camera.lookAt(lookTarget);

    // Mug: on the coaster in the hero, scroll-driven transform in the story.
    const heroRotY = LAYOUT.mug.rotY + Math.sin(t * 0.35) * 0.2 * idle + pointer.sx * 0.3 * params.parallax;
    const storyRotY = view.ry + pointer.sx * 0.12 * params.parallax;
    // Mug shrinks about its centre (origin is the foot, centre ≈ 3.9 up).
    const ms = clamp(lerp(view.mugS, 1, h), 0, 1);
    mug.visible = ms > 0.01;
    mug.scale.setScalar(MUG_SCALE * Math.max(ease(ms), 0.001));
    mug.position.set(
      lerp(view.mx, LAYOUT.coaster.x, h),
      lerp(view.my, mugBaseY, h) + (1 - ease(ms)) * 3.9,
      lerp(view.mz, LAYOUT.coaster.z, h),
    );
    const flipAngle = view.userFlip * Math.PI;
    mug.rotation.set(
      lerp(view.rx, pointer.sy * 0.025 * params.parallax, h),
      lerp(storyRotY, heroRotY, h),
      lerp(view.rz, 0, h) + flipAngle,
    );
    // The flip turns about the mug's centre, not its foot: shift the foot by
    // c − Rz(θ)·c (c = centre offset), expressed in the mug's tilted frame.
    if (flipAngle > 0.0001) {
      const c = 3.9 * ease(ms);
      flipOffset.set(c * Math.sin(flipAngle), c * (1 - Math.cos(flipAngle)), 0);
      flipEuler.set(mug.rotation.x, mug.rotation.y, 0);
      mug.position.add(flipOffset.applyEuler(flipEuler));
    }

    // Coffee: slosh, drain, pour and splash, all driven by the flip angle.
    coffee.update(dt, t, flipAngle);

    // Gamepad / headset: scale in, gentle float + idle turn.
    const bob = Math.sin(t * 0.9) * 0.18 * idle;
    [
      [pad, view.padS, 0.95],
      [vr, view.vrS, 0.92],
    ].forEach(([a, sRaw, size]) => {
      const s = ease(clamp(sRaw, 0, 1));
      a.visible = s > 0.01;
      if (!a.visible) return;
      a.scale.setScalar(size * Math.max(s, 0.001));
      a.position.set(STAGE.x, STAGE.y + bob, STAGE.z);
      a.rotation.set(
        view.arx - pointer.sy * 0.08 * params.parallax,
        view.ary + Math.sin(t * 0.4) * 0.12 * idle + pointer.sx * 0.2 * params.parallax + (1 - s) * 1.2,
        0,
      );
    });

    // Desk fade, lighting and glaze.
    applyDeskFade(clamp(view.desk, 0, 1));
    hemi.intensity = view.hemi;
    key.intensity = view.key;
    fill.intensity = view.fill;
    rim.intensity = view.rim;
    scene.environmentIntensity = view.env;
    heat.intensity = view.heat * 60;
    heat.position.set(mug.position.x + 1.5, mug.position.y + 9, mug.position.z + 5);
    const g = clamp(view.glaze, 0, glazeColors.length - 1);
    const gi = Math.min(Math.floor(g), glazeColors.length - 2);
    glazeMat.color.lerpColors(glazeColors[gi], glazeColors[gi + 1], g - gi);

    // Backdrop + atmosphere (frozen in time for reduced motion).
    const ft = reducedMotion ? 0 : t;
    bgU.uTime.value = ft;
    bgU.uGlow.value = view.glow;
    bgU.uGlowPos.value.set(view.gx, 1 - view.gy);
    bgU.uTint.value = view.tint;
    embers.update(ft, clamp(view.embers, 0, 1.5));
    smoke.update(ft, clamp(view.smoke, 0, 1.5));
    trails.update(ft, clamp(view.trails, 0, 1.5));
    voxels.update(ft, clamp(view.voxels, 0, 1.2));

    post.render(dt);

    if (first) {
      first = false;
      onReady?.();
    }
    raf = requestAnimationFrame(tick);
  }
  tick();

  rig = {
    smoothing: 1,
    coffee, // { burst(strength), refill(), level } — for flip timelines
    scene,
    camera,
    renderer,
    params,
    state,
    objects: { mug, pad, vr, coaster, mat, knife, creamPencil, greenPencil, deskGroup },
  };

  /* Cleanup ----------------------------------------------------------- */
  function dispose() {
    cancelAnimationFrame(raf);
    timer.dispose();
    ro.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    post.dispose();
    scene.traverse((o) => {
      if (!o.isMesh && !o.isPoints) return;
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
