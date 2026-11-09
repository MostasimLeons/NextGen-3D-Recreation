import { content } from '../content.js';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <a className="header__dot" href="#intro" aria-label={`${content.brand} home`} />
      <nav className="header__nav" aria-label="Primary">
        {content.nav.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`header__link${item.active ? ' is-active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button type="button" className="header__menu" aria-label="Open menu">
        <span className="header__menu-dot" aria-hidden="true" />
        Menu
      </button>
    </header>
  );
}
