import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useApp } from './ui.jsx'
import data from '@assets/3d/jars.json'

// Labels unwrapped from safahoney.com's face-on photos by tools/jar3d.py
const tex = import.meta.glob('@assets/3d/*.webp', { eager: true, import: 'default' })
const texUrl = name => Object.entries(tex).find(([k]) => k.endsWith(`/${name}.webp`))?.[1]

export const has3D = slug => Boolean(data.jars[slug])

const CORNER = 0.1      // rounding of the hexagon's vertical edges, as a fraction of its radius
const ARC = 6           // segments per rounded edge

/* Cross-section: a hexagon with a flat face towards the viewer (+z), corners rounded.
   Starts and ends in the middle of the back face so the seam is on a flat panel. */
function section() {
  const d = 1 - CORNER / Math.cos(Math.PI / 6)
  const pts = []
  const flat = Math.cos(Math.PI / 6) // a flat face's distance from the axis
  const push = a => pts.push({ a, x: flat * Math.sin(a), z: flat * Math.cos(a) })
  push(Math.PI)
  for (let k = 3; k < 9; k++) {
    const t0 = (k * Math.PI) / 3, mid = t0 + Math.PI / 6
    const cx = d * Math.sin(mid), cz = d * Math.cos(mid)
    for (let s = 0; s <= ARC; s++) {
      const a = t0 + (s / ARC) * (Math.PI / 3)
      pts.push({ a, x: cx + CORNER * Math.sin(a), z: cz + CORNER * Math.cos(a) })
    }
    if (k === 5) push(2 * Math.PI) // middle of the front face
  }
  push(3 * Math.PI)
  return pts
}

const facing = (a, target) => Math.abs(((a - target) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) < 1e-6

/* Body: the measured profile swept around the rounded hexagon. Material groups:
   0 = honey seen through glass, 1 = front label, 2 = back label. */
function bodyGeometry(height) {
  const sec = section()
  const prof = [[0, 0], ...[...data.shape.profile].reverse(), [1, 0]] // bottom → top, closed at both ends
  const pos = [], uv = []
  for (const [py, pr] of prof) {
    for (const p of sec) {
      pos.push(p.x * pr, py * height, p.z * pr)
      const back = p.z < 0
      uv.push(back ? 0.5 - p.x : p.x + 0.5, py)
    }
  }
  const n = sec.length, groups = [[], [], []]
  for (let j = 0; j < prof.length - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, e = c + 1
      const g = facing(sec[i].a, 0) && facing(sec[i + 1].a, 0) ? 1 : facing(sec[i].a, Math.PI) && facing(sec[i + 1].a, Math.PI) ? 2 : 0
      groups[g].push(a, b, e, a, e, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  const index = []
  groups.forEach((g, m) => { geo.addGroup(index.length, g.length, m); index.push(...g) })
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/* Screw-top lid: a lathe with a rounded top edge, its side knurled with fine vertical ribs. */
function lidGeometry(r, h) {
  const e = h * 0.18
  const pts = [[0, 0], [r * 0.97, 0], [r, e * 0.4], [r, h - e]]
  for (let s = 1; s <= 6; s++) { const a = (s / 6) * (Math.PI / 2); pts.push([r - e + e * Math.cos(a), h - e + e * Math.sin(a)]) }
  pts.push([0, h])
  const geo = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 240)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    if (y < e * 0.5 || y > h - e) continue
    const k = 1 + 0.008 * Math.sign(Math.cos(Math.atan2(p.getX(i), p.getZ(i)) * 90))
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k)
  }
  geo.computeVertexNormals()
  return geo
}

/* A renderer plus the lit scene jars are shown in. Throws without WebGL. */
function makeStage() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(1)
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  renderer.setScissorTest(true)
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  const key = new THREE.DirectionalLight('#fff4e0', 1.6)
  key.position.set(-3, 4, 5)
  const rim = new THREE.DirectionalLight('#ffd9a0', 1.2)
  rim.position.set(4, 2, -4)
  scene.add(key, rim, new THREE.HemisphereLight('#fff6e8', '#5a2a10', 0.5))
  return { renderer, scene, w: 0, h: 0 }
}

/* One stage (WebGL context, lighting, compiled shaders) for the whole page, made on first use.
   The product page's jar borrows its canvas and draws straight onto it; the carousel's jars, up
   to four at once, are each drawn into it and copied onto their own 2D canvas. Copying costs a
   GPU read-back, so carousel jars only redraw when they turn. */
let shared = null
function getShared() {
  if (shared === null) { try { shared = makeStage() } catch { shared = false } }
  return shared
}

/* Draw `jar` seen by `camera`: straight onto the stage's canvas, or, with `ctx`, copied onto it. */
function draw(st, jar, camera, w, h, ctx) {
  if (ctx ? w > st.w || h > st.h : w !== st.w || h !== st.h) {
    st.w = ctx ? Math.max(w, st.w) : w; st.h = ctx ? Math.max(h, st.h) : h
    st.renderer.setSize(st.w, st.h, false)
  }
  st.renderer.setViewport(0, 0, w, h)
  st.renderer.setScissor(0, 0, w, h)
  st.scene.add(jar.pivot)
  st.renderer.render(st.scene, camera)
  st.scene.remove(jar.pivot)
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(st.renderer.domElement, 0, st.h - h, w, h, 0, 0, w, h) // WebGL draws from the bottom-left
}

/* Model for one product, built once and kept (the four jars are small); any renderer can draw it. */
const jars = new Map()
function getJar(slug) {
  if (!jars.has(slug)) {
    const listeners = new Set()
    const jar = build(slug, () => listeners.forEach(f => f()))
    jar.listeners = listeners
    jars.set(slug, jar)
  }
  return jars.get(slug)
}

function build(slug, onLoad) {
  const jar = data.jars[slug]
  const H = data.shape.aspect * 2
  const lidH = data.shape.lid.h * H
  const loader = new THREE.TextureLoader()
  const label = name => {
    const t = loader.load(texUrl(name), onLoad)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const honey = new THREE.Color(jar.honey)
  const glass = new THREE.MeshPhysicalMaterial({
    color: honey, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05,
    emissive: honey, emissiveIntensity: 0.12, envMapIntensity: 1.1,
  })
  const paper = map => new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.12, envMapIntensity: 0.7 })
  const mats = [glass, paper(label(`${slug}-front`)), jar.back ? paper(label(`${slug}-back`)) : glass]
  const gold = new THREE.MeshStandardMaterial({ color: '#c99a45', metalness: 1, roughness: 0.3, envMapIntensity: 1.25 })

  const group = new THREE.Group()
  group.add(new THREE.Mesh(bodyGeometry(H), mats))
  const lid = new THREE.Mesh(lidGeometry(data.shape.lid.r, lidH), gold)
  lid.position.y = H - lidH * 0.04
  group.add(lid)
  group.position.y = -(H + lidH) / 2
  const pivot = new THREE.Group()
  pivot.add(group)
  return { pivot, height: H + lidH }
}

/**
 * A jar in 3D. Falls back to the photo without WebGL.
 * interactive (product page): turns slowly on its own, turns further as the page scrolls,
 *   follows the pointer a little and can be spun by dragging (with inertia).
 * otherwise (home carousel): turned by the `turn` motion value; clicks go through to the
 *   surrounding button.
 *
 * Cost control, so the 3D never holds up the page:
 * - The jar's photo shows first. WebGL is set up only once `play` is true, the page has settled
 *   (the loader has gone and no page curtain is moving) and the browser is idle; the model then
 *   fades in over the photo, facing front as the photo does.
 * - Each jar measures what a draw costs and waits ~3x that long before the next, so the 3D takes
 *   at most about a quarter of the page's time. A draw's cost is the longer of the render call and
 *   the frame that follows it: with software WebGL most of the work is putting the canvas on
 *   screen, which the render call never sees. On a GPU both are tiny and the jar runs at 60 fps;
 *   on a weak device it turns in fewer, larger steps and the page stays responsive. A jar that is
 *   still costly after a few draws also drops to 1 device pixel per CSS pixel.
 */
export default function Jar3D({ slug, fallback, alt = '', interactive = true, turn, play = true, className = '' }) {
  const host = useRef(null)
  const [failed, setFailed] = useState(false)
  const [live, setLive] = useState(false) // the first 3D frame is drawn: the photo can go
  const { setCursor, settled } = useApp()
  const go = play && settled
  const [started, setStarted] = useState(false) // stays on once running, even while a later curtain moves

  useEffect(() => {
    if (!go || started) return
    const idle = window.requestIdleCallback ?? (f => setTimeout(f, 50))
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => setStarted(true), { timeout: 1000 })
    return () => cancelIdle(id)
  }, [go, started])

  useEffect(() => {
    if (!started) return
    const stop = start()
    return () => { stop(); setLive(false) }

    function start() {
      const el = host.current
      const st = getShared()
      if (!st) { setFailed(true); return () => {} }
      const direct = interactive && !st.borrowed
      const canvas = direct ? st.renderer.domElement : document.createElement('canvas')
      const ctx = direct ? null : canvas.getContext('2d')
      if (direct) st.borrowed = true
      el.appendChild(canvas)
      if (alt) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', alt) }
      else canvas.setAttribute('aria-hidden', 'true')

      let dirty = true // redraw only when the pose changes, the size changes or a label arrives
      const jar = getJar(slug)
      const onTex = () => { dirty = true }
      jar.listeners.add(onTex)
      const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100)
      const dist = (jar.height * 0.62) / Math.tan(THREE.MathUtils.degToRad(10))
      camera.position.set(0, dist * 0.16, dist)
      camera.lookAt(0, 0, 0)

      let W = 0, H = 0, lowPower = false
      const resize = () => {
        const { width, height } = el.getBoundingClientRect()
        if (!width || !height) return
        const dpr = lowPower ? 1 : Math.min(devicePixelRatio, interactive ? 2 : 1.5)
        W = Math.round(width * dpr); H = Math.round(height * dpr)
        if (ctx) { canvas.width = W; canvas.height = H }
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        dirty = true
      }
      const ro = new ResizeObserver(resize)
      ro.observe(el)
      resize()

      // spin state: own angle (idle + drag + inertia) plus the scroll position
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      let angle = 0, vel = 0, drag = null, tiltX = 0, tiltY = 0, aimX = 0, aimY = 0
      let pose = ''
      const down = e => { drag = { x: e.clientX, t: performance.now() }; vel = 0; el.setPointerCapture(e.pointerId); el.classList.add('grabbing') }
      const move = e => {
        const b = el.getBoundingClientRect()
        aimX = ((e.clientY - b.top) / b.height - 0.5) * 0.25
        aimY = ((e.clientX - b.left) / b.width - 0.5) * 0.3
        if (!drag) return
        const now = performance.now(), dx = e.clientX - drag.x
        angle += dx * 0.012
        vel = (dx * 0.012) / Math.max(now - drag.t, 1) * 1000
        drag = { x: e.clientX, t: now }
      }
      const up = () => { drag = null; el.classList.remove('grabbing') }
      const leave = () => { aimX = aimY = 0 }
      const events = interactive ? [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['pointerleave', leave]] : []
      events.forEach(([n, f]) => el.addEventListener(n, f))

      let visible = true, raf = 0, last = performance.now()
      let draws = 0, cost = 0, next = 0, drewAt = 0, cpu = 0 // draw budget, see above
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame) } })
      io.observe(el)
      function frame(now) {
        raf = 0
        const ms = now - last, dt = Math.min(ms / 1000, 0.05)
        last = now
        if (!drag) {
          angle += vel * dt
          vel *= Math.pow(0.04, dt)
          if (!reduce && interactive) angle += 0.35 * dt
        }
        tiltX += (aimX - tiltX) * Math.min(dt * 5, 1)
        tiltY += (aimY - tiltY) * Math.min(dt * 5, 1)
        const t = turn ? turn.get() : 0
        const rx = tiltX, ry = angle + tiltY + t + (interactive ? scrollY * 0.004 : 0)
        const py = interactive && !reduce ? Math.sin(now / 900) * 0.03 : 0
        const key = `${rx.toFixed(4)} ${ry.toFixed(4)} ${py.toFixed(4)}`
        if (drewAt) {
          // the frame after a draw shows what it really cost (the first draw compiles shaders and
          // uploads labels: a one-off, so it isn't counted)
          const c = Math.max(cpu, ms - 1000 / 60)
          drewAt = 0
          if (draws > 1) {
            cost = draws === 2 ? c : cost * 0.7 + c * 0.3
            next = now + Math.min(cost * 3, 600)
            if (!lowPower && draws > 4 && cost > 30) { lowPower = true; resize() }
          }
        }
        if (W && now >= next && (dirty || key !== pose)) {
          jar.pivot.rotation.set(rx, ry, 0)
          jar.pivot.position.y = py
          const t0 = performance.now()
          draw(st, jar, camera, W, H, ctx)
          cpu = performance.now() - t0
          drewAt = now
          if (draws++ === 0) setLive(true)
          dirty = false
          pose = key
        }
        if (visible) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      return () => {
        cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
        events.forEach(([n, f]) => el.removeEventListener(n, f))
        jar.listeners.delete(onTex)
        canvas.remove()
        if (direct) { st.borrowed = false; canvas.removeAttribute('role'); canvas.removeAttribute('aria-label'); canvas.removeAttribute('aria-hidden') }
      }
    }
  }, [slug, alt, interactive, turn, started])

  if (failed) return <img src={fallback} alt={alt} draggable="false" />
  return (
    <div className={`jar3d ${live ? 'live' : ''} ${className}`} ref={host}
      onMouseEnter={interactive ? () => setCursor('Drag to turn') : undefined}
      onMouseLeave={interactive ? () => setCursor(null) : undefined}>
      {!live && <img className="jar3d-poster" src={fallback} alt={alt} draggable="false" />}
    </div>
  )
}
