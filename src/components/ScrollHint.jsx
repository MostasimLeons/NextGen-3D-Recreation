import './ScrollHint.css';

export default function ScrollHint({ label }) {
  return (
    <a className="scroll-hint" href="#features">
      <span className="scroll-hint__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeOpacity="0.35" />
          <path d="M8.5 10.5 L12 14 L15.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </span>
      {label}
    </a>
  );
}
