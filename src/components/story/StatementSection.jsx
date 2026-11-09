import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.statement;

/** "Isn't just a mug." — the mug lifts off the desk into a floating 3D turn. */
export default function StatementSection() {
  return (
    <StorySection id="statement" label="Concept">
      <h2 className="statement__title" data-reveal>
        {copy.title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <p className="statement__body" data-reveal>
        {copy.body}
      </p>
    </StorySection>
  );
}
