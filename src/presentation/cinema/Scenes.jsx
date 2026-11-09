import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import GameIsland from '../../showcase/scenes/GameIsland.jsx';
import SculptStage from '../../showcase/scenes/SculptStage.jsx';
import DesignBoard from '../../showcase/scenes/DesignBoard.jsx';
import { PixelEmbers, HoloRoom, BlueprintField } from '../../showcase/scenes/atmospheres.jsx';
import { TECH_SCENES } from '../../showcase/scenes/techScenes.jsx';
import { TECH, TECH_SLOT, SCENES } from '../sequence.js';

/**
 * The presentation's content scenes. They reuse the site's own showcase
 * worlds (GameIsland, SculptStage, DesignBoard, the six technology scenes
 * and the category atmospheres) so the film and the website share one look.
 * All scenes are mounted for the whole presentation (and pre-compiled by
 * <Preload all />), and only the active one is visible — no hitches at cuts.
 */

/** Visible only while its scene is active; `children` may be a function of the group. */
export function SceneSlot({ seq, id, children }) {
  const g = useRef();
  useFrame(() => {
    if (g.current) g.current.visible = seq.active === id;
  });
  return <group ref={g}>{children}</group>;
}

/** Text drawn with the brand font onto a canvas, shown on a plane. */
export function TextPlate({ text, height = 1, color = '#ffedd7', weight = 700, opacity = 1, ...props }) {
  const { texture, aspect } = useMemo(() => {
    const fontPx = 180;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = `${weight} ${fontPx}px Outfit, "Hanken Grotesk", sans-serif`;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width + fontPx * 0.3);
    c.width = w;
    c.height = Math.ceil(fontPx * 1.3);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, fontPx * 0.15, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { texture: tex, aspect: c.width / c.height };
  }, [text, color, weight]);
  return (
    <mesh {...props}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/* Scene 2 — Game Development ------------------------------------------- */
/** Engine badge circling above the island, always facing the camera. */
function EnginePlate({ label, angle, radius, height }) {
  const w = label.length * 0.16 + 0.6;
  return (
    <group rotation={[0, angle, 0]}>
      <Billboard position={[radius, height, 0]}>
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[w + 0.05, 0.53]} />
          <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w, 0.48]} />
          <meshBasicMaterial color="#1a0d06" transparent opacity={0.9} />
        </mesh>
        <TextPlate text={label} height={0.3} />
      </Billboard>
    </group>
  );
}

export function GameScene({ seq }) {
  const plates = useRef();
  useFrame(() => {
    if (plates.current && seq.active === 'game') plates.current.rotation.y = seq.u * 2.2;
  });
  return (
    <SceneSlot seq={seq} id="game">
      <GameIsland detail={1.2} />
      <PixelEmbers count={120} />
      <group ref={plates}>
        <EnginePlate label="UNITY" angle={0.4} radius={2.4} height={3.3} />
        <EnginePlate label="UNREAL ENGINE" angle={Math.PI + 0.4} radius={2.4} height={2.8} />
      </group>
      <Sparkles count={60} scale={[12, 5, 12]} size={3} speed={0.4} color="#ff9a4a" />
    </SceneSlot>
  );
}

/* Scene 3 — 3D Art & VR ---------------------------------------------------- */
export function ArtScene({ seq }) {
  const key = useRef();
  const rim = useRef();
  const c1 = useMemo(() => new THREE.Color('#ff6a1f'), []);
  const c2 = useMemo(() => new THREE.Color('#ff2f4a'), []);
  const c3 = useMemo(() => new THREE.Color('#ffd9a8'), []);
  useFrame(() => {
    if (seq.active !== 'art' || !key.current) return;
    // lighting transition: orange → red → cream as the camera orbits
    const u = seq.u;
    const col = u < 0.5 ? c1.clone().lerp(c2, u * 2) : c2.clone().lerp(c3, (u - 0.5) * 2);
    key.current.color.copy(col);
    const a = u * Math.PI * 2;
    key.current.position.set(Math.cos(a) * 5, 2.5, Math.sin(a) * 5);
    rim.current.position.set(-Math.cos(a) * 5, -1, -Math.sin(a) * 5);
  });
  return (
    <SceneSlot seq={seq} id="art">
      <pointLight ref={key} intensity={60} distance={16} />
      <pointLight ref={rim} intensity={30} distance={14} color="#ff3d1f" />
      <SculptStage />
      <HoloRoom />
    </SceneSlot>
  );
}

/* Scene 4 — Creative Design: kinetic typography --------------------------- */
const WORDS = ['DESIGN', 'MOTION', 'INTERFACE', 'IDENTITY', 'RHYTHM', 'DETAIL', 'TYPE', 'COLOUR', 'FLOW', 'CRAFT'];
const TUNNEL = 40;

export function DesignScene({ seq }) {
  const words = useRef([]);
  const layout = useMemo(
    () =>
      WORDS.map((w, i) => ({
        w,
        x: (i % 2 ? 1 : -1) * (2.6 + (i % 3) * 1.4),
        // words on the left stay above the caption block (bottom-left)
        y: i % 2 ? ((i * 37) % 7) - 3 : 1.2 + (i % 3) * 0.9,
        z0: -(i / WORDS.length) * TUNNEL,
        rot: (i % 2 ? -1 : 1) * 0.35,
        accent: i % 3 === 0,
      })),
    [],
  );
  useFrame(() => {
    if (seq.active !== 'design') return;
    const travel = seq.u * TUNNEL * 0.9;
    words.current.forEach((m, i) => {
      if (!m) return;
      const L = layout[i];
      const z = ((((L.z0 + travel) % TUNNEL) + TUNNEL) % TUNNEL) - TUNNEL + 6;
      m.position.set(L.x, L.y, z);
      m.rotation.set(0, L.rot + seq.u * L.rot, Math.sin(seq.t * 0.6 + i) * 0.08);
      const near = THREE.MathUtils.smoothstep(z, 2, 6); // fade before it hits the lens
      const far = THREE.MathUtils.smoothstep(z, -TUNNEL + 6, -TUNNEL + 14);
      m.material.opacity = (1 - near) * far * (L.accent ? 1 : 0.85);
    });
  });
  return (
    <SceneSlot seq={seq} id="design">
      <DesignBoard />
      <BlueprintField />
      {layout.map((L, i) => (
        <TextPlate
          key={L.w}
          ref={(m) => (words.current[i] = m)}
          text={L.w}
          height={L.accent ? 1.5 : 1.1}
          color={L.accent ? '#ff8a3a' : '#ffedd7'}
        />
      ))}
    </SceneSlot>
  );
}

/* Scene 5 — Technology: six subjects, one per slot ------------------------- */
function TechSubject({ seq, index, Scene }) {
  const g = useRef();
  useFrame(() => {
    const on = seq.active === 'tech' && seq.slot === index;
    g.current.visible = on;
    if (!on) return;
    // pop in: scale + spin settle at the start of the slot
    const k = seq.reduced ? 1 : THREE.MathUtils.smoothstep(seq.slotU, 0, 0.28);
    g.current.scale.setScalar(0.55 + 0.45 * k);
    g.current.rotation.y = (1 - k) * 0.9;
  });
  return (
    <group ref={g}>
      <Scene />
    </group>
  );
}

export function TechScene({ seq }) {
  return (
    <SceneSlot seq={seq} id="tech">
      {TECH.map((t, i) => (
        <TechSubject key={t.id} seq={seq} index={i} Scene={TECH_SCENES[t.id]} />
      ))}
      <Sparkles count={80} scale={[14, 7, 10]} size={2.6} speed={0.5} color="#ff8a3a" />
    </SceneSlot>
  );
}

export const TECH_START = SCENES.find((s) => s.id === 'tech').start;
export { TECH_SLOT };
