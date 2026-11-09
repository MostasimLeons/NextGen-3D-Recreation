import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.process;

/** Pinned horizontal card track (≈ oryzo social content). Track x is scroll-scrubbed. */
export default function ProcessSection() {
  return (
    <StorySection id="process" label="How we work">
      <div className="process__head">
        <p className="story-eyebrow" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="process__title" data-reveal>
          {copy.title}
        </h2>
      </div>
      <ol className="process__track" data-track>
        {copy.cards.map((c, i) => (
          <li key={c.title} className="process-card">
            <span className="process-card__kicker">
              <span className="process-card__index">0{i + 1}</span>
              {c.kicker}
            </span>
            <span className="process-card__title">{c.title}</span>
            <span className="process-card__body">{c.body}</span>
            <span className="process-card__meta">{c.meta}</span>
          </li>
        ))}
      </ol>
    </StorySection>
  );
}
