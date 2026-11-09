import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const features = content.story.features;

/**
 * Pinned 3-step feature sequence: heat (glow + counter), weight, and the
 * handle-curve close-up with a blueprint circle drawing on (≈ oryzo features).
 */
export default function FeaturesSection() {
  return (
    <StorySection id="features" anchor="features" label="Features">
      {features.map((f, i) => (
        <div key={f.eyebrow} className={`feature feature--${i}`} data-step={i}>
          <p className="story-eyebrow" data-reveal>
            <span className="story-eyebrow__index">0{i + 1}</span>
            {f.eyebrow}
          </p>
          <h2 className="feature__title" data-reveal>
            {f.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="feature__body" data-reveal>
            {f.body}
          </p>
          <div className="feature__stat" data-reveal>
            <span className="feature__stat-value">
              {f.stat.to !== undefined ? (
                <>
                  <span data-counter data-from={f.stat.from} data-to={f.stat.to}>
                    {f.stat.to}
                  </span>
                  {f.stat.unit}
                </>
              ) : (
                f.stat.value
              )}
            </span>
            <span className="feature__stat-label">{f.stat.label}</span>
          </div>
        </div>
      ))}

      {/* Blueprint overlay around the handle (step 3) */}
      <svg className="blueprint" viewBox="0 0 200 200" aria-hidden="true" data-step="2">
        <g data-reveal>
          <circle cx="100" cy="100" r="78" pathLength="1" data-draw className="blueprint__line" />
          <circle cx="100" cy="100" r="30" pathLength="1" data-draw className="blueprint__line" />
          <path d="M100 4 V196 M4 100 H196" pathLength="1" data-draw className="blueprint__axis" />
          {[
            [100, 22],
            [178, 100],
            [100, 178],
            [22, 100],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} className="blueprint__node">
              <rect x={x - 3} y={y - 3} width="6" height="6" />
            </g>
          ))}
          <path d="M70 22 H130 M178 70 V130 M70 178 H130 M22 70 V130" className="blueprint__handles" />
        </g>
      </svg>
    </StorySection>
  );
}
