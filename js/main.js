"use strict";
/* ═══════════════════════════════════════════
   PRINTCRAFT BD — main.js  (v2)
   1.  State & utils
   2.  Cursor
   3.  Navbar
   4.  Theme
   5.  Language
   6.  Hero Three.js scene
   7.  Product data
   8.  Product card viewers (drag-to-spin)
   9.  Category filter
   10. Quick-view modal
   11. Gallery scenes
   12. Scroll reveal / steps
   13. Testimonial carousel
   14. Form
   15. WhatsApp FAB
   16. Init
═══════════════════════════════════════════ */

/* ─── 1. STATE & UTILS ─── */
const state = { theme:'dark', lang:'en', mouse:{x:0,y:0,nx:0,ny:0} };
const $  = (s,c=document) => c.querySelector(s);
const $$ = (s,c=document) => [...c.querySelectorAll(s)];
const lerp = (a,b,t) => a+(b-a)*t;

/* ─── 2. CURSOR ─── */
function initCursor(){
  const dot=$('#cursorDot'), ring=$('#cursorRing');
  if(!dot||!ring) return;
  let rx=0,ry=0,rafId;
  document.addEventListener('mousemove',e=>{
    dot.style.left=e.clientX+'px'; dot.style.top=e.clientY+'px';
    state.mouse.x=e.clientX; state.mouse.y=e.clientY;
    state.mouse.nx=(e.clientX/innerWidth)*2-1;
    state.mouse.ny=(e.clientY/innerHeight)*2-1;
    cancelAnimationFrame(rafId);
    const cx=e.clientX, cy=e.clientY;
    (function follow(){
      rx=lerp(rx,cx,.14); ry=lerp(ry,cy,.14);
      ring.style.left=rx+'px'; ring.style.top=ry+'px';
      if(Math.abs(rx-cx)>.5||Math.abs(ry-cy)>.5) rafId=requestAnimationFrame(follow);
    })();
  });
  $$('a,button,.prod-card,.gallery-item,.testi-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('cursor-hover'));
  });
}

/* ─── 3. NAVBAR ─── */
function initNavbar(){
  const nav=$('#navbar');
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40),{passive:true});
}

/* ─── 4. THEME ─── */
function initTheme(){
  $('#themeToggle').addEventListener('click',()=>{
    state.theme = state.theme==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',state.theme);
    $('#themeIcon').textContent = state.theme==='dark'?'🌙':'☀️';
    document.dispatchEvent(new CustomEvent('themechange',{detail:state.theme}));
  });
}

/* ─── 5. LANGUAGE ─── */
function initLang(){
  function apply(lang){
    state.lang=lang;
    document.documentElement.setAttribute('data-lang',lang);
    $$('[data-en]').forEach(el=>{
      const v=el.getAttribute('data-'+lang); if(!v) return;
      if(v.includes('<')) el.innerHTML=v;
      else if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.placeholder=v;
      else el.textContent=v;
    });
    $('#langEN').classList.toggle('active',lang==='en');
    $('#langBN').classList.toggle('active',lang==='bn');
  }
  $('#langToggle').addEventListener('click',()=>apply(state.lang==='en'?'bn':'en'));
}

/* ─── 6. HERO SCENE ─── */
function initHeroScene(){
  const canvas=$('#heroCanvas');
  if(!canvas||typeof THREE==='undefined') return;
  const W=()=>innerWidth, H=()=>innerHeight;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W(),H());
  renderer.setClearColor(0,0);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,W()/H(),.1,100);
  camera.position.z=5;

  scene.add(new THREE.AmbientLight(0xffffff,.4));
  const dl=new THREE.DirectionalLight(0x7c5cff,1.8); dl.position.set(3,5,3); scene.add(dl);
  const pl1=new THREE.PointLight(0x00d4ff,1.5,12); pl1.position.set(-3,2,2); scene.add(pl1);
  const pl2=new THREE.PointLight(0xff4da6,1.0,10); pl2.position.set(4,-2,1); scene.add(pl2);

  const mat=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:.2,roughness:.3,metalness:.6});

  // Dragon
  const dg=new THREE.Group();
  const dBody=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),mat(0x7c5cff,0x3a1a80));
  dBody.scale.set(1,1.3,.9); dg.add(dBody);
  const dHead=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),mat(0x7c5cff));
  dHead.scale.set(1.1,1,.85); dHead.position.set(0,.52,.18); dg.add(dHead);
  const snout=new THREE.Mesh(new THREE.ConeGeometry(.1,.2,8),mat(0x5a3db5));
  snout.rotation.x=Math.PI/2; snout.position.set(0,.52,.42); dg.add(snout);
  const ws=new THREE.Shape(); ws.moveTo(0,0); ws.lineTo(.6,.5); ws.lineTo(.5,-.3);
  const wm=new THREE.MeshStandardMaterial({color:0xb084ff,side:THREE.DoubleSide,transparent:true,opacity:.8,roughness:.4});
  const wL=new THREE.Mesh(new THREE.ShapeGeometry(ws),wm); wL.position.set(-.35,.1,0); wL.rotation.y=-.3; dg.add(wL);
  const wR=wL.clone(); wR.position.x=.35; wR.rotation.y=Math.PI+.3; wR.scale.x=-1; dg.add(wR);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.06,.01,.55,8),mat(0x7c5cff));
  tail.rotation.z=Math.PI/4; tail.position.set(.25,-.55,0); dg.add(tail);
  dg.position.set(1.6,.3,-.5); scene.add(dg);

  // Elephant
  const eg=new THREE.Group();
  const em=mat(0x00d4ff,0x003d4f);
  eg.add(new THREE.Mesh(new THREE.SphereGeometry(.3,14,10),em));
  const eH=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),em); eH.position.set(0,.38,.15); eg.add(eH);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.06,.04,.35,8),em);
  tr.rotation.x=Math.PI/2; tr.position.set(0,.28,.45); eg.add(tr);
  const earM=new THREE.MeshStandardMaterial({color:0x00b8d9,side:THREE.DoubleSide});
  const eaL=new THREE.Mesh(new THREE.CircleGeometry(.15,12),earM); eaL.position.set(-.28,.4,.05); eaL.rotation.y=.4; eg.add(eaL);
  const eaR=eaL.clone(); eaR.position.x=.28; eaR.rotation.y=-.4; eg.add(eaR);
  eg.position.set(-1.9,-.2,.2); scene.add(eg);

  // Snake
  const sg=new THREE.Group();
  const sm=mat(0x1bea8a,0x074433);
  const spts=[];
  for(let i=0;i<40;i++){const t=i/39; spts.push(new THREE.Vector3(Math.sin(t*Math.PI*3)*.28,t*.7-.35,Math.cos(t*Math.PI*2)*.12));}
  sg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spts),60,.055,8,false),sm));
  sg.position.set(-.3,-.5,.8); scene.add(sg);

  // Keychain
  const kg=new THREE.Group();
  const km=mat(0xffd700,0x806600);
  kg.add(new THREE.Mesh(new THREE.TorusGeometry(.18,.04,8,24),km));
  const kTag=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,.05),mat(0x00d4ff)); kTag.position.y=-.28; kg.add(kTag);
  kg.position.set(.6,-.8,.6); scene.add(kg);

  // Action figure
  const fg=new THREE.Group();
  const fm=mat(0xff4da6,0x7a0040), fa=mat(0xffd700);
  fg.add(new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.15),fm));
  const fH=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),fm); fH.position.y=.26; fg.add(fH);
  const aG=new THREE.CylinderGeometry(.04,.035,.26,8);
  const aL2=new THREE.Mesh(aG,fm); aL2.position.set(-.17,.05,0); aL2.rotation.z=.5; fg.add(aL2);
  const aR2=aL2.clone(); aR2.position.x=.17; aR2.rotation.z=-.5; fg.add(aR2);
  const lG=new THREE.CylinderGeometry(.05,.04,.28,8);
  const lL2=new THREE.Mesh(lG,fm); lL2.position.set(-.08,-.28,0); fg.add(lL2);
  const lR2=lL2.clone(); lR2.position.x=.08; fg.add(lR2);
  fg.add(new THREE.Mesh(new THREE.BoxGeometry(.24,.05,.16),fa));
  fg.position.set(-.6,.6,.4); scene.add(fg);

  // Particles
  const pPos=new Float32Array(80*3);
  for(let i=0;i<80;i++){pPos[i*3]=(Math.random()-.5)*12;pPos[i*3+1]=(Math.random()-.5)*8;pPos[i*3+2]=(Math.random()-.5)*6-2;}
  const pGeo=new THREE.BufferGeometry(); pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0x7c5cff,size:.04,transparent:true,opacity:.6}));
  scene.add(particles);

  const clock=new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    const t=clock.getElapsedTime();
    camera.rotation.y=lerp(camera.rotation.y,state.mouse.nx*.25,.04);
    camera.rotation.x=lerp(camera.rotation.x,state.mouse.ny*.15,.04);
    dg.rotation.y=t*.4; dg.position.y=.3+Math.sin(t*.7)*.18;
    wL.rotation.z=-.3+Math.sin(t*2.5)*.25; wR.rotation.z=.3-Math.sin(t*2.5)*.25;
    eg.rotation.y=-t*.25; eg.position.y=-.2+Math.sin(t*.9+1)*.15;
    sg.rotation.y=t*.5; sg.position.y=-.5+Math.sin(t*1.1)*.12;
    kg.rotation.y=t*.8; kg.position.y=-.8+Math.sin(t*1.4+2)*.2;
    fg.rotation.y=-t*.35; fg.position.y=.6+Math.sin(t*.8+3)*.14;
    particles.rotation.y=t*.02;
    pl1.intensity=1.5+Math.sin(t*1.2)*.4;
    pl2.intensity=1.0+Math.sin(t*.9+2)*.3;
    renderer.render(scene,camera);
  })();

  window.addEventListener('resize',()=>{
    camera.aspect=W()/H(); camera.updateProjectionMatrix();
    renderer.setSize(W(),H());
  });
}

/* ─── 7. PRODUCT DATA ─── */
const PRODUCTS = {
  nightfury: {
    cat:'Dragon', catbn:'ড্রাগন',
    title:'Night Fury Dragon', titlebn:'নাইট ফিউরি ড্রাগন',
    desc:'Sleek, poseable dragon inspired by legendary night dragons. Highly detailed surface finish with smooth matte black coating.',
    descbn:'মসৃণ, কিংবদন্তি রাত্রি ড্রাগন থেকে অনুপ্রাণিত। উচ্চ-বিস্তারিত পৃষ্ঠের সাথে মসৃণ ম্যাট কালো আবরণ।',
    specs:['~14cm wingspan','Matte black PLA finish','Poseable tail & wings','Free colour change option'],
    specbn:['~১৪ সেমি পাখার বিস্তার','ম্যাট কালো PLA ফিনিশ','পোজযোগ্য লেজ ও ডানা','বিনামূল্যে রঙ পরিবর্তন'],
    price:'৳ 650', color:0x2a1a6e,
    build: buildDragonNight
  },
  kitten:{
    cat:'Cute Toy', catbn:'কিউট খেলনা',
    title:'Cute Kitten Figurine', titlebn:'কিউট কিটেন ফিগারিন',
    desc:'Adorable sitting kitten with oversized round eyes and tiny folded ears. Available in 10 pastel colour options.',
    descbn:'বড় গোল চোখের সুন্দর বসা বিড়াল। ১০টি প্যাস্টেল রঙে পাওয়া যায়।',
    specs:['~8cm tall','10 colour options','Smooth resin finish','Perfect desk companion'],
    specbn:['~৮ সেমি উচ্চতা','১০টি রঙের বিকল্প','মসৃণ রেজিন ফিনিশ','নিখুঁত ডেস্ক সঙ্গী'],
    price:'৳ 380', color:0xff9acd,
    build: buildKitten
  },
  raptor:{
    cat:'Dinosaur', catbn:'ডাইনোসর',
    title:'Velociraptor', titlebn:'ভেলোসির‍্যাপ্টর',
    desc:'High-detail running raptor in mid-stride pose with articulated jaw. A collector favourite and perfect for dinosaur fans.',
    descbn:'উচ্চ-বিস্তারিত দৌড়ানো র‍্যাপ্টর। সংগ্রাহকদের প্রিয় এবং ডাইনোসর অনুরাগীদের জন্য আদর্শ।',
    specs:['~12cm long','Articulated jaw detail','Textured scale surface','Green or brown options'],
    specbn:['~১২ সেমি দীর্ঘ','আর্টিকুলেটেড চোয়ালের বিবরণ','টেক্সচার্ড স্কেল পৃষ্ঠ','সবুজ বা বাদামি বিকল্প'],
    price:'৳ 520', color:0x3a7a2a,
    build: buildRaptor
  },
  deer:{
    cat:'Baby Animal', catbn:'বেবি অ্যানিমেল',
    title:'Baby Deer (Fawn)', titlebn:'বেবি ডিয়ার',
    desc:'Gentle newborn deer in a lying pose with tiny white spot details. A favourite gift for nature lovers and children.',
    descbn:'ছোট্ট সাদা ছিট্টে বিবরণ সহ শুয়ে থাকা নবজাতক হরিণ। প্রকৃতিপ্রেমীদের প্রিয় উপহার।',
    specs:['~7cm long','White spot detailing','Warm brown PLA','Soft matte finish'],
    specbn:['~৭ সেমি দীর্ঘ','সাদা ছিট্টে বিস্তারিত','উষ্ণ বাদামি PLA','নরম ম্যাট ফিনিশ'],
    price:'৳ 420', color:0x8b5e3c,
    build: buildDeer
  },
  firedrake:{
    cat:'Dragon', catbn:'ড্রাগন',
    title:'Fire Drake Dragon', titlebn:'ফায়ার ড্রেক ড্রাগন',
    desc:'Rearing up on hind legs with wings spread wide and fierce claws extended. A stunning display piece for any shelf.',
    descbn:'পিছনের পায়ে দাঁড়িয়ে, ডানা প্রসারিত এবং ভয়ানক নখর বিস্তৃত। যেকোনো শেলফের জন্য অসাধারণ ডিসপ্লে পিস।',
    specs:['~18cm tall','Orange-red gradient','Metallic claw tips','Premium display base included'],
    specbn:['~১৮ সেমি উচ্চতা','কমলা-লাল গ্রেডিয়েন্ট','মেটালিক নখরের ডগা','প্রিমিয়াম ডিসপ্লে বেস অন্তর্ভুক্ত'],
    price:'৳ 850', color:0xff5500,
    build: buildFireDrake
  },
  cutedino:{
    cat:'Dinosaur', catbn:'ডাইনোসর',
    title:'Cute Mini Dino', titlebn:'কিউট মিনি ডাইনো',
    desc:'Chubby chibi-style dinosaur with an oversized round head, teeny arms and a big happy smile. Kids absolutely love it!',
    descbn:'বড় মাথা এবং ছোট বাহু সহ চিবি-স্টাইল ডাইনো। বাচ্চারা ভালোবাসে!',
    specs:['~6cm tall','Glossy finish','5 colour choices','Perfect party favour'],
    specbn:['~৬ সেমি উচ্চতা','চকচকে ফিনিশ','৫টি রঙের পছন্দ','নিখুঁত পার্টি ফেভার'],
    price:'৳ 350', color:0x44cc88,
    build: buildCuteDino
  },
  elephant:{
    cat:'Baby Animal', catbn:'বেবি অ্যানিমেল',
    title:'Baby Elephant', titlebn:'বেবি এলিফ্যান্ট',
    desc:'Pudgy baby elephant with oversized floppy ears and a cheeky curled trunk. Available in grey or sky blue.',
    descbn:'ঝুলন্ত কান এবং কুঁচকানো শুঁড় সহ মোটাসোটা বেবি হাতি। ধূসর বা আকাশী নীল।',
    specs:['~9cm tall','Grey or sky blue','Smooth PLA finish','Great for gifting'],
    specbn:['~৯ সেমি উচ্চতা','ধূসর বা আকাশী নীল','মসৃণ PLA ফিনিশ','উপহারের জন্য দুর্দান্ত'],
    price:'৳ 400', color:0x5bc8e0,
    build: buildElephant
  }
};

/* ─── 8a. MODEL BUILDERS ─── */
// Each receives a THREE.Group and adds meshes to it.

function buildDragonNight(g){
  const m=stdMat(0x1a0a3a,0x4a1a99);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),m); body.scale.set(1,1.25,.9); g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,12,10),m); head.scale.set(1.1,1,.88); head.position.set(0,.62,.2); g.add(head);
  const snout=new THREE.Mesh(new THREE.ConeGeometry(.1,.22,8),stdMat(0x110730)); snout.rotation.x=Math.PI/2; snout.position.set(0,.6,.5); g.add(snout);
  const wg=new THREE.Shape(); wg.moveTo(0,0); wg.lineTo(.8,.65); wg.lineTo(.65,-.38);
  const wm=new THREE.MeshStandardMaterial({color:0x3a1a7a,side:THREE.DoubleSide,transparent:true,opacity:.85});
  const wL=new THREE.Mesh(new THREE.ShapeGeometry(wg),wm); wL.position.set(-.44,.12,0); wL.rotation.y=-.28; g.add(wL);
  const wR=wL.clone(); wR.position.x=.44; wR.scale.x=-1; wR.rotation.y=Math.PI+.28; g.add(wR);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.07,.01,.65,8),m); tail.rotation.z=Math.PI/4.5; tail.position.set(.28,-.62,0); g.add(tail);
  // eye glow
  const eyeM=new THREE.MeshStandardMaterial({color:0x00d4ff,emissive:0x00d4ff,emissiveIntensity:1});
  const eL=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),eyeM); eL.position.set(-.1,.67,.42); g.add(eL);
  const eR=eL.clone(); eR.position.x=.1; g.add(eR);
}

function buildKitten(g){
  const m=stdMat(0xffccee,0x440022);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.38,14,12),m); body.scale.set(1,.95,1); g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.3,14,12),m); head.position.set(0,.56,.08); g.add(head);
  // big eyes
  const eyeM=new THREE.MeshStandardMaterial({color:0x00aaff,emissive:0x002244,roughness:.1});
  const eL=new THREE.Mesh(new THREE.SphereGeometry(.1,10,10),eyeM); eL.position.set(-.1,.62,.28); g.add(eL);
  const eR=eL.clone(); eR.position.x=.1; g.add(eR);
  const pupilM=new THREE.MeshStandardMaterial({color:0x000010});
  const pL=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),pupilM); pL.position.set(-.1,.62,.36); g.add(pL);
  const pR=pL.clone(); pR.position.x=.1; g.add(pR);
  // ears
  const earSh=new THREE.Shape(); earSh.moveTo(0,0); earSh.lineTo(.12,.22); earSh.lineTo(.22,0);
  const earM=new THREE.MeshStandardMaterial({color:0xff99cc,side:THREE.DoubleSide});
  const eaL=new THREE.Mesh(new THREE.ShapeGeometry(earSh),earM); eaL.position.set(-.28,.82,.02); eaL.rotation.z=-.1; g.add(eaL);
  const eaR=eaL.clone(); eaR.position.x=.18; eaR.scale.x=-1; g.add(eaR);
  // tail
  const tpts=[]; for(let i=0;i<20;i++){const t=i/19; tpts.push(new THREE.Vector3(-.38+t*.3,-.35+Math.sin(t*Math.PI)*.3,0));}
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts),20,.05,7),m));
}

function buildRaptor(g){
  const m=stdMat(0x2d6622,0x0a2208);
  // body (leaning forward)
  const body=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10),m); body.scale.set(1.3,.75,.85); body.rotation.z=-.5; body.position.set(.1,0,0); g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.32,10),m); neck.rotation.z=-.7; neck.position.set(-.25,.28,0); g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),m); head.scale.set(1.4,.7,.9); head.position.set(-.52,.42,0); g.add(head);
  // jaw
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.22,.06,.14),m); jaw.position.set(-.62,.3,0); g.add(jaw);
  // legs
  const lG=new THREE.CylinderGeometry(.07,.05,.38,8);
  const lL=new THREE.Mesh(lG,m); lL.position.set(.1,-.38,-.12); lL.rotation.z=.15; lL.rotation.x=-.25; g.add(lL);
  const lR=lL.clone(); lR.position.z=.12; g.add(lR);
  // tail
  const tpts=[]; for(let i=0;i<16;i++){const t=i/15; tpts.push(new THREE.Vector3(.45-.08*t,-.05-t*.15-Math.sin(t*2)*.12,0));}
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts),16,.06,7),m));
  // eye
  const eM=new THREE.MeshStandardMaterial({color:0xffdd00,emissive:0x886600,roughness:.2});
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),eM); eye.position.set(-.62,.46,.1); g.add(eye);
}

function buildDeer(g){
  const m=stdMat(0xc87840,0x3a1a00);
  // body (lying)
  const body=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),m); body.scale.set(1.4,.7,1); g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.28,10),m); neck.rotation.z=.65; neck.position.set(-.3,.22,.06); g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),m); head.position.set(-.52,.38,.06); g.add(head);
  const snout=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),stdMat(0xb86830)); snout.scale.set(1.2,.8,1); snout.position.set(-.64,.32,.08); g.add(snout);
  // spots (small white discs)
  const spotM=new THREE.MeshStandardMaterial({color:0xfff5e0});
  [[.18,.1,.38],[-.05,.15,.38],[.3,.05,.35],[.1,-.1,.38]].forEach(([x,y,z])=>{
    const s=new THREE.Mesh(new THREE.CircleGeometry(.04+Math.random()*.03,8),spotM);
    s.position.set(x,y,z); s.rotation.y=.1; g.add(s);
  });
  // legs tucked
  const legM=stdMat(0xb06828);
  const lG=new THREE.CylinderGeometry(.055,.04,.22,8);
  [[.22,-.42,.18],[-.15,-.42,.18],[.22,-.42,-.18],[-.15,-.42,-.18]].forEach(([x,y,z])=>{
    const l=new THREE.Mesh(lG,legM); l.position.set(x,y,z); l.rotation.z=.12; g.add(l);
  });
  // big ears
  const earSh=new THREE.Shape(); earSh.moveTo(0,0); earSh.bezierCurveTo(.06,.2,.14,.22,.1,0);
  const earM2=new THREE.MeshStandardMaterial({color:0xe89050,side:THREE.DoubleSide});
  const eaL=new THREE.Mesh(new THREE.ShapeGeometry(earSh),earM2); eaL.position.set(-.48,.54,.14); eaL.rotation.z=-.3; g.add(eaL);
  const eaR=eaL.clone(); eaR.position.z=-.14; eaR.rotation.z=-.5; g.add(eaR);
}

function buildFireDrake(g){
  const m=stdMat(0xcc3300,0x801800);
  const acm=stdMat(0xff8800,0xcc4400);
  // upright body
  const body=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),m); body.scale.set(.9,1.4,.85); body.position.y=-.1; g.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),acm); chest.scale.set(1,1.1,.8); chest.position.set(0,.05,.1); g.add(chest);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.3,10),m); neck.position.set(0,.55,.05); g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),m); head.scale.set(1.1,1,.9); head.position.set(0,.82,.1); g.add(head);
  const snout=new THREE.Mesh(new THREE.ConeGeometry(.1,.25,8),stdMat(0xaa2200)); snout.rotation.x=Math.PI/2; snout.position.set(0,.8,.38); g.add(snout);
  // big spread wings
  const bigWg=new THREE.Shape(); bigWg.moveTo(0,0); bigWg.lineTo(.95,.75); bigWg.lineTo(1.0,.2); bigWg.lineTo(.8,-.55); bigWg.lineTo(.2,-.3);
  const bwm=new THREE.MeshStandardMaterial({color:0xff4400,side:THREE.DoubleSide,transparent:true,opacity:.88});
  const bwL=new THREE.Mesh(new THREE.ShapeGeometry(bigWg),bwm); bwL.position.set(-.32,.25,0); bwL.rotation.y=-.22; g.add(bwL);
  const bwR=bwL.clone(); bwR.position.x=.32; bwR.scale.x=-1; bwR.rotation.y=Math.PI+.22; g.add(bwR);
  // legs with claws
  const lG=new THREE.CylinderGeometry(.09,.07,.36,8);
  const lL=new THREE.Mesh(lG,m); lL.position.set(-.16,-.56,.06); lL.rotation.z=.2; g.add(lL);
  const lR=lL.clone(); lR.position.x=.16; lR.rotation.z=-.2; g.add(lR);
  // tail going down-back
  const tpts=[]; for(let i=0;i<18;i++){const t=i/17; tpts.push(new THREE.Vector3(Math.sin(t*2)*.15,-.45-t*.6,t*.12));}
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts),18,.07,8),m));
  // eye glow orange
  const eM=new THREE.MeshStandardMaterial({color:0xffaa00,emissive:0xff6600,emissiveIntensity:1.5});
  const eL=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),eM); eL.position.set(-.09,.87,.32); g.add(eL);
  const eR=eL.clone(); eR.position.x=.09; g.add(eR);
}

function buildCuteDino(g){
  const m=stdMat(0x33cc77,0x0a4422);
  // chibi: huge round head, tiny body
  const head=new THREE.Mesh(new THREE.SphereGeometry(.42,16,14),m); head.position.y=.18; g.add(head);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),m); body.scale.set(1,.8,1); body.position.y=-.32; g.add(body);
  // big bright eyes
  const wM=new THREE.MeshStandardMaterial({color:0xffffff});
  const yM=new THREE.MeshStandardMaterial({color:0xffee00,emissive:0x886600,roughness:.2});
  const pM=new THREE.MeshStandardMaterial({color:0x000010});
  [-.16,.16].forEach(x=>{
    const w=new THREE.Mesh(new THREE.SphereGeometry(.13,10,10),wM); w.position.set(x,.26,.36); g.add(w);
    const y=new THREE.Mesh(new THREE.SphereGeometry(.1,10,10),yM); y.position.set(x,.26,.44); g.add(y);
    const p=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),pM); p.position.set(x,.26,.5); g.add(p);
  });
  // smile (torus arc)
  const smileGeo=new THREE.TorusGeometry(.14,.025,6,14,Math.PI);
  const smile=new THREE.Mesh(smileGeo,new THREE.MeshStandardMaterial({color:0x004422}));
  smile.rotation.z=Math.PI; smile.position.set(0,.06,.42); g.add(smile);
  // tiny arms
  const armG=new THREE.CylinderGeometry(.05,.04,.22,8);
  const aL=new THREE.Mesh(armG,m); aL.position.set(-.34,-.18,.06); aL.rotation.z=.8; g.add(aL);
  const aR=aL.clone(); aR.position.x=.34; aR.rotation.z=-.8; g.add(aR);
  // legs
  const legG=new THREE.CylinderGeometry(.07,.06,.28,8);
  const lL=new THREE.Mesh(legG,m); lL.position.set(-.14,-.56,.04); g.add(lL);
  const lR=lL.clone(); lR.position.x=.14; g.add(lR);
  // little dorsal spikes
  const spkM=stdMat(0x22aa55);
  for(let i=0;i<4;i++){
    const spk=new THREE.Mesh(new THREE.ConeGeometry(.04,.14,6),spkM);
    spk.position.set(0,.44-.09*i,-.3+.05*i); g.add(spk);
  }
}

function buildElephant(g){
  const m=stdMat(0x5bc8e0,0x1a4a55);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),m); body.scale.set(1,1.1,1); g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.3,14,12),m); head.position.set(0,.6,.1); g.add(head);
  // trunk curling up
  const tpts=[]; for(let i=0;i<20;i++){const t=i/19; tpts.push(new THREE.Vector3(Math.sin(t*Math.PI*.8)*.18,-.18-t*.35+Math.cos(t*Math.PI)*.15,t*.22+.28));}
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts),20,.07,8),m));
  // big floppy ears
  const earSh=new THREE.Shape(); earSh.moveTo(0,0); earSh.bezierCurveTo(-.28,.1,-.32,.45,-.1,.55); earSh.bezierCurveTo(.12,.55,.22,.35,.12,0);
  const earM=new THREE.MeshStandardMaterial({color:0x40b8d0,side:THREE.DoubleSide});
  const eaL=new THREE.Mesh(new THREE.ShapeGeometry(earSh),earM); eaL.position.set(-.42,.5,.06); eaL.rotation.y=.35; g.add(eaL);
  const eaR=eaL.clone(); eaR.position.x=.42; eaR.scale.x=-1; eaR.rotation.y=-.35; g.add(eaR);
  // legs
  const lG=new THREE.CylinderGeometry(.09,.08,.32,10);
  [[-.2,-.5,.16],[.2,-.5,.16],[-.2,-.5,-.16],[.2,-.5,-.16]].forEach(([x,y,z])=>{
    g.add(Object.assign(new THREE.Mesh(lG,m),{position:new THREE.Vector3(x,y,z)}));
    const l=new THREE.Mesh(lG,m); l.position.set(x,y,z); g.add(l);
  });
  // big smile eyes
  const eM=new THREE.MeshStandardMaterial({color:0x1a3a44});
  const eL=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),eM); eL.position.set(-.14,.64,.28); g.add(eL);
  const eR=eL.clone(); eR.position.x=.14; g.add(eR);
  const shM=new THREE.MeshStandardMaterial({color:0xffffff});
  const sL=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),shM); sL.position.set(-.12,.66,.32); g.add(sL);
  const sR=sL.clone(); sR.position.x=.16; g.add(sR);
}

// Helper: standard material
function stdMat(color, emissive=0x000000){
  return new THREE.MeshStandardMaterial({color, emissive, emissiveIntensity:.15, roughness:.35, metalness:.4});
}

/* ─── 8b. PRODUCT CARD VIEWERS (drag-to-spin) ─── */
const prodRenderers = {}; // store references

function initProductViewers(){
  if(typeof THREE==='undefined') return;

  Object.entries(PRODUCTS).forEach(([id, data])=>{
    const canvas = document.getElementById('pc-'+id);
    if(!canvas) return;

    const container = canvas.parentElement;
    const W = container.offsetWidth  || 280;
    const H = container.offsetHeight || 200;

    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0,0);
    prodRenderers[id] = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W/H, .1, 50);
    camera.position.z = 3;

    // Lighting — adjust tint per product
    scene.add(new THREE.AmbientLight(0xffffff, .55));
    const dl = new THREE.DirectionalLight(0xffffff, 1.1);
    dl.position.set(2,3,2); scene.add(dl);
    const pl = new THREE.PointLight(new THREE.Color(data.color), 2, 8);
    pl.position.set(-1.5,1,1); scene.add(pl);

    // Build the model
    const group = new THREE.Group();
    scene.add(group);
    data.build(group);

    // Drag-to-spin state
    let isDragging=false, prevX=0, rotY=0, rotX=0, velX=0, velY=0;
    let autoSpin=true;

    canvas.addEventListener('mousedown',  e=>{isDragging=true; prevX=e.clientX; autoSpin=false; velX=velY=0;});
    canvas.addEventListener('touchstart', e=>{isDragging=true; prevX=e.touches[0].clientX; autoSpin=false; velX=velY=0;},{passive:true});
    window.addEventListener('mouseup',   ()=>{isDragging=false;});
    window.addEventListener('touchend',  ()=>{isDragging=false;});

    canvas.addEventListener('mousemove', e=>{
      if(!isDragging) return;
      const dx=e.clientX-prevX;
      velX=dx*.012; rotY+=velX; prevX=e.clientX;
    });
    canvas.addEventListener('touchmove', e=>{
      if(!isDragging) return;
      const dx=e.touches[0].clientX-prevX;
      velX=dx*.012; rotY+=velX; prevX=e.touches[0].clientX;
    },{passive:true});

    // Resume auto-spin after 2s idle
    let idleTimer;
    canvas.addEventListener('mouseup', ()=>{
      clearTimeout(idleTimer);
      idleTimer = setTimeout(()=>{autoSpin=true;}, 2000);
    });

    let active = true;
    const clock = new THREE.Clock();

    // Pause when off-screen
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ active = e.isIntersecting; });
    }, {threshold:.1});
    obs.observe(container);

    (function loop(){
      requestAnimationFrame(loop);
      if(!active) return;
      const t = clock.getElapsedTime();

      if(autoSpin){
        rotY += .008;
      } else {
        velX *= .92; rotY += velX;
      }

      group.rotation.y = rotY;
      group.position.y = Math.sin(t*.7)*.08;
      pl.intensity = 2 + Math.sin(t*.9)*.5;

      renderer.render(scene, camera);
    })();
  });
}

/* ─── 8c. CTA ORB SCENE ─── */
function initCtaOrb(){
  if(typeof THREE==='undefined') return;
  const container = document.getElementById('ctaOrb');
  if(!container) return;

  const W=container.offsetWidth||300, H=container.offsetHeight||200;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.setClearColor(0,0);
  container.style.position='absolute'; container.style.inset='0';
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width='100%'; renderer.domElement.style.height='100%';

  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(50,W/H,.1,50);
  camera.position.z=3;
  scene.add(new THREE.AmbientLight(0xffffff,.3));
  const pl=new THREE.PointLight(0xff4da6,2,8); pl.position.set(0,0,2); scene.add(pl);

  // wireframe icosahedron
  const geo=new THREE.IcosahedronGeometry(.9,1);
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x7c5cff,wireframe:true,transparent:true,opacity:.5}));
  scene.add(mesh);
  const solid=new THREE.Mesh(new THREE.IcosahedronGeometry(.7,1),new THREE.MeshStandardMaterial({color:0x3a1a7a,roughness:.4,metalness:.6}));
  scene.add(solid);

  const clock=new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    const t=clock.getElapsedTime();
    mesh.rotation.y=t*.4; mesh.rotation.x=t*.2;
    solid.rotation.y=-t*.3; solid.rotation.x=t*.15;
    pl.intensity=2+Math.sin(t*1.5)*.8;
    renderer.render(scene,camera);
  })();
}

/* ─── 9. CATEGORY FILTER ─── */
function initFilter(){
  const btns  = $$('.filter-btn');
  const cards = $$('.prod-card');
  const noRes = $('#noResults');

  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      let visible=0;
      cards.forEach(card=>{
        const show = filter==='all' || card.dataset.cat===filter;
        card.classList.toggle('hidden', !show);
        if(show) visible++;
      });
      noRes.style.display = visible===0 ? 'block' : 'none';
    });
  });
}

/* ─── 10. QUICK-VIEW MODAL ─── */
let modalRenderer=null;

window.openModal = function(id){
  const data = PRODUCTS[id];
  if(!data) return;

  const overlay = $('#modalOverlay');
  const modal   = $('#prodModal');
  const lang    = state.lang;

  $('#modalCat').textContent   = lang==='bn' ? data.catbn   : data.cat;
  $('#modalTitle').textContent = lang==='bn' ? data.titlebn : data.title;
  $('#modalDesc').textContent  = lang==='bn' ? data.descbn  : data.desc;
  $('#modalPrice').textContent = data.price;

  const specs = lang==='bn' ? data.specbn : data.specs;
  $('#modalSpecs').innerHTML = specs.map(s=>`<li>${s}</li>`).join('');

  $('#modalOrderBtn').onclick = ()=>{ closeModal(); orderProduct(data.title); };

  // Build 3D in modal
  const viewer = $('#modal3d');
  viewer.innerHTML='';

  if(typeof THREE!=='undefined'){
    if(modalRenderer){ modalRenderer.dispose(); modalRenderer=null; }
    const W=viewer.offsetWidth||380, H=viewer.offsetHeight||320;
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(W,H);
    renderer.setClearColor(0,0);
    viewer.appendChild(renderer.domElement);
    renderer.domElement.style.width='100%'; renderer.domElement.style.height='100%';
    modalRenderer=renderer;

    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(46,W/H,.1,50);
    camera.position.z=3.2;
    scene.add(new THREE.AmbientLight(0xffffff,.6));
    const dl=new THREE.DirectionalLight(0xffffff,1.2); dl.position.set(2,3,2); scene.add(dl);
    const pl=new THREE.PointLight(new THREE.Color(data.color),2.5,10); pl.position.set(-2,1,2); scene.add(pl);

    const group=new THREE.Group(); scene.add(group);
    data.build(group);

    let isDrag=false, prevX=0, rotY=0, velX=0;
    renderer.domElement.addEventListener('mousedown', e=>{isDrag=true;prevX=e.clientX;velX=0;});
    renderer.domElement.addEventListener('touchstart',e=>{isDrag=true;prevX=e.touches[0].clientX;velX=0;},{passive:true});
    window.addEventListener('mouseup',()=>isDrag=false);
    window.addEventListener('touchend',()=>isDrag=false);
    renderer.domElement.addEventListener('mousemove',e=>{if(!isDrag)return;velX=(e.clientX-prevX)*.014;rotY+=velX;prevX=e.clientX;});
    renderer.domElement.addEventListener('touchmove',e=>{if(!isDrag)return;velX=(e.touches[0].clientX-prevX)*.014;rotY+=velX;prevX=e.touches[0].clientX;},{passive:true});

    let open=true;
    const clock=new THREE.Clock();
    (function loop(){
      if(!open){renderer.dispose();return;}
      requestAnimationFrame(loop);
      const t=clock.getElapsedTime();
      if(!isDrag){velX*=.94; rotY+=velX+(isDrag?0:.007);}
      group.rotation.y=rotY;
      group.position.y=Math.sin(t*.6)*.1;
      pl.intensity=2.5+Math.sin(t)*.5;
      renderer.render(scene,camera);
    })();
    modal._closeScene=()=>{open=false;};
  }

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow='hidden';
};

window.closeModal = function(){
  const overlay=$('#modalOverlay'), modal=$('#prodModal');
  overlay.classList.remove('open');
  modal.classList.remove('open');
  document.body.style.overflow='';
  if(modal._closeScene){modal._closeScene(); modal._closeScene=null;}
  setTimeout(()=>{$('#modal3d').innerHTML='';},400);
};

window.orderProduct = function(name){
  const wa=`https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent('Hello! I want to order: '+name)}`;
  window.open(wa,'_blank');
};

/* ─── 11. GALLERY SCENES ─── */
function initGalleryScenes(){
  if(typeof THREE==='undefined') return;
  const cfgs=[
    {id:'g1',hue:260,build:g=>{
      const m=stdMat(0x7c5cff,0x3a1a80);
      const b=new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),m); g.add(b);
      const h=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),m); h.position.set(0,.68,.2); g.add(h);
      const ws=new THREE.Shape(); ws.moveTo(0,0); ws.lineTo(.9,.7); ws.lineTo(.7,-.4);
      const wm=new THREE.MeshStandardMaterial({color:0xb084ff,side:THREE.DoubleSide,transparent:true,opacity:.8});
      const wL=new THREE.Mesh(new THREE.ShapeGeometry(ws),wm); wL.position.set(-.48,.1,0); wL.rotation.y=-.3; g.add(wL);
      const wR=wL.clone(); wR.position.x=.48; wR.scale.x=-1; wR.rotation.y=Math.PI+.3; g.add(wR);
    }},
    {id:'g2',hue:330,build:g=>{
      const mA=stdMat(0xff4da6), mB=stdMat(0x7c5cff);
      [[mA,-.45],[mB,.45]].forEach(([m,x])=>{
        const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.38,10),m); t.position.x=x; g.add(t);
        const h=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),m); h.position.set(x,.42,0); g.add(h);
      });
    }},
    {id:'g3',hue:200,build:g=>{
      const m=stdMat(0x00d4ff,0x003d4f);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(.48,14,10),m));
      const h=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),m); h.position.set(0,.58,.18); g.add(h);
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.08,.05,.4,8),m); tr.rotation.x=Math.PI/2; tr.position.set(0,.45,.5); g.add(tr);
      const em=new THREE.MeshStandardMaterial({color:0x00b8d9,side:THREE.DoubleSide});
      const eL=new THREE.Mesh(new THREE.CircleGeometry(.2,12),em); eL.position.set(-.34,.58,.08); eL.rotation.y=.5; g.add(eL);
      const eR=eL.clone(); eR.position.x=.34; eR.rotation.y=-.5; g.add(eR);
    }},
    {id:'g4',hue:30,build:g=>{
      const m=stdMat(0xff8c42), a=stdMat(0xffd700);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(.32,.42,.2),m));
      const h=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),m); h.position.y=.38; g.add(h);
      const aG=new THREE.CylinderGeometry(.055,.05,.36,8);
      const aL=new THREE.Mesh(aG,m); aL.position.set(-.24,.06,0); aL.rotation.z=.65; g.add(aL);
      const aR=aL.clone(); aR.position.x=.24; aR.rotation.z=-.4; g.add(aR);
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.34,.06,.22),a),{position:new THREE.Vector3(0,-.1,0)}));
    }},
    {id:'g5',hue:160,build:g=>{
      const m=stdMat(0xffd700,0x886600);
      g.add(new THREE.Mesh(new THREE.TorusGeometry(.32,.07,10,30),m));
      const tag=new THREE.Mesh(new THREE.BoxGeometry(.28,.38,.07),stdMat(0x00d4ff)); tag.position.y=-.48; g.add(tag);
      const ch=new THREE.Mesh(new THREE.TorusGeometry(.07,.025,6,12),m); ch.position.y=-.12; ch.rotation.x=Math.PI/2; g.add(ch);
    }},
    {id:'g6',hue:90,build:g=>{
      const m=stdMat(0x1bea8a);
      const pts=[]; for(let i=0;i<36;i++){const t=i/35; pts.push(new THREE.Vector3(Math.sin(t*Math.PI*3)*.35,t*.9-.45,Math.cos(t*Math.PI*2)*.15));}
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),50,.065,8),m));
      const sh=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),m); sh.position.copy(pts[35]); g.add(sh);
    }},
  ];

  cfgs.forEach(({id,hue,build})=>{
    const container=document.getElementById(id);
    if(!container) return;
    const W=container.offsetWidth||300, H=container.offsetHeight||300;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setSize(W,H); renderer.setClearColor(0,0);
    container.style.position='absolute'; container.style.inset='0';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width='100%'; renderer.domElement.style.height='100%';

    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(50,W/H,.1,50);
    camera.position.z=3;
    scene.add(new THREE.AmbientLight(0xffffff,.5));
    const dl=new THREE.DirectionalLight(0xffffff,1.2); dl.position.set(2,3,2); scene.add(dl);
    const pl=new THREE.PointLight(new THREE.Color().setHSL(hue/360,.8,.5),1.8,8); pl.position.set(-1.5,1,1); scene.add(pl);
    const group=new THREE.Group(); scene.add(group); build(group);

    let active=false;
    const obs=new IntersectionObserver(e=>{active=e[0].isIntersecting;});
    obs.observe(container.parentElement);
    const clock=new THREE.Clock();
    (function loop(){
      requestAnimationFrame(loop);
      if(!active) return;
      const t=clock.getElapsedTime();
      group.rotation.y=t*.55; group.position.y=Math.sin(t*.75)*.12;
      renderer.render(scene,camera);
    })();
  });
}

/* ─── 12. SCROLL REVEAL & STEPS ─── */
function initReveal(){
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach((e,i)=>{
      if(e.isIntersecting){
        const delay=parseInt(e.target.dataset.delay||0);
        setTimeout(()=>e.target.classList.add('in'), delay);
        obs.unobserve(e.target);
      }
    });
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});

  $$('.reveal,.prod-card,.gallery-item,.step-node').forEach(el=>obs.observe(el));

  $$('.section-header').forEach(h=>{
    [h.querySelector('.section-tag'),h.querySelector('h2'),h.querySelector('p')]
      .filter(Boolean).forEach((el,i)=>{
        el.classList.add('reveal');
        el.style.transitionDelay=`${i*.1}s`;
        obs.observe(el);
      });
  });

  // steps progress line
  const progress=$('#stepsProgress'), track=$('.steps-track');
  if(progress&&track){
    new IntersectionObserver(e=>{
      if(e[0].isIntersecting) progress.style.height='100%';
    },{threshold:.3}).observe(track);
  }
}

/* ─── 13. TESTIMONIALS ─── */
function initTestimonials(){
  const track=$('#testimonialTrack'), dotsWrap=$('#testiDots');
  if(!track||!dotsWrap) return;
  const cards=$$('.testi-card',track);
  let current=0;
  cards.forEach((_,i)=>{
    const d=document.createElement('div');
    d.className='testi-dot'+(i===0?' active':'');
    d.addEventListener('click',()=>goTo(i));
    dotsWrap.appendChild(d);
  });
  function goTo(i){
    current=i;
    track.scrollTo({left:cards[i].offsetLeft-24,behavior:'smooth'});
    $$('.testi-dot',dotsWrap).forEach((d,j)=>d.classList.toggle('active',j===i));
  }
  setInterval(()=>goTo((current+1)%cards.length),4500);
  track.addEventListener('scroll',()=>{
    const idx=Math.round(track.scrollLeft/(cards[0]?.offsetWidth+20||320));
    if(idx!==current){current=idx;$$('.testi-dot',dotsWrap).forEach((d,j)=>d.classList.toggle('active',j===current));}
  },{passive:true});
}

/* ─── 14. FORM ─── */
function initForm(){
  const zone=$('#uploadZone'), input=$('#fileInput');
  if(zone&&input){
    zone.addEventListener('click',()=>input.click());
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');if(e.dataTransfer.files[0])showFile(e.dataTransfer.files[0]);});
  }
}
window.handleFile=e=>{if(e.target.files[0])showFile(e.target.files[0]);};
function showFile(f){
  const z=$('#uploadZone'); if(!z) return;
  z.innerHTML=`<div class="upload-icon" style="color:var(--green)">✓</div><span>${f.name}</span>`;
  z.style.borderColor='var(--green)'; z.style.color='var(--green)';
}
window.handleFormSubmit=e=>{
  e.preventDefault();
  const btn=e.target.querySelector('.btn-primary'), suc=$('#formSuccess');
  btn.querySelector('span').textContent='Sending...';
  btn.disabled=true;
  setTimeout(()=>{
    btn.style.display='none';
    if(suc){suc.style.display='flex';suc.classList.add('show');}
  },1200);
};

/* ─── 15. WA FAB ─── */
function initWaFab(){
  const fab=$('#waFab'); if(!fab) return;
  window.addEventListener('scroll',()=>fab.classList.toggle('show',scrollY>300),{passive:true});
}

/* ─── 16. INIT ─── */
document.addEventListener('DOMContentLoaded',()=>{
  initCursor();
  initNavbar();
  initTheme();
  initLang();
  initReveal();
  initTestimonials();
  initForm();
  initWaFab();
  initFilter();

  if(typeof THREE!=='undefined'){
    initHeroScene();
    // Stagger heavy 3D inits to avoid janky load
    setTimeout(()=>initProductViewers(), 200);
    setTimeout(()=>initCtaOrb(), 400);
    setTimeout(()=>initGalleryScenes(), 600);
  }
});
