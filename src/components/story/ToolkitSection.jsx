import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.toolkit;

/** Big pinned title + tool grid (≈ oryzo sustainability). Lists only real capabilities. */
export default function ToolkitSection() {
  return (
    <StorySection id="toolkit" label="Toolkit">
      <div className="toolkit__head">
        <p className="story-eyebrow" data-reveal>
          {copy.eyebrow}
        </p>
        <h2 className="toolkit__title" data-reveal>
          {copy.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
      </div>
      <ul className="toolkit__grid">
        {copy.groups.map((g, i) => (
          <li key={g.name} className="toolkit__card" data-reveal>
            <span className="toolkit__index">0{i + 1}</span>
            <span className="toolkit__name">{g.name}</span>
            <span className="toolkit__items">
              {g.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </StorySection>
  );
}
