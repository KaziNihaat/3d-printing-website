"use strict";
/* ═══════════════════════════════════════════════════
   PRINTCRAFT BD — reviews.js
   1.  Storage keys & seed data
   2.  Data helpers (load / save)
   3.  Star picker widget
   4.  Homepage reviews section
   5.  Review card renderer
   6.  Rating summary bar
   7.  Filter & load-more
   8.  Submit review drawer
   9.  Photo upload in form
   10. Product modal review panel
   11. Review photo lightbox
   12. Helpful / vote button
   13. Language support
   14. Init
═══════════════════════════════════════════════════ */

const REV_STORAGE_KEY = "printcraft_reviews_v1";

/* ───────────────────────────────────────────────────
   1. SEED REVIEWS
   Pre-loaded so the site never looks empty.
───────────────────────────────────────────────── */
const SEED_REVIEWS = [
  {
    id:"r1", product:"nightfury", productName:"Night Fury Dragon",
    name:"Rafiq Hassan", location:"Dhaka",
    rating:5, text:"Absolutely stunning — the detail on the wings is incredible. My son cried with happiness when he opened it! Best gift I've ever given.",
    photos:[], date:"2026-04-10", helpful:12,
    status:"approved", hue:260
  },
  {
    id:"r2", product:"kitten", productName:"Cute Kitten Figurine",
    name:"Sunita Das", location:"Chittagong",
    rating:5, text:"The pastel pink colour is exactly what I wanted. It sits on my desk and everyone asks about it. The resin finish is so smooth and professional.",
    photos:["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=70"],
    date:"2026-04-14", helpful:8,
    status:"approved", hue:330
  },
  {
    id:"r3", product:"raptor", productName:"Velociraptor",
    name:"Tanvir Ahmed", location:"Rajshahi",
    rating:5, text:"Insane level of detail. The scale texture on the skin is mind-blowing. I collect 3D prints and this is top 3 in my entire collection without question.",
    photos:[], date:"2026-04-18", helpful:15,
    status:"approved", hue:30
  },
  {
    id:"r4", product:"deer", productName:"Baby Deer (Fawn)",
    name:"Anika Begum", location:"Sylhet",
    rating:4, text:"Really lovely piece — the white spots are so delicate. Lost one star only because delivery took an extra day, but the print quality is flawless.",
    photos:["https://images.unsplash.com/photo-1484406566174-9da000fda645?w=300&q=70"],
    date:"2026-04-20", helpful:6,
    status:"approved", hue:100
  },
  {
    id:"r5", product:"firedrake", productName:"Fire Drake Dragon",
    name:"Nasir Uddin", location:"Khulna",
    rating:5, text:"This thing is MASSIVE and gorgeous. The orange-red gradient paint job looks like actual fire. Took it to the office and everyone wants one now.",
    photos:["https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=300&q=70"],
    date:"2026-04-22", helpful:19,
    status:"approved", hue:15
  },
  {
    id:"r6", product:"cutedino", productName:"Cute Mini Dino",
    name:"Mitu Akter", location:"Dhaka",
    rating:5, text:"Bought 4 of these for my kids' birthday party as favours. Every single child LOVED them. The chubby chibi style is just too cute. Will order 10 more!",
    photos:[], date:"2026-04-24", helpful:11,
    status:"approved", hue:150
  },
  {
    id:"r7", product:"elephant", productName:"Baby Elephant",
    name:"Sajid Rahman", location:"Mymensingh",
    rating:4, text:"Got the sky blue one for my daughter. She sleeps with it every night. Really solid quality, love that the trunk curls up which means good luck!",
    photos:["https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=300&q=70"],
    date:"2026-04-26", helpful:9,
    status:"approved", hue:200
  },
  {
    id:"r8", product:"custom", productName:"Custom Print",
    name:"Nadia Hossain", location:"Dhaka",
    rating:5, text:"I sent a rough sketch and they turned it into a masterpiece. The communication was excellent and they sent progress photos. Will 100% order again!",
    photos:[], date:"2026-04-27", helpful:22,
    status:"approved", hue:280
  },
];

/* ───────────────────────────────────────────────────
   2. DATA HELPERS
───────────────────────────────────────────────── */
let _reviews = [];

async function loadReviews() {
  try {
    const r = await window.storage.get(REV_STORAGE_KEY);
    if (r && r.value) {
      const d = JSON.parse(r.value);
      if (d && d.length) { _reviews = d; return; }
    }
  } catch(e) {}
  _reviews = [...SEED_REVIEWS];
  await saveReviews();
}

async function saveReviews() {
  try { await window.storage.set(REV_STORAGE_KEY, JSON.stringify(_reviews)); } catch(e) {}
}

function approvedReviews() { return _reviews.filter(r => r.status === "approved"); }

function avgRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function reviewsForProduct(productId) {
  return approvedReviews().filter(r => r.product === productId);
}

/* ───────────────────────────────────────────────────
   3. STAR PICKER WIDGET
───────────────────────────────────────────────── */
const STAR_LABELS = ["","Terrible","Poor","Okay","Good","Excellent"];

function buildStarPicker(containerId, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  let selected = 0;

  function render(hover) {
    const active = hover || selected;
    el.innerHTML = `
      <div class="star-picker" id="${containerId}_stars">
        ${"★".repeat(5).split("").map((s, i) => `
          <span class="sp-star ${i < active ? "lit" : ""}" data-idx="${i+1}">${s}</span>
        `).join("")}
      </div>
      <div class="star-picker-label" id="${containerId}_label">${STAR_LABELS[active] || "Tap to rate"}</div>`;

    el.querySelectorAll(".sp-star").forEach(star => {
      star.addEventListener("mouseover", () => render(+star.dataset.idx));
      star.addEventListener("mouseleave", () => render(0));
      star.addEventListener("click", () => {
        selected = +star.dataset.idx;
        render(0);
        onChange(selected);
      });
    });
  }
  render(0);
  return { getValue: () => selected };
}

/* ───────────────────────────────────────────────────
   4. HOMEPAGE REVIEWS SECTION
───────────────────────────────────────────────── */
let revFilter   = "all";
let revShowing  = 6;
const PAGE_SIZE = 6;

function buildReviewsSection() {
  const section = document.getElementById("reviews");
  if (!section) return;

  const approved = approvedReviews();

  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <span class="section-tag" data-en="Customer Reviews" data-bn="গ্রাহক পর্যালোচনা">Customer Reviews</span>
        <h2 data-en="What Our <em>Customers Say</em>" data-bn="আমাদের <em>গ্রাহকরা কী বলেন</em>">What Our <em>Customers Say</em></h2>
        <p data-en="Every review is from a real PrintCraft BD customer." data-bn="প্রতিটি পর্যালোচনা একজন প্রকৃত গ্রাহকের কাছ থেকে।">Every review is from a real PrintCraft BD customer.</p>
      </div>

      ${buildSummaryBar(approved)}

      <div class="reviews-toolbar">
        <div class="review-filters" id="revFilters">
          <button class="rev-filter active" data-f="all"  data-en="All" data-bn="সব">All</button>
          <button class="rev-filter" data-f="5" data-en="5 ★" data-bn="৫ ★">5 ★</button>
          <button class="rev-filter" data-f="4" data-en="4 ★" data-bn="৪ ★">4 ★</button>
          <button class="rev-filter" data-f="dragons"   data-en="Dragons"      data-bn="ড্রাগন">Dragons</button>
          <button class="rev-filter" data-f="cute-toys" data-en="Cute Toys"     data-bn="কিউট খেলনা">Cute Toys</button>
          <button class="rev-filter" data-f="animals"   data-en="Baby Animals"  data-bn="বেবি অ্যানিমেল">Baby Animals</button>
          <button class="rev-filter" data-f="dinos"     data-en="Dinosaurs"     data-bn="ডাইনোসর">Dinosaurs</button>
        </div>
        <button class="btn-write-review" onclick="openReviewForm()">
          ✏ <span data-en="Write a Review" data-bn="পর্যালোচনা লিখুন">Write a Review</span>
        </button>
      </div>

      <div class="reviews-grid" id="reviewsGrid"></div>

      <div class="reviews-load-more" id="revLoadMore" style="display:none">
        <button class="btn-load-more" onclick="loadMoreReviews()">
          <span data-en="Load more reviews" data-bn="আরও পর্যালোচনা লোড করুন">Load more reviews</span>
        </button>
      </div>
    </div>
  `;

  // Filter event listeners
  document.querySelectorAll(".rev-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".rev-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      revFilter  = btn.dataset.f;
      revShowing = PAGE_SIZE;
      renderReviewCards();
    });
  });

  renderReviewCards();
  animateBars();
}

function buildSummaryBar(reviews) {
  const avg = avgRating(reviews).toFixed(1);
  const counts = [5,4,3,2,1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === s).length / reviews.length * 100) : 0
  }));

  return `
    <div class="reviews-summary reveal">
      <div class="reviews-avg">
        <div class="avg-number">${avg}</div>
        <div class="avg-stars">${"★".repeat(Math.round(avg))}${"☆".repeat(5-Math.round(avg))}</div>
        <div class="avg-count">${reviews.length} reviews</div>
      </div>
      <div class="rating-bars">
        ${counts.map(c => `
          <div class="rating-bar-row">
            <span class="rating-bar-label">${c.star}★</span>
            <div class="rating-bar-track">
              <div class="rating-bar-fill" data-pct="${c.pct}" style="width:0%"></div>
            </div>
            <span class="rating-bar-count">${c.count}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function animateBars() {
  // Use IntersectionObserver so bars animate when scrolled into view
  const bars = document.querySelectorAll(".rating-bar-fill");
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => { e.target.style.width = e.target.dataset.pct + "%"; }, 100);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => obs.observe(b));
}

/* ───────────────────────────────────────────────────
   5. REVIEW CARD RENDERER
───────────────────────────────────────────────── */
const PRODUCT_CATS = {
  nightfury:"dragons", firedrake:"dragons",
  kitten:"cute-toys", cutedino:"cute-toys",
  deer:"animals", elephant:"animals",
  raptor:"dinos",
  custom:"custom"
};

function getFilteredReviews() {
  const approved = approvedReviews();
  if (revFilter === "all") return approved;
  if (revFilter === "5")   return approved.filter(r => r.rating === 5);
  if (revFilter === "4")   return approved.filter(r => r.rating === 4);
  // category filter
  return approved.filter(r => PRODUCT_CATS[r.product] === revFilter);
}

function renderReviewCards() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;
  const all = getFilteredReviews();
  const shown = all.slice(0, revShowing);

  if (!all.length) {
    grid.innerHTML = `
      <div class="reviews-empty" style="grid-column:1/-1">
        <div class="empty-icon">💬</div>
        <h4 data-en="No reviews yet" data-bn="এখনো কোনো পর্যালোচনা নেই">No reviews yet</h4>
        <p data-en="Be the first to review this!" data-bn="প্রথম পর্যালোচনা করুন!">Be the first to review this!</p>
      </div>`;
    document.getElementById("revLoadMore").style.display = "none";
    return;
  }

  grid.innerHTML = shown.map((r, i) => buildReviewCard(r, i)).join("");

  // Animate in
  grid.querySelectorAll(".review-card").forEach((card, i) => {
    setTimeout(() => card.classList.add("in"), i * 60);
  });

  // Load more button
  const lm = document.getElementById("revLoadMore");
  lm.style.display = all.length > revShowing ? "" : "none";

  // Attach helpful buttons
  grid.querySelectorAll(".rev-helpful-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleHelpful(btn.dataset.id, btn));
  });

  // Attach photo zoom
  grid.querySelectorAll(".rev-photo").forEach(ph => {
    ph.addEventListener("click", () => openRevLightbox(ph.querySelector("img").src));
  });
}

function buildReviewCard(r, idx) {
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const initials = r.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#7c5cff,#b084ff)",
    "linear-gradient(135deg,#ff4da6,#cc2277)",
    "linear-gradient(135deg,#00d4ff,#0099bb)",
    "linear-gradient(135deg,#1bea8a,#00bb66)",
    "linear-gradient(135deg,#ff8c42,#ff5500)",
    "linear-gradient(135deg,#ffd700,#ff8c00)",
  ];
  const grad = gradients[idx % gradients.length];
  const voted = JSON.parse(localStorage.getItem("rev_helpful")||"{}")[r.id];

  return `
    <div class="review-card" style="transition-delay:${idx*0.05}s">
      <div class="rev-header">
        <div class="rev-author-row">
          <div class="rev-avatar" style="background:${grad}">${initials}</div>
          <div class="rev-author-info">
            <strong>${r.name}</strong>
            <span>${r.location}</span>
          </div>
        </div>
        <span class="rev-product-tag">${r.productName}</span>
      </div>
      <div class="rev-stars">
        ${stars.split("").map(s => `<span class="${s==="★"?"star-filled":"star-empty"}">${s}</span>`).join("")}
      </div>
      <div class="rev-body">${r.text}</div>
      ${r.photos && r.photos.length ? `
        <div class="rev-photos">
          ${r.photos.map(src => `
            <div class="rev-photo">
              <img src="${src}" alt="Review photo" loading="lazy"
                onerror="this.parentElement.style.display='none'"/>
            </div>`).join("")}
        </div>` : ""}
      <div class="rev-footer">
        <span class="rev-date">${formatDate(r.date)}</span>
        <div class="rev-helpful">
          <button class="rev-helpful-btn ${voted?"voted":""}" data-id="${r.id}">
            👍 Helpful (${r.helpful + (voted?0:0)})
          </button>
        </div>
      </div>
    </div>`;
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-BD", { year:"numeric", month:"short", day:"numeric" });
  } catch(e) { return dateStr; }
}

function loadMoreReviews() {
  revShowing += PAGE_SIZE;
  renderReviewCards();
}

/* ───────────────────────────────────────────────────
   6. RATING BARS already built in buildSummaryBar()
   7. FILTER already wired in buildReviewsSection()
───────────────────────────────────────────────── */

/* ───────────────────────────────────────────────────
   8. SUBMIT REVIEW DRAWER
───────────────────────────────────────────────── */
const PRODUCT_LIST = [
  {id:"nightfury",  name:"Night Fury Dragon"},
  {id:"kitten",     name:"Cute Kitten Figurine"},
  {id:"raptor",     name:"Velociraptor"},
  {id:"deer",       name:"Baby Deer (Fawn)"},
  {id:"firedrake",  name:"Fire Drake Dragon"},
  {id:"cutedino",   name:"Cute Mini Dino"},
  {id:"elephant",   name:"Baby Elephant"},
  {id:"custom",     name:"Custom Print"},
];

let formPhotos    = [];   // base64 strings
let formStarValue = 0;
let formStarPicker = null;

window.openReviewForm = function(productId) {
  buildFormDrawer(productId || "");
  const overlay = document.getElementById("reviewFormOverlay");
  if (overlay) {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
};

function buildFormDrawer(preselect) {
  let overlay = document.getElementById("reviewFormOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "reviewFormOverlay";
    overlay.className = "review-form-overlay";
    overlay.innerHTML = `
      <div class="review-form-drawer" id="reviewFormDrawer">
        <div class="drawer-handle"></div>
        <div class="drawer-header">
          <h3 data-en="Write a Review" data-bn="পর্যালোচনা লিখুন">Write a Review</h3>
          <button class="drawer-close" onclick="closeReviewForm()">✕</button>
        </div>
        <div class="drawer-body" id="reviewFormBody"></div>
        <div class="form-success-state" id="formSuccessState">
          <div class="success-icon">🎉</div>
          <h4 data-en="Thank you!" data-bn="ধন্যবাদ!">Thank you!</h4>
          <p data-en="Your review has been submitted and will appear after approval." data-bn="আপনার পর্যালোচনা জমা দেওয়া হয়েছে এবং অনুমোদনের পরে প্রদর্শিত হবে।">
            Your review has been submitted and will appear after approval.
          </p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeReviewForm(); });
  }

  formPhotos    = [];
  formStarValue = 0;
  document.getElementById("formSuccessState").classList.remove("show");
  document.getElementById("reviewFormBody").style.display = "";

  document.getElementById("reviewFormBody").innerHTML = `
    <div class="form-field">
      <label data-en="Your Name" data-bn="আপনার নাম">Your Name *</label>
      <input type="text" id="revName" placeholder="e.g. Rahim Uddin" required/>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label data-en="Location" data-bn="অবস্থান">Location</label>
        <input type="text" id="revLocation" placeholder="e.g. Dhaka"/>
      </div>
      <div class="form-field">
        <label data-en="Which Product?" data-bn="কোন পণ্য?">Which Product? *</label>
        <select id="revProduct">
          <option value="">Select a product…</option>
          ${PRODUCT_LIST.map(p => `<option value="${p.id}" ${preselect===p.id?"selected":""}>${p.name}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="form-field">
      <label data-en="Your Rating *" data-bn="আপনার রেটিং *">Your Rating *</label>
      <div id="revStarPicker"></div>
    </div>
    <div class="form-field">
      <label data-en="Your Review *" data-bn="আপনার পর্যালোচনা *">Your Review *</label>
      <textarea id="revText" rows="4"
        placeholder="Tell us about your experience — quality, delivery, what you loved..."></textarea>
    </div>
    <div class="form-field">
      <label data-en="Add Photos (optional)" data-bn="ছবি যোগ করুন (ঐচ্ছিক)">Add Photos (optional)</label>
      <div class="rev-upload-zone" id="revUploadZone"
        onclick="document.getElementById('revPhotoInput').click()">
        <div class="upload-icon-big">📷</div>
        <span data-en="Tap to add photos of your print" data-bn="আপনার প্রিন্টের ছবি যোগ করতে ট্যাপ করুন">Tap to add photos of your print</span>
        <input type="file" id="revPhotoInput" accept="image/*" multiple style="display:none"
          onchange="handleRevPhotos(event)"/>
      </div>
      <div class="rev-upload-previews" id="revPhotoPreviews"></div>
    </div>
    <button class="form-submit-btn" onclick="submitReview()">
      <span data-en="Submit Review" data-bn="পর্যালোচনা জমা দিন">Submit Review</span>
    </button>
    <div class="form-pending-note">
      <span data-en="⏳ Reviews are approved by our team before showing." data-bn="⏳ পর্যালোচনাগুলি প্রদর্শনের আগে আমাদের দল দ্বারা অনুমোদিত হয়।">
        ⏳ Reviews are approved by our team before showing.
      </span>
    </div>`;

  // Build star picker
  formStarPicker = buildStarPicker("revStarPicker", val => { formStarValue = val; });

  // Drag and drop on upload zone
  const zone = document.getElementById("revUploadZone");
  zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault(); zone.classList.remove("dragover");
    if (e.dataTransfer.files) handleRevPhotos({ target: { files: e.dataTransfer.files } });
  });
}

window.closeReviewForm = function() {
  const overlay = document.getElementById("reviewFormOverlay");
  if (overlay) { overlay.classList.remove("open"); document.body.style.overflow = ""; }
};

/* ───────────────────────────────────────────────────
   9. PHOTO UPLOAD IN FORM
───────────────────────────────────────────────── */
window.handleRevPhotos = function(e) {
  const files = [...(e.target.files || [])].slice(0, 4 - formPhotos.length);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      formPhotos.push(ev.target.result);
      renderRevPreviews();
    };
    reader.readAsDataURL(file);
  });
};

function renderRevPreviews() {
  const container = document.getElementById("revPhotoPreviews");
  if (!container) return;
  container.innerHTML = formPhotos.map((src, i) => `
    <div class="rev-up-preview">
      <img src="${src}" alt=""/>
      <button class="rm-btn" onclick="removeRevPhoto(${i})">✕</button>
    </div>`).join("");
}

window.removeRevPhoto = function(idx) {
  formPhotos.splice(idx, 1);
  renderRevPreviews();
};

/* ───────────────────────────────────────────────────
   Submit
───────────────────────────────────────────────── */
window.submitReview = async function() {
  const name    = document.getElementById("revName")?.value.trim();
  const product = document.getElementById("revProduct")?.value;
  const text    = document.getElementById("revText")?.value.trim();

  if (!name)    { flashField("revName",    "Name is required");    return; }
  if (!product) { flashField("revProduct", "Please select a product"); return; }
  if (!formStarValue) { showRevToast("Please select a star rating", "error"); return; }
  if (!text || text.length < 10) { flashField("revText", "Please write at least 10 characters"); return; }

  const productObj = PRODUCT_LIST.find(p => p.id === product);
  const newReview = {
    id:          "r" + Date.now(),
    product:     product,
    productName: productObj?.name || product,
    name, location: document.getElementById("revLocation")?.value.trim() || "Bangladesh",
    rating:  formStarValue,
    text,
    photos:  formPhotos.slice(0, 3),   // max 3 photos
    date:    new Date().toISOString().slice(0, 10),
    helpful: 0,
    status:  "pending",   // ← requires admin approval
    hue:     Math.floor(Math.random() * 360),
  };

  _reviews.push(newReview);
  await saveReviews();

  // Show success
  document.getElementById("reviewFormBody").style.display = "none";
  document.getElementById("formSuccessState").classList.add("show");

  // Auto close after 3s
  setTimeout(() => { closeReviewForm(); }, 3200);
};

function flashField(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = "var(--pink)";
  el.style.boxShadow = "0 0 0 3px rgba(255,77,166,.25)";
  showRevToast(msg, "error");
  setTimeout(() => { el.style.borderColor = ""; el.style.boxShadow = ""; }, 2000);
}

/* ───────────────────────────────────────────────────
   10. PRODUCT MODAL REVIEW PANEL
   Called by main.js openModal() after modal opens.
───────────────────────────────────────────────── */
window.injectModalReviews = function(productId, containerEl) {
  if (!containerEl) return;
  const revs = reviewsForProduct(productId);
  const avg  = avgRating(revs);

  containerEl.innerHTML = `
    <div class="modal-review-panel">
      <div class="modal-rev-header">
        <div class="modal-rev-title">
          Customer Reviews
          ${revs.length ? `(${revs.length})` : ""}
        </div>
        ${revs.length ? `
          <div class="modal-rev-avg">
            <span class="gold">${avg.toFixed(1)}</span>
            <span style="color:var(--gold)">★</span>
          </div>` : ""}
      </div>
      ${revs.length ? `
        <div class="modal-rev-list">
          ${revs.slice(0, 3).map(r => `
            <div class="modal-rev-item">
              <div class="mri-top">
                <span class="mri-name">${r.name}</span>
                <span class="mri-stars">${"★".repeat(r.rating)}</span>
              </div>
              <div class="mri-text">${r.text}</div>
              ${r.photos && r.photos.length ? `
                <div class="mri-photos">
                  ${r.photos.map(src => `
                    <div class="mri-photo">
                      <img src="${src}" alt="" loading="lazy"
                        onclick="openRevLightbox('${src}')"
                        onerror="this.parentElement.style.display='none'"/>
                    </div>`).join("")}
                </div>` : ""}
              <div class="mri-date">${formatDate(r.date)}</div>
            </div>`).join("")}
          ${revs.length > 3 ? `<div style="font-size:.78rem;color:var(--text3);text-align:center;padding:6px 0">+${revs.length-3} more reviews on the main page</div>` : ""}
        </div>` : `
        <div class="modal-rev-empty">
          No reviews yet for this product — be the first!
        </div>`}
      <button class="modal-write-btn" onclick="openReviewForm('${productId}')">
        ✏ Write a Review for This Product
      </button>
    </div>`;
};

/* ───────────────────────────────────────────────────
   11. REVIEW PHOTO LIGHTBOX
───────────────────────────────────────────────── */
window.openRevLightbox = function(src) {
  let lb = document.getElementById("revLightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "revLightbox"; lb.className = "rev-lightbox";
    lb.innerHTML = `
      <button class="rev-lb-close" onclick="closeRevLightbox()">✕</button>
      <img class="rev-lb-img" id="revLbImg" src="" alt="Review photo"/>`;
    lb.addEventListener("click", e => { if (e.target === lb) closeRevLightbox(); });
    document.body.appendChild(lb);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && lb.classList.contains("open")) closeRevLightbox();
    });
  }
  document.getElementById("revLbImg").src = src;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeRevLightbox = function() {
  const lb = document.getElementById("revLightbox");
  if (lb) { lb.classList.remove("open"); document.body.style.overflow = ""; }
};

/* ───────────────────────────────────────────────────
   12. HELPFUL / VOTE BUTTON
───────────────────────────────────────────────── */
function toggleHelpful(reviewId, btn) {
  const key   = "rev_helpful";
  const voted = JSON.parse(localStorage.getItem(key) || "{}");
  const rev   = _reviews.find(r => r.id === reviewId);
  if (!rev) return;

  if (voted[reviewId]) {
    // Un-vote
    delete voted[reviewId];
    rev.helpful = Math.max(0, rev.helpful - 1);
    btn.classList.remove("voted");
  } else {
    // Vote
    voted[reviewId] = true;
    rev.helpful += 1;
    btn.classList.add("voted");
  }
  localStorage.setItem(key, JSON.stringify(voted));
  btn.textContent = `👍 Helpful (${rev.helpful})`;
  saveReviews();
}

/* ───────────────────────────────────────────────────
   Toast helper (lightweight, for form validation)
───────────────────────────────────────────────── */
let revToastTimer;
function showRevToast(msg, type = "success") {
  let t = document.getElementById("revToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "revToast";
    t.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      padding:10px 20px;border-radius:50px;font-size:.82rem;font-weight:500;
      z-index:9999;white-space:nowrap;pointer-events:none;
      transition:opacity .3s;opacity:0;
      background:var(--surface);border:1px solid var(--border2);
      box-shadow:0 4px 20px rgba(0,0,0,.3);`;
    document.body.appendChild(t);
  }
  clearTimeout(revToastTimer);
  t.textContent = msg;
  t.style.color  = type === "error" ? "var(--pink)" : "var(--green)";
  t.style.opacity = "1";
  revToastTimer = setTimeout(() => { t.style.opacity = "0"; }, 2600);
}

/* ───────────────────────────────────────────────────
   13. EXPOSE helpers for admin.html
───────────────────────────────────────────────── */
window._reviewsAPI = {
  getAll:     ()  => _reviews,
  getApproved: () => approvedReviews(),
  approve:    async id => {
    const r = _reviews.find(x => x.id === id);
    if (r) { r.status = "approved"; await saveReviews(); buildReviewsSection(); }
  },
  reject:     async id => {
    const r = _reviews.find(x => x.id === id);
    if (r) { r.status = "rejected"; await saveReviews(); }
  },
  delete:     async id => {
    _reviews = _reviews.filter(r => r.id !== id);
    await saveReviews(); buildReviewsSection();
  },
  pendingCount: () => _reviews.filter(r => r.status === "pending").length,
};

/* ───────────────────────────────────────────────────
   14. INIT
───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  await loadReviews();
  buildReviewsSection();

  // Reveal animation for summary
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".review-card, .reviews-summary").forEach(el => obs.observe(el));
});
