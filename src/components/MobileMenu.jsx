import { useEffect, useRef } from 'react';
import { content } from '../content.js';
import './MobileMenu.css';

/**
 * Slide-in navigation drawer for small screens.
 * Escape / backdrop / Close dismiss it; focus moves into the drawer on open
 * and back to the opener on close.
 */
export default function MobileMenu({ open, onClose, returnFocusRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = returnFocusRef?.current;
    panelRef.current?.querySelector('a, button')?.focus();

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div className={`mobile-menu${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button
        type="button"
        className="mobile-menu__backdrop"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="mobile-menu"
        className="mobile-menu__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <button type="button" className="mobile-menu__close" onClick={onClose} tabIndex={open ? 0 : -1}>
          <span className="mobile-menu__close-dot" aria-hidden="true" />
          Close
        </button>

        <nav className="mobile-menu__nav" aria-label="Primary">
          {content.nav.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`mobile-menu__link${item.active ? ' is-active' : ''}`}
              style={{ '--i': i }}
              tabIndex={open ? 0 : -1}
              onClick={onClose}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mobile-menu__foot">
          <span>{content.menuFoot.label}</span>
          <a href={content.menuFoot.href} tabIndex={open ? 0 : -1} onClick={onClose}>
            {content.menuFoot.cta}
          </a>
        </div>
      </div>
    </div>
  );
}
