import { useSyncExternalStore } from 'react';
import { findRoute, normalizePath } from '../pages/routeTable.js';

/**
 * Tiny History-API router (no dependency) built around the page transition.
 *
 *   useRoute()                 current route entry (routeTable.js)
 *   navigate(href, { origin }) cover → swap page → wait until it is ready →
 *                              reveal; `origin` = click point for the portal
 *   signalPageReady()          called by a page once its scroll story is set
 *   setTransitionHooks({ cover, reveal })   registered by <PortalOverlay>
 *   installLinkInterception()  turns every internal <a href> into navigate()
 *
 * The two WebGL canvases live above the router and are never torn down:
 * only the page content swaps, while the shared scene dives through the
 * portal and comes out at the next page's preset.
 */

let path = normalizePath(window.location.pathname);
const subscribers = new Set();
const emit = () => subscribers.forEach((fn) => fn());

export const getPath = () => path;

function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function useRoute() {
  const p = useSyncExternalStore(subscribe, getPath);
  return findRoute(p);
}

/* Transition hooks ---------------------------------------------------------- */
let hooks = { cover: async () => {}, reveal: async () => {} };
export function setTransitionHooks(next) {
  hooks = { ...hooks, ...next };
}

let readyResolve = null;
/** A page calls this once its DOM + scroll timeline exist. */
export function signalPageReady() {
  readyResolve?.();
  readyResolve = null;
}
function waitForPage(timeoutMs = 2500) {
  return new Promise((resolve) => {
    readyResolve = resolve;
    setTimeout(resolve, timeoutMs); // never hang on a slow chunk
  });
}

function scrollToHash(hash, smooth) {
  if (!hash || hash === '#') {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
    return;
  }
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
}

/* Navigation ---------------------------------------------------------------- */
let busy = false;
let queued = null;

export async function navigate(href, { push = true, origin = null } = {}) {
  const url = new URL(href, window.location.href);
  const next = normalizePath(url.pathname);
  const { hash } = url;

  if (next === path) {
    // Same page: just move to the anchor.
    if (push && window.location.hash !== hash) window.history.pushState(null, '', next + hash);
    scrollToHash(hash, true);
    return;
  }
  if (busy) {
    queued = { href, push, origin }; // the latest request wins
    return;
  }

  busy = true;
  try {
    await hooks.cover({ origin, to: findRoute(next) });
    if (push) window.history.pushState(null, '', next + hash);
    window.scrollTo(0, 0);
    const ready = waitForPage();
    path = next;
    emit();
    await ready;
    if (hash) scrollToHash(hash, false);
    await hooks.reveal();
  } finally {
    busy = false;
  }
  if (queued) {
    const q = queued;
    queued = null;
    navigate(q.href, q);
  }
}

/* Links ----------------------------------------------------------------------- */
let installed = false;

export function installLinkInterception() {
  if (installed) return;
  installed = true;
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

  window.addEventListener('popstate', () => navigate(window.location.href, { push: false }));

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (/^(mailto|tel|sms):/i.test(raw)) return;
    const origin = { x: e.clientX, y: e.clientY };

    if (raw.startsWith('#')) {
      // In-page anchors work natively on their own page; elsewhere they
      // mean "that section of the home page".
      if (path === '/') return;
      e.preventDefault();
      navigate(`/${raw}`, { origin });
      return;
    }
    const url = new URL(a.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.hash, { origin });
  });
}
