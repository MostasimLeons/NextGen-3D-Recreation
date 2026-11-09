import StorySection from './StorySection.jsx';
import { content } from '../../content.js';

const copy = content.story.projects;

/**
 * "Our projects" (≈ oryzo "choose your own"): scrolling steps through four
 * categories; the 3D stage swaps gamepad → mug → headset → mug.
 * Categories only — case studies are marked as coming soon.
 */
export default function ProjectsSection() {
  return (
    <StorySection id="projects" anchor="projects" label="Our projects">
      <p className="story-eyebrow projects__eyebrow">
        {copy.eyebrow}
        <span className="projects__note">{copy.note}</span>
      </p>
      <ol className="projects__list">
        {copy.items.map((item, i) => (
          <li key={item.name} className="projects__item" data-variant={i}>
            <span className="projects__index" aria-hidden="true">
              0{i + 1}
            </span>
            <span className="projects__name">{item.name}</span>
          </li>
        ))}
      </ol>
      {copy.items.map((item, i) => (
        <p key={item.name} className="projects__body" data-step={i}>
          <span data-reveal>{item.body}</span>
        </p>
      ))}
    </StorySection>
  );
}
