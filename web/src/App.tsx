import {
  AnimatePresence, LayoutGroup, motion, MotionConfig, animate,
  useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform,
} from 'framer-motion';
import {lazy, Suspense, useEffect, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent} from 'react';
import {asset, featured, filters, marquee, posts, products, slides, steps, trades, type Product} from './data';
/* three.js is ~500 KB, so the hero's 3D layer loads in its own chunk */
const HoneycombGL = lazy(() => import('./HoneycombGL').then((m) => ({default: m.HoneycombGL})));
import {Counter, ease, easeInOut, Reveal, SplitWords} from './motion';
import {ScrollTrigger, useParallax} from './useParallax';

/* ---------------- Loader ---------------- */
function Loader({onDone}: {onDone: () => void}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const c = animate(0, 100, {duration: 1.6, ease: 'easeInOut', onUpdate: (v) => setPct(Math.round(v)), onComplete: () => setTimeout(onDone, 250)});
    return () => c.stop();
  }, [onDone]);
  return (
    <motion.div className="loader" aria-hidden="true" exit={{y: '-100%'}} transition={{duration: 1, ease: easeInOut}}>
      <div className="pct"><span>{pct}</span>%</div>
    </motion.div>
  );
}

/* ---------------- Cursor ---------------- */
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, {stiffness: 600, damping: 40}), sy = useSpring(y, {stiffness: 600, damping: 40});
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!matchMedia('(hover:hover)').matches) return;
    const mv = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const ov = (e: MouseEvent) => setBig(!!(e.target as Element).closest?.('a,button,.card'));
    addEventListener('mousemove', mv);
    document.addEventListener('mouseover', ov);
    return () => { removeEventListener('mousemove', mv); document.removeEventListener('mouseover', ov); };
  }, [x, y]);
  return <motion.div className={`cursor ${big ? 'big' : ''}`} aria-hidden="true" style={{x: sx, y: sy, translateX: '-50%', translateY: '-50%'}} />;
}

/* ---------------- Header + menu ---------------- */
const menuLinks = [['#pantry', 'The Pantry'], ['#production', 'Hive to Jar'], ['#story', 'Our Story'], ['#trade', 'For Business'], ['#contact', 'Contact']];

function Header({cart, open, setOpen}: {cart: number; open: boolean; setOpen: (o: boolean) => void}) {
  const {scrollY} = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40));
  return (
    <>
      <header className={`top ${scrolled ? 'scrolled' : ''}`} id="top">
        <div className="wrap">
          <a href="#" className="logo" aria-label="Safa Honey home"><img src={asset('logo.png')} alt="" />Honey</a>
          <div className="top-right">
            <div className="lang"><a href="#">EN</a><span>/</span><a href="#" style={{opacity: 0.4}}>हि</a></div>
            <a href="#pantry" className="pill">Shop
              <motion.span key={cart} className="cart-count" initial={{scale: 1.6}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 500, damping: 15}}>{cart}</motion.span>
            </a>
            <button className="pill menu-btn" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
              <span className="bars">
                <motion.i animate={open ? {y: 3.5, rotate: 45} : {y: 0, rotate: 0}} />
                <motion.i animate={open ? {y: -3.5, rotate: -45} : {y: 0, rotate: 0}} />
              </span>
              <span>{open ? 'Close' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>

      <motion.div className="menu" id="menu" aria-hidden={!open}
        initial={false}
        animate={{clipPath: open ? 'circle(150% at calc(100% - 60px) 40px)' : 'circle(0% at calc(100% - 60px) 40px)'}}
        transition={{duration: 0.9, ease: easeInOut}}
        style={{pointerEvents: open ? 'auto' : 'none'}}>
        <div className="wrap">
          <nav aria-label="Main">
            {menuLinks.map(([href, label], i) => (
              <motion.a key={href} href={href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}
                initial={false} animate={open ? {y: 0, opacity: 1} : {y: 60, opacity: 0}}
                transition={{duration: 0.7, ease, delay: open ? 0.25 + i * 0.06 : 0}}>
                <em>0{i + 1}</em>{label}
              </motion.a>
            ))}
          </nav>
          <motion.div className="sub" initial={false} animate={{opacity: open ? 1 : 0}} transition={{delay: open ? 0.6 : 0}}>
            <div><h4>Shop</h4><a href="#pantry">Raw Honey</a><a href="#pantry">Herbal Honey</a><a href="#pantry">Black Seed Oil</a><a href="#pantry">Vinegar</a></div>
            <div><h4>About</h4><a href="#">Quality Assurance</a><a href="#">Suppliers</a><a href="#">Sustainability</a><a href="#journal">Journal</a></div>
            <div><h4>Say hello</h4><a href="mailto:info@safahoney.com">info@safahoney.com</a><a href="tel:+919108084444">+91 91080 84444</a></div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ready}: {ready: boolean}) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setCur((c) => (c + 1) % slides.length), 6000);
    return () => clearTimeout(t);
  }, [cur]);
  const s = slides[cur];

  /* pointer parallax on the jar stage */
  const px = useMotionValue(0), py = useMotionValue(0);
  const sx = useSpring(px, {stiffness: 60, damping: 18}), sy = useSpring(py, {stiffness: 60, damping: 18});
  useEffect(() => {
    if (!matchMedia('(hover:hover)').matches) return;
    const mv = (e: PointerEvent) => { px.set((e.clientX / innerWidth - 0.5) * -24); py.set((e.clientY / innerHeight - 0.5) * -16); };
    addEventListener('pointermove', mv, {passive: true});
    return () => removeEventListener('pointermove', mv);
  }, [px, py]);

  const enter = (d: number) => ({initial: {opacity: 0, y: 40}, animate: ready ? {opacity: 1, y: 0} : {}, transition: {duration: 1, ease, delay: d}});

  return (
    <motion.section className="hero" id="hero" animate={{backgroundColor: s.bg}} transition={{duration: 1.2}} style={{backgroundColor: slides[0].bg}}>
      <div className="wrap">
        <motion.p className="eyebrow" {...enter(0.1)}>Raw honey · Bangalore, India</motion.p>
        <motion.h1 style={{marginTop: 18}} {...enter(0.2)}>
          Honey, the way the{' '}
          <motion.em className="swap" animate={{color: s.col}} transition={{duration: 1}}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={s.word} initial={{y: '40%', opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: '-40%', opacity: 0}} transition={{duration: 0.45, ease: easeInOut}}>
                {s.word}
              </motion.span>
            </AnimatePresence>
          </motion.em>{' '}
          made it.
        </motion.h1>
        <motion.p className="lede" {...enter(0.35)}>Raw, unheated and unfiltered honey gathered from wild forests and blossoming orchards across India — jarred in Bangalore, nothing added.</motion.p>
        <motion.div className="ctas" {...enter(0.45)}>
          <motion.a href="#pantry" className="pill solid" whileHover={{scale: 1.04}} whileTap={{scale: 0.97}}>Explore the pantry →</motion.a>
          <motion.a href="#production" className="pill" whileHover={{scale: 1.04}} whileTap={{scale: 0.97}}>How we make it</motion.a>
        </motion.div>
      </div>

      <Suspense fallback={<canvas id="gl" className="gl" aria-hidden="true" />}><HoneycombGL tint={cur} /></Suspense>

      <div className="scene" aria-hidden="true">
        <motion.div className="stage" style={{x: sx, y: sy}}>
          <AnimatePresence>
            <motion.img key={s.img} src={asset(s.img)} alt=""
              initial={{opacity: 0, y: 50, scale: 0.92, rotate: -4}}
              animate={ready ? {opacity: 1, y: [0, -12, 0], scale: 1, rotate: [0, 1, 0]} : {}}
              exit={{opacity: 0, y: -30, scale: 0.96, rotate: 3, transition: {duration: 0.7}}}
              transition={{
                opacity: {duration: 0.9}, scale: {duration: 1.2, ease},
                y: {duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 1.2},
                rotate: {duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 1.2},
              }} />
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div className="badge" aria-hidden="true" initial={{scale: 0, rotate: -90}} animate={ready ? {scale: 1, rotate: 0} : {}} transition={{type: 'spring', stiffness: 120, damping: 14, delay: 0.6}}>
        <svg className="ring" viewBox="0 0 200 200">
          <defs><path id="circ" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
          <circle cx="100" cy="100" r="99" fill="#fdf3e4" stroke="#2b1a0e" strokeWidth="1.5" />
          <text fontFamily="DM Sans" fontSize="15.5" fontWeight="700" letterSpacing="4.2" fill="#2b1a0e"><textPath href="#circ">RAW · UNHEATED · UNFILTERED · PURE · </textPath></text>
        </svg>
        <div className="core"><svg viewBox="0 0 24 24"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" /></svg></div>
      </motion.div>

      <div className="hero-foot">
        <div className="wrap">
          <div className="dots" role="tablist" aria-label="Hero slides">
            {slides.map((sl, k) => (
              <button key={sl.word} aria-label={sl.label} aria-selected={k === cur} role="tab" onClick={() => setCur(k)}>
                {k === cur && <motion.i key={cur} initial={{scaleX: 0}} animate={{scaleX: 1}} transition={{duration: 6, ease: 'linear'}} />}
              </button>
            ))}
            <small>0{cur + 1} / 0{slides.length}</small>
          </div>
          <a href="#pantry" className="scroll-cue"><span className="line" />Scroll to discover</a>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------------- Pantry ---------------- */
function Jar({pr}: {pr: Product}) {
  if (pr.img) return <img className="jar" src={asset(pr.img)} alt="" loading="lazy" decoding="async" />;
  return (
    <svg className="jar" viewBox="0 0 160 300" aria-hidden="true">
      <rect x="62" y="6" width="36" height="26" rx="5" fill="#2b1a0e" />
      <path d="M66 32h28v30c0 14 34 26 34 54v156a22 22 0 01-22 22H54a22 22 0 01-22-22V116c0-28 34-40 34-54z" fill={pr.h} />
      <path d="M44 128c0-10 6-16 14-20" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".25" fill="none" />
      <rect x="32" y="160" width="96" height="80" fill={pr.lbl} />
      <text x="80" y="198" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="22" fill="#2b1a0e">Safa</text>
      <text x="80" y="220" textAnchor="middle" fontFamily="DM Sans" fontWeight="700" fontSize="8" letterSpacing="1.6" fill="#2b1a0e">{pr.n.toUpperCase().slice(0, 18)}</text>
    </svg>
  );
}

function Card({pr, i, onAdd}: {pr: Product; i: number; onAdd: (p: Product) => void}) {
  /* 3D tilt with springs */
  const rx = useMotionValue(0), ry = useMotionValue(0), lift = useMotionValue(0);
  const srx = useSpring(rx, {stiffness: 200, damping: 20}), sry = useSpring(ry, {stiffness: 200, damping: 20}), sl = useSpring(lift, {stiffness: 200, damping: 20});
  const tx = useTransform(sry, (v) => `${v * -1.9}px`), ty = useTransform(srx, (v) => `${v * 1.7}px`);
  const move = (e: RPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-y * 12); ry.set(x * 14); lift.set(-6);
    e.currentTarget.style.setProperty('--gx', (x + 0.5) * 100 + '%');
    e.currentTarget.style.setProperty('--gy', (y + 0.5) * 100 + '%');
  };
  const leave = () => { rx.set(0); ry.set(0); lift.set(0); };
  const save = pr.was && pr.p ? Math.round((1 - pr.p / pr.was) * 100) : 0;

  return (
    <motion.article layout className={`card ${pr.wide ? 'wide' : ''} ${pr.dark ? 'dark' : ''}`}
      style={{'--c': pr.c, '--tx': tx, '--ty': ty, rotateX: srx, rotateY: sry, y: sl, transformPerspective: 1000} as never}
      initial={{opacity: 0, scale: 0.96}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true, amount: 0.15}}
      exit={{opacity: 0, scale: 0.9, transition: {duration: 0.3}}}
      transition={{opacity: {duration: 1, delay: (i % 3) * 0.09}, scale: {duration: 1, ease, delay: (i % 3) * 0.09}, layout: {duration: 0.6, ease}}}
      onPointerMove={move} onPointerLeave={leave}>
      {pr.sold ? <span className="tag">Sold out</span> : save ? <span className="tag sale">Save {save}%</span> : null}
      {!pr.sold && (
        <motion.button className="add" aria-label={`Add ${pr.n} to cart`} onClick={() => onAdd(pr)} whileTap={{scale: 0.8, rotate: 90}}>+</motion.button>
      )}
      <span className="glare" />
      <div className="art">
        <span className="blob" />
        <Jar pr={pr} />
        {pr.life && <img className="life" src={asset('lifestyle.webp')} alt="" loading="lazy" />}
      </div>
      <div className="info">
        <div><h3>{pr.n}</h3><div className="meta">{pr.m}</div></div>
        <div className="price">
          {pr.p ? <><b>₹{pr.p.toLocaleString('en-IN')}</b>{pr.was && <s>₹{pr.was}</s>}</> : <b style={{fontSize: 16}}>Enquire</b>}
        </div>
      </div>
    </motion.article>
  );
}

function Pantry({filter, setFilter, onAdd}: {filter: string; setFilter: (f: string) => void; onAdd: (p: Product) => void}) {
  const list = products.filter((p) => filter === 'all' || p.cat === filter);
  return (
    <section className="sec" id="pantry">
      <div className="wrap">
        <div className="head-row">
          <div>
            <Reveal as="p" className="eyebrow">01 — The Pantry</Reveal>
            <SplitWords className="h2" pieces={[{text: 'Every jar has '}, {text: 'a landscape', em: true}, {text: ' inside.'}]} />
          </div>
          <Reveal as="p">Each honey tastes of the flowers the bees visited — dark and woody from the forest, light and floral from acacia, rich and buttery from sidr.</Reveal>
        </div>
        <Reveal className="filters" role="group" aria-label="Filter products">
          <LayoutGroup id="filters">
            {filters.map(({f, label}) => (
              <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {filter === f && <motion.span layoutId="pill" className="filter-pill" transition={{type: 'spring', stiffness: 400, damping: 32}} />}
                <span className="filter-label">{label}</span>
              </button>
            ))}
          </LayoutGroup>
        </Reveal>
        <motion.div className="grid" id="grid" layout>
          <AnimatePresence mode="popLayout">
            {list.map((pr) => <Card key={pr.n} pr={pr} i={products.indexOf(pr)} onAdd={onAdd} />)}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Production ---------------- */
const icons = [
  <><path d="M28 6l20 11.5v23L28 52 8 40.5v-23z" /><path d="M28 18c-5 6-8 10-8 14a8 8 0 0016 0c0-4-3-8-8-14z" /></>,
  <><path d="M22 6h12M24 6v16L10 46a3 3 0 002.6 4.5h30.8A3 3 0 0046 46L32 22V6" /><path d="M16 36h24" /></>,
  <><circle cx="28" cy="28" r="20" /><path d="M28 16v24M20 22c4 4 12 4 16 0M20 34c4-4 12-4 16 0" /><path d="M12 12l32 32" /></>,
  <><rect x="14" y="16" width="28" height="34" rx="6" /><rect x="17" y="8" width="22" height="8" rx="2" /><path d="M14 30h28" /></>,
];

function Production() {
  return (
    <section className="sec production" id="production">
      <svg className="comb" viewBox="0 0 300 300" aria-hidden="true"><g fill="none" stroke="#fdf3e4" strokeWidth="3"><path id="hx" d="M50 10l35 20v40L50 90 15 70V30z" /><use href="#hx" x="70" /><use href="#hx" x="140" /><use href="#hx" x="35" y="60" /><use href="#hx" x="105" y="60" /><use href="#hx" x="175" y="60" /><use href="#hx" x="70" y="120" /><use href="#hx" x="140" y="120" /></g></svg>
      <div className="wrap">
        <div className="head-row">
          <div>
            <Reveal as="p" className="eyebrow">02 — Hive to Jar</Reveal>
            <SplitWords className="h2" pieces={[{text: 'Nothing added. '}, {text: 'Nothing taken away.', em: true}]} />
          </div>
          <Reveal as="p">We keep the process short on purpose. The less we do to honey, the more of it reaches you.</Reveal>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.h}>
              <Reveal delay={i * 0.08}>
                <div className="n">0{i + 1}</div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
                <motion.svg className="ic" viewBox="0 0 56 56" initial={{pathLength: 0, opacity: 0}} whileInView={{pathLength: 1, opacity: 1}} viewport={{once: true}}>
                  {icons[i]}
                </motion.svg>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Film (rendered with Remotion: see /remotion) ---------------- */
function Film() {
  return (
    <section className="film" id="film" aria-label="Brand film">
      <div className="film-pin">
        <p className="film-label">Hive to jar · a short film</p>
        <div className="film-frame">
          <video src={asset('film.mp4')} poster={asset('film-poster.jpg')} muted loop playsInline preload="metadata"
            aria-label="Safa honey jars floating over a honeycomb wall with the words Nothing added, nothing taken away" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Story ---------------- */
function Story() {
  return (
    <section className="sec story" id="story">
      <div className="wrap split">
        {/* observe the unclipped frame; a fully clipped element never reports as in view */}
        <motion.div className="visual" role="img" aria-label="Raw honey running off a dipper in front of wooden beehives"
          style={{background: 'transparent'}} initial="hidden" whileInView="shown" viewport={{once: true, amount: 0.2}}>
          <motion.div className="visual-in" transition={{duration: 1.4, ease: easeInOut}}
            variants={{hidden: {clipPath: 'inset(100% 0% 0% 0%)'}, shown: {clipPath: 'inset(0% 0% 0% 0%)'}}}>
            <img src={asset('story.webp')} alt="" loading="lazy" />
          </motion.div>
        </motion.div>
        <div className="copy">
          <Reveal as="p" className="eyebrow">03 — Our Story</Reveal>
          <SplitWords className="h2" pieces={[{text: 'The very best, '}, {text: 'from across India.', em: true}]} />
          <Reveal as="p">Safa began with a simple idea: to collect the finest floral honeys from around the country and bring them to people exactly as nature made them.</Reveal>
          <Reveal as="p">From our home on Kanakapura Road in Bangalore, we jar raw honey for families — and supply it to makers in food, healthcare and beauty care.</Reveal>
          <div className="stats-wrap">
            <Reveal className="stats">
              <div><Counter to={100} /><span>+ product types made with our honey</span></div>
              <div><Counter to={6} /><span>floral &amp; forest varieties</span></div>
              <div><b>0°</b><span>of added heat in our raw range</span></div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trade ---------------- */
function Trade() {
  return (
    <section className="sec" id="trade">
      <div className="wrap">
        <div className="head-row">
          <div>
            <Reveal as="p" className="eyebrow">04 — For Business</Reveal>
            <SplitWords className="h2" pieces={[{text: 'Honey, '}, {text: 'at scale.', em: true}]} />
          </div>
          <Reveal as="p">We've supplied manufacturers of more than a hundred kinds of products. Tell us what you're making.</Reveal>
        </div>
        <div className="trade-grid">
          {trades.map((t, i) => (
            <Reveal as="a" href="#contact" className="trade" key={t.h} delay={i * 0.1}>
              <span className="k">{t.k}</span><h3>{t.h}</h3><p>{t.p}</p><span className="arrow">→</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Journal ---------------- */
function Journal() {
  return (
    <section className="sec journal" id="journal" style={{paddingTop: 'clamp(60px,8vw,110px)'}}>
      <div className="wrap">
        <div className="head-row">
          <div>
            <Reveal as="p" className="eyebrow">05 — Journal</Reveal>
            <SplitWords className="h2" pieces={[{text: 'Notes from '}, {text: 'the hive.', em: true}]} />
          </div>
          <Reveal as="a" href="#" className="pill">All stories →</Reveal>
        </div>
        <div className="feat">
          {featured.map((f, i) => (
            <Reveal as="a" href="#" className="fpost" key={f.h} delay={i * 0.1}>
              <div className="ph"><img src={asset(f.img)} alt={f.alt} loading="lazy" style={f.pos ? {objectPosition: f.pos} : undefined} /></div>
              <div className="row"><time>{f.date}</time><span className="cat">{f.cat}</span></div>
              <h3>{f.h}</h3>
            </Reveal>
          ))}
        </div>
        <div className="posts">
          {posts.map((p) => (
            <Reveal as="a" href="#" className="post" key={p.h}><time>{p.date}</time><h3>{p.h}</h3><span className="cat">{p.cat}</span></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Newsletter ---------------- */
function Newsletter({say}: {say: (t: string) => void}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    say('Welcome to the colony — check your inbox for 10% off.');
    e.currentTarget.reset();
  };
  return (
    <section className="news" aria-labelledby="newsTitle">
      <svg className="bee" viewBox="0 0 100 80" aria-hidden="true"><ellipse cx="50" cy="48" rx="30" ry="20" fill="#2b1a0e" /><path d="M38 30v36M52 28v40" stroke="#fdf3e4" strokeWidth="7" /><ellipse cx="38" cy="22" rx="18" ry="12" fill="#fff" opacity=".9" /><ellipse cx="60" cy="20" rx="16" ry="11" fill="#fff" opacity=".9" /><circle cx="78" cy="44" r="4" fill="#fdf3e4" /></svg>
      <div className="wrap">
        <div>
          <p className="eyebrow">Join the colony</p>
          <h2 className="h2" id="newsTitle">10% off <em>your first jar.</em></h2>
        </div>
        <div>
          <form onSubmit={submit}>
            <label htmlFor="email" className="skip">Email address</label>
            <input id="email" type="email" placeholder="Your email address" required />
            <motion.button className="pill solid" type="submit" whileHover={{scale: 1.04}} whileTap={{scale: 0.96}}>Subscribe</motion.button>
          </form>
          <small>Seasonal harvests, recipes and first access to small batches. Free shipping on orders above ₹500.</small>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer id="contact">
      <div className="wrap">
        <SplitWords as="div" className="foot-big" pieces={[{text: 'Stay '}, {text: 'sweet.', em: true}]} />
        <div className="foot-cols">
          <div>
            <h4>Visit</h4>
            <p>19/2, Mango Garden Layout,<br />Behind METRO, Kanakapura Road,<br />Bangalore – 560 062, India</p>
            <p style={{marginTop: 14}}><a href="mailto:info@safahoney.com">info@safahoney.com</a><a href="tel:+919108084444">+91 91080 84444</a></p>
          </div>
          <div><h4>Shop</h4><a href="#pantry">Raw Honey</a><a href="#pantry">Herbal Honey</a><a href="#pantry">Black Seed Oil</a><a href="#trade">Bulk &amp; Private Label</a></div>
          <div><h4>About</h4><a href="#story">Our Story</a><a href="#">Quality Assurance</a><a href="#">Sustainability</a><a href="#journal">Journal</a></div>
          <div><h4>Help</h4><a href="#">FAQ</a><a href="#">Shipping</a><a href="#">Refunds &amp; Cancellation</a><a href="#">Privacy</a></div>
        </div>
        <div className="legal"><span>© 2026 Safa Honey. Raw honey, made by bees.</span><span>Instagram · Facebook · Pinterest</span></div>
      </div>
    </footer>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const [loading, setLoading] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<{id: number; text: string} | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const say = (text: string) => setToast({id: Date.now(), text});
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [menuOpen]);

  useParallax(root, [filter]);
  /* cards animate their layout for ~0.6s after a filter change; re-measure triggers after */
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    return () => clearTimeout(t);
  }, [filter]);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">Skip to content</a>
      <AnimatePresence>{loading && <Loader onDone={() => setLoading(false)} />}</AnimatePresence>
      <Cursor />
      <Header cart={cart} open={menuOpen} setOpen={setMenuOpen} />
      <div ref={root}>
        <main id="main">
          <Hero ready={!loading} />
          <div className="marquee" aria-hidden="true">
            <div className="track">{[...marquee, ...marquee].map((m, i) => <span key={i}>{m}</span>)}</div>
          </div>
          <Pantry filter={filter} setFilter={setFilter} onAdd={(p) => { setCart((c) => c + 1); say(`${p.n} added to your basket`); }} />
          <Production />
          <Film />
          <Story />
          <Trade />
          <Journal />
          <Newsletter say={say} />
        </main>
        <Footer />
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className="toast" role="status" aria-live="polite"
            initial={{y: 80, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 80, opacity: 0}} transition={{duration: 0.5, ease}}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
