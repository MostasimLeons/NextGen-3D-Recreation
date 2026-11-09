import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORY } from './storyConfig.js';
import { pick, resolveSteps, applyPreset } from './sceneDirector.js';
import { techProgress, TECH_CHAPTER_EVENT } from './techChapter.js';
import { content } from '../content.js';

gsap.registerPlugin(ScrollTrigger);
// Don't re-measure when only the mobile URL bar shows/hides.
ScrollTrigger.config({ ignoreMobileResize: true });
if (import.meta.env.DEV) window.__ScrollTrigger = ScrollTrigger; // debugging aid (dev only)

/**
 * Wires the whole scroll story:
 *  - 3D: fromTo tweens on rig.state, one non-overlapping scroll window per
 *    step (scrub: true). The scene smooths the values itself, so tweens
 *    never fight and forward/backward scrolling is deterministic.
 *  - Background (GLSL backdrop) + atmosphere are plain state fields too.
 *  - Typography reveals, counters, header logo.
 *  - Reduced motion: no scrubbed motion; scene/text snap per step.
 *
 * `story` is the page's config (home: storyConfig.js STORY). Its first step
 * is the page preset (sceneDirector.js), applied as soon as the page opens.
 * Home-only effects (tech chapters, giant word, counter…) simply find no
 * element on other pages and are skipped.
 */
export function useScrollStory(rig, rootRef, story = STORY) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!rig || !root) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rig.smoothing = reduced ? 0 : 1;
    const steps = resolveSteps(story);
    const first = story[0].id;
    applyPreset(rig, story);
    const vh = () => window.innerHeight;
    const sectionEl = (id) => root.querySelector(`[data-story="${id}"]`);
    const pos = (offsetVh) => () => `top+=${Math.round(offsetVh * vh())} top`;

    const ctx = gsap.context(() => {
      /* 3D keyframes ---------------------------------------------------- */
      if (reduced) {
        // No scrubbed motion: cut to each step's state at its midpoint.
        for (const s of steps) {
          if (s.base || !sectionEl(s.section)) continue;
          ScrollTrigger.create({
            trigger: sectionEl(s.section),
            start: pos((s.from + s.to) / 2),
            onEnter: () => Object.assign(rig.state, pick(s.next)),
            onLeaveBack: () => Object.assign(rig.state, pick(s.prev)),
          });
        }
      }
    }, root);

    /* One master timeline drives all 3D state (incl. backdrop). Positions
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
        if (s.base) continue;
        const el = sectionEl(s.section);
        if (!el) continue;
        const start = Math.max(0, el.offsetTop + s.from * h);
        const end = Math.min(total, el.offsetTop + s.to * h);
        const dur = Math.max(1, end - start);
        master.fromTo(rig.state, pick(s.prev), { ...pick(s.next), duration: dur, immediateRender: false }, start);
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
      /* HUD: section index/label + overall progress ----------------------- */
      const hudIndex = document.querySelector('[data-hud-index]');
      const hudLabel = document.querySelector('[data-hud-label]');
      const hudBar = document.querySelector('[data-hud-bar]');
      story.forEach((section, i) => {
        const el = sectionEl(section.id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (!self.isActive) return;
            if (hudIndex) hudIndex.textContent = `${String(i + 1).padStart(2, '0')} / ${String(story.length).padStart(2, '0')}`;
            if (hudLabel) hudLabel.textContent = section.label ?? section.id;
          },
        });
      });
      if (hudBar) {
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => hudBar.style.setProperty('--p', self.progress.toFixed(4)),
        });
      }

      /* Header: small wordmark appears once the hero is left behind ------ */
      ScrollTrigger.create({
        trigger: sectionEl(first),
        start: 'bottom 70%',
        toggleClass: { targets: document.documentElement, className: 'is-past-hero' },
      });

      /* Whole-page progress → world travel (continuous, not keyframed) --- */
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => (rig.scrollProgress = self.progress),
        onRefresh: (self) => (rig.scrollProgress = self.progress),
      });

      /* "Runs on the edge of play": six technology chapters -------------- */
      // One trigger over the pinned range: writes in-chapter progress (camera
      // dolly + word fill) every update, and fires TECH_CHAPTER_EVENT only
      // when the chapter index changes (React re-renders 6× per pass).
      const processEl = sectionEl('process');
      const techRoot = processEl?.querySelector('.tech');
      if (processEl && techRoot) {
        const len = story.find((s) => s.id === 'process').length;
        const n = content.story.process.chapters.length;
        const apply = (progress) => {
          const p = Math.min(progress * n, n - 0.0001);
          const i = Math.floor(p);
          techProgress.current = p - i;
          techRoot.style.setProperty('--fill', reduced ? '1' : (p - i).toFixed(3));
          if (i !== techProgress.index) {
            techProgress.index = i;
            window.dispatchEvent(new CustomEvent(TECH_CHAPTER_EVENT, { detail: { index: i } }));
          }
        };
        ScrollTrigger.create({
          trigger: processEl,
          start: 'top top',
          end: () => `+=${Math.round((len - 1) * vh())}`,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        });
      }

      if (reduced) return; // text stays static & visible

      /* Headline parallax: every section title drifts through its section
         (yPercent composes with the reveal tweens' y — no conflict). */
      root.querySelectorAll('.story-section h2:not([data-giant])').forEach((h2) => {
        const section = h2.closest('.story-section');
        gsap.fromTo(
          h2,
          { yPercent: 18, letterSpacing: '0.01em' },
          {
            yPercent: -18,
            letterSpacing: '-0.035em',
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });

      /* Typography ------------------------------------------------------- */
      for (const section of story) {
        if (section.id === first) continue; // the opening section has its own entrance
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
          const isFinalSection = section === story[story.length - 1];
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
      const f = story.find((s) => s.id === 'features');
      if (blueprint.length && f) {
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
  }, [rig, rootRef, story]);
}
