import base64, re, sys
import os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
html = open(D + 'src.html', encoding='utf-8').read()

def rep(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        sys.exit(f'expected {count} got {n}: {old[:80]!r}')
    html = html.replace(old, new)

# ---------------- CSS ----------------
rep(".logo svg{width:34px;height:34px}",
    ".logo img{height:40px;width:auto}")
rep(""".scene{position:absolute;right:-4%;bottom:0;width:min(62vw,860px);height:100%;z-index:1;pointer-events:none}
.scene svg{position:absolute;inset:auto 0 0 auto;width:100%;height:auto;opacity:0;transform:translateY(40px) scale(.96);transition:opacity 1s,transform 1.2s cubic-bezier(.2,.7,.2,1)}
.scene svg.active{opacity:1;transform:none}""",
""".scene{position:absolute;right:max(3vw,16px);top:110px;bottom:120px;width:min(40vw,600px);z-index:2;pointer-events:none;display:flex;align-items:center;justify-content:center}
.scene::before{content:"";position:absolute;width:78%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75),rgba(255,255,255,0) 68%)}
.scene .stage{position:relative;display:grid;grid-template:100%/100%;place-items:end center;height:min(60vh,560px);width:100%;transform:translate(var(--px,0px),var(--py,0px));transition:transform .4s ease-out}
.scene img{grid-area:1/1;height:100%;min-height:0;width:auto;max-width:100%;object-fit:contain;object-position:bottom;opacity:0;transform:translateY(50px) scale(.92) rotate(-4deg);transition:opacity .9s,transform 1.2s cubic-bezier(.2,.7,.2,1);filter:drop-shadow(0 40px 40px rgba(43,26,14,.28))}
.scene img.active{opacity:1;transform:none;animation:bob 6s ease-in-out 1.2s infinite}
@keyframes bob{50%{transform:translateY(-12px) rotate(1deg)}}
.hero h1{max-width:10ch}
.hero .wrap{position:relative;z-index:3}
.toast:not(.show){transform:translate(-50%,calc(100% + 40px))}""")

rep(""".card .art svg.jar{height:300px;width:auto;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.card:hover .art svg.jar{transform:translateY(-14px) rotate(-4deg)}""",
""".card .art .jar{height:300px;width:auto;max-width:92%;object-fit:contain;position:relative;transition:transform .7s cubic-bezier(.2,.7,.2,1),opacity .6s}
.card .art .life{position:absolute;inset:14px 14px 0;width:calc(100% - 28px);height:calc(100% - 14px);object-fit:cover;object-position:50% 100%;border-radius:20px;opacity:0;transition:opacity .6s;z-index:1}
.card:hover .art .life{opacity:1}
.card:hover .art:has(.life) .jar,.card:hover .art:has(.life) .blob{opacity:0}""")

rep(".story .visual svg{position:absolute;inset:0;width:100%;height:100%}",
    ".story .visual img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}")

rep(""".post .cat{font-size:13px;border:1px solid var(--line);border-radius:99px;padding:5px 12px;white-space:nowrap}""",
""".post .cat{font-size:13px;border:1px solid var(--line);border-radius:99px;padding:5px 12px;white-space:nowrap}
.feat{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px}
.fpost{display:flex;flex-direction:column;gap:14px;padding-bottom:20px}
.fpost .ph{aspect-ratio:16/11;border-radius:28px;overflow:hidden;background:var(--cream-2)}
.fpost .ph img{width:100%;height:100%;object-fit:cover;transition:transform 1s cubic-bezier(.2,.7,.2,1)}
.fpost:hover .ph img{transform:scale(1.05)}
.fpost .row{display:flex;gap:12px;align-items:center;font-size:14px;color:var(--ink-soft)}
.fpost h3{font-family:var(--serif);font-weight:400;font-size:clamp(24px,2.6vw,34px);letter-spacing:-.02em;line-height:1.1}""")

rep(""".card .art svg.jar{transform:translate(var(--tx,0px),var(--ty,0px));filter:drop-shadow(0 30px 30px rgba(43,26,14,.25))}
.card:hover .art svg.jar{transform:translate(var(--tx,0px),calc(var(--ty,0px) - 14px)) rotate(-4deg)}""",
""".card .art .jar{transform:translate(var(--tx,0px),var(--ty,0px));filter:drop-shadow(0 30px 30px rgba(43,26,14,.25))}
.card:hover .art .jar{transform:translate(var(--tx,0px),calc(var(--ty,0px) - 14px)) rotate(-4deg)}""")
rep(".story .visual svg{transition:transform .2s linear}", ".story .visual img{transition:transform .2s linear}")
rep("@media (max-width:720px){.hero{justify-content:flex-start;padding-top:110px}}",
    "@media (max-width:720px){.hero{justify-content:flex-start;padding-top:110px;padding-bottom:calc(min(40vh,340px) + 100px)}}")

rep("  .scene{width:120vw;right:-30vw;opacity:.55}",
    "  .scene{top:auto;bottom:80px;left:16px;right:16px;width:auto;height:min(40vh,340px)}\n  .scene .stage{height:100%}\n  .feat{grid-template-columns:1fr}")
rep("  .card .art svg.jar{height:240px}", "  .card .art .jar{height:240px}")
rep("  .badge{width:104px;height:104px;top:auto;bottom:96px;right:16px}",
    "  .badge{width:96px;height:96px;top:auto;bottom:calc(min(40vh,340px) + 20px);right:16px}")

# ---------------- Markup ----------------
rep("""<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l14.7 8.5v17L20 37 5.3 28.5v-17z" fill="#e8a317"/><path d="M20 11c-4 4.5-6 8-6 11a6 6 0 0012 0c0-3-2-6.5-6-11z" fill="#2b1a0e"/></svg>
      Safa
""", """<img src="__IMG_logo__" alt="">
      Honey
""")

rep("""  <canvas id="gl" class="gl" aria-hidden="true"></canvas>
""", """  <canvas id="gl" class="gl" aria-hidden="true"></canvas>

  <div class="scene" aria-hidden="true">
    <div class="stage" id="stage">
      <img class="active" src="__IMG_forest__" alt="">
      <img src="__IMG_acacia__" alt="" loading="lazy">
      <img src="__IMG_sidr__" alt="" loading="lazy">
    </div>
  </div>
""")

story_svg = re.search(r'      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">.*?</svg>\n', html, re.S).group(0)
rep(story_svg, '      <img src="__IMG_story__" alt="" loading="lazy">\n')
rep('<div class="visual rv" aria-hidden="true">', '<div class="visual rv" role="img" aria-label="Raw honey running off a dipper in front of wooden beehives">')

rep("""    <div class="posts">
      <a href="#" class="post rv"><time>Apr 2019</time><h3>5 things that start happening when you take honey every day</h3><span class="cat">Everyday</span></a>
      <a href="#" class="post rv"><time>Oct 2018</time><h3>5 ways to supercharge your breakfast with honey</h3><span class="cat">Recipes</span></a>
      <a href="#" class="post rv"><time>Sep 2018</time><h3>3 DIY natural honey hair-care masks</h3><span class="cat">Beauty</span></a>
      <a href="#" class="post rv"><time>Mar 2018</time><h3>Ginger &amp; honey: a warming tradition</h3><span class="cat">Rituals</span></a>
    </div>""",
"""    <div class="feat">
      <a href="#" class="fpost rv"><div class="ph"><img src="__IMG_lifestyle__" alt="A family laughing in the kitchen with a jar of Safa Raw Acacia Honey" loading="lazy" style="object-position:50% 100%"></div><div class="row"><time>Apr 2019</time><span class="cat">Everyday</span></div><h3>5 things that start happening when you take honey every day</h3></a>
      <a href="#" class="fpost rv"><div class="ph"><img src="__IMG_ginger__" alt="Honey dripping from a dipper into a glass bowl beside fresh ginger root" loading="lazy"></div><div class="row"><time>Mar 2018</time><span class="cat">Rituals</span></div><h3>Ginger &amp; honey: a warming tradition</h3></a>
    </div>
    <div class="posts">
      <a href="#" class="post rv"><time>Oct 2018</time><h3>5 ways to supercharge your breakfast with honey</h3><span class="cat">Recipes</span></a>
      <a href="#" class="post rv"><time>Sep 2018</time><h3>3 DIY natural honey hair-care masks</h3><span class="cat">Beauty</span></a>
    </div>""")
rep('.fpost .row{display:flex;', '.fpost .row .cat{font-size:13px;border:1px solid var(--line);border-radius:99px;padding:5px 12px;color:var(--ink)}\n.fpost .row{display:flex;')

# ---------------- Products JS ----------------
rep("""/* ---------- Products ---------- */
const products=[""", """/* ---------- Products ---------- */
const IMG={forest:"__IMG_forest__",neem:"__IMG_neem__",sidr:"__IMG_sidr__",acacia:"__IMG_acacia__",wild:"__IMG_wild__",wild3k:"__IMG_wild3k__",acv:"__IMG_acv__",life:"__IMG_lifestyle__"};
const products=[""")
for old, new in [
    ('cat:"raw",wide:true,lbl:"#fdf3e4"}', 'cat:"raw",wide:true,lbl:"#fdf3e4",img:"forest"}'),
    ('cat:"herbal",lbl:"#fdf3e4"}', 'cat:"herbal",lbl:"#fdf3e4",img:"neem"}'),
    ('c:"#f08a4b",h:"#9b4a10",cat:"raw",lbl:"#fdf3e4"}', 'c:"#f08a4b",h:"#9b4a10",cat:"raw",lbl:"#fdf3e4",img:"sidr"}'),
    ('cat:"raw",sold:true,lbl:"#2b1a0e"}', 'cat:"raw",sold:true,lbl:"#2b1a0e",img:"acacia",life:true}'),
    ('c:"#e9a48f",h:"#8a4310",cat:"raw",sold:true,lbl:"#fdf3e4"}', 'c:"#e9a48f",h:"#8a4310",cat:"raw",sold:true,lbl:"#fdf3e4",img:"wild"}'),
    ('wide:true,big:true,lbl:"#fdf3e4"}', 'wide:true,big:true,lbl:"#fdf3e4",img:"wild3k"}'),
    ('bottle:true,sold:true,lbl:"#2b1a0e"}', 'bottle:true,sold:true,lbl:"#2b1a0e",img:"acv"}'),
]:
    rep(old, new)
rep("""function jar(pr){
  if(pr.bottle){""", """function jar(pr){
  if(pr.img)return `<img class="jar" src="${IMG[pr.img]}" alt="" loading="lazy" decoding="async">${pr.life?`<img class="life" src="${IMG.life}" alt="" loading="lazy">`:''}`;
  if(pr.bottle){""")

# hero slider + story parallax selectors
rep("const slides=[...document.querySelectorAll('.scene svg')]", "const slides=[...document.querySelectorAll('.scene img')]")
rep("const sv=document.querySelector('.story .visual svg');", "const sv=document.querySelector('.story .visual img');")
rep("""dots.forEach((d,k)=>d.addEventListener('click',()=>go(k)));""",
"""dots.forEach((d,k)=>d.addEventListener('click',()=>go(k)));
const stage=document.getElementById('stage');
if(matchMedia('(hover:hover)').matches)addEventListener('pointermove',e=>{stage.style.setProperty('--px',(e.clientX/innerWidth-.5)*-24+'px');stage.style.setProperty('--py',(e.clientY/innerHeight-.5)*-16+'px')},{passive:true});""")

# ---------------- Three.js: keep only the ambient honeycomb cells ----------------
s = html.index('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
e = html.index('</script>', html.index('<script>', s)) + len('</script>')
html = html[:s] + '''<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
/* ambient floating honeycomb cells behind the hero photo */
(function(){
if(!window.THREE)return;
const canvas=document.getElementById('gl'),hero=document.getElementById('hero');
const R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.1,100);cam.position.set(0,0,11);
const pm=new THREE.PMREMGenerator(R),env=new THREE.Scene();
env.add(new THREE.Mesh(new THREE.SphereGeometry(20,32,16),new THREE.MeshBasicMaterial({color:0xf3e2c4,side:THREE.BackSide})));
[[6,6,-4,8,4],[-7,2,3,5,7],[0,-6,5,10,2]].forEach(([x,y,z,w,h])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m)});
scene.environment=pm.fromScene(env,.04).texture;
scene.add(new THREE.HemisphereLight(0xfff4dd,0x6b4a2a,.7));
const key=new THREE.DirectionalLight(0xffe2b0,1.6);key.position.set(4,6,6);scene.add(key);
const hexMat=new THREE.MeshPhysicalMaterial({color:0xe8a317,roughness:.15,clearcoat:1,transmission:.5,thickness:1,envMapIntensity:1.2});
const hexGeo=new THREE.CylinderGeometry(.32,.32,.16,6);
const hexes=[];
for(let k=0;k<18;k++){const h=new THREE.Mesh(hexGeo,hexMat);
  h.position.set((Math.random()-.5)*12,(Math.random()-.5)*7,-1-Math.random()*5);
  h.rotation.set(Math.random()*6,Math.random()*6,0);const s=.5+Math.random()*.9;h.scale.setScalar(s);
  h.userData={sp:.2+Math.random()*.5,ph:Math.random()*6,y:h.position.y};scene.add(h);hexes.push(h)}
const tints=[0xe8a317,0xf2c94c,0xd9773a],target=new THREE.Color(0xe8a317);
window.setTint=i=>target.setHex(tints[i]);
function size(){const w=hero.clientWidth,h=hero.clientHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',size);size();
let mx=0,my=0,tx=0,ty=0;
addEventListener('pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5},{passive:true});
let visible=true;new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(hero);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);if(!visible)return;
  const t=reduce?0:clock.getElapsedTime();
  mx+=(tx-mx)*.05;my+=(ty-my)*.05;
  cam.position.x=mx*1.2;cam.position.y=-my*.8;cam.lookAt(0,0,-3);
  hexMat.color.lerp(target,.04);
  hexes.forEach(h=>{h.rotation.x+=.003*h.userData.sp;h.rotation.y+=.004*h.userData.sp;h.position.y=h.userData.y+Math.sin(t*h.userData.sp+h.userData.ph)*.3});
  R.render(scene,cam);
}
frame();
canvas.classList.add('on');
})();
</script>''' + html[e:]

# ---------------- embed images ----------------
mime = {'webp': 'image/webp', 'png': 'image/png'}
files = {'logo': 'logo.png', 'forest': 'forest.webp', 'acacia': 'acacia.webp', 'sidr': 'sidr.webp', 'neem': 'neem.webp',
         'wild': 'wild.webp', 'wild3k': 'wild3k.webp', 'acv': 'acv.webp', 'lifestyle': 'lifestyle.webp',
         'story': 'story.webp', 'ginger': 'ginger.webp'}
for k, f in files.items():
    ph = f'__IMG_{k}__'
    if ph not in html:
        sys.exit('missing placeholder ' + ph)
    uri = f'data:{mime[f.rsplit(".",1)[1]]};base64,' + base64.b64encode(open(D + '../assets/' + f, 'rb').read()).decode()
    html = html.replace(ph, uri)
assert '__IMG_' not in html
open(D + '../index.html', 'w', encoding='utf-8').write(html)
print('ok', len(html))
