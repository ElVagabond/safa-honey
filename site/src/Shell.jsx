import { useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import gsap from 'gsap'
import { img, products } from './data.js'
import { EASE, EASE_OUT, Link, Reveal, useApp } from './ui.jsx'

export function Header({ open, setOpen }) {
  const { cart } = useApp()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  // slide away while scrolling down, come back as soon as the visitor scrolls up
  useMotionValueEvent(scrollY, 'change', y => setHidden(y > (scrollY.getPrevious() ?? 0) && y > 160))
  return (
    <motion.header className={`top ${open ? 'is-open' : ''}`} animate={{ y: hidden && !open ? '-120%' : '0%' }} transition={{ duration: 0.6, ease: EASE }}>
      <div className="top-left">
        <button className="chip on" aria-pressed="true">EN</button>
        <button className="chip" aria-pressed="false">हि</button>
      </div>
      <Link to="" className="brand" aria-label="Safa Honey home">
        <img src={img.logo} alt="" />
        <span>SAFA<em>honey</em></span>
      </Link>
      <div className="top-right">
        <span className="bag" aria-label={`${cart} items in cart`}>
          <motion.b key={cart} initial={{ scale: 1.8 }} animate={{ scale: 1 }}>{cart}</motion.b>
        </span>
        <button className="menu-pill" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(o => !o)}>
          {open ? 'Close' : 'Menu'}<i />
        </button>
      </div>
    </motion.header>
  )
}

export function Menu({ open, close }) {
  const links = [['', 'The Pantry'], ...products.slice(0, 4).map(p => [p.slug, p.n])]
  return (
    <AnimatePresence>
      {open && (
        <motion.div id="menu" className="menu" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.9, ease: EASE }}>
          <nav aria-label="Main">
            {links.map(([to, t], i) => (
              <div className="mask" key={t}>
                <motion.div initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 + i * 0.06 }}>
                  <Link to={to} onClick={close}><em>0{i + 1}</em>{t}</Link>
                </motion.div>
              </div>
            ))}
          </nav>
          <motion.div className="menu-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
            <p>19/2, Mango Garden Layout, Kanakapura Road<br />Bangalore 560 062, India</p>
            <p><a href="mailto:info@safahoney.com">info@safahoney.com</a><br /><a href="tel:+919108084444">+91 91080 84444</a></p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Grid of product cards; hovering tilts the jar and drops a coloured cell from the top.
export function ProductGrid({ items }) {
  return (
    <>
      <div className="pgrid">
        {items.map((p, i) => (
          <motion.div key={p.slug} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 1, ease: EASE_OUT, delay: (i % 4) * 0.08 }}>
            <Link to={p.slug} className="pcard" cursor="Discover" style={{ '--tint': p.tint, '--deep': p.deep }}>
              <span className="cell" aria-hidden="true" />
              <img src={p.img} alt="" loading="lazy" />
              <span className="pcard-meta"><b>{p.n}</b><small>{p.cat} · ₹{p.price}</small></span>
            </Link>
          </motion.div>
        ))}
      </div>
      {items.length > 2 && <p className="swipe-hint" aria-hidden="true">Swipe to see more →</p>}
    </>
  )
}

export function Footer() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('.giant .l', { yPercent: 105 }, {
          yPercent: 0, stagger: 0.05, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'top 20%', scrub: 1 },
        })
        gsap.fromTo('.giant em', { xPercent: -12, opacity: 0 }, {
          xPercent: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 60%', end: 'top 10%', scrub: 1 },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <footer className="foot" ref={ref} id="contact">
      <div className="giant">
        <span className="sr">Safa Honey</span>
        <div className="giant-line" aria-hidden="true">{'SAFA'.split('').map((c, i) => <span className="mask" key={i}><span className="l">{c}</span></span>)}</div>
        <em aria-hidden="true">Honey</em>
      </div>
      <div className="foot-cols">
        <div className="foot-brand">
          <img src={img.logo} alt="" />
          <p><b>Safa Honey</b><br />Raw honey from the forests of India</p>
        </div>
        <nav aria-label="Footer">
          <Link to="">The Pantry</Link>
          {products.slice(0, 4).map(p => <Link key={p.slug} to={p.slug}>{p.n}</Link>)}
        </nav>
        <div>
          <h4>Visit</h4>
          <p>19/2, Mango Garden Layout,<br />Behind METRO, Kanakapura Road,<br />Bangalore – 560 062, India</p>
        </div>
        <div>
          <h4>Say hello</h4>
          <p>Have a question, or want honey for your business? Write to us — we’d love to tell you more about where it comes from.</p>
          <a className="flame" href="mailto:info@safahoney.com">info@safahoney.com</a>
          <a href="tel:+919108084444">+91 91080 84444</a>
        </div>
      </div>
      <div className="legal"><span>© 2026 Safa Honey</span><Link href="#">Back to top ↑</Link></div>
    </footer>
  )
}

export function SectionTitle({ children, sub }) {
  return (
    <div className="stitle">
      {sub && <p className="eyebrow">{sub}</p>}
      <h2>{children.split('\n').map((l, i) => <Reveal key={i} as="span" className="line" delay={i * 0.12}>{l}</Reveal>)}</h2>
    </div>
  )
}
