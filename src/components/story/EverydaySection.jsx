import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.everyday;

/** Giant lowercase word across the screen with the mug spinning (≈ "it's wearable"). */
export default function EverydaySection() {
  return (
    <StorySection id="everyday" label="Everyday">
      <div className="everyday__frame" aria-hidden="true" data-reveal />
      <p className="everyday__label" data-reveal>
        {copy.label}
      </p>
      <h2 className="everyday__word" data-giant>
        {copy.word}
      </h2>
    </StorySection>
  );
}
