import { useCallback, useRef, useState } from 'react';
import { content } from '../content.js';
import MobileMenu from './MobileMenu.jsx';
import './Header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="header">
      <a className="header__dot" href="#intro" aria-label={`${content.brand} home`} />
      <a className="header__logo" href="#intro" tabIndex={-1} aria-hidden="true">
        {content.brand}
      </a>
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
      <button
        ref={menuButton}
        type="button"
        className="header__menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen(true)}
      >
        <span className="header__menu-dot" aria-hidden="true" />
        Menu
      </button>
      <MobileMenu open={menuOpen} onClose={closeMenu} returnFocusRef={menuButton} />
    </header>
  );
}
