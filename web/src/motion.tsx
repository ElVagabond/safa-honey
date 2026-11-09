import {animate, motion, useInView, type Variants} from 'framer-motion';
import {createElement, Fragment, useEffect, useRef, useState, type ReactNode} from 'react';

export const ease = [0.2, 0.7, 0.2, 1] as const;
export const easeInOut = [0.77, 0, 0.18, 1] as const;

/* Fade-up when scrolled into view (replaces the old .rv IntersectionObserver) */
export function Reveal({children, className, delay = 0, as = 'div', ...rest}: {
  children: ReactNode; className?: string; delay?: number; as?: 'div' | 'p' | 'a' | 'article';
} & Record<string, unknown>) {
  const C = motion[as] as typeof motion.div;
  return (
    <C className={className} initial={{opacity: 0, y: 40}} whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.15}} transition={{duration: 1, ease, delay}} {...rest}>
      {children}
    </C>
  );
}

/* Headline whose words rise out of a mask one after another.
   The outer element stays a plain tag so GSAP can move it without fighting Framer. */
const wordVariants: Variants = {
  hidden: {y: '105%'},
  shown: (i: number) => ({y: '0%', transition: {duration: 1, ease, delay: i * 0.06}}),
};

type Piece = {text: string; em?: boolean};
export function SplitWords({as = 'h2', className, pieces, id}: {as?: string; className?: string; pieces: Piece[]; id?: string}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, {once: true, amount: 0.15});
  let i = 0;
  const words = (p: Piece) =>
    p.text.split(/(\s+)/).filter(Boolean).map((t, k) =>
      /^\s+$/.test(t) ? <Fragment key={k}>{t}</Fragment> : (
        <span className="w" key={k}>
          <motion.span custom={i++} variants={wordVariants}>{t}</motion.span>
        </span>
      ));
  return createElement(as, {ref, className: `split-words ${className ?? ''}`, id},
    <motion.span style={{display: 'contents'}} initial="hidden" animate={inView ? 'shown' : 'hidden'}>
      {pieces.map((p, k) => (p.em ? <em key={k}>{words(p)}</em> : <Fragment key={k}>{words(p)}</Fragment>))}
    </motion.span>);
}

/* Number that counts up the first time it is seen */
export function Counter({to}: {to: number}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, {once: true});
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, {duration: 1.2, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x))});
    return () => c.stop();
  }, [inView, to]);
  return <b ref={ref}>{v}</b>;
}
