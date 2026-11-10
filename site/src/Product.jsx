import { useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { products, gallery } from './data.js'
import { EASE_OUT, Diamond, Reveal, useApp } from './ui.jsx'
import { ProductGrid, SectionTitle } from './Shell.jsx'

function Gallery({ p }) {
  const { setCursor } = useApp()
  const bounds = useRef(null)
  const ref = useRef(null)
  const slides = [
    { jar: true, bg: p.deep },
    ...gallery.map(src => ({ src })),
    { jar: true, bg: p.tint },
    { src: gallery[0] },
  ]
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('.slide', { clipPath: 'inset(100% 0 0 0 round 18px)' }, {
          clipPath: 'inset(0% 0 0 0 round 18px)', duration: 1.4, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 80%' },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [p.slug])
  return (
    <section className="gallery" ref={ref} aria-label="Photos">
      <div className="gallery-bounds" ref={bounds}
        onMouseEnter={() => setCursor('Drag')} onMouseLeave={() => setCursor(null)}>
        <motion.div className="gallery-track" drag="x" dragConstraints={bounds} dragElastic={0.08}
          dragTransition={{ power: 0.25, timeConstant: 300 }}>
          {slides.map((s, i) => (
            <div className="slide" key={i} style={s.bg ? { background: s.bg } : undefined}>
              {s.jar ? <img className="slide-jar" src={p.img} alt="" draggable="false" /> : <img src={s.src} alt="" draggable="false" loading="lazy" />}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default function Product({ slug, ready }) {
  const { add } = useApp()
  const p = products.find(x => x.slug === slug) ?? products[0]
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const jarY = useTransform(scrollY, [0, 700], reduce ? ['0vh', '0vh'] : ['0vh', '-34vh'])
  const jarR = useTransform(scrollY, [0, 700], reduce ? [0, 0] : [0, -16])
  const jarS = useTransform(scrollY, [0, 700], [1, 0.82])
  const words = p.n.toUpperCase().split(' ')
  const half = Math.ceil(words.length / 2)
  const lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)

  return (
    <>
      <section className="phero" key={p.slug}>
        <h1 className="ptitle" aria-label={p.n}>
          {lines.map((l, i) => <Reveal key={l} as="span" className="line" play={ready} delay={0.15 + i * 0.12} split="chars" stagger={0.025}>{l}</Reveal>)}
        </h1>
        <div className="side-labels">
          <motion.span initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.8 }}>{p.cat}</motion.span>
          <motion.span initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.9 }}>Jarred in<br />Bangalore – India</motion.span>
        </div>
        <motion.div className="pjar" style={{ y: jarY, rotate: jarR, scale: jarS }}>
          <motion.img src={p.img} alt={`A jar of ${p.n}`}
            initial={{ y: '60vh' }} animate={ready ? { y: '0vh' } : undefined} transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.3 }} />
        </motion.div>
      </section>

      <section className="pinfo">
        <Diamond />
        <motion.p className="pdesc" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE_OUT }}>{p.desc}</motion.p>
        <Diamond />
        <div className="facts">
          <div><h4>Good to know</h4><p>{p.tips}</p></div>
          <div><h4>Sizes</h4><div className="sizes">{p.sizes.map(s => <span key={s}>{s}</span>)}</div></div>
          <div><h4>Best before</h4><p>{p.shelf}</p></div>
          <div className="buy">
            <h4>Price</h4>
            <p className="price">₹{p.price}</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => add(p.n)}>Add to cart</motion.button>
          </div>
        </div>
      </section>

      <Gallery p={p} />

      <section className="others">
        <SectionTitle>{'THE OTHER\nHONEYS'}</SectionTitle>
        <ProductGrid items={products.filter(x => x.slug !== p.slug).slice(0, 4)} />
      </section>
    </>
  )
}
