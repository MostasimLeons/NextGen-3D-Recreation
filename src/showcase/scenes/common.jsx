import { Environment, Lightformer, PerspectiveCamera } from '@react-three/drei';

/** Shared palette, matching the main site. */
export const C = {
  cream: '#efe3cf',
  charcoal: '#221c17',
  ink: '#100904',
  orange: '#dc5000',
  glow: '#ff7a2a',
  olive: '#4b5a3c',
  dirt: '#6b4428',
  sand: '#d8b48a',
};

/**
 * Warm studio lighting for every showcase view. The environment map is
 * built from procedural Lightformers — no HDR file is downloaded.
 */
export function StudioLights({ intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.25 * intensity} color="#ffe2c2" />
      <directionalLight position={[4, 6, 5]} intensity={2.2 * intensity} color="#ffd6a8" />
      <directionalLight position={[-5, 2, -4]} intensity={0.9 * intensity} color="#ff7a2a" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 4]} scale={[8, 3, 1]} color="#ffe6c8" />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#ff7a2a" />
        <Lightformer form="ring" intensity={1} position={[4, 2, -4]} scale={3} color="#ffb066" />
      </Environment>
    </>
  );
}

/** A View's own camera. */
export function ViewCamera({ position = [0, 1.5, 9], fov = 32 }) {
  return <PerspectiveCamera makeDefault position={position} fov={fov} />;
}
