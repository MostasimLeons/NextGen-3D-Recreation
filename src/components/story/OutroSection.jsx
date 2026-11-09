import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.outro;

/** Closing frame: oversized faded wordmark + sign-off (≈ oryzo footer). */
export default function OutroSection() {
  return (
    <StorySection id="outro" anchor="contact" label="Outro">
      <p className="outro__wordmark" aria-hidden="true" data-reveal>
        {content.brand}
      </p>
      <div className="outro__foot">
        <p className="outro__line" data-reveal>
          {copy.line}
        </p>
        <p className="outro__body" data-reveal>
          {copy.body}
        </p>
        <a className="outro__cta" href={copy.cta.href} data-reveal>
          <span className="outro__cta-dot" aria-hidden="true" />
          {copy.cta.label}
        </a>
      </div>
    </StorySection>
  );
}
