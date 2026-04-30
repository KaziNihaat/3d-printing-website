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

/* ─── 6. HERO SCENE — Premium 3D Experience ───
   Objects: Dragon · Kitten · Dino · Keychain
   Features:
   - Per-object soft glow point lights
   - Smooth mouse parallax (lerped camera drift)
   - Elegant floating + slow rotation per object
   - Depth layering (near/mid/far positions)
   - 120 ambient particles with two colour pools
   - Reduced pixel ratio on mobile for perf
──────────────────────────────────────────── */
function initHeroScene(){
  const canvas = $('#heroCanvas');
  if(!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ── */
  const isMobile = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha:     true,
    antialias: !isMobile,   // skip AA on mobile
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);   // transparent — CSS bg shows through
  renderer.shadowMap.enabled = false;    // shadows too expensive for hero

  /* ── Scene & Camera ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 5.5);

  /* ── Lighting ──
     One ambient + four coloured point lights
     positioned around the scene for rim lighting.  */
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  // Main fill — warm purple from top-right
  const fillLight = new THREE.DirectionalLight(0x9966ff, 1.4);
  fillLight.position.set(4, 6, 3);
  scene.add(fillLight);

  // Cyan rim — bottom-left
  const rimCyan = new THREE.PointLight(0x00d4ff, 2.2, 14);
  rimCyan.position.set(-4, -1, 2);
  scene.add(rimCyan);

  // Pink accent — far right
  const rimPink = new THREE.PointLight(0xff4da6, 1.4, 12);
  rimPink.position.set(5, 1, -1);
  scene.add(rimPink);

  // Warm gold — bottom centre (keychain hero)
  const rimGold = new THREE.PointLight(0xffd700, 0.9, 8);
  rimGold.position.set(0.5, -2.5, 2);
  scene.add(rimGold);

  /* ── Shared material factory ── */
  function mat(color, emissive = 0x000000, emissiveIntensity = 0.18) {
    return new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity,
      roughness: 0.28,
      metalness: 0.55,
    });
  }
  function matGlass(color) {
    return new THREE.MeshStandardMaterial({
      color, transparent: true, opacity: 0.78,
      roughness: 0.1, metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }

  /* ════════════════════════════════════════
     OBJECT 1 — NIGHT FURY DRAGON
     Position: right side, mid depth
  ════════════════════════════════════════ */
  const dragon = new THREE.Group();

  // Body
  const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), mat(0x1a0a38, 0x5522aa));
  dBody.scale.set(1, 1.28, 0.88);
  dragon.add(dBody);

  // Neck
  const dNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.32, 10), mat(0x1a0a38));
  dNeck.position.set(0, 0.54, 0.12);
  dNeck.rotation.x = -0.3;
  dragon.add(dNeck);

  // Head
  const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), mat(0x1a0a38));
  dHead.scale.set(1.12, 0.9, 0.88);
  dHead.position.set(0, 0.76, 0.24);
  dragon.add(dHead);

  // Snout
  const dSnout = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), mat(0x110728));
  dSnout.rotation.x = Math.PI / 2;
  dSnout.position.set(0, 0.74, 0.52);
  dragon.add(dSnout);

  // Wings — translucent purple glass
  const wShape = new THREE.Shape();
  wShape.moveTo(0, 0);
  wShape.bezierCurveTo(0.4, 0.6, 0.9, 0.5, 0.85, -0.05);
  wShape.bezierCurveTo(0.7, -0.4, 0.2, -0.3, 0, 0);
  const wingMat = matGlass(0x6633cc);
  wingMat.emissive    = new THREE.Color(0x330066);
  wingMat.emissiveIntensity = 0.12;
  const wL = new THREE.Mesh(new THREE.ShapeGeometry(wShape), wingMat);
  wL.position.set(-0.44, 0.15, 0.05);
  wL.rotation.y = -0.22;
  dragon.add(wL);
  const wR = wL.clone();
  wR.position.x = 0.44;
  wR.scale.x = -1;
  wR.rotation.y = Math.PI + 0.22;
  dragon.add(wR);

  // Tail (curve)
  const tPoints = [];
  for(let i = 0; i < 14; i++){
    const t = i / 13;
    tPoints.push(new THREE.Vector3(
      0.22 * Math.sin(t * 2.2),
      -0.48 - t * 0.52,
      0.06 * Math.cos(t * 3)
    ));
  }
  dragon.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tPoints), 14, 0.058, 7),
    mat(0x1a0a38)
  ));

  // Eye glow
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    emissive: 0x00d4ff,
    emissiveIntensity: 1.8,
    roughness: 0,
  });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeMat);
  eL.position.set(-0.1, 0.78, 0.46);
  dragon.add(eL);
  const eR = eL.clone(); eR.position.x = 0.1; dragon.add(eR);

  // Place dragon: right, slightly above centre, mid-far depth
  dragon.position.set(2.0, 0.5, -0.6);
  dragon.rotation.y = -0.3;
  scene.add(dragon);

  /* ════════════════════════════════════════
     OBJECT 2 — CUTE KITTEN
     Position: left side, near
  ════════════════════════════════════════ */
  const kitten = new THREE.Group();

  const kMat  = mat(0xffcce8, 0x992244, 0.1);
  const kBody = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), kMat);
  kBody.scale.set(1, 0.94, 1.0);
  kitten.add(kBody);

  const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), kMat);
  kHead.position.set(0, 0.5, 0.08);
  kitten.add(kHead);

  // Big eyes (white + iris + pupil)
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const irisMat  = new THREE.MeshStandardMaterial({
    color: 0x00aaff, emissive: 0x003366, roughness: 0.05,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000815, roughness: 0.1 });
  [[-0.1, 0.1], [0.1, 0.1]].forEach(([x]) => {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), whiteMat);
    w.position.set(x, 0.54, 0.26);
    kitten.add(w);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), irisMat);
    ir.position.set(x, 0.54, 0.33);
    kitten.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), pupilMat);
    pu.position.set(x, 0.54, 0.38);
    kitten.add(pu);
  });

  // Ears
  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0); earShape.lineTo(0.1, 0.22); earShape.lineTo(0.2, 0);
  const earMat = new THREE.MeshStandardMaterial({ color: 0xff99cc, side: THREE.DoubleSide });
  const eaL = new THREE.Mesh(new THREE.ShapeGeometry(earShape), earMat);
  eaL.position.set(-0.26, 0.74, 0.06); eaL.rotation.z = -0.12;
  kitten.add(eaL);
  const eaR = eaL.clone(); eaR.position.x = 0.16; eaR.scale.x = -1; kitten.add(eaR);

  // Curly tail
  const kTailPts = [];
  for(let i = 0; i < 18; i++){
    const t = i / 17;
    kTailPts.push(new THREE.Vector3(
      -0.36 + t * 0.28 + Math.sin(t * Math.PI) * 0.22,
      -0.32 + Math.sin(t * Math.PI * 1.2) * 0.24,
      0
    ));
  }
  kitten.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kTailPts), 18, 0.045, 7),
    kMat
  ));

  // Nose
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff6699, roughness: 0.3 });
  kitten.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), noseMat), {
    position: new THREE.Vector3(0, 0.46, 0.4)
  }));

  kitten.position.set(-2.1, -0.1, 0.3);
  scene.add(kitten);

  /* ════════════════════════════════════════
     OBJECT 3 — CUTE MINI DINO (chibi)
     Position: far left, back
  ════════════════════════════════════════ */
  const dino = new THREE.Group();
  const dinoMat = mat(0x22cc77, 0x0a4422, 0.15);

  // Big chibi head
  const dinoHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), dinoMat);
  dinoHead.position.y = 0.18;
  dino.add(dinoHead);

  // Small round body
  const dinoBody = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), dinoMat);
  dinoBody.scale.set(1, 0.78, 1);
  dinoBody.position.y = -0.32;
  dino.add(dinoBody);

  // Huge cute eyes
  const dinoWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const dinoIris  = new THREE.MeshStandardMaterial({
    color: 0xffee00, emissive: 0x885500, roughness: 0.15,
  });
  const dinoPupil = new THREE.MeshStandardMaterial({ color: 0x000000 });
  [[-0.15, 0.15], [0.15, 0.15]].forEach(([x]) => {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), dinoWhite);
    w.position.set(x, 0.24, 0.32);
    dino.add(w);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), dinoIris);
    ir.position.set(x, 0.24, 0.4);
    dino.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), dinoPupil);
    pu.position.set(x, 0.24, 0.46);
    dino.add(pu);
  });

  // Big happy smile (torus arc)
  const smileMat = new THREE.MeshStandardMaterial({ color: 0x006633, roughness: 0.4 });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 6, 14, Math.PI), smileMat);
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.04, 0.4);
  dino.add(smile);

  // Tiny arms
  const armG = new THREE.CylinderGeometry(0.046, 0.038, 0.2, 8);
  const armL = new THREE.Mesh(armG, dinoMat);
  armL.position.set(-0.3, -0.16, 0.06); armL.rotation.z = 0.8;
  dino.add(armL);
  const armR = armL.clone(); armR.position.x = 0.3; armR.rotation.z = -0.8;
  dino.add(armR);

  // Dorsal spikes
  const spkMat = mat(0x18aa55);
  for(let i = 0; i < 3; i++){
    const spk = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.12, 6), spkMat);
    spk.position.set(0, 0.42 - i * 0.08, -0.28 + i * 0.04);
    dino.add(spk);
  }

  dino.position.set(-0.4, -0.9, -1.2);
  scene.add(dino);

  /* ════════════════════════════════════════
     OBJECT 4 — GOLD KEYCHAIN + STAR
     Position: right bottom, near
  ════════════════════════════════════════ */
  const keychain = new THREE.Group();
  const goldMat  = mat(0xffd700, 0x886600, 0.25);
  goldMat.metalness = 0.92;
  goldMat.roughness = 0.08;

  // Ring
  keychain.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 10, 28), goldMat));

  // Chain link
  const chainLink = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.022, 7, 14),
    goldMat
  );
  chainLink.rotation.x = Math.PI / 2;
  chainLink.position.y = -0.1;
  keychain.add(chainLink);

  // Tag (rectangular with rounded look)
  const tagMat = new THREE.MeshStandardMaterial({
    color: 0x00d4ff, emissive: 0x003344,
    roughness: 0.2, metalness: 0.6,
    emissiveIntensity: 0.25,
  });
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.065), tagMat);
  tag.position.y = -0.46;
  keychain.add(tag);

  // Star on tag (extruded)
  const starShape = new THREE.Shape();
  for(let i = 0; i < 5; i++){
    const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    i === 0
      ? starShape.moveTo(Math.cos(outerA) * 0.09, Math.sin(outerA) * 0.09)
      : starShape.lineTo(Math.cos(outerA) * 0.09, Math.sin(outerA) * 0.09);
    starShape.lineTo(Math.cos(innerA) * 0.042, Math.sin(innerA) * 0.042);
  }
  starShape.closePath();
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape, { depth: 0.04, bevelEnabled: false }),
    goldMat
  );
  star.position.set(-0.013, -0.46, 0.055);
  keychain.add(star);

  keychain.position.set(1.1, -1.1, 0.7);
  scene.add(keychain);

  /* ════════════════════════════════════════
     PARTICLES — two pools, two colours
     Pool A: purple/violet (background)
     Pool B: cyan specks (foreground)
  ════════════════════════════════════════ */
  function makeParticles(count, color, sizeVal, spread, zOffset) {
    const positions = new Float32Array(count * 3);
    for(let i = 0; i < count; i++){
      positions[i*3]   = (Math.random() - 0.5) * spread[0];
      positions[i*3+1] = (Math.random() - 0.5) * spread[1];
      positions[i*3+2] = (Math.random() - 0.5) * spread[2] + zOffset;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color, size: sizeVal, transparent: true, opacity: 0.55,
    }));
  }
  const particlesBg = makeParticles(90, 0x7c5cff, 0.038, [14, 9, 7], -2.5);
  const particlesFg = makeParticles(40, 0x00d4ff, 0.025, [ 9, 7, 4],  0.5);
  scene.add(particlesBg);
  scene.add(particlesFg);

  /* ════════════════════════════════════════
     ANIMATION LOOP
  ════════════════════════════════════════ */
  const clock = new THREE.Clock();
  let paused = false;

  // Pause when tab is hidden (battery + GPU saving)
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if(!paused) clock.getDelta(); // discard accumulated time
  });

  (function loop(){
    requestAnimationFrame(loop);
    if(paused) return;

    const t = clock.getElapsedTime();

    /* ── Smooth mouse parallax ──
       Camera drifts very gently toward mouse position.
       Max offset: ±0.22 Y, ±0.16 X — barely perceptible
       but adds real sense of depth.                      */
    camera.rotation.y = lerp(camera.rotation.y, state.mouse.nx * 0.22, 0.028);
    camera.rotation.x = lerp(camera.rotation.x, state.mouse.ny * 0.14, 0.028);

    /* ── Dragon ──
       Slow Y rotation + gentle bob + wing flap.          */
    dragon.rotation.y  = t * 0.28;
    dragon.position.y  = 0.5 + Math.sin(t * 0.65) * 0.16;
    wL.rotation.z = -0.25 + Math.sin(t * 2.0) * 0.22;
    wR.rotation.z =  0.25 - Math.sin(t * 2.0) * 0.22;
    // Eye pulse
    eyeMat.emissiveIntensity = 1.4 + Math.sin(t * 3.0) * 0.6;

    /* ── Kitten ──
       Counter-rotation, slight tilt for personality.     */
    kitten.rotation.y   = -t * 0.2;
    kitten.position.y   = -0.1 + Math.sin(t * 0.82 + 1.1) * 0.13;
    kitten.rotation.z   = Math.sin(t * 0.55) * 0.04;

    /* ── Dino ──
       Slower, back-plane; scale-bobs for chibi feel.     */
    dino.rotation.y     = t * 0.18;
    dino.position.y     = -0.9 + Math.sin(t * 0.72 + 2.3) * 0.11;
    const dinoScale     = 1 + Math.sin(t * 1.6) * 0.018;
    dino.scale.set(dinoScale, dinoScale, dinoScale);

    /* ── Keychain ──
       Faster spin + pendulum-like swing on Z.            */
    keychain.rotation.y = t * 0.65;
    keychain.rotation.z = Math.sin(t * 1.1) * 0.18;
    keychain.position.y = -1.1 + Math.sin(t * 1.3 + 1.7) * 0.17;

    /* ── Particles ── */
    particlesBg.rotation.y = t * 0.014;
    particlesBg.rotation.x = t * 0.007;
    particlesFg.rotation.y = -t * 0.018;

    /* ── Light pulsing — subtle, not disco ── */
    rimCyan.intensity = 2.2 + Math.sin(t * 1.05) * 0.45;
    rimPink.intensity = 1.4 + Math.sin(t * 0.88 + 1.9) * 0.3;
    rimGold.intensity = 0.9 + Math.sin(t * 1.55 + 0.6) * 0.3;

    renderer.render(scene, camera);
  })();

  /* ── Resize handler ── */
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }, { passive: true });

  /* ── Theme change — soften lights in light mode ── */
  document.addEventListener('themechange', e => {
    const light = e.detail === 'light';
    ambient.intensity   = light ? 0.9 : 0.35;
    fillLight.intensity = light ? 0.8 : 1.4;
    rimCyan.intensity   = light ? 1.2 : 2.2;
    rimPink.intensity   = light ? 0.7 : 1.4;
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

  // Inject image carousel into modal (gallery.js)
  if(typeof patchModalWithImages === 'function'){
    setTimeout(() => patchModalWithImages(id), 50);
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
/* ─────────────────────────────────────────────────
   HERO PRODUCT MINI-SCENES
   Tiny Three.js scene per hero-right card.
   Slow spin always on; faster on hover.
───────────────────────────────────────────────── */
function initHeroProducts(){
  if(typeof THREE === 'undefined') return;

  const HPC_CONFIG = {
    nightfury: { build: buildDragonNight, color: 0x7c5cff },
    kitten:    { build: buildKitten,      color: 0xff4da6 },
    raptor:    { build: buildRaptor,      color: 0x1bea8a },
    firedrake: { build: buildFireDrake,   color: 0xff8c42 },
  };

  $$('.hero-prod-card').forEach(card => {
    const pid    = card.dataset.pid;
    const cfg    = HPC_CONFIG[pid];
    const canvas = card.querySelector('.hpc-canvas');
    if(!cfg || !canvas) return;

    const W = canvas.offsetWidth  || 220;
    const H = canvas.offsetHeight || 150;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(W, H);
    renderer.setClearColor(0, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, W/H, 0.1, 40);
    camera.position.z = 3.2;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1.1);
    dl.position.set(2, 3, 2); scene.add(dl);
    const pl = new THREE.PointLight(new THREE.Color(cfg.color), 2.0, 8);
    pl.position.set(-1.5, 1, 1); scene.add(pl);

    const group = new THREE.Group();
    scene.add(group);
    cfg.build(group);

    let isHovered = false, targetScale = 1, currentScale = 1, rotY = 0;
    const clock = new THREE.Clock();

    /* Hover speed-up + scale */
    card.addEventListener('mouseenter', () => { isHovered = true;  targetScale = 1.06; });
    card.addEventListener('mouseleave', () => { isHovered = false; targetScale = 1.0;  });

    /* Pause when off-screen */
    let active = false;
    new IntersectionObserver(e => { active = e[0].isIntersecting; }, { threshold: 0.1 }).observe(card);

    (function loop(){
      requestAnimationFrame(loop);
      if(!active) return;
      const t = clock.getElapsedTime();
      rotY += isHovered ? 0.018 : 0.006;
      group.rotation.y  = rotY;
      group.position.y  = Math.sin(t * 0.7) * 0.08;
      currentScale      = lerp(currentScale, targetScale, 0.08);
      group.scale.setScalar(currentScale);
      pl.intensity      = 2.0 + Math.sin(t * 1.1) * 0.4;
      renderer.render(scene, camera);
    })();

    window.addEventListener('resize', () => {
      const nW = canvas.offsetWidth || 220;
      const nH = canvas.offsetHeight || 150;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    }, { passive: true });
  });
}

/* ─────────────────────────────────────────────────
   CARD VIDEO TOGGLE
   ▸ Reads data-video-src from each <article>
   ▸ Injects <video> + toggle pill into viewer wrap
   ▸ Autoplay on hover, pause on leave
   ▸ Falls back gracefully if no video provided
───────────────────────────────────────────────── */
function initCardVideoToggle(){
  $$('.prod-card[data-cat]').forEach(card => {
    const videoSrc = card.dataset.videoSrc; // optional attribute
    const wrap     = card.querySelector('.prod-viewer-wrap');
    if(!wrap) return;

    // Determine available modes
    const hasBd3d  = !!card.querySelector('.prod-canvas');
    const hasPhoto = !!card.querySelector('.prod-img-layer');
    const hasVideo = !!videoSrc;

    // Only inject if at least 2 modes exist
    const modes = [];
    if(hasBd3d)  modes.push({ key:'3d',    label:'3D' });
    if(hasPhoto) modes.push({ key:'photo',  label:'Photo' });
    if(hasVideo) modes.push({ key:'video',  label:'▶ Video' });
    if(modes.length < 2) return;

    // ── Inject video element (lazy — src set only when activated) ──
    let videoEl = null;
    if(hasVideo){
      videoEl = document.createElement('video');
      videoEl.className    = 'prod-card-video';
      videoEl.muted        = true;
      videoEl.loop         = true;
      videoEl.playsInline  = true;
      videoEl.preload      = 'none';  // lazy — don't load until needed
      wrap.appendChild(videoEl);
    }

    // ── Inject toggle pill ──
    const pill = document.createElement('div');
    pill.className = 'card-media-toggle';
    pill.innerHTML = modes.map(m =>
      `<button class="cmt-btn${m.key==='3d'?' active':''}" data-mode="${m.key}">${m.label}</button>`
    ).join('');
    wrap.appendChild(pill);

    // ── Track current mode ──
    let currentMode = '3d';

    function setMode(mode){
      currentMode = mode;

      // Update button states
      pill.querySelectorAll('.cmt-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.mode === mode)
      );

      // 3D mode
      const canvas = card.querySelector('.prod-canvas');
      if(canvas) canvas.style.opacity = mode === '3d' ? '' : '0.1';

      // Photo mode
      const img = card.querySelector('.prod-img-layer');
      if(img) img.style.opacity = mode === 'photo' ? '1' : '0';

      // Video mode
      if(videoEl){
        if(mode === 'video'){
          // Set src lazily — only load when user actually wants video
          if(!videoEl.src && videoSrc){
            videoEl.src = videoSrc;
            videoEl.load();
          }
          wrap.classList.add('show-video');
          videoEl.play().catch(()=>{}); // catch autoplay block
        } else {
          wrap.classList.remove('show-video');
          videoEl.pause();
        }
      }

      // Spin hint visibility
      const hint = card.querySelector('.prod-spin-hint');
      if(hint) hint.style.opacity = mode === '3d' ? '' : '0';
    }

    // Pill click handler
    pill.addEventListener('click', e => {
      const btn = e.target.closest('.cmt-btn');
      if(btn) setMode(btn.dataset.mode);
    });

    // Hover-autoplay: if video mode is active and user hovers, ensure playing
    wrap.addEventListener('mouseenter', () => {
      if(currentMode === 'video' && videoEl) videoEl.play().catch(()=>{});
    });
    wrap.addEventListener('mouseleave', () => {
      if(currentMode === 'video' && videoEl) videoEl.pause();
    });
  });
}

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

  /* ── Background video fade-in ──
     The <video> starts with opacity:0.
     Once enough data is loaded we fade it in smoothly.
     This prevents a flash of black/white before the video starts. */
  const heroBgVideo = document.getElementById('heroBgVideo');
  if(heroBgVideo){
    // 'canplaythrough' fires when enough is buffered to play without stopping
    heroBgVideo.addEventListener('canplaythrough', () => {
      heroBgVideo.classList.add('loaded');
    }, { once: true });
    // Fallback: if event never fires (e.g. no video file), just show nothing
    // and the CSS background gradient shows through naturally.
  }

  /* ── Product card video toggle ──
     Injects a video element + 3D/Video toggle pill into every
     .prod-viewer-wrap that has a data-video-src attribute.
     ► HOW TO ADD A VIDEO TO A PRODUCT CARD:
       1. Add a data-video-src="video/my-product.mp4" attr to the <article>
       2. Put the MP4 file in a /video/ folder in your project
       3. Save — the toggle pill appears automatically              */
  initCardVideoToggle();

  if(typeof THREE!=='undefined'){
    initHeroScene();
    setTimeout(()=>initHeroProducts(),  100);
    setTimeout(()=>initProductViewers(), 300);
    setTimeout(()=>initCtaOrb(), 500);
    setTimeout(()=>initGalleryScenes(), 700);
  }
});
