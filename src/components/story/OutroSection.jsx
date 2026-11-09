import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.outro;

/** Closing frame (≈ oryzo footer): giant faded wordmark + sign-off. */
export default function OutroSection() {
  return (
    <StorySection id="outro" anchor="contact" label="Contact">
      <p className="outro__wordmark" aria-hidden="true" data-reveal>
        {content.brand}
      </p>
      <div className="outro__foot">
        <p className="outro__line" data-reveal>
          {copy.line.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </p>
        <p className="outro__body" data-reveal>
          {copy.body}
        </p>
        <div className="outro__ctas" data-reveal>
          <a className="outro__cta" href={copy.cta.href}>
            <span className="outro__cta-dot" aria-hidden="true" />
            {copy.cta.label}
          </a>
          <a className="outro__cta outro__cta--ghost" href={copy.back.href}>
            {copy.back.label}
          </a>
        </div>
      </div>
    </StorySection>
  );
}
