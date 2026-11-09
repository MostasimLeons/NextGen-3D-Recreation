import { openPresentation } from '../presentation/store.js';
import { loadPresentation } from '../presentation/PresentationHost.jsx';
import './VideoPreview.css';

/**
 * Video-preview-style thumbnail with an orange glowing frame (a CSS-drawn
 * still). Clicking it opens the full-screen cinematic presentation; the
 * presentation chunk is prefetched on hover/focus so it opens instantly.
 */
export default function VideoPreview({ brand, label, caption }) {
  return (
    <button
      type="button"
      className="video-preview"
      aria-label={caption}
      aria-haspopup="dialog"
      title={caption}
      onPointerEnter={loadPresentation}
      onFocus={loadPresentation}
      onClick={(e) => openPresentation(e.currentTarget)}
    >
      <span className="video-preview__glow" aria-hidden="true" />
      <span className="video-preview__frame" aria-hidden="true">
        <span className="video-preview__still">
          <span className="video-preview__coaster" />
        </span>
        <span className="video-preview__brand">{brand}</span>
        <span className="video-preview__play">
          <svg viewBox="0 0 10 12" width="7" height="8">
            <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
          </svg>
          {label}
        </span>
      </span>
    </button>
  );
}
