import { Canvas } from '@react-three/fiber';
import { Preload, Sparkles } from '@react-three/drei';
import { StudioLights } from '../../showcase/scenes/common.jsx';
import Director from './Director.jsx';
import Backdrop from './Backdrop.jsx';
import LogoParticles from './LogoParticles.jsx';
import PostFX from './PostFX.jsx';
import { GameScene, ArtScene, DesignScene, TechScene } from './Scenes.jsx';

/**
 * The presentation's own full-screen R3F canvas. It exists only while the
 * presentation is open (unmount disposes the context and every resource),
 * renders through PostFX, and freezes completely while paused
 * (frameloop "never").
 */
export default function CinemaCanvas({ seq, paused, lowPower, onReady }) {
  return (
    <Canvas
      className="cine__canvas"
      flat
      dpr={[1, lowPower ? 1.25 : 1.6]}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 35, near: 0.1, far: 220, position: [0, 0.8, 26] }}
      onCreated={({ gl }) => {
        gl.setClearColor('#100904');
        onReady?.();
      }}
    >
      <Director seq={seq} />
      <Backdrop seq={seq} />
      <StudioLights intensity={1.1} />
      <LogoParticles seq={seq} count={lowPower ? 3600 : 7000} />
      <Sparkles count={lowPower ? 40 : 90} scale={[26, 12, 18]} size={3.4} speed={0.35} opacity={0.85} color="#ff8a3a" />
      <GameScene seq={seq} />
      <ArtScene seq={seq} />
      <DesignScene seq={seq} />
      <TechScene seq={seq} />
      <PostFX seq={seq} lowPower={lowPower} />
      {/* compile every scene's materials up front: no stalls at cuts */}
      <Preload all />
    </Canvas>
  );
}
