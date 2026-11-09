import {useEffect, useRef} from 'react';
import * as THREE from 'three';

/* Ambient floating honeycomb cells behind the hero photo. setTint(i) follows the hero slide. */
export function HoneycombGL({tint}: {tint: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{setTint: (i: number) => void} | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const hero = el.parentElement!;
    let R: THREE.WebGLRenderer;
    try {
      R = new THREE.WebGLRenderer({canvas: el, antialias: true, alpha: true});
    } catch {
      return;
    }
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 0, 11);

    const pm = new THREE.PMREMGenerator(R);
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({color: 0xf3e2c4, side: THREE.BackSide})));
    [[6, 6, -4, 8, 4], [-7, 2, 3, 5, 7], [0, -6, 5, 10, 2]].forEach(([x, y, z, w, h]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: 0xffffff}));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    });
    scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xfff4dd, 0x6b4a2a, 2.2));
    const key = new THREE.DirectionalLight(0xffe2b0, 4);
    key.position.set(4, 6, 6);
    scene.add(key);

    const mat = new THREE.MeshPhysicalMaterial({color: 0xe8a317, roughness: 0.15, clearcoat: 1, transmission: 0.5, thickness: 1, envMapIntensity: 1.2});
    const geo = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 6);
    const hexes = Array.from({length: 18}, () => {
      const h = new THREE.Mesh(geo, mat);
      h.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, -1 - Math.random() * 5);
      h.rotation.set(Math.random() * 6, Math.random() * 6, 0);
      h.scale.setScalar(0.5 + Math.random() * 0.9);
      h.userData = {sp: 0.2 + Math.random() * 0.5, ph: Math.random() * 6, y: h.position.y};
      scene.add(h);
      return h;
    });
    const tints = [0xe8a317, 0xf2c94c, 0xd9773a];
    const target = new THREE.Color(tints[0]);
    api.current = {setTint: (i) => target.setHex(tints[i])};

    const size = () => {
      const w = hero.clientWidth, h = hero.clientHeight;
      R.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    size();
    addEventListener('resize', size);
    let mx = 0, my = 0, tx = 0, ty = 0;
    const move = (e: PointerEvent) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', move, {passive: true});
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(hero);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      cam.position.x = mx * 1.2;
      cam.position.y = -my * 0.8;
      cam.lookAt(0, 0, -3);
      mat.color.lerp(target, 0.04);
      hexes.forEach((h) => {
        const u = h.userData;
        h.rotation.x += 0.003 * u.sp;
        h.rotation.y += 0.004 * u.sp;
        h.position.y = u.y + Math.sin(t * u.sp + u.ph) * 0.3;
      });
      R.render(scene, cam);
    };
    frame();
    el.classList.add('on');
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      removeEventListener('pointermove', move);
      io.disconnect();
      geo.dispose();
      mat.dispose();
      pm.dispose();
      R.dispose();
    };
  }, []);

  useEffect(() => {
    api.current?.setTint(tint);
  }, [tint]);
  return <canvas ref={canvas} id="gl" className="gl" aria-hidden="true" />;
}
