import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { View, PresentationControls, ContactShadows, Environment, Lightformer, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { THEMES } from './themes.js';
import GameIsland from './scenes/GameIsland.jsx';
import SculptStage from './scenes/SculptStage.jsx';
import DesignBoard from './scenes/DesignBoard.jsx';
import { ATMOSPHERES } from './scenes/atmospheres.jsx';

const STAGES = { game: GameIsland, art: SculptStage, design: DesignBoard };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Lights + fog that ease toward the active theme every frame, so a category
 * switch re-lights the stage smoothly instead of snapping.
 */
function ThemeRig({ theme }) {
  const amb = useRef();
  const key = useRef();
  const rim = useRef();
  const fog = useRef();
  const target = useMemo(
    () => ({
      amb: new THREE.Color(theme.ambient),
      key: new THREE.Color(theme.key),
      rim: new THREE.Color(theme.rim),
      fog: new THREE.Color(theme.fog),
    }),
    [theme],
  );
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 3.5);
    amb.current.color.lerp(target.amb, k);
    key.current.color.lerp(target.key, k);
    rim.current.color.lerp(target.rim, k);
    amb.current.intensity = THREE.MathUtils.lerp(amb.current.intensity, theme.ambientI, k);
    key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, theme.keyI, k);
    rim.current.intensity = THREE.MathUtils.lerp(rim.current.intensity, theme.rimI, k);
    fog.current.color.lerp(target.fog, k);
    fog.current.near = THREE.MathUtils.lerp(fog.current.near, theme.fogNear, k);
    fog.current.far = THREE.MathUtils.lerp(fog.current.far, theme.fogFar, k);
  });
  return (
    <>
      <fog ref={fog} attach="fog" args={[theme.fog, theme.fogNear, theme.fogFar]} />
      <ambientLight ref={amb} intensity={theme.ambientI} color={theme.ambient} />
      <directionalLight ref={key} position={[4, 6, 5]} intensity={theme.keyI} color={theme.key} />
      <directionalLight ref={rim} position={[-5, 2.5, -4]} intensity={theme.rimI} color={theme.rim} />
      {/* Procedural environment (no HDR download) for reflections */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 4]} scale={[8, 3, 1]} color="#ffe6c8" />
        <Lightformer form="rect" intensity={1.3} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#ff7a2a" />
        <Lightformer form="ring" intensity={0.9} position={[4, 2, -4]} scale={3} color="#e6eef5" />
      </Environment>
    </>
  );
}

/**
 * Camera that eases toward each theme's framing, plus a dolly "push"
 * (rig.kick, tweened by GSAP during a switch) for a cinematic cut.
 */
function CameraRig({ theme, rig }) {
  const cam = useRef();
  const look = useMemo(() => new THREE.Vector3(...theme.target), []); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const c = cam.current;
    if (!c) return;
    const k = 1 - Math.exp(-dt * 2.6);
    pos.set(...theme.camera);
    pos.z += rig.kick * 2.4; // pull back during the cut…
    pos.y += rig.kick * 0.6;
    pos.x += state.pointer.x * 0.35; // …and a touch of parallax
    pos.y += state.pointer.y * 0.2;
    c.position.lerp(pos, k);
    tgt.set(...theme.target);
    look.lerp(tgt, k);
    c.lookAt(look);
  });
  return <PerspectiveCamera ref={cam} makeDefault position={theme.camera} fov={34} />;
}

/** Wraps the active scene; plays the GSAP enter animation on mount. */
function SceneSlot({ children, groupRef, reduce }) {
  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return undefined;
    if (reduce) {
      g.scale.setScalar(1);
      return undefined;
    }
    g.scale.setScalar(0.55);
    g.position.y = -1.4;
    g.rotation.y = -0.9;
    const tl = gsap.timeline();
    tl.to(g.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'power3.out' }, 0)
      .to(g.position, { y: 0, duration: 1.0, ease: 'power3.out' }, 0)
      .to(g.rotation, { y: 0, duration: 1.2, ease: 'power3.out' }, 0);
    return () => tl.kill();
  }, [groupRef, reduce]);
  return <group ref={groupRef}>{children}</group>;
}

/**
 * Large drag-to-rotate stage for the active category (drei View).
 *
 * Transition state machine:
 *   activeId changes → exit tween on the current scene (sink, tilt, shrink)
 *   + camera kick → on complete, `shown` switches → new scene mounts and
 *   plays its enter tween; lights/fog/camera ease to the new theme.
 */
export default function ProjectsStage({ activeId }) {
  const [shown, setShown] = useState(activeId);
  const group = useRef();
  const rig = useRef({ kick: 0 }).current;
  const reduce = reducedMotion();

  useEffect(() => {
    if (activeId === shown) return undefined;
    if (reduce || !group.current) {
      setShown(activeId);
      return undefined;
    }
    const g = group.current;
    const tl = gsap.timeline({ onComplete: () => setShown(activeId) });
    tl.to(g.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 0.42, ease: 'power3.in' }, 0)
      .to(g.position, { y: -1.6, duration: 0.42, ease: 'power3.in' }, 0)
      .to(g.rotation, { y: '+=0.9', duration: 0.42, ease: 'power3.in' }, 0)
      .to(rig, { kick: 1, duration: 0.42, ease: 'power2.in' }, 0)
      .to(rig, { kick: 0, duration: 1.1, ease: 'power3.out' }, 0.42);
    return () => tl.kill();
  }, [activeId, shown, reduce, rig]);

  const theme = THEMES[activeId]; // lights/camera lead the swap slightly
  const Stage = STAGES[shown];
  const Atmosphere = ATMOSPHERES[shown];

  return (
    <View className="explore__view">
      <CameraRig theme={theme} rig={rig} />
      <ThemeRig theme={theme} />
      <PresentationControls global={false} cursor snap speed={1.4} polar={[-0.2, 0.3]} azimuth={[-0.9, 0.9]}>
        <SceneSlot key={shown} groupRef={group} reduce={reduce}>
          <Stage />
        </SceneSlot>
      </PresentationControls>
      <Atmosphere key={`atmo-${shown}`} />
      <ContactShadows position={[0, -2.6, 0]} opacity={0.55} scale={12} blur={2.6} far={5} color="#000" />
      <ResizeGuard />
    </View>
  );
}

/** Keeps the View's camera aspect correct when its DOM box resizes. */
function ResizeGuard() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (camera.isPerspectiveCamera) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  return null;
}
