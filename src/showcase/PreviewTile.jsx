import { useEffect, useState } from 'react';
import { View } from '@react-three/drei';
import { StudioLights, ViewCamera } from './scenes/common.jsx';
import { PREVIEWS } from './scenes/Previews.jsx';
import './PreviewTile.css';

function Timecode() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((v) => (v + 1) % 600), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <span className="preview-tile__time">
      {mm}:{ss}
    </span>
  );
}

/**
 * "Video preview" tile — honestly a live real-time render (drei View), styled
 * like a video thumbnail: orange-glow frame, REC dot, timecode, label.
 */
export default function PreviewTile({ sceneId, label, meta, camera, className = '' }) {
  const Scene = PREVIEWS[sceneId];
  return (
    <figure className={`preview-tile ${className}`}>
      <View className="preview-tile__view">
        <ViewCamera {...camera} />
        <StudioLights intensity={0.9} />
        {Scene && <Scene />}
      </View>
      <figcaption className="preview-tile__hud">
        <span className="preview-tile__live">
          <span className="preview-tile__dot" aria-hidden="true" />
          Live
        </span>
        <Timecode />
        <span className="preview-tile__label">{label}</span>
        <span className="preview-tile__meta">{meta}</span>
      </figcaption>
    </figure>
  );
}
