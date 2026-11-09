import './page.css';

/**
 * Opening header of a deep page: giant faded index, eyebrow, kinetic title
 * (lines rise in on open, after the portal reveal), lead and tool tags.
 */
export default function ChapterHeader({ index, eyebrow, title, lead, tags = [] }) {
  return (
    <header className="chapter-header">
      <span className="chapter-header__index" aria-hidden="true">
        {index}
      </span>
      <p className="story-eyebrow chapter-header__eyebrow">{eyebrow}</p>
      <h1 className="chapter-header__title">
        {title.map((line, i) => (
          <span key={line} className="chapter-header__line" style={{ '--i': i }}>
            <span>{line}</span>
          </span>
        ))}
      </h1>
      <p className="chapter-header__lead">{lead}</p>
      {tags.length > 0 && (
        <ul className="chapter-header__tags" aria-label="Tools and disciplines">
          {tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
