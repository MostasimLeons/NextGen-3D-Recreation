import * as THREE from 'three';
import { createSpring } from './spring.js';

/**
 * Hero desk micro-interactions (pointer + raycasting, no physics engine):
 *
 *   mug      hovering near the mug sends ring ripples across the coffee
 *            (coffeeLiquid.addRipple), stronger the faster the pointer
 *            moves; a click is a "tap" ripple. `mugHover` (0–1) is exposed
 *            so the scene can lift the steam a little.
 *   pencils  hover: float up + lean; click: hop, roll about the long axis
 *            and settle on a flat hex face, with bounces.
 *   clips    hover: float; click: hop, spin and wobble, then ease home.
 *   knife    hover: the blade slides out; click: "click-clack" — snaps
 *            fully in, then springs back out.
 *
 * Every prop is hit-tested through an invisible, slightly oversized proxy
 * box, so thin parts (clip wire, pencil) are easy to catch and raycasts stay
 * cheap (a handful of boxes). Props keep their layout transform as the rest
 * pose; all motion is an offset on top, so nothing drifts over time.
 *
 * update(dt, active) — active = the hero desk is on screen.
 */
const GRAVITY = 60; // world units / s² (props are ~12 units long)
const HEX = Math.PI / 3;

export function createHeroInteractions({ element, camera, liquid, pencils, clips, knife, reducedMotion = false }) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { x: 0, y: 0, type: 'mouse', inside: false, dirty: false, speed: 0, lastT: 0 };
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const proxies = [];

  function addProxy(obj, [sx, sy, sz], [ox, oy, oz], prop) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), hitMat);
    m.position.set(ox, oy, oz);
    m.name = 'hitProxy';
    m.userData.prop = prop;
    obj.add(m);
    proxies.push(m);
  }

  function makeProp(obj, kind, extra = {}) {
    obj.rotation.order = 'YXZ'; // lean / wobble about the prop's own long axis
    const p = {
      obj,
      kind,
      base: obj.position.clone(),
      baseRot: obj.rotation.clone(),
      hover: false,
      lift: createSpring({ stiffness: 90, damping: 11 }),
      lean: createSpring({ stiffness: 70, damping: 9 }),
      yaw: createSpring({ stiffness: 7, damping: 4.2 }),
      wobble: createSpring({ stiffness: 140, damping: 6 }),
      y: 0,
      vy: 0,
      air: false,
      roll: 0,
      rollVel: 0,
      rollRest: 0,
      ...extra,
    };
    return p;
  }

  const props = [];
  for (const pencil of pencils) {
    const inner = pencil.children[0];
    inner.rotation.order = 'ZYX'; // rotation.y = roll about the hex axis
    const p = makeProp(pencil, 'pencil', { inner });
    addProxy(pencil, [12.6, 1.6, 1.8], [0, 0.4, 0], p);
    props.push(p);
  }
  for (const clip of clips) {
    const p = makeProp(clip, 'clip');
    addProxy(clip, [4.4, 0.8, 1.8], [0.1, 0.25, 0], p);
    props.push(p);
  }
  let knifeProp = null;
  if (knife) {
    const rig = knife.userData.blade;
    knifeProp = makeProp(knife, 'knife', {
      rig,
      blade: createSpring({ stiffness: 260, damping: 17 }),
      clackT: 0,
    });
    addProxy(knife, [13.4, 1.6, 2.8], [0.9, 0.5, 0], knifeProp);
    props.push(knifeProp);
  }

  /* Pointer --------------------------------------------------------------- */
  function toNdc(clientX, clientY) {
    const r = element.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  }
  function onMove(e) {
    const now = performance.now();
    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;
    const dtMs = Math.max(now - pointer.lastT, 1);
    // smoothed pointer speed in px/s (drives ripple strength)
    pointer.speed += (Math.hypot(dx, dy) / (dtMs / 1000) - pointer.speed) * 0.35;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.lastT = now;
    pointer.type = e.pointerType || 'mouse';
    pointer.inside = true;
    pointer.dirty = true;
  }
  function onLeave() {
    pointer.inside = false;
    pointer.dirty = true;
  }

  // Clicks on real UI (links, buttons, the message field…) never poke props.
  const UI = 'a, button, input, textarea, select, label, [role="button"], [role="dialog"]';
  let clickQueue = null;
  function onClick(e) {
    if (e.target instanceof Element && e.target.closest(UI)) return;
    clickQueue = { x: e.clientX, y: e.clientY };
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('click', onClick);

  /* Hit testing ----------------------------------------------------------- */
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const local = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const nMat = new THREE.Matrix3();

  function pickProp() {
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(proxies, false);
    return hits.length ? hits[0].object.userData.prop : null;
  }

  /** Pointer on the coffee plane, in surface-local units; null if far away. */
  function coffeePoint() {
    if (!liquid?.surface || liquid.level < 0.05) return null;
    const s = liquid.surface;
    s.updateWorldMatrix(true, false);
    nMat.getNormalMatrix(s.matrixWorld);
    nrm.set(0, 0, 1).applyMatrix3(nMat).normalize();
    hit.setFromMatrixPosition(s.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(nrm, hit);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    local.copy(hit);
    s.worldToLocal(local);
    const r = Math.hypot(local.x, local.y);
    const R = liquid.innerRadius;
    if (r > R * 2.4) return null; // "near the mug" = within ~2.4 radii
    const k = r > R * 0.82 ? (R * 0.82) / r : 1; // sources stay on the disc
    return { x: local.x * k, y: local.y * k, inside: r <= R };
  }

  /* Prop behaviour ---------------------------------------------------------- */
  const sign = () => (Math.random() < 0.5 ? -1 : 1);

  function poke(p) {
    if (reducedMotion) return;
    if (p.kind === 'knife') {
      // click-clack: snap the blade in, spring back out after a beat
      p.blade.target = p.rig.maxIn;
      p.clackT = 0.2;
      p.vy = 6;
      p.air = true;
      return;
    }
    const strength = p.air ? 0.6 : 1; // re-clicking mid-air adds a smaller kick
    p.vy = Math.max(p.vy, 0) + (p.kind === 'pencil' ? 11 : 9) * strength;
    p.air = true;
    if (p.kind === 'pencil') {
      p.rollVel += sign() * (9 + Math.random() * 5);
      p.yaw.kick(sign() * 1.2);
    } else {
      p.yaw.kick(sign() * (7 + Math.random() * 5));
      p.wobble.kick(sign() * 9);
    }
  }

  function stepProp(p, dt) {
    const hov = p.hover && !reducedMotion;
    p.lift.target = hov ? (p.kind === 'knife' ? 0.18 : p.kind === 'clip' ? 0.3 : 0.42) : 0;
    p.lean.target = hov ? (p.kind === 'knife' ? 0.02 : 0.07) : 0;
    p.lift.update(dt);
    p.lean.update(dt);
    p.yaw.update(dt);
    p.wobble.update(dt);

    // Ballistic hop with bouncy landings.
    if (p.air) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0 && p.vy < 0) {
        p.y = 0;
        if (-p.vy > 2.2) {
          p.vy = -p.vy * 0.36;
          p.rollVel *= 0.45;
          p.wobble.kick(sign() * 2.5);
        } else {
          p.vy = 0;
          p.air = false;
          p.rollRest = Math.round(p.roll / HEX) * HEX; // land on a flat face
        }
      }
    }

    if (p.kind === 'pencil') {
      if (p.air) {
        p.roll += p.rollVel * dt;
      } else {
        p.rollVel = 0;
        p.roll += (p.rollRest - p.roll) * (1 - Math.exp(-dt * 12));
      }
      // keep the number small so repeated clicks never accumulate
      if (!p.air && Math.abs(p.roll - p.rollRest) < 1e-3) {
        p.roll = p.rollRest = ((p.rollRest % (HEX * 6)) + HEX * 6) % (HEX * 6);
      }
      p.inner.rotation.y = p.roll;
    }

    if (p.kind === 'knife') {
      if (p.clackT > 0) {
        p.clackT -= dt;
        if (p.clackT <= 0) p.blade.target = p.hover ? p.rig.maxOut : 0;
      } else {
        p.blade.target = hov ? p.rig.maxOut : 0;
      }
      p.blade.update(dt);
      const b = THREE.MathUtils.clamp(p.blade.value, p.rig.maxIn - 0.15, p.rig.maxOut + 0.25);
      p.rig.carriage.position.x = b;
      p.rig.slider.position.x = p.rig.sliderX + b * 0.55; // thumb button follows
    }

    p.obj.position.set(p.base.x, p.base.y + p.lift.value + p.y, p.base.z);
    p.obj.rotation.set(p.baseRot.x + p.lean.value + p.wobble.value * 0.12, p.baseRot.y + p.yaw.value, p.baseRot.z);
  }

  /* Mug hover → ripples ------------------------------------------------------ */
  const mugHover = createSpring({ stiffness: 40, damping: 12 });
  // Pointer projected onto a plane just above the desk (for the dust layer).
  const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -3);
  const pointerWorld = new THREE.Vector3();
  const pointerOn = createSpring({ stiffness: 30, damping: 11 });
  let wasNear = false;
  let rippleCooldown = 0;
  const lastRipple = { x: -1e4, y: -1e4 };
  let hovered = null;

  function setCursor(on) {
    document.documentElement.classList.toggle('is-prop-hover', on);
  }

  return {
    /** 0–1, eased: how much the pointer is hovering the mug. */
    get mugHover() {
      return THREE.MathUtils.clamp(mugHover.value, 0, 1);
    },
    /** Pointer on the desk plane (world) and how present it is (0–1). */
    pointerWorld,
    get pointerOn() {
      return THREE.MathUtils.clamp(pointerOn.value, 0, 1);
    },
    update(dt, active) {
      rippleCooldown -= dt;
      pointer.speed *= Math.exp(-dt * 10); // a still pointer stops rippling
      let near = null;

      if (!active) {
        if (hovered) hovered.hover = false;
        hovered = null;
        wasNear = false;
        setCursor(false);
        clickQueue = null;
      } else {
        // Hover (mouse / pen only: touch has no hover).
        const canHover = pointer.inside && pointer.type !== 'touch';
        if (pointer.dirty || canHover) {
          if (canHover) {
            toNdc(pointer.x, pointer.y);
            const p = pickProp();
            if (p !== hovered) {
              if (hovered) hovered.hover = false;
              hovered = p;
              if (p) p.hover = true;
            }
            near = coffeePoint();
            raycaster.setFromCamera(ndc, camera);
            raycaster.ray.intersectPlane(deskPlane, pointerWorld);
          } else if (hovered) {
            hovered.hover = false;
            hovered = null;
          }
          setCursor(Boolean(hovered));
          pointer.dirty = false;
        }

        if (near && !reducedMotion) {
          // a new ripple needs real movement since the last one
          const moved = Math.hypot(pointer.x - lastRipple.x, pointer.y - lastRipple.y) > 6;
          const fast = pointer.speed > 60 && moved;
          if (!wasNear || (fast && rippleCooldown <= 0)) {
            lastRipple.x = pointer.x;
            lastRipple.y = pointer.y;
            const s = wasNear ? THREE.MathUtils.clamp(pointer.speed / 2600, 0.012, 0.045) : 0.028;
            liquid.addRipple(near.x, near.y, near.inside ? s : s * 0.7);
            rippleCooldown = 0.12;
          }
        }
        wasNear = Boolean(near);

        // Clicks: a prop under the pointer gets poked; near the mug, a tap.
        if (clickQueue) {
          toNdc(clickQueue.x, clickQueue.y);
          const p = pickProp();
          if (p) poke(p);
          else {
            const c = coffeePoint();
            if (c && !reducedMotion) liquid.addRipple(c.x, c.y, 0.085);
          }
          clickQueue = null;
        }
      }

      pointerOn.target = active && pointer.inside && pointer.type !== 'touch' ? 1 : 0;
      pointerOn.update(dt);
      mugHover.target = near ? 1 : 0;
      mugHover.update(dt);
      for (const p of props) stepProp(p, dt);
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onClick);
      setCursor(false);
      for (const m of proxies) m.geometry.dispose();
      hitMat.dispose();
    },
  };
}
