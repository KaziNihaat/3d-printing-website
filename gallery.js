"use strict";
/* ═══════════════════════════════════════════════════
   PRINTCRAFT BD — gallery.js
   Handles everything image-related:
   1.  Image data (placeholder SVGs + swap instructions)
   2.  Product card image/3D toggle
   3.  Photo gallery section (masonry + slideshow)
   4.  Category tab filtering
   5.  View switcher (masonry ↔ slideshow)
   6.  Fullscreen lightbox (keyboard + touch)
   7.  Product modal image carousel
═══════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────
   1. IMAGE DATA
   ▸ Each product has an array of images.
   ▸ Currently all use generated SVG placeholders so the
     site works with zero real files.
   ▸ HOW TO SWAP IN REAL PHOTOS:
       1. Create a folder called  /images/products/
          inside your project folder.
       2. Drop your photo in — e.g. dragon1.jpg
       3. Replace the placeholder URL string below with:
              "images/products/dragon1.jpg"
       4. Save and refresh.  Done!
───────────────────────────────────────────────── */

/* Generates a crisp SVG placeholder so cards never show broken images */
function placeholder(label, hue, w=600, h=600){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <defs>
      <radialGradient id='g' cx='50%' cy='40%'>
        <stop offset='0%'  stop-color='hsl(${hue},55%,28%)'/>
        <stop offset='100%' stop-color='hsl(${hue},40%,10%)'/>
      </radialGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='44%' font-family='sans-serif' font-size='52'
      text-anchor='middle' dominant-baseline='middle' fill='hsla(${hue},80%,85%,0.18)'>📷</text>
    <text x='50%' y='58%' font-family='sans-serif' font-size='14' font-weight='600'
      text-anchor='middle' dominant-baseline='middle'
      fill='hsla(${hue},60%,75%,0.5)' letter-spacing='1'>${label}</text>
    <text x='50%' y='67%' font-family='sans-serif' font-size='11'
      text-anchor='middle' dominant-baseline='middle'
      fill='hsla(0,0%,100%,0.22)'>Replace with real photo</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ── PRODUCT IMAGES ──
   Key = product id (matches PRODUCTS in main.js)
   Each array = [main photo, angle 2, angle 3, ...]
   ► SWAP GUIDE: replace placeholder() calls with real paths ◄  */
const PRODUCT_IMAGES = {
  nightfury: [
    placeholder('Night Fury — Front',     260),   // ← swap: "images/products/nightfury-front.jpg"
    placeholder('Night Fury — Wings',     270),   // ← swap: "images/products/nightfury-wings.jpg"
    placeholder('Night Fury — Detail',    250),   // ← swap: "images/products/nightfury-detail.jpg"
  ],
  kitten: [
    placeholder('Kitten — Pink',          330),   // ← swap: "images/products/kitten-pink.jpg"
    placeholder('Kitten — Blue',          210),   // ← swap: "images/products/kitten-blue.jpg"
    placeholder('Kitten — Close-up',      340),   // ← swap: "images/products/kitten-closeup.jpg"
  ],
  raptor: [
    placeholder('Velociraptor — Side',     120),  // ← swap: "images/products/raptor-side.jpg"
    placeholder('Velociraptor — Head',     130),  // ← swap: "images/products/raptor-head.jpg"
    placeholder('Velociraptor — Scale',    110),  // ← swap: "images/products/raptor-scale.jpg"
  ],
  deer: [
    placeholder('Baby Deer — Lying',        30),  // ← swap: "images/products/deer-lying.jpg"
    placeholder('Baby Deer — Close-up',     35),  // ← swap: "images/products/deer-closeup.jpg"
    placeholder('Baby Deer — Pair',         25),  // ← swap: "images/products/deer-pair.jpg"
  ],
  firedrake: [
    placeholder('Fire Drake — Full',         15), // ← swap: "images/products/firedrake-full.jpg"
    placeholder('Fire Drake — Wings',        10), // ← swap: "images/products/firedrake-wings.jpg"
    placeholder('Fire Drake — Face',         20), // ← swap: "images/products/firedrake-face.jpg"
  ],
  cutedino: [
    placeholder('Cute Dino — Green',        150), // ← swap: "images/products/cutedino-green.jpg"
    placeholder('Cute Dino — Blue',         200), // ← swap: "images/products/cutedino-blue.jpg"
    placeholder('Cute Dino — Pack',         160), // ← swap: "images/products/cutedino-pack.jpg"
  ],
  elephant: [
    placeholder('Baby Elephant — Grey',     200), // ← swap: "images/products/elephant-grey.jpg"
    placeholder('Baby Elephant — Blue',     195), // ← swap: "images/products/elephant-blue.jpg"
    placeholder('Baby Elephant — Family',   185), // ← swap: "images/products/elephant-family.jpg"
  ],
};

/* ── GALLERY SECTION IMAGES ──
   These appear in the full-page photo gallery section.
   cat values must match filter tab data-cat values.
   ► Add as many as you like — masonry handles layout. ◄ */
const GALLERY_ITEMS = [
  // Dragons
  { id:'gal-1',  cat:'dragons',   title:'Night Fury Dragon',     desc:'Matte black PLA, 14cm wingspan',     img: placeholder('Night Fury — Studio', 260, 800, 1000) },
  { id:'gal-2',  cat:'dragons',   title:'Fire Drake Rearing',    desc:'Orange-red gradient, 18cm tall',     img: placeholder('Fire Drake — Hero',   15,  800, 600)  },
  { id:'gal-3',  cat:'dragons',   title:'Dragon Close-up',       desc:'Eye detail & scale texture',         img: placeholder('Dragon Detail',        255, 800, 800)  },
  // Cute Toys
  { id:'gal-4',  cat:'cute-toys', title:'Kitten — Pastel Pink',  desc:'Resin finish, 8cm tall',             img: placeholder('Kitten Pink',          330, 800, 900)  },
  { id:'gal-5',  cat:'cute-toys', title:'Kitten Colour Range',   desc:'10 pastel options available',        img: placeholder('Kittens Row',          320, 800, 600)  },
  { id:'gal-6',  cat:'cute-toys', title:'Cute Mini Dino',        desc:'Chibi style, glossy, 6cm',           img: placeholder('Cute Dino',            150, 800, 800)  },
  // Baby Animals
  { id:'gal-7',  cat:'animals',   title:'Baby Deer Fawn',        desc:'Resting pose, warm brown PLA',       img: placeholder('Baby Deer',             30,  800, 1000) },
  { id:'gal-8',  cat:'animals',   title:'Baby Elephant',         desc:'Sky blue option, 9cm tall',          img: placeholder('Baby Elephant',        195, 800, 800)  },
  { id:'gal-9',  cat:'animals',   title:'Animal Family Set',     desc:'Deer + Elephant bundle gift',        img: placeholder('Animal Family',         60,  800, 600)  },
  // Dinosaurs
  { id:'gal-10', cat:'dinos',     title:'Velociraptor',          desc:'Running pose, 12cm, textured',       img: placeholder('Raptor Studio',        120, 800, 900)  },
  { id:'gal-11', cat:'dinos',     title:'Dino Pack — 3 pieces',  desc:'Raptor + 2 cute dinos set',          img: placeholder('Dino Pack',            130, 800, 600)  },
  // Custom
  { id:'gal-12', cat:'custom',    title:'Custom Couple Gift',    desc:'Client commission — anniversary',    img: placeholder('Couple Custom',        300, 800, 900)  },
  { id:'gal-13', cat:'custom',    title:'Name Keychain Set',     desc:'Personalised engraved keychains',    img: placeholder('Keychain Custom',      200, 800, 700)  },
  { id:'gal-14', cat:'custom',    title:'Mini Portrait Figure',  desc:'Client likeness figurine',           img: placeholder('Portrait Custom',      270, 800, 1000) },
];

/* Slideshow uses a curated subset — the hero shots */
const SLIDESHOW_ITEMS = [
  { img: placeholder('Featured — Night Fury',  260, 1400, 700), title:'Night Fury Dragon', desc:'Our most popular piece — sleek, dramatic, iconic.' },
  { img: placeholder('Featured — Fire Drake',   15, 1400, 700), title:'Fire Drake Dragon', desc:'Rearing with open wings. A statement display piece.' },
  { img: placeholder('Featured — Kitten',      330, 1400, 700), title:'Cute Kitten Set',   desc:'Available in 10 pastel colours — perfect as a gift.' },
  { img: placeholder('Featured — Raptor',      120, 1400, 700), title:'Velociraptor',      desc:'High-detail surface with articulated jaw.' },
  { img: placeholder('Featured — Deer',         30, 1400, 700), title:'Baby Deer (Fawn)',  desc:'Gentle and sweet — a nature lover\'s favourite.' },
];

/* ───────────────────────────────────────────────────
   2. PRODUCT CARD — IMAGE/3D TOGGLE
───────────────────────────────────────────────── */
function initCardImageToggles(){
  // For each product card that has a canvas, inject:
  //  - An <img> overlay layer
  //  - A placeholder label
  //  - A view-toggle pill (3D | Photo)
  document.querySelectorAll('.prod-card[data-cat]').forEach(card => {
    const id      = card.querySelector('.prod-canvas')?.id?.replace('pc-','');
    const wrap    = card.querySelector('.prod-viewer-wrap');
    if(!wrap || !id || !PRODUCT_IMAGES[id]) return;

    const imgs = PRODUCT_IMAGES[id];

    // Main overlay image (shows first photo)
    const imgEl = document.createElement('img');
    imgEl.className = 'prod-img-layer';
    imgEl.alt = id;
    imgEl.src = imgs[0];
    wrap.appendChild(imgEl);

    // Placeholder label
    const lbl = document.createElement('div');
    lbl.className = 'placeholder-label';
    lbl.textContent = '📷 Add real photo here';
    wrap.appendChild(lbl);

    // Toggle pill
    const pill = document.createElement('div');
    pill.className = 'view-toggle';
    pill.innerHTML = `
      <button class="vt-btn active" data-view="3d">3D</button>
      <button class="vt-btn"        data-view="photo">Photo</button>`;
    wrap.appendChild(pill);

    let mode = '3d';
    pill.addEventListener('click', e => {
      const btn = e.target.closest('.vt-btn');
      if(!btn) return;
      mode = btn.dataset.view;
      pill.querySelectorAll('.vt-btn').forEach(b => b.classList.toggle('active', b.dataset.view === mode));
      wrap.classList.toggle('show-image', mode === 'photo');
      // Hide placeholder label once real image is confirmed loaded
      if(mode === 'photo') lbl.style.display = 'block';
      else lbl.style.display = 'none';
    });
  });
}

/* ───────────────────────────────────────────────────
   3–5. PHOTO GALLERY SECTION
───────────────────────────────────────────────── */
function buildPhotoGallerySection(){
  const section = document.getElementById('photo-gallery');
  if(!section) return;

  // ── Build masonry ──
  const masonry = section.querySelector('.masonry-wrap');
  if(masonry){
    GALLERY_ITEMS.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'masonry-item';
      el.dataset.cat = item.cat;
      el.dataset.idx = i;
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      el.innerHTML = `
        <img src="${item.img}" alt="${item.title}" loading="lazy"/>
        <div class="masonry-caption">
          <div>
            <div class="masonry-caption-cat">${catLabel(item.cat)}</div>
            <div class="masonry-caption-text">${item.title}</div>
          </div>
          <div class="masonry-zoom">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </div>
        </div>`;
      el.addEventListener('click', () => openLightbox(i));
      masonry.appendChild(el);
    });

    // Reveal masonry items on scroll
    const mObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){ e.target.classList.add('in'); mObs.unobserve(e.target); }
      });
    }, {threshold: 0.08});
    masonry.querySelectorAll('.masonry-item').forEach(el => mObs.observe(el));
  }

  // ── Build slideshow ──
  const ssTrack = section.querySelector('.slideshow-track');
  const ssDots  = section.querySelector('.ss-dots');
  if(ssTrack){
    SLIDESHOW_ITEMS.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide' + (i===0?' active':'');
      slide.innerHTML = `
        <img src="${item.img}" alt="${item.title}" loading="lazy"/>
        <div class="slide-caption">
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>`;
      ssTrack.appendChild(slide);
    });

    SLIDESHOW_ITEMS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'ss-dot' + (i===0?' active':'');
      dot.addEventListener('click', () => goSlide(i));
      ssDots?.appendChild(dot);
    });

    let currentSlide = 0, ssTimer;

    function goSlide(n){
      currentSlide = (n + SLIDESHOW_ITEMS.length) % SLIDESHOW_ITEMS.length;
      ssTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
      ssTrack.querySelectorAll('.slide').forEach((s,i) => s.classList.toggle('active', i===currentSlide));
      ssDots?.querySelectorAll('.ss-dot').forEach((d,i) => d.classList.toggle('active', i===currentSlide));
      restartTimer();
    }

    function restartTimer(){
      clearInterval(ssTimer);
      ssTimer = setInterval(() => goSlide(currentSlide+1), 4500);
    }
    restartTimer();

    section.querySelector('.ss-arrow.left')?.addEventListener( 'click', () => goSlide(currentSlide-1));
    section.querySelector('.ss-arrow.right')?.addEventListener('click', () => goSlide(currentSlide+1));
  }
}

function catLabel(cat){
  const map = {
    'dragons':'Dragon','cute-toys':'Cute Toy',
    'animals':'Baby Animal','dinos':'Dinosaur','custom':'Custom'
  };
  return map[cat] || cat;
}

/* ── Gallery tab filter ── */
function initGalleryTabs(){
  const section = document.getElementById('photo-gallery');
  if(!section) return;

  const tabs = section.querySelectorAll('.gtab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      section.querySelectorAll('.masonry-item').forEach(item => {
        const show = filter === 'all' || item.dataset.cat === filter;
        item.classList.toggle('hidden', !show);
        if(show && !item.classList.contains('in')){
          setTimeout(() => item.classList.add('in'), 80);
        }
      });
    });
  });
}

/* ── View switcher: masonry ↔ slideshow ── */
function initViewSwitcher(){
  const section = document.getElementById('photo-gallery');
  if(!section) return;

  section.querySelectorAll('.gvt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      section.querySelectorAll('.gvt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      section.querySelectorAll('.gallery-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.panel === view);
      });
    });
  });
}

/* ───────────────────────────────────────────────────
   6. FULLSCREEN LIGHTBOX
───────────────────────────────────────────────── */
let lbIndex = 0;
let lbItems  = GALLERY_ITEMS; // default pool

function openLightbox(idx, items = GALLERY_ITEMS){
  lbItems = items;
  lbIndex = idx;
  renderLightbox();
  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function renderLightbox(){
  const item = lbItems[lbIndex];
  if(!item) return;

  // Main image
  const img = document.querySelector('#lightbox .lb-img-wrap img');
  img.classList.add('loading');
  const newSrc = item.img || item;
  img.onload = () => img.classList.remove('loading');
  img.src = newSrc;
  img.alt = item.title || '';

  // Caption
  document.querySelector('#lightbox .lb-caption h4').textContent = item.title || '';
  document.querySelector('#lightbox .lb-caption p').textContent  = item.desc  || '';
  document.querySelector('#lightbox .lb-counter').textContent =
    `${lbIndex + 1} / ${lbItems.length}`;

  // Thumbnails
  const strip = document.querySelector('#lightbox .lb-thumbs');
  strip.innerHTML = '';
  lbItems.forEach((it, i) => {
    const t = document.createElement('div');
    t.className = 'lb-thumb' + (i === lbIndex ? ' active' : '');
    t.innerHTML = `<img src="${it.img || it}" alt="" loading="lazy"/>`;
    t.addEventListener('click', () => { lbIndex = i; renderLightbox(); });
    strip.appendChild(t);
  });
  // Scroll active thumb into view
  const activeTh = strip.querySelectorAll('.lb-thumb')[lbIndex];
  activeTh?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
}

function buildLightboxDOM(){
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lb-close" id="lbClose" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <button class="lb-prev" id="lbPrev">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <button class="lb-next" id="lbNext">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <div class="lb-inner">
      <div class="lb-img-wrap"><img src="" alt=""/></div>
      <div class="lb-caption"><h4></h4><p></p><div class="lb-counter"></div></div>
      <div class="lb-thumbs"></div>
    </div>`;
  document.body.appendChild(lb);

  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => { lbIndex=(lbIndex-1+lbItems.length)%lbItems.length; renderLightbox(); });
  document.getElementById('lbNext').addEventListener('click', () => { lbIndex=(lbIndex+1)%lbItems.length; renderLightbox(); });

  // Click backdrop to close
  lb.addEventListener('click', e => { if(e.target===lb) closeLightbox(); });

  // Keyboard
  document.addEventListener('keydown', e => {
    if(!lb.classList.contains('open')) return;
    if(e.key==='ArrowRight') { lbIndex=(lbIndex+1)%lbItems.length; renderLightbox(); }
    if(e.key==='ArrowLeft')  { lbIndex=(lbIndex-1+lbItems.length)%lbItems.length; renderLightbox(); }
    if(e.key==='Escape') closeLightbox();
  });

  // Touch swipe
  let tx=0;
  lb.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; },{passive:true});
  lb.addEventListener('touchend',   e=>{
    const dx=e.changedTouches[0].clientX-tx;
    if(Math.abs(dx)>50){
      lbIndex = dx<0 ? (lbIndex+1)%lbItems.length : (lbIndex-1+lbItems.length)%lbItems.length;
      renderLightbox();
    }
  });
}

/* ───────────────────────────────────────────────────
   7. PRODUCT MODAL — IMAGE CAROUSEL
   Attaches to the existing modal built in main.js.
   Injects a photo toggle + thumbnail strip.
───────────────────────────────────────────────── */
function patchModalWithImages(id){
  const viewer = document.getElementById('modal3d');
  if(!viewer || !PRODUCT_IMAGES[id]) return;

  const imgs = PRODUCT_IMAGES[id];

  // Photo overlay layer
  const overlay = document.createElement('div');
  overlay.className = 'modal-photo-overlay';
  overlay.innerHTML = `<img src="${imgs[0]}" alt=""/>`;
  viewer.appendChild(overlay);

  // View toggle row
  const toggleRow = document.createElement('div');
  toggleRow.className = 'modal-view-row';
  toggleRow.innerHTML = `
    <button class="mvr-btn active" data-v="3d">3D</button>
    <button class="mvr-btn"        data-v="photo">Photo</button>`;
  viewer.appendChild(toggleRow);

  // Thumbnail strip
  if(imgs.length > 1){
    const strip = document.createElement('div');
    strip.className = 'modal-img-carousel';
    imgs.forEach((src, i) => {
      const th = document.createElement('div');
      th.className = 'mic-thumb' + (i===0?' active':'');
      th.innerHTML = `<img src="${src}" alt="" loading="lazy"/>`;
      th.addEventListener('click', () => {
        strip.querySelectorAll('.mic-thumb').forEach((t,j) => t.classList.toggle('active', j===i));
        overlay.querySelector('img').src = src;
        // Switch to photo mode automatically
        overlay.classList.add('show');
        toggleRow.querySelectorAll('.mvr-btn').forEach(b => b.classList.toggle('active', b.dataset.v==='photo'));
      });
      strip.appendChild(th);
    });
    viewer.appendChild(strip);
  }

  // Toggle logic
  toggleRow.addEventListener('click', e => {
    const btn = e.target.closest('.mvr-btn');
    if(!btn) return;
    const v = btn.dataset.v;
    toggleRow.querySelectorAll('.mvr-btn').forEach(b => b.classList.toggle('active', b.dataset.v===v));
    overlay.classList.toggle('show', v==='photo');
  });

  // Allow clicking photo to open lightbox
  overlay.addEventListener('click', () => {
    const currentSrc = overlay.querySelector('img').src;
    const idx = imgs.indexOf(currentSrc) >= 0 ? imgs.indexOf(currentSrc) : 0;
    // Build a simple array for the lightbox
    openLightbox(idx, imgs.map((img,i)=>({
      img,
      title: `${id.charAt(0).toUpperCase()+id.slice(1)} — Photo ${i+1}`,
      desc:  'Click arrows or use keyboard to browse'
    })));
  });
}

/* Expose so main.js openModal() can call it */
window.patchModalWithImages = patchModalWithImages;

/* ───────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildLightboxDOM();
  initCardImageToggles();
  buildPhotoGallerySection();
  initGalleryTabs();
  initViewSwitcher();
});
