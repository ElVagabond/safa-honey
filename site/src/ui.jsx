import { Fragment, createContext, useContext, useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

export const EASE = [0.76, 0, 0.24, 1]
export const EASE_OUT = [0.16, 1, 0.3, 1]

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// Text that rises out of a mask, word by word (or char by char).
export function Reveal({ children, as: Tag = 'span', delay = 0, play = true, className = '', split = 'words', stagger }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const go = play && inView
  const parts = split === 'chars' ? [...children] : children.split(' ')
  const step = stagger ?? (split === 'chars' ? 0.03 : 0.07)
  return (
    <Tag ref={ref} className={`reveal ${className}`} aria-label={children}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span className="mask" aria-hidden="true">
            <motion.span
              initial={{ y: '115%' }}
              animate={go ? { y: '0%' } : undefined}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: delay + i * step }}
            >
              {p === ' ' ? '\u00a0' : p}
            </motion.span>
          </span>
          {split === 'words' && i < parts.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  )
}

export function Diamond() {
  return <span className="diamond" aria-hidden="true" />
}

// In-app link: hash routes go through the page transition, #anchors scroll with Lenis.
export function Link({ to, href, children, cursor, onClick, ...rest }) {
  const { navigate, lenis, setCursor } = useApp()
  const target = to !== undefined ? `#${to}` : href
  return (
    <a
      href={target}
      {...rest}
      onMouseEnter={cursor ? () => setCursor(cursor) : undefined}
      onMouseLeave={cursor ? () => setCursor(null) : undefined}
      onClick={e => {
        onClick?.(e)
        if (to !== undefined) { e.preventDefault(); setCursor(null); navigate(to) }
        else if (href?.startsWith('#')) {
          e.preventDefault()
          if (href === '#') lenis.current ? lenis.current.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' })
          else lenis.current ? lenis.current.scrollTo(href, { duration: 1.6 }) : document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
        }
      }}
    >
      {children}
    </a>
  )
}

// Small pill that trails the pointer and names what a click will do ("Discover", "Drag").
export function Cursor({ label }) {
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const sx = useSpring(x, { stiffness: 500, damping: 40 })
  const sy = useSpring(y, { stiffness: 500, damping: 40 })
  useEffect(() => {
    if (!matchMedia('(hover:hover)').matches) return
    const f = e => { x.set(e.clientX + 16); y.set(e.clientY + 10) }
    addEventListener('pointermove', f, { passive: true })
    return () => removeEventListener('pointermove', f)
  }, [x, y])
  return (
    <motion.div className="cursor" style={{ x: sx, y: sy }} aria-hidden="true">
      <AnimatePresence>
        {label && (
          <motion.span key={label} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}>
            <i />{label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
