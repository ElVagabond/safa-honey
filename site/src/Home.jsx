import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { img, products } from './data.js'
import { EASE_OUT, Diamond, useApp } from './ui.jsx'
import { ProductGrid, SectionTitle } from './Shell.jsx'
import Jar3D, { has3D } from './Jar3D.jsx'

/* Rounded, pointy-topped hexagon — a honeycomb cell. `from`/`count` pick which vertices to walk. */
function hexPath(cx, cy, R, r, from = 0, count = 6, closed = true) {
  const v = k => { const a = (Math.PI / 3) * k; return [cx + R * Math.sin(a), cy - R * Math.cos(a)] }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const t = r / R
  let d = ''
  for (let j = 0; j <= count; j++) {
    const k = from + j
    const p = v(k), prev = v(k - 1), next = v(k + 1)
    const a = lerp(p, prev, t), b = lerp(p, next, t)
    if (j === 0) d += `M${b[0].toFixed(1)} ${b[1].toFixed(1)}`
    else if (j === count && !closed) d += `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    else d += `L${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`
  }
  return closed ? d + 'Z' : d
}

const CELL = hexPath(1000, 1000, 960, 170)
const RIM = hexPath(1000, 1000, 870, 150, 4, 4, false)
const RIM_TEXT = 'RAW · UNHEATED · UNFILTERED · NOTHING ADDED · FROM THE FORESTS OF INDIA · '

/* ------------------------------------------------------------------ hero carousel */

function Jar({ p, i, n, pos, ready, spacing }) {
  const { navigate, setCursor } = useApp()
  // signed distance from the centre slot, wrapped so the carousel loops forever
  const dist = v => { let d = (i - v) % n; if (d < -n / 2) d += n; if (d >= n / 2) d -= n; return d }
  const x = useTransform(pos, v => `${dist(v) * spacing}vw`)
  const y = useTransform(pos, v => { const d = dist(v); return `${d * d * 2.4 + (Math.abs(d) < 1 ? 0 : 2)}vh` })
  const rotate = useTransform(pos, v => { const d = dist(v); return d * 9 + (i % 2 ? 7 : -7) * Math.min(Math.abs(d), 1) })
  const scale = useTransform(pos, v => 1.12 - Math.min(Math.abs(dist(v)), 2.2) * 0.2)
  const zIndex = useTransform(pos, v => 10 - Math.round(Math.abs(dist(v)) * 2))
  // 3D jars turn as they travel along the arc and face front in the centre slot
  const turn = useTransform(pos, v => -dist(v) * 1.1)
  const intro = {
    initial: { y: '70vh', rotate: 20 },
    animate: ready ? { y: 0, rotate: 0 } : undefined,
    transition: { duration: 1.6, ease: EASE_OUT, delay: 0.25 + ((i * 3) % n) * 0.06 },
    whileHover: { scale: 1.06, transition: { duration: 0.5 } },
  }
  return (
    <motion.button
      className="cjar"
      style={{ x, y, rotate, scale, zIndex }}
      aria-label={`${p.n} — discover the product`}
      onMouseEnter={() => setCursor('Discover the product')}
      onMouseLeave={() => setCursor(null)}
      onClick={() => { setCursor(null); navigate(p.slug) }}
    >
      {has3D(p.slug) ? (
        <motion.div className="cjar-3d" {...intro}>
          <Jar3D slug={p.slug} fallback={p.img} interactive={false} turn={turn} play={ready} />
        </motion.div>
      ) : (
        <motion.img src={p.img} alt="" draggable="false" {...intro} />
      )}
    </motion.button>
  )
}

function Hero({ ready }) {
  const wrap = useRef(null)
  const cell = useRef(null)
  const textPath = useRef(null)
  const reduce = useReducedMotion()
  const n = products.length
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.6 })
  const pos = useTransform(smooth, [0, 1], [0, n])
  const [active, setActive] = useState(0)
  useMotionValueEvent(pos, 'change', v => setActive(((Math.round(v) % n) + n) % n))
  const [spacing, setSpacing] = useState(30)
  useEffect(() => {
    const f = () => setSpacing(innerWidth < 720 ? 66 : innerWidth < 1100 ? 40 : 30)
    f(); addEventListener('resize', f); return () => removeEventListener('resize', f)
  }, [])

  // GSAP: the honeycomb cell rises on load, then its rim text runs along the edge as you scroll
  useLayoutEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.fromTo(cell.current, { yPercent: 40, scale: 0.85 }, { yPercent: 0, scale: 1, duration: 1.8, ease: 'expo.out' })
      if (reduce) return
      gsap.to(textPath.current, {
        attr: { startOffset: -2200 }, ease: 'none',
        scrollTrigger: { trigger: wrap.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
      })
      gsap.to(cell.current, {
        rotate: 6, ease: 'none',
        scrollTrigger: { trigger: wrap.current, start: 'top top', end: 'bottom bottom', scrub: 1.5 },
      })
    }, wrap)
    return () => ctx.revert()
  }, [ready, reduce])

  return (
    <section className="hero" ref={wrap} style={{ height: `${n * 50 + 100}vh` }} aria-label="Our honeys">
      <div className="hero-stage">
        <svg className="cell" ref={cell} viewBox="0 0 2000 2000" aria-hidden="true">
          <path d={CELL} fill="var(--wine)" />
          <path id="rim" d={RIM} fill="none" />
          <text className="rim-text"><textPath ref={textPath} href="#rim" startOffset="0">{RIM_TEXT.repeat(4)}</textPath></text>
        </svg>
        <div className="jars">
          {products.map((p, i) => <Jar key={p.slug} p={p} i={i} n={n} pos={pos} ready={ready} spacing={spacing} />)}
        </div>
        <motion.div className="hero-foot" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 1.2, duration: 1 }}>
          <span className="hero-name" aria-live="polite">
            <small>{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</small>
            {products[active].n}
          </span>
          <span className="scroll-cue">Scroll to discover</span>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ manifesto */

const MANIFESTO = 'We collect the finest floral and forest honeys from across India and bring them to you exactly as the bees left them. No heat, no blending, no shortcuts — only the taste of a single landscape, season after season.'

function Manifesto() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.mf-text .w', { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.mf-text', start: 'top 80%', end: 'bottom 50%', scrub: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="manifesto" ref={ref}>
      <div className="side-labels"><span>Raw honey &amp;<br />Herbal honey</span><span>Jarred in<br />Bangalore – India</span></div>
      <Diamond />
      <p className="mf-text">{MANIFESTO.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>)}</p>
      <Diamond />
    </section>
  )
}

/* ------------------------------------------------------------------ parallax band */

function Band() {
  const ref = useRef(null)
  const photo = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x1 = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['10%', '-30%'])
  const x2 = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-30%', '5%'])
  const jarY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['40%', '-60%'])
  const jarR = useTransform(scrollYProgress, [0, 1], [-14, 10])
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(photo.current, { clipPath: 'inset(18% 22% 18% 22% round 32px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'top 10%', scrub: true },
        })
        gsap.fromTo(photo.current.querySelector('img'), { yPercent: -12, scale: 1.25 }, {
          yPercent: 12, scale: 1.05, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="band" ref={ref}>
      <div className="band-photo" ref={photo}><img src={img.story} alt="Raw honey running off a dipper in front of wooden beehives" loading="lazy" /></div>
      <div className="band-words" aria-hidden="true">
        <motion.span style={{ x: x1 }}>From the hive</motion.span>
        <motion.span style={{ x: x2 }}><em>straight to the jar</em></motion.span>
      </div>
      <motion.img className="band-jar" src={img.acacia} alt="" style={{ y: jarY, rotate: jarR }} loading="lazy" />
    </section>
  )
}

/* ------------------------------------------------------------------ process */

const steps = [
  ['Gathered', 'From forests and floral regions across India, season by season, by beekeepers and honey hunters we know.', img.lifestyle],
  ['Tested', 'Every batch is checked against our quality standards for purity and safety before it is approved.', img.ginger],
  ['Never heated', 'Our raw honeys stay unheated and unprocessed, so they keep their character — and may crystallise.', img.story],
  ['Jarred', 'Strained gently and poured into glass in Bangalore, then sent straight to your door.', img.lifestyle],
]

function Step({ s, i }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80 + i * 30, -80 - i * 30])
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-15%', '15%'])
  return (
    <motion.article className="step" ref={ref} style={{ y }}>
      <div className="step-pic"><motion.img src={s[2]} alt="" style={{ y: imgY }} loading="lazy" /></div>
      <span className="n">0{i + 1}</span>
      <h3>{s[0]}</h3>
      <p>{s[1]}</p>
    </motion.article>
  )
}

function Process() {
  return (
    <section className="process" id="process">
      <SectionTitle sub="Hive to jar">{'NOTHING ADDED,\nNOTHING TAKEN AWAY'}</SectionTitle>
      <div className="steps">{steps.map((s, i) => <Step key={s[0]} s={s} i={i} />)}</div>
    </section>
  )
}

export default function Home({ ready }) {
  return (
    <>
      <Hero ready={ready} />
      <Manifesto />
      <Band />
      <Process />
      <section className="others" id="pantry">
        <SectionTitle sub="Shop">{'THE\nPANTRY'}</SectionTitle>
        <ProductGrid items={products} />
      </section>
    </>
  )
}

export { hexPath }
