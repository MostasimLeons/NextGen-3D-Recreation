import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { View, PerspectiveCamera, Sparkles, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { TECH_SCENES, TECH_CAMERAS } from './scenes/techScenes.jsx';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Camera that eases toward each chapter's framing, adds a GSAP-driven
 * "kick" (pull-back) during a cut and a slow scroll dolly inside a chapter
 * (progress.current: 0 → 1 across the chapter, written by ScrollTrigger).
 */
function TechCamera({ chapter, rig, progress }) {
  const cam = useRef();
  const look = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const c = cam.current;
    if (!c) return;
    const f = TECH_CAMERAS[chapter];
    const k = 1 - Math.exp(-dt * 2.4);
    const p = progress.current ?? 0;
    // Keep the View camera's aspect in sync with its DOM box.
    const aspect = state.size.width / Math.max(1, state.size.height);
    if (Math.abs(c.aspect - aspect) > 1e-3) {
      c.aspect = aspect;
      c.updateProjectionMatrix();
    }
    // Narrow (portrait) screens: back off so subjects fit the width.
    const fit = THREE.MathUtils.clamp(0.95 / aspect, 1, 1.75);
    pos.set(...f.pos);
    pos.multiplyScalar((1.08 - p * 0.14) * fit); // dolly in while scrolling the chapter
    pos.z += rig.kick * 3.2;
    pos.y += rig.kick * 0.8;
    pos.x += state.pointer.x * 0.4;
    pos.y += state.pointer.y * 0.25;
    c.position.lerp(pos, k);
    tgt.set(...f.target);
    look.lerp(tgt, k);
    c.lookAt(look);
  });
  return <PerspectiveCamera ref={cam} makeDefault position={TECH_CAMERAS[chapter].pos} fov={36} />;
}

/** Enter animation for each newly mounted scene. */
function Slot({ children, groupRef, reduce }) {
  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g || reduce) return undefined;
    g.scale.setScalar(0.5);
    g.position.y = -1.6;
    g.rotation.y = -1.0;
    const tl = gsap.timeline();
    tl.to(g.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'power3.out' }, 0)
      .to(g.position, { y: 0, duration: 1.1, ease: 'power3.out' }, 0)
      .to(g.rotation, { y: 0, duration: 1.3, ease: 'power3.out' }, 0);
    return () => tl.kill();
  }, [groupRef, reduce]);
  return <group ref={groupRef}>{children}</group>;
}

/**
 * Full-bleed 3D stage for "Runs on the edge of play" (drei View in the
 * shared lazy canvas). Chapter changes play: exit (sink + spin + shrink) →
 * camera kick → enter, with warm orange key/rim lights, local embers
 * (Sparkles) and fog for depth.
 */
export default function TechStage({ chapter, progress }) {
  const [shown, setShown] = useState(chapter);
  const group = useRef();
  const rig = useRef({ kick: 0 }).current;
  const reduce = reducedMotion();

  useEffect(() => {
    if (chapter === shown) return undefined;
    if (reduce || !group.current) {
      setShown(chapter);
      return undefined;
    }
    const g = group.current;
    const tl = gsap.timeline({ onComplete: () => setShown(chapter) });
    tl.to(g.scale, { x: 0.55, y: 0.55, z: 0.55, duration: 0.4, ease: 'power3.in' }, 0)
      .to(g.position, { y: 1.8, duration: 0.4, ease: 'power3.in' }, 0)
      .to(g.rotation, { y: '+=1.1', duration: 0.4, ease: 'power3.in' }, 0)
      .to(rig, { kick: 1, duration: 0.4, ease: 'power2.in' }, 0)
      .to(rig, { kick: 0, duration: 1.2, ease: 'power3.out' }, 0.4);
    return () => tl.kill();
  }, [chapter, shown, reduce, rig]);

  const Scene = TECH_SCENES[shown];

  return (
    <View className="tech-stage__view">
      <TechCamera chapter={chapter} rig={rig} progress={progress} />
      <fog attach="fog" args={['#160604', 9, 24]} />
      <ambientLight intensity={0.2} color="#ff9a6a" />
      <directionalLight position={[4, 6, 5]} intensity={2.1} color="#ffcfa0" />
      <directionalLight position={[-6, 1.5, -3]} intensity={2.4} color="#ff3d14" />
      <pointLight position={[0, -2, 3]} intensity={18} distance={10} decay={1.6} color="#dc5000" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.8} position={[0, 4, 4]} scale={[8, 3, 1]} color="#ffe6c8" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#ff5a1f" />
      </Environment>
      <Slot key={shown} groupRef={group} reduce={reduce}>
        <Scene />
      </Slot>
      <Sparkles count={60} scale={[14, 8, 8]} size={3} speed={0.45} opacity={0.75} color="#ff7a2a" noise={1.2} />
    </View>
  );
}
