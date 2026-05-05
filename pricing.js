"use strict";
/* ═══════════════════════════════════════════════════
   PRINTCRAFT BD — pricing.js
   Self-contained pricing calculator.
   Sections:
   1.  Pricing data (base prices, multipliers)
   2.  State
   3.  DOM helpers
   4.  Step navigation
   5.  Size panel
   6.  Material panel
   7.  Quantity panel
   8.  Finish panel
   9.  Price engine
   10. Result panel renderer
   11. WhatsApp quote builder
   12. Language sync
   13. Init
═══════════════════════════════════════════════════ */

/* ─── 1. PRICING DATA ───────────────────────────── */

/* Base prices in BDT per size tier */
const BASE_PRICES = {
  small:  300,   /* keychain / tiny figurine   ≤ 5cm  */
  medium: 550,   /* hand-sized print            6–12cm */
  large:  950,   /* display piece              13–22cm */
  custom: null,  /* calculated from volume      user cm */
};

/* Material cost multipliers */
const MATERIALS = [
  {
    id: 'pla',
    icon: '🧱',
    nameEn: 'PLA',       nameBn: 'Pিএলএ',
    descEn: 'Standard — smooth finish, wide colour range',
    descBn: 'স্ট্যান্ডার্ড — মসৃণ ফিনিশ, বিস্তৃত রঙ',
    tagEn: 'Standard',   tagBn: 'স্ট্যান্ডার্ড',
    multiplier: 1.0,
  },
  {
    id: 'petg',
    icon: '💪',
    nameEn: 'PETG',      nameBn: 'পিইটিজি',
    descEn: 'Durable — impact resistant, slightly flexible',
    descBn: 'টেকসই — প্রভাব প্রতিরোধী, সামান্য নমনীয়',
    tagEn: '+20%',       tagBn: '+২০%',
    multiplier: 1.20,
  },
  {
    id: 'resin',
    icon: '✨',
    nameEn: 'Resin',     nameBn: 'রেজিন',
    descEn: 'High detail — ultra fine features, glossy',
    descBn: 'উচ্চ বিস্তারিত — অতি সূক্ষ্ম বৈশিষ্ট্য, চকচকে',
    tagEn: '+60%',       tagBn: '+৬০%',
    multiplier: 1.60,
  },
  {
    id: 'tpu',
    icon: '🤸',
    nameEn: 'Flexible (TPU)', nameBn: 'ফ্লেক্সিবল (টিপিইউ)',
    descEn: 'Soft & bendy — perfect for toys & grips',
    descBn: 'নরম ও নমনীয় — খেলনা ও গ্রিপের জন্য নিখুঁত',
    tagEn: '+40%',       tagBn: '+৪০%',
    multiplier: 1.40,
  },
];

/* Size tiers */
const SIZES = [
  {
    id: 'small',
    icon: '🔑',
    nameEn: 'Small',     nameBn: 'ছোট',
    rangeEn: 'Up to 5cm',   rangeBn: '৫ সেমি পর্যন্ত',
    exampleEn: 'Keychain, mini figurine',
    exampleBn: 'কীচেইন, মিনি ফিগারিন',
  },
  {
    id: 'medium',
    icon: '🤚',
    nameEn: 'Medium',    nameBn: 'মাঝারি',
    rangeEn: '6–12 cm',     rangeBn: '৬–১২ সেমি',
    exampleEn: 'Cute toy, animal',
    exampleBn: 'কিউট খেলনা, প্রাণী',
  },
  {
    id: 'large',
    icon: '🏆',
    nameEn: 'Large',     nameBn: 'বড়',
    rangeEn: '13–22 cm',    rangeBn: '১৩–২২ সেমি',
    exampleEn: 'Dragon, display piece',
    exampleBn: 'ড্রাগন, ডিসপ্লে পিস',
  },
  {
    id: 'custom',
    icon: '📐',
    nameEn: 'Custom',    nameBn: 'কাস্টম',
    rangeEn: 'Enter cm',    rangeBn: 'সেমি লিখুন',
    exampleEn: 'Your exact size',
    exampleBn: 'আপনার সঠিক আকার',
  },
];

/* Finish options */
const FINISHES = [
  {
    id: 'standard',
    dotColor: '#a89ec9',
    nameEn: 'Standard finish',  nameBn: 'স্ট্যান্ডার্ড ফিনিশ',
    multiplier: 1.0,
  },
  {
    id: 'sanded',
    dotColor: '#00d4ff',
    nameEn: 'Sanded smooth',    nameBn: 'স্যান্ডেড মসৃণ',
    multiplier: 1.15,
  },
  {
    id: 'painted',
    dotColor: '#ff4da6',
    nameEn: 'Hand painted',     nameBn: 'হাতে রঙ করা',
    multiplier: 1.40,
  },
];

/* Quantity break discounts */
const QTY_DISCOUNTS = [
  { min: 1,  max: 1,  discount: 0.00, labelEn: '',              labelBn: '' },
  { min: 2,  max: 4,  discount: 0.05, labelEn: '5% off',        labelBn: '৫% ছাড়' },
  { min: 5,  max: 9,  discount: 0.10, labelEn: '10% off',       labelBn: '১০% ছাড়' },
  { min: 10, max: 999,discount: 0.15, labelEn: '15% bulk off',  labelBn: '১৫% বাল্ক ছাড়' },
];

/* BDT per cm³ for custom size estimation */
const BDT_PER_CM3 = 14;

/* Delivery days per size */
const DELIVERY_DAYS = { small: '2–3', medium: '3–5', large: '5–7', custom: '5–8' };

/* ─── 2. STATE ─────────────────────────────────── */
const calcState = {
  step:       1,    /* 1=size, 2=material, 3=qty, 4=finish */
  size:       null,
  customL:    '',
  customW:    '',
  customH:    '',
  material:   null,
  qty:        1,
  finish:     'standard',
};

/* ─── 3. DOM HELPERS ──────────────────────────── */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const lang = () => document.documentElement.getAttribute('data-lang') || 'en';
const t = (en, bn) => lang() === 'bn' ? bn : en;

/* ─── 4. STEP NAVIGATION ──────────────────────── */
function goStep(n) {
  calcState.step = n;
  renderStepTabs();
  renderActivePanel();
  renderResult();
}

function renderStepTabs() {
  $$('.calc-step-tab').forEach(tab => {
    const s = parseInt(tab.dataset.step);
    tab.classList.remove('active', 'done');
    if (s === calcState.step) tab.classList.add('active');
    if (s < calcState.step)  tab.classList.add('done');
    /* Update number → checkmark for done steps */
    const num = tab.querySelector('.calc-step-num');
    if (num) num.textContent = s < calcState.step ? '✓' : s;
  });
}

/* Validate whether user can advance from current step */
function canAdvance() {
  if (calcState.step === 1) {
    if (!calcState.size) return false;
    if (calcState.size === 'custom') {
      const l = parseFloat(calcState.customL);
      const w = parseFloat(calcState.customW);
      const h = parseFloat(calcState.customH);
      if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) return false;
    }
    return true;
  }
  if (calcState.step === 2) return !!calcState.material;
  return true; /* steps 3 & 4 always valid */
}

/* ─── 5. SIZE PANEL ───────────────────────────── */
function renderSizePanel() {
  const grid = $('#sizeGrid');
  if (!grid) return;

  grid.innerHTML = SIZES.map(sz => `
    <div class="size-card ${calcState.size === sz.id ? 'selected' : ''}"
         data-size="${sz.id}" role="button" tabindex="0"
         aria-pressed="${calcState.size === sz.id}">
      <span class="size-card-icon">${sz.icon}</span>
      <span class="size-card-name">${t(sz.nameEn, sz.nameBn)}</span>
      <span class="size-card-range">${t(sz.rangeEn, sz.rangeBn)}</span>
    </div>`).join('');

  grid.querySelectorAll('.size-card').forEach(card => {
    const activate = () => {
      calcState.size = card.dataset.size;
      renderSizePanel();
      toggleCustomDims();
      updateNextBtn();
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }});
  });
  toggleCustomDims();
}

function toggleCustomDims() {
  const dims = $('#customDims');
  if (!dims) return;
  dims.classList.toggle('show', calcState.size === 'custom');
}

function bindCustomDims() {
  ['customL','customW','customH'].forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;
    el.addEventListener('input', e => {
      calcState[id] = e.target.value;
      updateNextBtn();
      renderResult();
    });
  });
}

/* ─── 6. MATERIAL PANEL ───────────────────────── */
function renderMaterialPanel() {
  const grid = $('#materialGrid');
  if (!grid) return;

  grid.innerHTML = MATERIALS.map(m => `
    <div class="mat-card ${calcState.material === m.id ? 'selected' : ''}"
         data-mat="${m.id}" role="button" tabindex="0"
         aria-pressed="${calcState.material === m.id}">
      <span class="mat-icon">${m.icon}</span>
      <span class="mat-name">${t(m.nameEn, m.nameBn)}</span>
      <span class="mat-desc">${t(m.descEn, m.descBn)}</span>
      <span class="mat-multiplier">${t(m.tagEn, m.tagBn)}</span>
    </div>`).join('');

  grid.querySelectorAll('.mat-card').forEach(card => {
    const activate = () => {
      calcState.material = card.dataset.mat;
      renderMaterialPanel();
      updateNextBtn();
      renderResult();
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }});
  });
}

/* ─── 7. QUANTITY PANEL ───────────────────────── */
function bindQtyPanel() {
  const display = $('#qtyDisplay');
  const note    = $('#qtyNote');
  const decBtn  = $('#qtyDec');
  const incBtn  = $('#qtyInc');
  if (!display || !decBtn || !incBtn) return;

  function update() {
    display.textContent = calcState.qty;
    decBtn.disabled = calcState.qty <= 1;
    incBtn.disabled = calcState.qty >= 99;
    /* Show discount label */
    const disc = QTY_DISCOUNTS.find(d => calcState.qty >= d.min && calcState.qty <= d.max);
    if (note) note.textContent = disc && disc.discount > 0 ? `🎉 ${t(disc.labelEn, disc.labelBn)}` : '';
    renderResult();
  }

  decBtn.addEventListener('click', () => { if (calcState.qty > 1)  { calcState.qty--; update(); }});
  incBtn.addEventListener('click', () => { if (calcState.qty < 99) { calcState.qty++; update(); }});
  update();
}

/* ─── 8. FINISH PANEL ─────────────────────────── */
function renderFinishPanel() {
  const row = $('#finishRow');
  if (!row) return;

  row.innerHTML = FINISHES.map(f => `
    <div class="finish-chip ${calcState.finish === f.id ? 'selected' : ''}"
         data-finish="${f.id}" role="button" tabindex="0">
      <span class="finish-chip-dot" style="background:${f.id === calcState.finish ? f.dotColor : 'transparent'};border-color:${f.dotColor}"></span>
      ${t(f.nameEn, f.nameBn)}
    </div>`).join('');

  row.querySelectorAll('.finish-chip').forEach(chip => {
    const activate = () => {
      calcState.finish = chip.dataset.finish;
      renderFinishPanel();
      renderResult();
    };
    chip.addEventListener('click', activate);
    chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }});
  });
}

/* ─── 9. PRICE ENGINE ─────────────────────────── */
function calcVolumeCm3() {
  const l = parseFloat(calcState.customL) || 0;
  const w = parseFloat(calcState.customW) || 0;
  const h = parseFloat(calcState.customH) || 0;
  /* Approximate — solid bounding box × 0.35 fill factor */
  return l * w * h * 0.35;
}

function getBasePrice() {
  if (!calcState.size) return null;
  if (calcState.size === 'custom') {
    const vol = calcVolumeCm3();
    if (vol <= 0) return null;
    return Math.max(300, Math.round(vol * BDT_PER_CM3 / 50) * 50); /* round to ৳50 */
  }
  return BASE_PRICES[calcState.size];
}

function getPrice() {
  const base = getBasePrice();
  if (base === null) return null;

  const matMul = calcState.material
    ? (MATERIALS.find(m => m.id === calcState.material)?.multiplier || 1)
    : 1;

  const finMul = FINISHES.find(f => f.id === calcState.finish)?.multiplier || 1;

  const unitPrice = Math.round(base * matMul * finMul);

  const disc = QTY_DISCOUNTS.find(d => calcState.qty >= d.min && calcState.qty <= d.max);
  const discRate = disc?.discount || 0;

  const total = Math.round(unitPrice * calcState.qty * (1 - discRate));

  return {
    base,
    matMul,
    finMul,
    unitPrice,
    qty: calcState.qty,
    discRate,
    discLabel: lang() === 'bn' ? disc?.labelBn : disc?.labelEn,
    total,
    delivery: DELIVERY_DAYS[calcState.size] || '3–5',
  };
}

/* ─── 10. RESULT PANEL RENDERER ──────────────── */
function renderResult() {
  const amountEl  = $('#resultAmount');
  const bodyEl    = $('#resultBody');
  const ctaEl     = $('#resultCta');
  if (!amountEl || !bodyEl) return;

  const p = getPrice();

  /* Pending — not enough info yet */
  if (!p) {
    amountEl.textContent = '—';
    bodyEl.innerHTML = `
      <div class="result-pending">
        <span class="result-pending-icon">🖨️</span>
        ${t('Complete the steps to see your price estimate.', 'মূল্য অনুমান দেখতে ধাপগুলি সম্পূর্ণ করুন।')}
      </div>`;
    if (ctaEl) { ctaEl.classList.add('disabled'); ctaEl.setAttribute('aria-disabled','true'); }
    return;
  }

  /* Animate price change */
  amountEl.classList.add('updating');
  setTimeout(() => {
    amountEl.textContent = p.total.toLocaleString('en-BD');
    amountEl.classList.remove('updating');
  }, 160);

  /* Breakdown rows */
  const matName  = calcState.material
    ? t(MATERIALS.find(m=>m.id===calcState.material)?.nameEn||'', MATERIALS.find(m=>m.id===calcState.material)?.nameBn||'')
    : '—';
  const finName  = t(FINISHES.find(f=>f.id===calcState.finish)?.nameEn||'', FINISHES.find(f=>f.id===calcState.finish)?.nameBn||'');
  const sizeName = calcState.size
    ? (calcState.size==='custom'
        ? `${calcState.customL||'?'}×${calcState.customW||'?'}×${calcState.customH||'?'} cm`
        : t(SIZES.find(s=>s.id===calcState.size)?.nameEn||'', SIZES.find(s=>s.id===calcState.size)?.nameBn||''))
    : '—';

  const discRow = p.discRate > 0 ? `
    <tr>
      <td>${t('Qty discount','পরিমাণ ছাড়')} <span style="color:var(--green);font-size:.7rem">${p.discLabel}</span></td>
      <td>− ৳${Math.round(p.unitPrice * p.qty * p.discRate).toLocaleString('en-BD')}</td>
    </tr>` : '';

  bodyEl.innerHTML = `
    <div class="delivery-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
      </svg>
      ${t(`Est. delivery: ${p.delivery} days`, `আনুমানিক ডেলিভারি: ${p.delivery} দিন`)}
    </div>

    <table class="breakdown-table">
      <tr>
        <td>${t('Size','আকার')}</td>
        <td>${sizeName}</td>
      </tr>
      <tr>
        <td>${t('Material','উপকরণ')}</td>
        <td>${matName}</td>
      </tr>
      <tr>
        <td>${t('Finish','ফিনিশ')}</td>
        <td>${finName}</td>
      </tr>
      <tr>
        <td>${t('Unit price','একক মূল্য')}</td>
        <td>৳${p.unitPrice.toLocaleString('en-BD')}</td>
      </tr>
      <tr>
        <td>${t('Quantity','পরিমাণ')}</td>
        <td>× ${p.qty}</td>
      </tr>
      ${discRow}
      <tr class="total-row">
        <td>${t('Total estimate','মোট অনুমান')}</td>
        <td>৳${p.total.toLocaleString('en-BD')}</td>
      </tr>
    </table>`;

  if (ctaEl) {
    ctaEl.classList.remove('disabled');
    ctaEl.removeAttribute('aria-disabled');
    ctaEl.href = buildWALink(p, sizeName, matName, finName);
  }
}

/* ─── 11. WHATSAPP QUOTE BUILDER ─────────────── */
function buildWALink(p, sizeName, matName, finName) {
  const WA_NUMBER = '8801XXXXXXXXX'; /* ← Replace with real number */
  const msg = lang() === 'bn'
    ? `হ্যালো! আমি একটি ৩ডি প্রিন্ট অর্ডার করতে চাই।\n\n📐 আকার: ${sizeName}\n🧱 উপকরণ: ${matName}\n✨ ফিনিশ: ${finName}\n🔢 পরিমাণ: ${p.qty}\n💰 আনুমানিক মূল্য: ৳${p.total.toLocaleString('en-BD')}\n\nঅনুগ্রহ করে নিশ্চিত করুন।`
    : `Hello! I'd like to order a 3D print.\n\n📐 Size: ${sizeName}\n🧱 Material: ${matName}\n✨ Finish: ${finName}\n🔢 Quantity: ${p.qty}\n💰 Estimated price: ৳${p.total.toLocaleString('en-BD')}\n\nPlease confirm.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* ─── 12. LANGUAGE SYNC ──────────────────────── */
/* Called by main.js applyLang after language switches */
window.refreshPricingCalc = function() {
  renderSizePanel();
  renderMaterialPanel();
  renderFinishPanel();
  renderResult();
};

/* ─── 13. INIT ───────────────────────────────── */
function updateNextBtn() {
  /* Update ALL next buttons in the active panel */
  const activePanel = $(`.calc-panel[data-step="${calcState.step}"]`);
  if (!activePanel) return;
  activePanel.querySelectorAll('.calc-next-btn').forEach(btn => {
    btn.disabled = !canAdvance();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('pricing');
  if (!section) return;

  /* Render initial panels */
  renderSizePanel();
  renderMaterialPanel();
  renderFinishPanel();
  bindCustomDims();
  bindQtyPanel();
  renderResult();
  updateNextBtn();

  /* ── Event delegation for all nav buttons ──
     Handles all .calc-next-btn and .calc-back-btn
     clicks anywhere inside the calculator card.
     This avoids issues with duplicate IDs and
     buttons added dynamically.                */
  section.addEventListener('click', e => {

    /* NEXT button */
    if (e.target.closest('.calc-next-btn')) {
      if (!canAdvance()) return;
      if (calcState.step < 4) {
        goStep(calcState.step + 1);
        /* Re-render material/finish when entering their step */
        if (calcState.step === 2) renderMaterialPanel();
        if (calcState.step === 4) renderFinishPanel();
      }
      return;
    }

    /* BACK button */
    if (e.target.closest('.calc-back-btn')) {
      if (calcState.step > 1) goStep(calcState.step - 1);
      return;
    }

    /* Step tab — allow clicking done tabs to go back */
    const tab = e.target.closest('.calc-step-tab');
    if (tab) {
      const s = parseInt(tab.dataset.step);
      if (s < calcState.step) goStep(s);
    }
  });

  /* ── Sync with language changes ── */
  document.addEventListener('themechange', () => renderResult());
});

/* Called after renderActivePanel in goStep */
function renderActivePanel() {
  $$('.calc-panel').forEach(p => p.classList.remove('active'));
  const active = $(`.calc-panel[data-step="${calcState.step}"]`);
  if (active) {
    active.classList.add('active');
    /* Update next btn for this panel */
    active.querySelectorAll('.calc-next-btn').forEach(btn => {
      btn.disabled = !canAdvance();
    });
  }
}
