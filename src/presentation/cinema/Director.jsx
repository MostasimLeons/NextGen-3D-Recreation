import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENES, TECH, TECH_SLOT, sceneAt } from '../sequence.js';
import { TECH_CAMERAS } from '../../showcase/scenes/techScenes.jsx';

/**
 * The Director turns the timeline clock (seq.t, advanced by GSAP) into
 * everything the 3D side needs each frame:
 *   seq.active / seq.u        current scene + its local progress
 *   seq.slot / seq.slotU      technology sub-shot (scene 5)
 *   seq.cut                   transition strength (peaks on every cut)
 *   seq.look                  backdrop glow / tint / trails per scene
 * and flies the camera along each scene's move. Everything derives from
 * seq.t, so pause, replay and seeking are exact.
 */
const ease = (x) => x * x * (3 - 2 * x);
const lerp = THREE.MathUtils.lerp;

const LOOKS = {
  logo: { glow: 0.9, tint: 0.35, trails: 0.9, glowPos: [0.5, 0.55] },
  game: { glow: 0.6, tint: 0.25, trails: 0.5, glowPos: [0.66, 0.6] },
  art: { glow: 0.55, tint: 0.55, trails: 0.35, glowPos: [0.36, 0.55] },
  design: { glow: 0.5, tint: 0.2, trails: 0.8, glowPos: [0.62, 0.5] },
  tech: { glow: 0.7, tint: 0.45, trails: 1, glowPos: [0.64, 0.56] },
  final: { glow: 1, tint: 0.4, trails: 0.9, glowPos: [0.5, 0.62] },
};

/** Camera move per scene: (u 0–1) → [position, target]. */
const MOVES = {
  logo: (u) => {
    const e = ease(u);
    return [[Math.sin(u * 0.9) * 3.2, 0.8 + u * 0.6, lerp(26, 14.5, e)], [0, 0.6, 0]];
  },
  game: (u) => {
    const a = -0.9 + u * 1.5;
    const r = lerp(12.5, 8.2, ease(u));
    return [[Math.sin(a) * r, lerp(6.8, 2.6, ease(u)), Math.cos(a) * r], [-1.3, 0.3, 0]];
  },
  art: (u) => {
    const a = 0.5 + u * 1.2;
    const r = lerp(10, 8.4, u);
    return [[Math.sin(a) * r, lerp(1, 2.4, u), Math.cos(a) * r], [-1.4, 0.1, 0]];
  },
  design: (u) => [[lerp(0.6, -1.2, u), lerp(0.2, 0.9, u), lerp(12.5, 8, ease(u))], [lerp(-1.6, -0.8, u), 0, 0]],
  final: (u) => [[Math.sin(u * 0.7) * 1.5, 0.6, lerp(14, 19, ease(u))], [0, 0.2, 0]],
};

function techMove(slot, slotU) {
  const f = TECH_CAMERAS[TECH[slot].id];
  const k = 1.08 - ease(slotU) * 0.16; // slow dolly inside each technology
  return [f.pos.map((v) => v * k), f.target];
}

/** Distance-based pulse at every scene and technology cut. */
function cutAt(t) {
  let cut = 0;
  for (let i = 1; i < SCENES.length; i++) {
    const d = Math.abs(t - SCENES[i].start);
    cut = Math.max(cut, Math.pow(Math.max(0, 1 - d / 0.42), 1.6));
  }
  const tech = SCENES.find((s) => s.id === 'tech');
  for (let i = 1; i < TECH.length; i++) {
    const d = Math.abs(t - (tech.start + i * TECH_SLOT));
    cut = Math.max(cut, 0.55 * Math.pow(Math.max(0, 1 - d / 0.26), 1.6));
  }
  return cut;
}

export default function Director({ seq }) {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ id: null, slot: -1 });

  useFrame((state, dt) => {
    const { scene, u } = sceneAt(seq.t);
    seq.active = scene.id;
    seq.u = u;
    if (scene.id === 'tech') {
      const local = seq.t - scene.start;
      seq.slot = Math.min(TECH.length - 1, Math.floor(local / TECH_SLOT));
      seq.slotU = Math.min(1, (local - seq.slot * TECH_SLOT) / TECH_SLOT);
    } else {
      seq.slot = -1;
      seq.slotU = 0;
    }
    seq.cut = seq.reduced ? cutAt(seq.t) * 0.6 : cutAt(seq.t);

    const L = LOOKS[scene.id];
    seq.look.glow = L.glow;
    seq.look.tint = L.tint;
    seq.look.trails = seq.reduced ? 0 : L.trails;
    seq.look.glowPos.set(L.glowPos[0], L.glowPos[1]);

    // Camera: reduced motion holds the mid-point of each move.
    const mu = seq.reduced ? 0.5 : u;
    const [p, target] = scene.id === 'tech' ? techMove(seq.slot, seq.reduced ? 0.5 : seq.slotU) : MOVES[scene.id](mu);
    const cam = state.camera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const fit = THREE.MathUtils.clamp(0.95 / aspect, 1, 1.9); // portrait: back off
    pos.set(p[0], p[1], p[2]).multiplyScalar(fit);
    tgt.set(target[0], target[1], target[2]);
    if (aspect < 0.9) tgt.x *= 0.15; // portrait: centre the subject (captions go below)

    // Hard cut on scene/slot change (hidden under the transition pulse).
    const changed = last.current.id !== scene.id || last.current.slot !== seq.slot;
    last.current = { id: scene.id, slot: seq.slot };
    if (changed || dt > 0.25) {
      cam.position.copy(pos);
      look.copy(tgt);
    } else {
      const k = 1 - Math.exp(-dt * 6);
      cam.position.lerp(pos, k);
      look.lerp(tgt, k);
    }
    cam.lookAt(look);
  });

  return null;
}
