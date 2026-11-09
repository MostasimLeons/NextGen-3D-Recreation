import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.crafted;

/** Big centred title over a top-down view of the mug (≈ "Powered by AI*"). */
export default function CraftedSection() {
  return (
    <StorySection id="crafted" label="Craft">
      <div className="crafted__head">
        <h2 className="crafted__title" data-reveal>
          {copy.title}
          <sup>{copy.mark}</sup>
        </h2>
        <p className="crafted__label" data-reveal>
          {copy.label}
        </p>
      </div>
      <p className="crafted__aside" data-reveal>
        {copy.aside.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <p className="crafted__footnote" data-reveal>
        {copy.footnote}
      </p>
    </StorySection>
  );
}
