import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.material;

/** Macro close-up of the glaze with a small spec card (≈ oryzo "grip"). */
export default function MaterialSection() {
  return (
    <StorySection id="material" label="Material">
      <div className="material__head">
        <p className="story-eyebrow story-eyebrow--accent" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="material__title" data-reveal>
          {copy.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p className="material__body" data-reveal>
          {copy.body}
        </p>
      </div>
      <div className="spec-card" data-reveal>
        <span className="spec-card__swatch" aria-hidden="true" />
        <span className="spec-card__label">{copy.spec.label}</span>
        <span className="spec-card__value">{copy.spec.value}</span>
      </div>
    </StorySection>
  );
}
