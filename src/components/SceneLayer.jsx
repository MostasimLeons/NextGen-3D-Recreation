import HeroCanvas from './HeroCanvas.jsx';
import './SceneLayer.css';

/**
 * Fixed, full-screen layer behind the whole page: warm background + glow
 * (animated by the scroll story) and the persistent Three.js canvas.
 */
export default function SceneLayer({ onSceneReady }) {
  return (
    <div className="scene-layer" aria-hidden="true">
      <div className="scene-bg">
        <div className="scene-bg__glow" />
      </div>
      <HeroCanvas onSceneReady={onSceneReady} />
    </div>
  );
}
