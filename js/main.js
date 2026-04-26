/* ═══════════════════════════════════════════
   PRINTCRAFT BD — MAIN.JS
   Sections:
   1. State & Utilities
   2. Custom Cursor
   3. Navbar Scroll
   4. Theme Toggle
   5. Language Toggle
   6. Three.js Hero Scene
   7. Three.js Product Mini-Scenes
   8. Three.js Gallery Scenes
   9. Scroll Reveal
   10. Steps Progress
   11. Testimonial Carousel
   12. Form Interactions
   13. WhatsApp FAB
   14. Init
═══════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────
   1. STATE & UTILITIES
───────────────────────────────────────── */
const state = {
  theme: 'dark',
  lang: 'en',
  mouse: { x: 0, y: 0, nx: 0, ny: 0 }, // nx/ny = normalised -1..1
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function lerp(a, b, t) { return a + (b - a) * t; }

/* ─────────────────────────────────────────
   2. CUSTOM CURSOR
───────────────────────────────────────── */
function initCursor() {
  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');
  if (!dot || !ring) return;

  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    state.mouse.x   = e.clientX;
    state.mouse.y   = e.clientY;
    state.mouse.nx  = (e.clientX / window.innerWidth)  * 2 - 1;
    state.mouse.ny  = (e.clientY / window.innerHeight) * 2 - 1;

    // Smooth ring follow
    function follow() {
      rx = lerp(rx, e.clientX, 0.14);
      ry = lerp(ry, e.clientY, 0.14);
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      if (Math.abs(rx - e.clientX) > 0.5 || Math.abs(ry - e.clientY) > 0.5) {
        requestAnimationFrame(follow);
      }
    }
    follow();
  });

  // Hover effect on interactive elements
  $$('a, button, .cat-card, .gallery-item, .testi-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ─────────────────────────────────────────
   3. NAVBAR SCROLL
───────────────────────────────────────── */
function initNavbar() {
  const nav = $('#navbar');
  let last = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    last = y;
  }, { passive: true });
}

/* ─────────────────────────────────────────
   4. THEME TOGGLE
───────────────────────────────────────── */
function initTheme() {
  const btn  = $('#themeToggle');
  const icon = $('#themeIcon');

  btn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    icon.textContent = state.theme === 'dark' ? '🌙' : '☀️';

    // Notify all Three.js scenes to update colours
    document.dispatchEvent(new CustomEvent('themechange', { detail: state.theme }));
  });
}

/* ─────────────────────────────────────────
   5. LANGUAGE TOGGLE
───────────────────────────────────────── */
function initLang() {
  const btnEN = $('#langEN');
  const btnBN = $('#langBN');

  function applyLang(lang) {
    state.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    $$('[data-en]').forEach(el => {
      const val = el.getAttribute(`data-${lang}`);
      if (!val) return;

      // Handle innerHTML (elements with <em> tags)
      if (val.includes('<')) {
        el.innerHTML = val;
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });

    btnEN.classList.toggle('active', lang === 'en');
    btnBN.classList.toggle('active', lang === 'bn');
  }

  $('#langToggle').addEventListener('click', () => {
    applyLang(state.lang === 'en' ? 'bn' : 'en');
  });
}

/* ─────────────────────────────────────────
   6. THREE.JS HERO SCENE
───────────────────────────────────────── */
function initHeroScene() {
  const canvas = $('#heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x7c5cff, 1.8);
  dirLight.position.set(3, 5, 3);
  scene.add(dirLight);

  const pointLight1 = new THREE.PointLight(0x00d4ff, 1.5, 12);
  pointLight1.position.set(-3, 2, 2);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xff4da6, 1.0, 10);
  pointLight2.position.set(4, -2, 1);
  scene.add(pointLight2);

  // ── Object builder helper ──
  function makeMat(color, emissive = 0x000000) {
    return new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity: 0.2,
      roughness: 0.3, metalness: 0.6
    });
  }

  // ── DRAGON (composite geometry) ──
  const dragonGroup = new THREE.Group();

  // Body
  const bodyGeo = new THREE.SphereGeometry(0.36, 16, 12);
  bodyGeo.scale(1, 1.3, 0.9);
  const dragonMat = makeMat(0x7c5cff, 0x3a1a80);
  const body = new THREE.Mesh(bodyGeo, dragonMat);
  dragonGroup.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 12, 10);
  headGeo.scale(1.1, 1, 0.85);
  const head = new THREE.Mesh(headGeo, dragonMat);
  head.position.set(0, 0.52, 0.18);
  dragonGroup.add(head);

  // Snout
  const snoutGeo = new THREE.ConeGeometry(0.1, 0.2, 8);
  snoutGeo.rotateX(Math.PI / 2);
  const snout = new THREE.Mesh(snoutGeo, makeMat(0x5a3db5));
  snout.position.set(0, 0.52, 0.42);
  dragonGroup.add(snout);

  // Wings (flat planes with triangle shape)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(0.6, 0.5); wingShape.lineTo(0.5, -0.3);
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xb084ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8, roughness: 0.4 });

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.35, 0.1, 0); wingL.rotation.y = -0.3;
  dragonGroup.add(wingL);

  const wingR = wingL.clone();
  wingR.position.set(0.35, 0.1, 0); wingR.rotation.y = Math.PI + 0.3;
  wingR.scale.x = -1;
  dragonGroup.add(wingR);

  // Tail
  const tailGeo = new THREE.CylinderGeometry(0.06, 0.01, 0.55, 8);
  tailGeo.rotateZ(Math.PI / 4);
  const tail = new THREE.Mesh(tailGeo, dragonMat);
  tail.position.set(0.25, -0.55, 0);
  dragonGroup.add(tail);

  dragonGroup.position.set(1.6, 0.3, -0.5);
  scene.add(dragonGroup);

  // ── ELEPHANT ──
  const elephantGroup = new THREE.Group();

  const elephantMat = makeMat(0x00d4ff, 0x003d4f);
  const eBody = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), elephantMat);
  elephantGroup.add(eBody);

  const eHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), elephantMat);
  eHead.position.set(0, 0.38, 0.15);
  elephantGroup.add(eHead);

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.35, 8);
  trunkGeo.rotateX(Math.PI / 2);
  const trunk = new THREE.Mesh(trunkGeo, elephantMat);
  trunk.position.set(0, 0.28, 0.45);
  elephantGroup.add(trunk);

  // Ears (flat discs)
  const earGeo = new THREE.CircleGeometry(0.15, 12);
  const earMat = new THREE.MeshStandardMaterial({ color: 0x00b8d9, side: THREE.DoubleSide, roughness: 0.5 });
  const earL = new THREE.Mesh(earGeo, earMat);
  earL.position.set(-0.28, 0.4, 0.05); earL.rotation.y = 0.4;
  elephantGroup.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.28; earR.rotation.y = -0.4;
  elephantGroup.add(earR);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.22, 8);
  const legMat = makeMat(0x0099bb);
  [[-0.15, -0.38, 0.1],[0.15, -0.38, 0.1],[-0.15, -0.38, -0.1],[0.15, -0.38, -0.1]].forEach(([x,y,z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    elephantGroup.add(leg);
  });

  elephantGroup.position.set(-1.9, -0.2, 0.2);
  scene.add(elephantGroup);

  // ── SNAKE ──
  const snakeGroup = new THREE.Group();
  const snakeMat = makeMat(0x1bea8a, 0x074433);
  const snakePoints = [];
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    snakePoints.push(new THREE.Vector3(
      Math.sin(t * Math.PI * 3) * 0.28,
      t * 0.7 - 0.35,
      Math.cos(t * Math.PI * 2) * 0.12
    ));
  }
  const snakeCurve = new THREE.CatmullRomCurve3(snakePoints);
  const snakeTube = new THREE.TubeGeometry(snakeCurve, 60, 0.055, 8, false);
  const snakeMesh = new THREE.Mesh(snakeTube, snakeMat);
  snakeGroup.add(snakeMesh);

  // Snake head
  const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), snakeMat);
  sHead.position.copy(snakePoints[39]);
  snakeGroup.add(sHead);

  snakeGroup.position.set(-0.3, -0.5, 0.8);
  scene.add(snakeGroup);

  // ── KEYCHAIN (torus + ring) ──
  const keyGroup = new THREE.Group();
  const keyMat = makeMat(0xffd700, 0x806600);

  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 24), keyMat);
  keyGroup.add(keyRing);

  const starShape = new THREE.Shape();
  for (let i = 0; i < 5; i++) {
    const outer = (i * 4 * Math.PI) / 5;
    const inner = outer + (2 * Math.PI) / 10;
    if (i === 0) {
      starShape.moveTo(Math.cos(outer) * 0.13, Math.sin(outer) * 0.13);
    } else {
      starShape.lineTo(Math.cos(outer) * 0.13, Math.sin(outer) * 0.13);
    }
    starShape.lineTo(Math.cos(inner) * 0.06, Math.sin(inner) * 0.06);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: false });
  const starMesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.2, metalness: 0.8 }));
  starMesh.position.set(0, -0.28, 0);
  keyGroup.add(starMesh);

  // Connecting chain link
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 6, 12), keyMat);
  chain.position.set(0, -0.07, 0); chain.rotation.x = Math.PI / 2;
  keyGroup.add(chain);

  keyGroup.position.set(0.6, -0.8, 0.6);
  scene.add(keyGroup);

  // ── ACTION FIGURE ──
  const figGroup = new THREE.Group();
  const figMat = makeMat(0xff4da6, 0x7a0040);
  const figAccent = makeMat(0xffd700);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.15), figMat);
  figGroup.add(torso);

  // Head
  const figHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), figMat);
  figHead.position.y = 0.26;
  figGroup.add(figHead);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.26, 8);
  const armL = new THREE.Mesh(armGeo, figMat);
  armL.position.set(-0.17, 0.05, 0); armL.rotation.z = 0.5;
  figGroup.add(armL);
  const armR = armL.clone(); armR.position.x = 0.17; armR.rotation.z = -0.5;
  figGroup.add(armR);

  // Legs
  const legGeo2 = new THREE.CylinderGeometry(0.05, 0.04, 0.28, 8);
  const legL = new THREE.Mesh(legGeo2, figMat);
  legL.position.set(-0.08, -0.28, 0); legL.rotation.z = 0.1;
  figGroup.add(legL);
  const legR = legL.clone(); legR.position.x = 0.08; legR.rotation.z = -0.1;
  figGroup.add(legR);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.16), figAccent);
  belt.position.y = -0.07;
  figGroup.add(belt);

  figGroup.position.set(-0.6, 0.6, 0.4);
  scene.add(figGroup);

  // ── FLOATING PARTICLES ──
  const particleCount = 80;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i*3]   = (Math.random() - 0.5) * 12;
    particlePositions[i*3+1] = (Math.random() - 0.5) * 8;
    particlePositions[i*3+2] = (Math.random() - 0.5) * 6 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0x7c5cff, size: 0.04, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── ANIMATION LOOP ──
  const clock = new THREE.Clock();
  let targetRotX = 0, targetRotY = 0;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Mouse parallax — smooth camera drift
    targetRotY = state.mouse.nx * 0.25;
    targetRotX = state.mouse.ny * 0.15;
    camera.rotation.y = lerp(camera.rotation.y, targetRotY, 0.04);
    camera.rotation.x = lerp(camera.rotation.x, targetRotX, 0.04);

    // Dragon float & rotate
    dragonGroup.rotation.y  = t * 0.4;
    dragonGroup.position.y  = 0.3 + Math.sin(t * 0.7) * 0.18;
    wingL.rotation.z = -0.3 + Math.sin(t * 2.5) * 0.25;
    wingR.rotation.z =  0.3 - Math.sin(t * 2.5) * 0.25;

    // Elephant float
    elephantGroup.rotation.y = -t * 0.25;
    elephantGroup.position.y = -0.2 + Math.sin(t * 0.9 + 1) * 0.15;

    // Snake writhe
    snakeGroup.rotation.y = t * 0.5;
    snakeGroup.position.y = -0.5 + Math.sin(t * 1.1) * 0.12;

    // Keychain spin
    keyGroup.rotation.y = t * 0.8;
    keyGroup.rotation.z = Math.sin(t * 1.3) * 0.25;
    keyGroup.position.y = -0.8 + Math.sin(t * 1.4 + 2) * 0.2;

    // Action figure bounce
    figGroup.rotation.y = -t * 0.35;
    figGroup.position.y = 0.6 + Math.sin(t * 0.8 + 3) * 0.14;
    figGroup.rotation.z = Math.sin(t * 0.6) * 0.06;

    // Particles drift
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;

    // Lights pulse
    pointLight1.intensity = 1.5 + Math.sin(t * 1.2) * 0.4;
    pointLight2.intensity = 1.0 + Math.sin(t * 0.9 + 2) * 0.3;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Theme change — update material colours
  document.addEventListener('themechange', e => {
    const isLight = e.detail === 'light';
    ambientLight.intensity = isLight ? 0.8 : 0.4;
    dirLight.intensity = isLight ? 1.0 : 1.8;
  });
}

/* ─────────────────────────────────────────
   7. THREE.JS PRODUCT MINI-SCENES
───────────────────────────────────────── */
function initMiniScene(containerId, buildScene) {
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return;

  const w = container.offsetWidth || 300;
  const h = container.offsetHeight || 220;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
  camera.position.z = 3.5;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2);
  dl.position.set(2, 3, 2);
  scene.add(dl);

  const pl = new THREE.PointLight(0x7c5cff, 1.5, 8);
  pl.position.set(-2, 1, 1);
  scene.add(pl);

  const group = new THREE.Group();
  scene.add(group);
  buildScene(group);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    group.rotation.y = t * 0.6;
    group.position.y = Math.sin(t * 0.8) * 0.15;
    renderer.render(scene, camera);
  }
  animate();

  // Pause when not visible
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) animate(); });
  });
  obs.observe(container);
}

function initProductScenes() {
  if (typeof THREE === 'undefined') return;

  // Toys — cute dragon
  initMiniScene('scene-toys', group => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xb084ff, roughness: 0.3, metalness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), mat);
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat);
    head.position.set(0, 0.7, 0.2);
    group.add(head);
    // Wings
    const wg = new THREE.Shape();
    wg.moveTo(0,0); wg.lineTo(0.8, 0.6); wg.lineTo(0.6, -0.3);
    const wGeo = new THREE.ShapeGeometry(wg);
    const wMat = new THREE.MeshStandardMaterial({ color: 0xd4aaff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const wL = new THREE.Mesh(wGeo, wMat); wL.position.set(-0.45, 0.1, 0); wL.rotation.y = -0.3; group.add(wL);
    const wR = wL.clone(); wR.position.x = 0.45; wR.scale.x = -1; wR.rotation.y = Math.PI+0.3; group.add(wR);
  });

  // Couple — two heart-shaped figures
  initMiniScene('scene-couple', group => {
    const figA = new THREE.MeshStandardMaterial({ color: 0xff4da6, roughness: 0.4, metalness: 0.3 });
    const figB = new THREE.MeshStandardMaterial({ color: 0x7c5cff, roughness: 0.4, metalness: 0.3 });
    [[figA, -0.4],[figB, 0.4]].forEach(([mat, x]) => {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.18, 0.35, 6, 10) : new THREE.CylinderGeometry(0.18, 0.18, 0.35, 10), mat);
      body.position.x = x;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat);
      head.position.set(x, 0.45, 0);
      group.add(head);
    });
    // Heart between them
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.15);
    heartShape.bezierCurveTo(0, 0.22, -0.1, 0.25, -0.12, 0.15);
    heartShape.bezierCurveTo(-0.15, 0.05, 0, -0.08, 0, -0.15);
    heartShape.bezierCurveTo(0, -0.08, 0.15, 0.05, 0.12, 0.15);
    heartShape.bezierCurveTo(0.1, 0.25, 0, 0.22, 0, 0.15);
    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMesh = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({ color: 0xff4444, side: THREE.DoubleSide }));
    heartMesh.position.set(0, 0.55, 0.1);
    heartMesh.scale.setScalar(0.9);
    group.add(heartMesh);
  });

  // Keychains — torus + star + tag
  initMiniScene('scene-key', group => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.1, metalness: 0.9 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 10, 30), mat);
    group.add(ring);
    // Tag shape
    const tagGeo = new THREE.BoxGeometry(0.3, 0.42, 0.06);
    const tag = new THREE.Mesh(tagGeo, new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.3, metalness: 0.5 }));
    tag.position.y = -0.42;
    group.add(tag);
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), mat);
    chain.position.y = -0.1; chain.rotation.x = Math.PI/2;
    group.add(chain);
    // Star on tag
    const sCurve = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI/2;
      const b = a + (2 * Math.PI) / 10;
      sCurve.push(new THREE.Vector3(Math.cos(a)*0.1, -0.42+Math.sin(a)*0.1, 0.04));
      sCurve.push(new THREE.Vector3(Math.cos(b)*0.05, -0.42+Math.sin(b)*0.05, 0.04));
    }
  });

  // Action figures — heroic pose
  initMiniScene('scene-fig', group => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4da6, roughness: 0.35, metalness: 0.4 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.7 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.22), mat);
    group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat);
    head.position.y = 0.38;
    group.add(head);
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 8);
    const aL = new THREE.Mesh(armGeo, mat); aL.position.set(-0.26, 0.08, 0); aL.rotation.z = 0.6; group.add(aL);
    const aR = new THREE.Mesh(armGeo, mat); aR.position.set( 0.26, 0.08, 0); aR.rotation.z = -0.4; group.add(aR);
    const legGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.44, 8);
    const lL = new THREE.Mesh(legGeo, mat); lL.position.set(-0.12, -0.44, 0); lL.rotation.z = 0.12; group.add(lL);
    const lR = new THREE.Mesh(legGeo, mat); lR.position.set( 0.12, -0.44, 0); lR.rotation.z = -0.12; group.add(lR);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.24), accent); belt.position.y = -0.1; group.add(belt);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.24), accent); chest.position.y = 0.12; group.add(chest);
  });
}

/* ─────────────────────────────────────────
   8. THREE.JS GALLERY SCENES
───────────────────────────────────────── */
function initGalleryScenes() {
  if (typeof THREE === 'undefined') return;

  const configs = [
    { id: 'g1', hue: 260, build: g => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x7c5cff, roughness: 0.3, metalness: 0.6 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), mat); g.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat); h.position.set(0,0.68,0.2); g.add(h);
      const wg = new THREE.Shape(); wg.moveTo(0,0); wg.lineTo(0.9,0.7); wg.lineTo(0.7,-0.4);
      const wL = new THREE.Mesh(new THREE.ShapeGeometry(wg), new THREE.MeshStandardMaterial({color:0xb084ff,side:THREE.DoubleSide,transparent:true,opacity:0.8}));
      wL.position.set(-0.48,0.1,0); wL.rotation.y=-0.3; g.add(wL);
      const wR = wL.clone(); wR.position.x=0.48; wR.scale.x=-1; wR.rotation.y=Math.PI+0.3; g.add(wR);
    }},
    { id: 'g2', hue: 330, build: g => {
      const mA = new THREE.MeshStandardMaterial({color:0xff4da6,roughness:0.4,metalness:0.3});
      const mB = new THREE.MeshStandardMaterial({color:0x7c5cff,roughness:0.4,metalness:0.3});
      const torsoA = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.38,10), mA); torsoA.position.x=-0.45; g.add(torsoA);
      const headA = new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8), mA); headA.position.set(-0.45,0.42,0); g.add(headA);
      const torsoB = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.38,10), mB); torsoB.position.x=0.45; g.add(torsoB);
      const headB = new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8), mB); headB.position.set(0.45,0.42,0); g.add(headB);
    }},
    { id: 'g3', hue: 200, build: g => {
      const mat = new THREE.MeshStandardMaterial({color:0x00d4ff,roughness:0.3,metalness:0.5});
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48,14,10), mat); g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3,12,10), mat); head.position.set(0,0.58,0.18); g.add(head);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.05,0.4,8), mat); trunk.rotation.x=Math.PI/2; trunk.position.set(0,0.45,0.5); g.add(trunk);
      const earGeo = new THREE.CircleGeometry(0.2,12);
      const earMat = new THREE.MeshStandardMaterial({color:0x00b8d9,side:THREE.DoubleSide});
      const eL = new THREE.Mesh(earGeo, earMat); eL.position.set(-0.34,0.58,0.08); eL.rotation.y=0.5; g.add(eL);
      const eR = eL.clone(); eR.position.x=0.34; eR.rotation.y=-0.5; g.add(eR);
    }},
    { id: 'g4', hue: 30, build: g => {
      const mat = new THREE.MeshStandardMaterial({color:0xff8c42,roughness:0.35,metalness:0.4});
      const acc = new THREE.MeshStandardMaterial({color:0xffd700,roughness:0.2,metalness:0.7});
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.42,0.2), mat); g.add(t);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.17,12,10), mat); h.position.y=0.38; g.add(h);
      const aGeo = new THREE.CylinderGeometry(0.055,0.05,0.36,8);
      const aL = new THREE.Mesh(aGeo,mat); aL.position.set(-0.24,0.06,0); aL.rotation.z=0.65; g.add(aL);
      const aR = new THREE.Mesh(aGeo,mat); aR.position.set(0.24,0.06,0); aR.rotation.z=-0.4; g.add(aR);
      const lGeo = new THREE.CylinderGeometry(0.075,0.065,0.42,8);
      const lL = new THREE.Mesh(lGeo,mat); lL.position.set(-0.1,-0.42,0); lL.rotation.z=0.1; g.add(lL);
      const lR = new THREE.Mesh(lGeo,mat); lR.position.set(0.1,-0.42,0); lR.rotation.z=-0.1; g.add(lR);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.06,0.22), acc); belt.position.y=-0.1; g.add(belt);
    }},
    { id: 'g5', hue: 160, build: g => {
      const mat = new THREE.MeshStandardMaterial({color:0xffd700,roughness:0.1,metalness:0.9});
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32,0.07,10,30), mat); g.add(ring);
      const tag = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.38,0.07), new THREE.MeshStandardMaterial({color:0x00d4ff,roughness:0.3,metalness:0.5})); tag.position.y=-0.48; g.add(tag);
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.07,0.025,6,12), mat); chain.position.y=-0.12; chain.rotation.x=Math.PI/2; g.add(chain);
    }},
    { id: 'g6', hue: 90, build: g => {
      const mat = new THREE.MeshStandardMaterial({color:0x1bea8a,roughness:0.3,metalness:0.5});
      const pts = [];
      for(let i=0;i<36;i++){const t=i/35; pts.push(new THREE.Vector3(Math.sin(t*Math.PI*3)*0.35, t*0.9-0.45, Math.cos(t*Math.PI*2)*0.15));}
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 50, 0.065, 8, false);
      g.add(new THREE.Mesh(tube, mat));
      const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8), mat); sHead.position.copy(pts[35]); g.add(sHead);
    }},
  ];

  configs.forEach(({ id, hue, build }) => {
    const container = document.getElementById(id);
    if (!container) return;

    const w = container.offsetWidth || container.parentElement.offsetWidth || 300;
    const h = container.offsetHeight || container.parentElement.offsetHeight || 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width  = '100%';
    renderer.domElement.style.height = '100%';

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
    camera.position.z = 3;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(2,3,2); scene.add(dl);
    const pl = new THREE.PointLight(new THREE.Color().setHSL(hue/360, 0.8, 0.5), 1.8, 8); pl.position.set(-1.5,1,1); scene.add(pl);

    const group = new THREE.Group();
    scene.add(group);
    build(group);

    let active = false;
    const clock = new THREE.Clock();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { active = e.isIntersecting; });
    });
    obs.observe(container.parentElement);

    (function loop() {
      requestAnimationFrame(loop);
      if (!active) return;
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.55;
      group.position.y = Math.sin(t * 0.75) * 0.12;
      renderer.render(scene, camera);
    })();
  });
}

/* ─────────────────────────────────────────
   9. SCROLL REVEAL
───────────────────────────────────────── */
function initReveal() {
  const els = $$('.reveal, .cat-card, .gallery-item, .step-node');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('in'), delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));

  // Section headers with stagger
  $$('.section-header').forEach(h => {
    const tag   = h.querySelector('.section-tag');
    const title = h.querySelector('h2');
    const p     = h.querySelector('p');
    [tag, title, p].filter(Boolean).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.1}s`;
      obs.observe(el);
    });
  });
}

/* ─────────────────────────────────────────
   10. STEPS PROGRESS
───────────────────────────────────────── */
function initSteps() {
  const progress = $('#stepsProgress');
  const track    = $('.steps-track');
  if (!progress || !track) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      progress.style.height = '100%';
    }
  }, { threshold: 0.3 });
  obs.observe(track);
}

/* ─────────────────────────────────────────
   11. TESTIMONIAL CAROUSEL
───────────────────────────────────────── */
function initTestimonials() {
  const track = $('#testimonialTrack');
  const dotsWrap = $('#testiDots');
  if (!track || !dotsWrap) return;

  const cards = $$('.testi-card', track);
  let current = 0;

  // Build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollTo(i));
    dotsWrap.appendChild(dot);
  });

  function scrollTo(i) {
    current = i;
    const card = cards[i];
    track.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
    $$('.testi-dot', dotsWrap).forEach((d, j) => d.classList.toggle('active', j === i));
  }

  // Auto-advance
  setInterval(() => scrollTo((current + 1) % cards.length), 4500);

  // Sync dots on manual scroll
  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / (cards[0]?.offsetWidth + 20 || 320));
    if (idx !== current) {
      current = idx;
      $$('.testi-dot', dotsWrap).forEach((d, j) => d.classList.toggle('active', j === current));
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────
   12. FORM INTERACTIONS
───────────────────────────────────────── */
function initForm() {
  // Upload zone
  const zone  = $('#uploadZone');
  const input = $('#fileInput');
  if (zone && input) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) showFile(e.dataTransfer.files[0]);
    });
  }
}

window.handleFile = function(e) {
  const file = e.target.files[0];
  if (file) showFile(file);
};

function showFile(file) {
  const zone = $('#uploadZone');
  if (!zone) return;
  zone.innerHTML = `<div class="upload-icon" style="color:var(--green)">✓</div><span>${file.name}</span>`;
  zone.style.borderColor = 'var(--green)';
  zone.style.color = 'var(--green)';
}

window.handleFormSubmit = function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  const success = $('#formSuccess');
  btn.innerHTML = '<span>Sending...</span>';
  btn.disabled = true;

  setTimeout(() => {
    btn.style.display = 'none';
    if (success) { success.style.display = 'flex'; success.classList.add('show'); }
    e.target.reset();
    const zone = $('#uploadZone');
    if (zone) {
      zone.innerHTML = `<div class="upload-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div><span>Drop image here or click to browse</span><input type="file" accept="image/*" id="fileInput" style="display:none" onchange="handleFile(event)"/>`;
      zone.style.borderColor = ''; zone.style.color = '';
    }
  }, 1200);
};

/* ─────────────────────────────────────────
   13. WHATSAPP FAB
───────────────────────────────────────── */
function initWaFab() {
  const fab = $('#waFab');
  if (!fab) return;

  window.addEventListener('scroll', () => {
    fab.classList.toggle('show', window.scrollY > 300);
  }, { passive: true });
}

/* ─────────────────────────────────────────
   14. INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavbar();
  initTheme();
  initLang();
  initReveal();
  initSteps();
  initTestimonials();
  initForm();
  initWaFab();

  // Three.js scenes — init after a short delay to ensure layout is ready
  if (typeof THREE !== 'undefined') {
    initHeroScene();
    setTimeout(() => {
      initProductScenes();
      initGalleryScenes();
    }, 300);
  }
});
