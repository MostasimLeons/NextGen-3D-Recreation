import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import * as THREE from 'three';
import { SCENES, TOTAL, TECH, TECH_SLOT } from './sequence.js';
import { createSoundtrack } from './soundtrack.js';
import { closePresentation } from './store.js';
import { navigate } from '../router/navigation.js';
import './presentation.css';

const CinemaCanvas = lazy(() => import('./cinema/CinemaCanvas.jsx'));

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Full-screen, auto-playing cinematic presentation (opened from the hero's
 * NEXT GEN card). One paused GSAP timeline is the master clock: it advances
 * `seq.t` (read every frame by the 3D Director) and sequences the captions,
 * so play / pause / replay / seek drive picture and text together. No
 * scrolling: the page underneath is locked and its own 3D scene paused.
 */
export default function Presentation({ rig }) {
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const lowPower = useMemo(() => Math.min(window.innerWidth, window.innerHeight) < 700, []);
  // Shared mutable clock for the 3D side (never triggers React renders).
  const seq = useMemo(
    () => ({ t: 0, active: 'logo', u: 0, slot: -1, slotU: 0, cut: 0, reduced, look: { glow: 0.8, tint: 0.3, trails: 0.8, glowPos: new THREE.Vector2(0.5, 0.55) } }),
    [reduced],
  );
  const root = useRef(null);
  const closeBtn = useRef(null);
  const tl = useRef(null);
  const sound = useRef(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const [visible, setVisible] = useState(false);

  /* Open: lock the page, pause its scene, wait for the brand font ---------- */
  useLayoutEffect(() => {
    const html = document.documentElement;
    const prev = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    html.classList.add('is-presenting');
    rig?.setPaused?.(true);
    sound.current = createSoundtrack();
    Promise.race([document.fonts?.load('700 120px Outfit') ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]).then(() =>
      setFontsReady(true),
    );
    requestAnimationFrame(() => setVisible(true));
    return () => {
      html.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
      html.classList.remove('is-presenting');
      rig?.setPaused?.(false);
      sound.current?.dispose();
    };
  }, [rig]);

  /* Master timeline -------------------------------------------------------- */
  useLayoutEffect(() => {
    if (!canvasReady) return undefined;
    const el = root.current;
    const q = (s) => el.querySelectorAll(s);
    const t = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const time = t.time();
        el.style.setProperty('--time', time.toFixed(2));
        SCENES.forEach((s, i) => {
          const p = Math.min(1, Math.max(0, (time - s.start) / s.duration));
          el.style.setProperty(`--p${i}`, p.toFixed(4));
        });
        const idx = SCENES.findIndex((s) => time < s.end);
        const i = idx === -1 ? SCENES.length - 1 : idx;
        if (i !== currentRef.current) {
          currentRef.current = i;
          sound.current?.whoosh(1);
          setCurrent(i);
        }
        el.querySelector('[data-clock]').textContent = `${fmt(time)} / ${fmt(TOTAL)}`;
      },
      onComplete: () => setEnded(true),
    });
    t.to(seq, { t: TOTAL, duration: TOTAL, ease: 'none' }, 0);

    // Captions: rise in after each cut, leave before the next one.
    SCENES.forEach((s, i) => {
      const group = q(`[data-scene="${i}"]`);
      const lines = q(`[data-scene="${i}"] [data-line]`);
      const fades = q(`[data-scene="${i}"] [data-fade]`);
      t.set(group, { autoAlpha: 1 }, s.start + 0.05);
      if (reduced) {
        t.fromTo([...lines, ...fades], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, s.start + 0.3);
      } else {
        t.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08 }, s.start + 0.3);
        t.fromTo(fades, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, s.start + 0.6);
      }
      if (i < SCENES.length - 1) t.to(group, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, s.end - 0.5);
    });
    // Scene 5: the giant technology name changes with each sub-shot.
    const tech = SCENES.find((s) => s.id === 'tech');
    q('[data-tech]').forEach((node, i) => {
      const at = tech.start + i * TECH_SLOT;
      t.fromTo(node, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: 'power3.out' }, at + 0.12);
      if (i < TECH.length - 1) t.to(node, { autoAlpha: 0, yPercent: -30, duration: 0.25, ease: 'power2.in' }, at + TECH_SLOT - 0.2);
    });

    tl.current = t;
    t.play(0);
    return () => {
      t.kill();
      tl.current = null;
    };
  }, [canvasReady, seq, reduced]);

  /* Controls ----------------------------------------------------------------- */
  const togglePause = useCallback(() => {
    const t = tl.current;
    if (!t) return;
    if (ended) return;
    if (t.paused()) {
      t.play();
      sound.current?.resume();
      setPaused(false);
    } else {
      t.pause();
      sound.current?.pause();
      setPaused(true);
    }
  }, [ended]);

  const replay = useCallback(() => {
    const t = tl.current;
    if (!t) return;
    setEnded(false);
    setPaused(false);
    sound.current?.resume();
    t.restart();
  }, []);

  const seek = useCallback((i) => {
    const t = tl.current;
    if (!t) return;
    setEnded(false);
    t.seek(SCENES[i].start + 0.001);
    if (t.paused()) {
      t.play();
      setPaused(false);
    }
  }, []);

  const toggleSound = useCallback(() => {
    const s = sound.current;
    if (!s) return;
    s.setMuted(!s.muted);
    setMuted(s.muted);
  }, []);

  const close = useCallback((then) => {
    setVisible(false);
    tl.current?.pause();
    setTimeout(() => {
      closePresentation();
      // after the page is unlocked again, so the anchor scroll can happen
      if (typeof then === 'string') setTimeout(() => navigate(then), 60);
    }, reduced ? 0 : 380);
  }, [reduced]);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'ArrowRight') seek(Math.min(SCENES.length - 1, current + 1));
      else if (e.key === 'ArrowLeft') seek(Math.max(0, current - 1));
      else if (e.key === 'm') toggleSound();
      else if (e.key === 'r') replay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, togglePause, seek, toggleSound, replay, current]);

  // keep Tab inside the dialog
  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    const f = root.current.querySelectorAll('button:not([disabled]), a[href]');
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const scene = SCENES[current];

  return createPortal(
    <div
      ref={root}
      className={`cine${visible ? ' is-visible' : ''}${paused ? ' is-paused' : ''}${ended ? ' is-ended' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="NEXT GEN presentation"
      onKeyDown={trapFocus}
    >
      {fontsReady && (
        <Suspense fallback={null}>
          <CinemaCanvas seq={seq} paused={paused} lowPower={lowPower} onReady={() => setCanvasReady(true)} />
        </Suspense>
      )}
      {!canvasReady && (
        <div className="cine__loading" aria-hidden="true">
          <span />
        </div>
      )}

      {/* Captions, one group per scene (sequenced by the timeline) */}
      <div className="cine__captions" aria-hidden="true">
        {SCENES.map((s, i) => (
          <div key={s.id} className={`cine__caption cine__caption--${s.id}`} data-scene={i}>
            <p className="cine__kicker" data-fade>
              {s.kicker}
            </p>
            {s.id !== 'logo' && s.id !== 'final' && (
              <h2 className="cine__title">
                {s.title.map((l) => (
                  <span key={l} className="cine__mask">
                    <span data-line>{l}</span>
                  </span>
                ))}
              </h2>
            )}
            <p className="cine__line" data-fade>
              {s.line}
            </p>
            {s.id === 'tech' && (
              <div className="cine__tech">
                {TECH.map((t) => (
                  <span key={t.id} data-tech>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Finale actions (real, focusable) */}
      <div className={`cine__cta${scene.id === 'final' ? ' is-on' : ''}`}>
        <button type="button" className="cine__btn cine__btn--primary" onClick={() => close('/#features')}>
          Explore the website
        </button>
        <button type="button" className="cine__btn" onClick={() => close('/#contact')}>
          Get in touch
        </button>
        <button type="button" className="cine__btn cine__btn--ghost" onClick={replay}>
          Replay
        </button>
      </div>

      {/* Screen-reader narration of the current scene */}
      <p className="cine__sr" aria-live="polite">
        {`Scene ${current + 1} of ${SCENES.length}: ${scene.label}. ${scene.title.join(' ')}. ${scene.line}`}
      </p>

      <div className="cine__top">
        <span className="cine__brand">
          NEXT GEN <em>Presentation</em>
        </span>
        <button ref={closeBtn} type="button" className="cine__icon" onClick={() => close()} aria-label="Close presentation">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="cine__bar">
        <ol className="cine__progress" aria-label="Scenes">
          {SCENES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={i === current ? 'is-current' : ''}
                onClick={() => seek(i)}
                aria-label={`Scene ${i + 1}: ${s.label}`}
                aria-current={i === current ? 'step' : undefined}
              >
                <span className="cine__seg">
                  <i style={{ transform: `scaleX(var(--p${i}, 0))` }} />
                </span>
                <span className="cine__seg-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="cine__controls">
          <span className="cine__clock" data-clock>
            0:00 / {fmt(TOTAL)}
          </span>
          <button type="button" className="cine__icon" onClick={togglePause} disabled={ended} aria-label={paused ? 'Resume' : 'Pause'}>
            {paused ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path className="fill" d="M8 5l11 7-11 7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5v14M15 5v14" />
              </svg>
            )}
          </button>
          <button type="button" className="cine__icon" onClick={replay} aria-label="Replay from the start">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5" />
            </svg>
          </button>
          <button type="button" className="cine__icon" onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>
            {muted ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4zM17 8a5 5 0 0 1 0 8M19.5 5.5a9 9 0 0 1 0 13" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
