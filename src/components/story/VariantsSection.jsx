import StorySection from './StorySection.jsx';
import { content } from '../../content.js';
import { GLAZES } from '../../three/sceneConfig.js';

const copy = content.story.variants;
const SWATCHES = ['#efe6d8', '#d8b48a', '#a9b894'];

/** "Choose your own" — scrolling steps through glazes; the mug re-tints. */
export default function VariantsSection() {
  return (
    <StorySection id="variants" anchor="product" label="Choose your glaze">
      <p className="story-eyebrow variants__eyebrow">{copy.eyebrow}</p>
      <ol className="variants__list">
        {copy.items.map((item, i) => (
          <li key={item.name} className="variants__item" data-variant={i}>
            <span className="variants__swatch" style={{ background: SWATCHES[i] ?? GLAZES[i] }} aria-hidden="true" />
            <span className="variants__name">
              NEXT GEN <em>{item.name}</em>
            </span>
          </li>
        ))}
      </ol>
      {copy.items.map((item, i) => (
        <p key={item.name} className="variants__body" data-step={i}>
          <span data-reveal>{item.body}</span>
        </p>
      ))}
    </StorySection>
  );
}
