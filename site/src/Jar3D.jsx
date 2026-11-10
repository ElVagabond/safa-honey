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

function build(slug, renderer) {
  const jar = data.jars[slug]
  const H = data.shape.aspect * 2
  const lidH = data.shape.lid.h * H
  const loader = new THREE.TextureLoader()
  const label = name => {
    const t = loader.load(texUrl(name))
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = renderer.capabilities.getMaxAnisotropy()
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
  return { pivot, height: H + lidH, dispose: () => { [...mats, gold].forEach(m => { m.map?.dispose(); m.dispose() }); group.children.forEach(c => c.geometry.dispose()) } }
}

/**
 * The product jar in 3D. It turns slowly on its own, turns further as the page scrolls,
 * and can be spun by dragging (with inertia). Falls back to the photo without WebGL.
 */
export default function Jar3D({ slug, fallback, alt }) {
  const host = useRef(null)
  const [failed, setFailed] = useState(false)
  const { setCursor } = useApp()

  useEffect(() => {
    const el = host.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch { setFailed(true); return }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', alt)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    const key = new THREE.DirectionalLight('#fff4e0', 1.6)
    key.position.set(-3, 4, 5)
    const rim = new THREE.DirectionalLight('#ffd9a0', 1.2)
    rim.position.set(4, 2, -4)
    scene.add(key, rim, new THREE.HemisphereLight('#fff6e8', '#5a2a10', 0.5))

    const jar = build(slug, renderer)
    scene.add(jar.pivot)
    const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100)
    const dist = (jar.height * 0.62) / Math.tan(THREE.MathUtils.degToRad(10))
    camera.position.set(0, dist * 0.16, dist)
    camera.lookAt(0, 0, 0)

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // spin state: own angle (idle + drag + inertia) plus the scroll position
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let angle = -0.5, vel = 0, drag = null, tiltX = 0, tiltY = 0, aimX = 0, aimY = 0
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
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)

    let visible = true, raf = 0, last = performance.now()
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame) } })
    io.observe(el)
    function frame(now) {
      raf = 0
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!drag) {
        angle += vel * dt
        vel *= Math.pow(0.04, dt)
        if (!reduce) angle += 0.35 * dt
      }
      tiltX += (aimX - tiltX) * Math.min(dt * 5, 1)
      tiltY += (aimY - tiltY) * Math.min(dt * 5, 1)
      jar.pivot.rotation.set(tiltX, angle + scrollY * 0.004 + tiltY, 0)
      jar.pivot.position.y = reduce ? 0 : Math.sin(now / 900) * 0.03
      renderer.render(scene, camera)
      if (visible) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('pointerleave', leave)
      jar.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose()
      renderer.domElement.remove()
    }
  }, [slug, alt])

  if (failed) return <img src={fallback} alt={alt} />
  return (
    <div className="jar3d" ref={host}
      onMouseEnter={() => setCursor('Drag to turn')} onMouseLeave={() => setCursor(null)} />
  )
}
