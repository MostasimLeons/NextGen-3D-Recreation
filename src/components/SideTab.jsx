import './SideTab.css';

/** Cream vertical tab pinned to the right edge (desktop only). */
export default function SideTab({ label }) {
  return (
    <a className="side-tab" href="#product">
      <span className="side-tab__dot" aria-hidden="true" />
      <span className="side-tab__label">{label}</span>
    </a>
  );
}
