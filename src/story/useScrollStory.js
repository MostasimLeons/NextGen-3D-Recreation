import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY } from './storyConfig.js';
import { HERO_STATE, isUserKey } from '../three/sceneConfig.js';

gsap.registerPlugin(ScrollTrigger);
// Don't re-measure when only the mobile URL bar shows/hides.
ScrollTrigger.config({ ignoreMobileResize: true });
if (import.meta.env.DEV) window.__ScrollTrigger = ScrollTrigger; // debugging aid (dev only)

const STATE_KEYS = Object.keys(HERO_STATE).filter((k) => !isUserKey(k));
const pick = (obj) => Object.fromEntries(STATE_KEYS.map((k) => [k, obj[k]]));

/**
 * Resolve every step into a full state (each step inherits the previous one)
 * plus its scroll window inside its section, in viewport-height units.
 */
function resolveSteps() {
  const out = [];
  let prev = { ...HERO_STATE, bg: STORY[0].steps[0].bg };
  for (const section of STORY) {
    const n = section.steps.length;
    section.steps.forEach((step, j) => {
      const next = { ...prev, ...step, bg: step.bg ?? prev.bg };
      let from;
      let to;
      if (j === 0) {
        // Transition while the section scrolls in (top at 75% → 15% above top).
        from = -0.75;
        to = 0.15;
      } else {
        // Spread steps over the pinned range only (the stage unpins at length − 1).
        const pinned = section.length - 1;
        const c = (j * pinned) / n;
        const half = Math.min(0.45, pinned / n / 2 - 0.03, section.length - 0.75 - c);
        from = c - half;
        to = c + half;
      }
      out.push({ section: section.id, index: j, from, to, prev, next });
      prev = next;
    });
  }
  return out;
}

/**
 * Wires the whole scroll story:
 *  - 3D: fromTo tweens on rig.state, one non-overlapping scroll window per
 *    step (scrub: true). The scene smooths the values itself, so tweens
 *    never fight and forward/backward scrolling is deterministic.
 *  - Background glow, typography reveals, counters, variant list, header logo.
 *  - Reduced motion: no scrubbed motion; scene/text snap per step.
 */
export function useScrollStory(rig, rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!rig || !root) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rig.smoothing = reduced ? 0 : 1;
    const steps = resolveSteps();
    const glow = document.querySelector('.scene-bg__glow');
    const vh = () => window.innerHeight;
    const sectionEl = (id) => root.querySelector(`[data-story="${id}"]`);
    const pos = (offsetVh) => () => `top+=${Math.round(offsetVh * vh())} top`;

    /* Background glow (compositor-only: opacity + transform) ------------ */
    const applyBg = (bg) => ({ opacity: bg.glow, x: `${bg.x - 50}vw`, y: `${bg.y - 50}vh` });
    if (glow) gsap.set(glow, { xPercent: -50, yPercent: -50, ...applyBg(STORY[0].steps[0].bg) });

    const ctx = gsap.context(() => {
      /* 3D keyframes ---------------------------------------------------- */
      if (reduced) {
        // No scrubbed motion: cut to each step's state at its midpoint.
        for (const s of steps) {
          if (s.section === 'intro' || !sectionEl(s.section)) continue;
          ScrollTrigger.create({
            trigger: sectionEl(s.section),
            start: pos((s.from + s.to) / 2),
            onEnter: () => {
              Object.assign(rig.state, pick(s.next));
              if (glow) gsap.set(glow, applyBg(s.next.bg));
            },
            onLeaveBack: () => {
              Object.assign(rig.state, pick(s.prev));
              if (glow) gsap.set(glow, applyBg(s.prev.bg));
            },
          });
        }
      }
    }, root);

    /* One master timeline drives all 3D state + background glow. Positions
       are scroll pixels measured from the DOM, so it is rebuilt on resize.
       Sequential, non-overlapping tweens inside a single timeline mean any
       scroll position (forward, backward, jump) renders one exact state. */
    let master = null;
    function buildMaster() {
      master?.scrollTrigger?.kill();
      master?.kill();
      if (reduced) return;
      const h = vh();
      const total = Math.max(1, root.scrollHeight - h);
      master = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${total}`, scrub: true },
      });
      for (const s of steps) {
        if (s.section === 'intro') continue;
        const el = sectionEl(s.section);
        if (!el) continue;
        const start = Math.max(0, el.offsetTop + s.from * h);
        const end = Math.min(total, el.offsetTop + s.to * h);
        const dur = Math.max(1, end - start);
        master.fromTo(rig.state, pick(s.prev), { ...pick(s.next), duration: dur, immediateRender: false }, start);
        if (glow) {
          master.fromTo(
            glow,
            applyBg(s.prev.bg),
            { ...applyBg(s.next.bg), duration: dur, ease: 'none', immediateRender: false },
            start,
          );
        }
      }
      master.set({}, {}, total); // pad so timeline time === scroll px
    }
    buildMaster();

    // Rebuild only on real layout changes: width, or a big height change.
    // (Mobile URL-bar show/hide fires small height-only resizes constantly.)
    let resizeTimer = 0;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const hgt = window.innerHeight;
        if (w === lastW && Math.abs(hgt - lastH) < 150) return;
        lastW = w;
        lastH = hgt;
        buildMaster();
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener('resize', onResize);

    ctx.add(() => {
      /* Header: small wordmark appears once the hero is left behind ------ */
      ScrollTrigger.create({
        trigger: sectionEl('intro'),
        start: 'bottom 70%',
        toggleClass: { targets: document.documentElement, className: 'is-past-hero' },
      });

      /* Projects list: highlight the active category ---------------------- */
      const variantItems = root.querySelectorAll('[data-variant]');
      steps
        .filter((s) => s.section === 'projects')
        .forEach((s, j, arr) => {
          const nextStep = arr[j + 1];
          if (!variantItems[j]) return;
          // toggleClass stays correct after jumps (anchor links, fast scroll).
          ScrollTrigger.create({
            trigger: sectionEl('projects'),
            start: j === 0 ? 'top bottom' : pos((s.from + s.to) / 2),
            end: nextStep ? pos((nextStep.from + nextStep.to) / 2) : 'bottom top',
            toggleClass: { targets: variantItems[j], className: 'is-active' },
          });
        });

      if (reduced) return; // text stays static & visible

      /* "How we work": horizontal card track scrubbed across the pin ------ */
      const track = root.querySelector('[data-track]');
      const processEl = sectionEl('process');
      if (track && processEl) {
        const len = STORY.find((s) => s.id === 'process').length;
        gsap.fromTo(
          track,
          { x: () => window.innerWidth * 0.55 },
          {
            x: () => -(track.scrollWidth - window.innerWidth * 0.55),
            ease: 'none',
            scrollTrigger: {
              trigger: processEl,
              start: pos(-0.3),
              end: pos(len - 1),
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      /* Typography ------------------------------------------------------- */
      for (const section of STORY) {
        if (section.id === 'intro') continue;
        const el = sectionEl(section.id);
        if (!el) continue;
        const n = section.steps.length;

        for (let j = 0; j < n; j++) {
          const group = el.querySelectorAll(n > 1 ? `[data-step="${j}"] [data-reveal]` : '[data-reveal]');
          if (!group.length) continue;
          const stepLen = (section.length - 1) / n; // pinned range per step
          const inStart = j === 0 ? -0.55 : j * stepLen - 0.35;
          const inEnd = j === 0 ? 0.1 : j * stepLen + 0.05;
          const isLast = j === n - 1;
          const isFinalSection = section === STORY[STORY.length - 1];
          // Last step leaves as the next section starts its 3D transition.
          const outStart = isLast ? section.length - 0.95 : (j + 1) * stepLen - 0.45;
          const outEnd = isLast ? section.length - 0.6 : (j + 1) * stepLen - 0.1;

          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: pos(inStart), end: pos(outEnd), scrub: true },
          });
          const span = outEnd - inStart;
          tl.fromTo(
            group,
            { autoAlpha: 0, y: 48 },
            { autoAlpha: 1, y: 0, stagger: 0.04 * span, duration: (inEnd - inStart) / span, ease: 'power3.out' },
            0,
          );
          if (!isFinalSection) {
            tl.to(
              group,
              { autoAlpha: 0, y: -36, stagger: 0.02 * span, duration: (outEnd - outStart) / span, ease: 'power2.in' },
              (outStart - inStart) / span,
            );
          }
        }
      }

      /* Giant word: blur/scale in like the reference ---------------------- */
      const giant = root.querySelector('[data-giant]');
      if (giant) {
        gsap.fromTo(
          giant,
          { scale: 1.18, filter: 'blur(14px)', autoAlpha: 0 },
          {
            scale: 1,
            filter: 'blur(0px)',
            autoAlpha: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: sectionEl('everyday'), start: pos(-0.5), end: pos(0.35), scrub: true },
          },
        );
      }

      /* Heat counter ----------------------------------------------------- */
      const counter = root.querySelector('[data-counter]');
      if (counter) {
        const c = { v: Number(counter.dataset.from) };
        const to = Number(counter.dataset.to);
        gsap.to(c, {
          v: to,
          ease: 'power1.out',
          scrollTrigger: { trigger: sectionEl('features'), start: pos(-0.4), end: pos(0.8), scrub: true },
          onUpdate: () => {
            counter.textContent = Math.round(c.v);
          },
        });
      }

      /* Blueprint circle draws on around the handle ------------------------ */
      const blueprint = root.querySelectorAll('[data-draw]');
      if (blueprint.length) {
        const f = STORY.find((s) => s.id === 'features');
        const c = (2 * (f.length - 1)) / 3;
        gsap.fromTo(
          blueprint,
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: sectionEl('features'), start: pos(c - 0.3), end: pos(c + 0.5), scrub: true },
          },
        );
      }
    }, root);

    // Fonts/layout can shift section offsets after first paint.
    const refresh = () => {
      buildMaster();
      ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      master?.scrollTrigger?.kill();
      master?.kill();
      ctx.revert();
      document.documentElement.classList.remove('is-past-hero');
    };
  }, [rig, rootRef]);
}
