import './VideoPreview.css';

/**
 * Video-preview-style thumbnail with an orange glowing frame.
 * The "footage" is a CSS-drawn still (coaster on the mat), so no video
 * asset is required for phase one.
 */
export default function VideoPreview({ brand, label, caption }) {
  return (
    <button type="button" className="video-preview" aria-label={caption}>
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
