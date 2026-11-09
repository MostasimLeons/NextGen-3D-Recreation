import './InfoCard.css';

/** Small translucent information card, bottom-left of the hero. */
export default function InfoCard({ title, body }) {
  return (
    <aside className="info-card">
      <span className="info-card__glow" aria-hidden="true" />
      <p className="info-card__title">
        {title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <div className="info-card__rule" aria-hidden="true" />
      <p className="info-card__body">{body}</p>
    </aside>
  );
}
