import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadFraunces} from '@remotion/google-fonts/Fraunces';
import {loadFont as loadDMSans} from '@remotion/google-fonts/DMSans';

const {fontFamily: frauncesFamily} = loadFraunces('normal', {weights: ['300'], subsets: ['latin']});
loadFraunces('italic', {weights: ['300'], subsets: ['latin']});
const {fontFamily: dmSansFamily} = loadDMSans('normal', {weights: ['500'], subsets: ['latin']});

const C = {
  cream: '#fdf3e4',
  cream2: '#f6e6c8',
  honey: '#e8a317',
  amber: '#c4720d',
  ink: '#2b1a0e',
};
const serif = `${frauncesFamily}, Georgia, serif`;
const sans = `${dmSansFamily}, "Helvetica Neue", Arial, sans-serif`;

/* A slow camera that drifts right, then back, so the film loops seamlessly.
   Every layer moves by camera * depth: far layers barely move, near layers sweep past. */
const useCamera = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = frame / durationInFrames;
  return {
    x: Math.sin(p * Math.PI * 2) * 110,
    y: Math.cos(p * Math.PI * 2) * 40,
  };
};

const Layer: React.FC<{depth: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  depth,
  children,
  style,
}) => {
  const cam = useCamera();
  return (
    <AbsoluteFill style={{transform: `translate(${-cam.x * depth}px, ${-cam.y * depth}px)`, ...style}}>
      {children}
    </AbsoluteFill>
  );
};

const hexPath = (r: number) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
};

const Honeycomb: React.FC = () => {
  const frame = useCurrentFrame();
  const r = 70;
  const w = Math.sqrt(3) * r;
  const cells: React.ReactNode[] = [];
  for (let row = -1; row < 10; row++) {
    for (let col = -2; col < 16; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0);
      const y = row * r * 1.5;
      const pulse = 0.08 + 0.1 * Math.max(0, Math.sin(frame / 18 - col * 0.5 + row * 0.7));
      cells.push(
        <path key={`${row}-${col}`} d={hexPath(r - 6)} transform={`translate(${x} ${y})`} fill={C.honey} fillOpacity={pulse} stroke={C.amber} strokeOpacity={0.22} strokeWidth={3} />
      );
    }
  }
  return (
    <svg width={2400} height={1400} style={{position: 'absolute', left: -240, top: -160}}>
      {cells}
    </svg>
  );
};

/* Floating bokeh hexes in the foreground */
const Bokeh: React.FC<{seed: number; count: number; blur: number; size: number}> = ({seed, count, blur, size}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const loop = (frame / durationInFrames) * Math.PI * 2;
        const x = rand(i) * 2100 - 90;
        const y = rand(i + 50) * 1200 - 60 + Math.sin(loop * (1 + (i % 2)) + i) * 40;
        const s = size * (0.6 + rand(i + 99) * 0.8);
        const rot = Math.sin(loop + i) * 30;
        return (
          <svg key={i} width={s * 2} height={s * 2} viewBox={`${-s} ${-s} ${s * 2} ${s * 2}`}
            style={{position: 'absolute', left: x, top: y, filter: `blur(${blur}px)`, transform: `rotate(${rot}deg)`}}>
            <path d={hexPath(s * 0.9)} fill={i % 3 ? C.honey : C.amber} fillOpacity={0.55} />
          </svg>
        );
      })}
    </>
  );
};

const Drip: React.FC<{x: number; delay: number; len: number}> = ({x, delay, len}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.2, 1),
  });
  const h = len * t;
  return (
    <svg width={80} height={len + 80} style={{position: 'absolute', left: x, top: 0}}>
      <path d={`M14 0 H66 V${h * 0.2} C66 ${h * 0.7} 52 ${h} 40 ${h} C28 ${h} 14 ${h * 0.7} 14 ${h * 0.2} Z`} fill={C.honey} />
      <circle cx={40} cy={h - 2} r={t > 0 ? 26 * Math.min(1, t * 1.4) : 0} fill={C.honey} />
      <ellipse cx={30} cy={h * 0.4} rx={5} ry={h * 0.12} fill="#fff" opacity={0.35} />
    </svg>
  );
};

const Jar: React.FC<{src: string; left: number; height: number; delay: number; tilt: number}> = ({src, left, height, delay, tilt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - delay, fps, config: {damping: 14, mass: 0.9}});
  const bob = Math.sin((frame - delay) / 22) * 10;
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        left,
        bottom: 60,
        height,
        transform: `translateY(${(1 - enter) * 500 + bob}px) rotate(${(1 - enter) * tilt + Math.sin(frame / 40) * 1.5}deg)`,
        opacity: enter,
        filter: 'drop-shadow(0 50px 40px rgba(43,26,14,.32))',
      }}
    />
  );
};

const Words: React.FC<{text: string; start: number; size: number; italic?: boolean; color?: string}> = ({text, start, size, italic, color = C.ink}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', columnGap: size * 0.28, rowGap: 0, flexWrap: 'wrap', fontFamily: serif, fontSize: size, lineHeight: 1, letterSpacing: '-0.03em', fontStyle: italic ? 'italic' : 'normal', fontWeight: 300, color}}>
      {text.split(' ').map((w, i) => {
        const s = spring({frame: frame - start - i * 5, fps, config: {damping: 200}});
        return (
          <span key={i} style={{overflow: 'hidden', display: 'inline-block', paddingBottom: size * 0.12}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 110}%)`}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

export const HoneyFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 18], [1, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 24, durationInFrames - 1], [0, 1], {extrapolateLeft: 'clamp'});
  const photoIn = spring({frame: frame - 10, fps, config: {damping: 200}, durationInFrames: 50});
  const kenBurns = interpolate(frame, [0, durationInFrames], [1.18, 1.04]);
  const tagIn = spring({frame: frame - 150, fps, config: {damping: 200}});

  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 70% 40%, ${C.cream} 0%, ${C.cream2} 60%, #efd3a3 100%)`}}>
      {/* far: honeycomb wall */}
      <Layer depth={0.25}>
        <Honeycomb />
      </Layer>

      {/* far-mid: soft bokeh */}
      <Layer depth={0.45}>
        <Bokeh seed={1} count={14} blur={10} size={40} />
      </Layer>

      {/* mid: arched photo of the hives */}
      <Layer depth={0.6}>
        <div style={{position: 'absolute', right: 140, top: 110, width: 620, height: 800, borderRadius: '310px 310px 40px 40px', overflow: 'hidden', clipPath: `inset(${(1 - photoIn) * 100}% 0 0 0 round 310px 310px 40px 40px)`, boxShadow: '0 40px 80px rgba(43,26,14,.25)'}}>
          <Img src={staticFile('story.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kenBurns})`}} />
        </div>
      </Layer>

      {/* honey drips from the top edge */}
      <Layer depth={0.8}>
        <Drip x={240} delay={6} len={260} />
        <Drip x={420} delay={20} len={170} />
        <Drip x={1010} delay={34} len={220} />
      </Layer>

      {/* type */}
      <Layer depth={0.9}>
        <div style={{position: 'absolute', left: 150, top: 330, width: 900}}>
          <div style={{fontFamily: sans, fontSize: 26, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.amber, marginBottom: 28, opacity: interpolate(frame, [30, 50], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})}}>
            Raw honey · Bangalore
          </div>
          <Words text="Nothing added." start={40} size={124} />
          <Words text="Nothing taken away." start={70} size={124} italic color={C.amber} />
          <div style={{marginTop: 46, display: 'flex', gap: 18, fontFamily: sans, fontSize: 28, color: C.ink, opacity: tagIn, transform: `translateY(${(1 - tagIn) * 30}px)`}}>
            {['Raw', 'Unheated', 'Unfiltered'].map((t) => (
              <span key={t} style={{border: `2px solid ${C.ink}`, borderRadius: 99, padding: '10px 26px'}}>{t}</span>
            ))}
          </div>
        </div>
      </Layer>

      {/* near: the jars */}
      <Layer depth={1.1}>
        <Jar src="acacia.webp" left={990} height={500} delay={60} tilt={-10} />
        <Jar src="forest.webp" left={1230} height={580} delay={78} tilt={8} />
        <Jar src="sidr.webp" left={1450} height={460} delay={96} tilt={12} />
      </Layer>

      {/* nearest: big blurred bokeh sweeping past the lens */}
      <Layer depth={2.2}>
        <Bokeh seed={7} count={6} blur={18} size={90} />
      </Layer>

      <AbsoluteFill style={{background: C.cream, opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
