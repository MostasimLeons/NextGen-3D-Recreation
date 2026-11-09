import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';

/** The single R3F canvas; every drei <View> on the page renders into it. */
export default function ShowcaseCanvas({ active = true }) {
  return (
    <Canvas
      className={`showcase-layer${active ? '' : ' is-paused'}`}
      frameloop={active ? 'always' : 'never'}
      eventSource={document.getElementById('root')}
      eventPrefix="client"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 10], fov: 35 }}
    >
      <View.Port />
    </Canvas>
  );
}
