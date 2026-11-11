import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { AppCtx, Cursor, EASE } from './ui.jsx'
import { Header, Menu, Footer } from './Shell.jsx'
import Home from './Home.jsx'
import Product from './Product.jsx'
import { products } from './data.js'

gsap.registerPlugin(ScrollTrigger)

// Routes are plain #slug hashes ('' = home) so they also work inside the artifact viewer.
const parse = () => { const h = location.hash.slice(1); return products.some(p => p.slug === h) ? h : '' }

function Loader({ onDone }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let v = 0
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 9))
      setN(v)
      if (v === 100) { clearInterval(id); setTimeout(onDone, 350) }
    }, 70)
    return () => clearInterval(id)
  }, [onDone])
  return (
    <motion.div className="loader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 1.1, ease: EASE }} aria-hidden="true">
      <svg viewBox="0 0 40 46" className="loader-cell"><path d="M20 1l18 10.5v23L20 45 2 34.5v-23z" /><path d="M20 1l18 10.5v23L20 45 2 34.5v-23z" style={{ strokeDashoffset: 130 - n * 1.3 }} /></svg>
      <span className="loader-n">{n}</span>
    </motion.div>
  )
}

export default function App() {
  const [route, setRoute] = useState(parse)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [cart, setCart] = useState(0)
  const [toast, setToast] = useState(null)
  const lenis = useRef(null)
  const [cover, animateCover] = useAnimate()
  const busy = useRef(false)
  // true once the loader has finished leaving and no page curtain is moving: heavy work (the 3D jars) waits for it
  const [introGone, setIntroGone] = useState(false)
  const [moving, setMoving] = useState(false)
  const [covered, setCovered] = useState(false)

  // Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger and framer's useScroll stay in sync
  useEffect(() => {
    history.scrollRestoration = 'manual'
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ lerp: 0.085 })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const tick = t => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(tick); l.destroy(); lenis.current = null }
  }, [])

  useEffect(() => {
    const lock = loading || open
    document.documentElement.classList.toggle('lock', lock)
    lock ? lenis.current?.stop() : lenis.current?.start()
  }, [loading, open])

  // Page transition: a wine-coloured curtain rises, the page swaps underneath, the curtain leaves upward.
  const swap = useCallback(async next => {
    if (busy.current) return
    busy.current = true
    setMoving(true)
    setOpen(false)
    await animateCover(cover.current, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 0.8, ease: EASE })
    setCovered(true)
    lenis.current?.scrollTo(0, { immediate: true, force: true })
    scrollTo(0, 0)
    setRoute(next)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    ScrollTrigger.refresh()
    setCovered(false)
    await animateCover(cover.current, { clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }, { duration: 0.9, ease: EASE })
    busy.current = false
    setMoving(false)
    // the visitor may have pressed Back/Forward while the curtain was moving: catch up with the URL
    const latest = parse()
    if (latest !== next) swap(latest)
  }, [animateCover, cover])

  useEffect(() => {
    const f = () => { const r = parse(); if (r !== route) swap(r) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [route, swap])

  const navigate = useCallback(to => {
    if (to === route) { lenis.current?.scrollTo(0); return }
    location.hash = to
  }, [route])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const done = useCallback(() => { setLoading(false); requestAnimationFrame(() => ScrollTrigger.refresh()) }, [])
  const add = useCallback(n => { setCart(c => c + 1); setToast(`${n} added to your cart`) }, [])
  const slug = route || null

  return (
    <AppCtx.Provider value={{ navigate, lenis, setCursor, cart, add, settled: introGone && !moving }}>
      <AnimatePresence onExitComplete={() => setIntroGone(true)}>{loading && <Loader key="loader" onDone={done} />}</AnimatePresence>
      <Header open={open} setOpen={setOpen} />
      <Menu open={open} close={() => setOpen(false)} />
      <main key={route}>
        {slug ? <Product slug={slug} ready={!loading && !covered} /> : <Home ready={!loading && !covered} />}
      </main>
      <Footer />
      <div className="curtain" ref={cover} aria-hidden="true" />
      <Cursor label={cursor} />
      <AnimatePresence>
        {toast && <motion.div className="toast" role="status" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>{toast}</motion.div>}
      </AnimatePresence>
    </AppCtx.Provider>
  )
}
