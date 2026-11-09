import HeroCanvas from './HeroCanvas.jsx';
import './SceneLayer.css';

/**
 * Fixed, full-screen layer behind the whole page: a CSS fallback background
 * and the persistent Three.js canvas (which renders its own GLSL backdrop).
 */
export default function SceneLayer({ onSceneReady }) {
  return (
    <div className="scene-layer" aria-hidden="true">
      {/* CSS fallback colour while WebGL boots; the GLSL backdrop takes over */}
      <div className="scene-bg" />
      <HeroCanvas onSceneReady={onSceneReady} />
    </div>
  );
}
