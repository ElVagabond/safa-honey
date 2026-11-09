import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {RefObject} from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* GSAP owns scroll-linked motion; Framer Motion owns state and entrance animation.
   Each element is driven by only one of them (or GSAP drives a CSS variable / an outer wrapper). */
export function useParallax(scope: RefObject<HTMLElement>, deps: unknown[]) {
  useGSAP(() => {
    const $$ = (s: string) => gsap.utils.toArray<HTMLElement>(s);
    const scrub = (trigger: gsap.DOMTarget, extra: ScrollTrigger.Vars = {}): ScrollTrigger.Vars =>
      ({trigger, start: 'top bottom', end: 'bottom top', scrub: true, ...extra});

    gsap.matchMedia().add({motion: '(prefers-reduced-motion: no-preference)', wide: '(min-aspect-ratio: 1/1)'}, (ctx) => {
      const {motion, wide} = ctx.conditions as {motion: boolean; wide: boolean};
      if (!motion) return;

      /* Hero: copy rises fast, jars sink slowly, badge spins — three depths */
      const hero: ScrollTrigger.Vars = {trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true};
      gsap.to('#hero > .wrap', {yPercent: -35, opacity: 0.15, ease: 'none', scrollTrigger: hero});
      gsap.to('#hero .scene', {y: () => innerHeight * 0.22, ease: 'none', scrollTrigger: hero});
      gsap.to('#hero .badge', {y: -120, rotate: 240, ease: 'none', scrollTrigger: hero});
      gsap.to('#gl', {y: () => innerHeight * 0.35, ease: 'none', scrollTrigger: hero});
      gsap.to('#hero .hero-foot', {opacity: 0, ease: 'none', scrollTrigger: {...hero, end: '25% top'}});

      /* Marquee leans into scroll velocity */
      const lean = gsap.quickTo('.marquee', 'skewY', {duration: 0.5, ease: 'power3'});
      ScrollTrigger.create({onUpdate: (self) => lean(gsap.utils.clamp(-4, 4, self.getVelocity() / -350))});

      /* Section headings drift against the page */
      $$('.head-row').forEach((r) => gsap.fromTo(r, {y: 60}, {y: -40, ease: 'none', scrollTrigger: scrub(r)}));

      /* Product jars float inside their cards at alternating depths (via --py) */
      $$('#grid .card').forEach((c, i) => {
        const d = [50, 90, 30][i % 3];
        gsap.fromTo(c, {'--py': d + 'px'}, {'--py': -d + 'px', ease: 'none', scrollTrigger: scrub(c)});
      });

      /* Production: comb turns, steps stagger by depth */
      gsap.to('#production .comb', {rotate: 60, y: 200, ease: 'none', scrollTrigger: scrub('#production')});
      $$('#production .step').forEach((s, i) =>
        gsap.fromTo(s, {y: 40 + i * 30}, {y: -20 - i * 10, ease: 'none', scrollTrigger: scrub('#production .steps')}));

      /* Brand film (landscape): pinned while the frame opens to full bleed */
      if (wide)
        gsap.timeline({scrollTrigger: {trigger: '#film', start: 'top top', end: '+=120%', pin: '.film-pin', scrub: 0.6, anticipatePin: 1, refreshPriority: 1}})
          .to('.film-frame', {clipPath: 'inset(0% 0% round 0px)', ease: 'power2.inOut', duration: 1})
          .to('.film-label', {opacity: 0, y: -20, duration: 0.4}, 0)
          .fromTo('.film-frame video', {scale: 1.08}, {scale: 1, ease: 'none', duration: 1.4}, 0)
          .to({}, {duration: 0.4});

      /* Story photo: zoomed-in window that pans as you pass */
      gsap.fromTo('#story .visual img', {scale: 1.3, yPercent: -6}, {scale: 1.15, yPercent: 6, ease: 'none', scrollTrigger: scrub('#story .visual')});
      gsap.fromTo('#story .stats-wrap', {y: 80}, {y: -30, ease: 'none', scrollTrigger: scrub('#story')});

      /* Journal photos slide inside their frames */
      $$('.fpost .ph img').forEach((img) =>
        gsap.fromTo(img, {'--py': '-18%'}, {'--py': '0%', ease: 'none', scrollTrigger: scrub(img.parentElement!)}));

      /* Bee crosses the newsletter band */
      gsap.fromTo('.news .bee', {'--bx': '120px', '--by': '60px'}, {'--bx': '-260px', '--by': '-40px', ease: 'none', scrollTrigger: scrub('.news')});

      /* Footer wordmark slides in */
      gsap.fromTo('.foot-big', {xPercent: -12}, {xPercent: 0, ease: 'none', scrollTrigger: {trigger: 'footer', start: 'top bottom', end: 'top 30%', scrub: true}});
    });

    /* Only decode the film while it's on screen; never autoplay for reduced motion */
    const film = document.querySelector<HTMLVideoElement>('#film video');
    if (film && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      ScrollTrigger.create({trigger: '#film', start: 'top bottom', end: 'bottom top',
        onToggle: (s) => (s.isActive ? film.play().catch(() => {}) : film.pause())});

    const refresh = () => ScrollTrigger.refresh();
    addEventListener('load', refresh);
    return () => removeEventListener('load', refresh);
  }, {scope, dependencies: deps, revertOnUpdate: true});
}

export {ScrollTrigger};
