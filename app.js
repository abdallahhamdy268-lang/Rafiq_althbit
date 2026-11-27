// ==========================================================================
// رفيق التثبيت v7.2 — app.js (الواجهة، صندوق التثبيت بالكرة الثلجية، المؤقت)
// يعتمد على: data.js + engine.js + storage.js
// ==========================================================================

const CUSTOM_CSS_VARS = [
  '--bg-deep', '--bg-grad-1', '--bg-grad-2', '--bg-card', '--bg-card-end',
  '--bg-card-2', '--bg-hero-start', '--bg-hero-end', '--bg-header', '--bg-nav',
  '--bg-input', '--bg-surface', '--bg-surface-strong', '--border-subtle',
  '--accent-hi', '--accent-mid', '--accent-deep', '--accent-grad',
  '--accent-soft', '--accent-border', '--accent-border-strong',
  '--btn-primary-text', '--text-main', '--text-muted', '--text-dim',
  '--ring-track', '--shadow-card'
];

// ================= COLOR & CONTRAST ENGINE =================
function hexToRgb(hex) {
  const clean = String(hex || '#00112B').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function mixHex(hexA, hexB, weightA) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weightA));
  return rgbToHex(a.r * w + b.r * (1 - w), a.g * w + b.g * (1 - w), a.b * w + b.b * (1 - w));
}

function rgbaStr(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function clearCustomCssVars() {
  CUSTOM_CSS_VARS.forEach((v) => document.documentElement.style.removeProperty(v));
}

function applyCustomPalette(bgHex, accentHex) {
  const root = document.documentElement;
  const isDark = getLuminance(bgHex) < 0.36;
  let safeAccent = accentHex;
  if (getContrastRatio(bgHex, accentHex) < 3.0) {
    safeAccent = isDark ? mixHex('#FFFFFF', accentHex, 0.55) : mixHex('#000000', accentHex, 0.55);
  }
  const textMain = isDark ? '#F7F8FA' : '#141D26';
  const textMuted = mixHex(textMain, bgHex, isDark ? 0.74 : 0.72);
  const textDim = mixHex(textMain, bgHex, 0.58);
  const bgCard = isDark ? mixHex('#FFFFFF', bgHex, 0.065) : mixHex('#FFFFFF', bgHex, 0.78);
  const bgCardEnd = isDark ? mixHex('#FFFFFF', bgHex, 0.035) : mixHex('#FFFFFF', bgHex, 0.52);
  const bgCard2 = isDark ? mixHex('#FFFFFF', bgHex, 0.105) : mixHex('#000000', bgHex, 0.045);
  const bgHeroStart = isDark ? mixHex(safeAccent, bgHex, 0.14) : mixHex('#FFFFFF', bgHex, 0.84);
  const bgHeroEnd = isDark ? bgHex : mixHex(safeAccent, bgHex, 0.08);
  const bgInput = isDark ? mixHex('#000000', bgHex, 0.26) : '#FFFFFF';
  const accentHi = isDark ? mixHex('#FFFFFF', safeAccent, 0.22) : safeAccent;
  const accentMid = safeAccent;
  const accentDeep = mixHex('#000000', safeAccent, 0.22);
  const btnPrimaryText = getLuminance(safeAccent) > 0.34 ? '#0B1320' : '#FFFFFF';

  const vars = {
    '--bg-deep': bgHex,
    '--bg-grad-1': rgbaStr(safeAccent, isDark ? 0.13 : 0.09),
    '--bg-grad-2': rgbaStr(isDark ? '#FFFFFF' : safeAccent, 0.06),
    '--bg-card': bgCard, '--bg-card-end': bgCardEnd, '--bg-card-2': bgCard2,
    '--bg-hero-start': bgHeroStart, '--bg-hero-end': bgHeroEnd,
    '--bg-header': rgbaStr(bgHex, 0.94),
    '--bg-nav': rgbaStr(isDark ? mixHex('#000000', bgHex, 0.15) : bgCard, 0.97),
    '--bg-input': bgInput, '--bg-surface': rgbaStr(textMain, 0.045),
    '--bg-surface-strong': rgbaStr(isDark ? '#000000' : textMain, isDark ? 0.44 : 0.07),
    '--border-subtle': rgbaStr(textMain, 0.18),
    '--accent-hi': accentHi, '--accent-mid': accentMid, '--accent-deep': accentDeep,
    '--accent-grad': `linear-gradient(135deg, ${accentHi} 0%, ${accentMid} 55%, ${accentDeep} 100%)`,
    '--accent-soft': rgbaStr(safeAccent, isDark ? 0.15 : 0.11),
    '--accent-border': rgbaStr(safeAccent, isDark ? 0.30 : 0.24),
    '--accent-border-strong': rgbaStr(accentHi, 0.56),
    '--btn-primary-text': btnPrimaryText,
    '--text-main': textMain, '--text-muted': textMuted, '--text-dim': textDim,
    '--ring-track': rgbaStr(textMain, 0.12),
    '--shadow-card': isDark ? '0 10px 28px rgba(0, 0, 0, 0.45)' : '0 8px 22px rgba(0, 0, 0, 0.08)'
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  const meta = document.getElementById('metaThemeColor');
  if (meta) meta.setAttribute('content', bgHex);
}

function applyTheme(themeId, customColors) {
  if (themeId === 'custom') {
    const cc = customColors || state.profile.customColors || { bg: '#00112B', accent: '#D0A151' };
    document.documentElement.setAttribute('data-theme', 'custom');
    applyCustomPalette(cc.bg, cc.accent);
    return;
  }
  clearCustomCssVars();
  const t = THEMES.find((x) => x.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', t.id);
  const meta = document.getElementById('metaThemeColor');
  if (meta) meta.setAttribute('content', t.meta);
}

// ================= APP RUNTIME STATE =================
let corruptBackupKey = null;
let storageQuotaWarning = false;
let editingDayId = null;
let selectedRating = '';
let selectedSrRating = '';
let selectedWeakSurahs = [];
let selectedWeakPages = [];
let srTarget = null; // { kind: 'old'|'new'|'passage'|'surah_solid', id, passageId?, title, overdueDays }
let surahSearchQuery = '';
let quickFocusSearch = '';
let newWirdFormOpen = false;
let obShowRevStartPicker = false;
let lastFocusBeforeModal = null;

let obDraft = {
  step: 1, isEditing: false, theme: 'royal',
  customColors: { bg: '#00112B', accent: '#D0A151' },
  level: 'intermediate', mode: 'from_nas',
  stopSurahNum: 78, stopSurahCompleted: false,
  beginnerDir: 'from_nas', khatimStart: 'from_baqarah',
  khatimSpecificJuz: [1, 2, 3], khatimCycleDays: 60,
  scatteredSurahs: [], scatteredContinue: 'org_nas',
  revStartMode: 'auto', revStartJuz: 30, stability: 'weak',
  dailyMin: 45, studyStyle: 'solo', maqraaDays: ['mon', 'thu'],
  pagesPerSession: 1, remEnabled: false
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.warn('Corrupt v7 JSON detected:', parseErr);
        const bk = `${STORAGE_KEY}_corrupt_${Date.now()}`;
        try { localStorage.setItem(bk, raw); } catch (e2) { console.warn(e2); }
        corruptBackupKey = bk;
        return getEmptyState();
      }
      return normalizeV7State(parsed);
    }
    const v6Raw = localStorage.getItem('rafiq_altathbit_v6');
    if (v6Raw) {
      const v6Parsed = JSON.parse(v6Raw);
      if (v6Parsed && v6Parsed.onboarded) {
        const migrated = migrateState(v6Parsed);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch (e3) { console.warn(e3); }
        return migrated;
      }
    }
  } catch (e) {
    console.warn('loadState error:', e);
  }
  return getEmptyState();
}

let state = loadState();

function saveState() {
  if (corruptBackupKey) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageQuotaWarning = false;
    const snaps = getAutoSnapshots();
    if (state.onboarded && (!snaps.length || snaps[0].date !== todayStr())) {
      saveAutoSnapshot(state, 'يومي');
    }
  } catch (e) {
    console.warn('saveState failed:', e);
    storageQuotaWarning = true;
    showToast('تعذّر الحفظ في ذاكرة المتصفح — يُنصح بتصدير نسخة احتياطية الآن');
    renderPriorityBanners();
  }
}

function syncPlanAndScheduleLive() {
  if (!state.onboarded || !state.juzList || state.juzList.length !== 30) return;
  const resolvedRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  state.activeRevJuzNum = resolvedRev ? resolvedRev.num : null;
  const resolvedNew = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  state.activeNewSurahNum = resolvedNew ? resolvedNew.num : null;
  const hasLinkingItems = state.newLinkingGroups.some((g) => !g.archived && g.passages.length > 0);
  state.schedule = buildLiveSchedule(
    state.profile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum,
    state.schedule, { hasLinkingItems }
  );
}

// ================= THEMES UI =================
function setTheme(themeId) {
  state.profile.theme = themeId;
  obDraft.theme = themeId;
  applyTheme(themeId, state.onboarded ? state.profile.customColors : obDraft.customColors);
  if (state.onboarded) saveState();
  renderThemeGrids();
}

function updateCustomColor(field, value) {
  obDraft.customColors = { ...(obDraft.customColors || { bg: '#00112B', accent: '#D0A151' }), [field]: value };
  state.profile.customColors = { ...obDraft.customColors };
  state.profile.theme = 'custom';
  obDraft.theme = 'custom';
  applyTheme('custom', state.profile.customColors);
  if (state.onboarded) saveState();
  renderThemeGrids();
}

function renderThemeGrids() {
  const current = state.onboarded ? state.profile.theme : obDraft.theme;
  const cc = (state.onboarded ? state.profile.customColors : obDraft.customColors) || { bg: '#00112B', accent: '#D0A151' };
  const tilesHtml = THEMES.map((t) => `
    <button type="button" class="theme-tile ${current === t.id ? 'selected' : ''}" onclick="setTheme('${t.id}')">
      <div class="theme-swatches">${t.swatches.map((c) => `<span class="swatch" style="background:${c};"></span>`).join('')}</div>
      <strong style="display:block; font-size:0.82rem; color:var(--text-main);">${t.name}</strong>
      <small style="font-size:0.74rem; color:var(--text-muted);">${t.desc}</small>
    </button>
  `).join('') + `
    <button type="button" class="theme-tile ${current === 'custom' ? 'selected' : ''}" onclick="setTheme('custom')">
      <div class="theme-swatches"><span class="swatch" style="background:${cc.bg};"></span><span class="swatch" style="background:${cc.accent};"></span></div>
      <strong style="display:block; font-size:0.82rem; color:var(--text-main);">تخصيص حر</strong>
      <small style="font-size:0.74rem; color:var(--text-muted);">اختر ألوانك بتباين تلقائي</small>
    </button>`;
  const ratio = getContrastRatio(cc.bg, cc.accent);
  const customBoxHtml = current === 'custom' ? `
    <div class="custom-theme-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="font-size:0.84rem; color:var(--accent-hi);">إعدادات التخصيص الحر</strong>
        <span class="tag ${ratio >= 4.5 ? 'tag-success' : 'tag-gold'}">${ratio >= 4.5 ? `تباين مريح (${ratio.toFixed(1)}:1)` : 'تم ضبط تباين النصوص تلقائياً'}</span>
      </div>
      <div class="color-picker-row">
        <label class="color-input-wrap"><input type="color" value="${cc.bg}" oninput="updateCustomColor('bg', this.value)" /><div class="color-input-meta"><strong>لون الخلفية</strong><span>${cc.bg.toUpperCase()}</span></div></label>
        <label class="color-input-wrap"><input type="color" value="${cc.accent}" oninput="updateCustomColor('accent', this.value)" /><div class="color-input-meta"><strong>اللون الأساسي</strong><span>${cc.accent.toUpperCase()}</span></div></label>
      </div>
    </div>` : '';
  ['modal', 'settings'].forEach((prefix) => {
    const g = document.getElementById(prefix + 'ThemeGrid');
    const c = document.getElementById(prefix + 'CustomThemeContainer');
    if (g) g.innerHTML = tilesHtml;
    if (c) c.innerHTML = customBoxHtml;
  });
}

function openThemeModal() { renderThemeGrids(); openModal('themeModal'); }

// ================= ONBOARDING =================
function saveObDraft() {
  try {
    const nameEl = document.getElementById('obName');
    if (nameEl) obDraft.name = nameEl.value;
    localStorage.setItem(OB_DRAFT_KEY, JSON.stringify(obDraft));
  } catch (e) { console.warn('saveObDraft error:', e); }
}

function loadObDraft() {
  try {
    const raw = localStorage.getItem(OB_DRAFT_KEY);
    if (raw) { obDraft = { ...obDraft, ...JSON.parse(raw) }; return true; }
  } catch (e) { console.warn('loadObDraft error:', e); }
  return false;
}

function openOnboarding(isEditing = false) {
  obDraft.isEditing = isEditing;
  obShowRevStartPicker = false;
  surahSearchQuery = '';
  if (isEditing && state.profile) {
    obDraft = { ...obDraft, ...JSON.parse(JSON.stringify(state.profile)), step: 1, isEditing: true, remEnabled: state.reminders.length > 0 };
    document.getElementById('obName').value = state.profile.name || '';
  } else {
    loadObDraft();
    document.getElementById('obName').value = obDraft.name || '';
  }
  document.getElementById('obDailyMin').value = obDraft.dailyMin || 45;
  document.getElementById('obTimeVal').textContent = (obDraft.dailyMin || 45) + ' دقيقة';
  document.getElementById('obPagesStepVal').textContent = `${formatNum(obDraft.pagesPerSession || 1)} وجه`;
  const closeBtn = document.getElementById('obCloseBtn');
  if (closeBtn) closeBtn.style.display = state.onboarded ? 'inline-flex' : 'none';

  const legacyKey = findLegacyStorageKey();
  const migBanner = document.getElementById('obMigrationBanner');
  migBanner.innerHTML = (!isEditing && legacyKey) ? `
    <div class="alert-banner">
      <div><strong>تم العثور على بياناتك المحفوظة من نسخة سابقة</strong> يمكنك استيراد تقدمك وسجل تسميعك مباشرة دون فقدان أي بيانات.</div>
      <button type="button" class="btn btn-gold btn-sm" onclick="importLegacyFromStorage()">استيراد والمتابعة الآن</button>
    </div>` : '';

  renderObStep2(); renderObStep3(); renderObStep4();
  obNext(obDraft.step || 1);
  document.getElementById('onboardingOverlay').classList.add('active');
}

function closeOnboardingSafely() {
  if (state.onboarded) document.getElementById('onboardingOverlay').classList.remove('active');
  else skipOnboardingQuick();
}

function skipOnboardingQuick() {
  obDraft.name = (document.getElementById('obName').value || '').trim() || 'حافظ القرآن';
  obDraft.mode = 'beginner';
  obDraft.level = 'beginner';
  obDraft.beginnerDir = 'from_nas';
  obDraft.dailyMin = 30;
  obDraft.studyStyle = 'solo';
  obDraft.pagesPerSession = 0.5;
  obDraft.remEnabled = false;
  completeOnboardingSave(true);
}

function stepObPages(delta) {
  const next = Math.max(0.25, Math.min(5, Number(((obDraft.pagesPerSession || 1) + delta).toFixed(2))));
  obDraft.pagesPerSession = next;
  document.getElementById('obPagesStepVal').textContent = `${formatNum(next)} وجه`;
  saveObDraft();
}

function renderObStep2() {
  const modes = [
    { id: 'from_nas', title: 'بدأت الحفظ من الناس إلى البقرة (تصاعدياً)', sub: 'تحدد السورة التي تحفظ فيها الآن، وتختار بداية مراجعة القديم بحرية' },
    { id: 'from_baqarah', title: 'بدأت الحفظ من البقرة إلى الناس (تنازلياً)', sub: 'تحدد السورة التي تحفظ فيها الآن، وتختار بداية مراجعة القديم بحرية' },
    { id: 'beginner', title: 'لم أحفظ شيئاً بعد (بداية من الصفر)', sub: 'نرشّح لك البداية من الناس للبقرة بوضع مبسّط وهادئ' },
    { id: 'khatim', title: 'خاتم للقرآن الكريم (٣٠ جزءاً) — مراجعة وتثبيت', sub: 'يُخفي الحفظ الجديد ويركّز على دورة الختم (٣٠ / ٦٠ / ٩٠ يوماً)' },
    { id: 'scattered', title: 'حافظ سوراً متفرقة من المصحف', sub: 'تختار السور التي حفظتها فعلاً، ثم تقرر طريقة المتابعة' }
  ];
  document.getElementById('obModeOptions').innerHTML = modes.map((m) => `
    <button type="button" class="choice-card ${obDraft.mode === m.id ? 'selected' : ''}" onclick="selectObMode('${m.id}')">
      <span class="choice-radio"></span>
      <span><strong style="display:block; font-size:0.88rem;">${m.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${m.sub}</small></span>
    </button>
  `).join('');
}

function selectObMode(modeId) {
  obDraft.mode = modeId;
  obDraft.level = modeId === 'khatim' ? 'hafidh' : (modeId === 'beginner' ? 'beginner' : 'intermediate');
  surahSearchQuery = '';
  if (modeId === 'from_nas' && (!obDraft.stopSurahNum || obDraft.stopSurahNum < 1)) obDraft.stopSurahNum = 78;
  if (modeId === 'from_baqarah' && (!obDraft.stopSurahNum || obDraft.stopSurahNum > 114)) obDraft.stopSurahNum = 2;
  obDraft.revStartMode = 'auto';
  saveObDraft();
  renderObStep2(); renderObStep3(); renderObStep4();
}

function renderObStep3() {
  const dyn = document.getElementById('obStep3Dynamic');
  const revStartSec = document.getElementById('obRevStartSection');
  const titleEl = document.getElementById('obStep3Title');
  const stabSec = document.getElementById('obStabilitySection');
  revStartSec.innerHTML = '';

  if (obDraft.mode === 'from_nas' || obDraft.mode === 'from_baqarah') {
    titleEl.textContent = '٣. عند أي سورة تقف حالياً؟';
    stabSec.style.display = 'block';
    const ordered = obDraft.mode === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
    const q = surahSearchQuery.trim();
    const filtered = q ? ordered.filter((s) => s.name.includes(q) || String(s.num) === q) : ordered;
    const summary = summarizeDiagnostic(obDraft);
    const stopSurah = getSurahByNum(obDraft.stopSurahNum) || ordered[0];

    dyn.innerHTML = `
      <label class="field-label">اختر السورة التي تقف عندها (من ١١٤ سورة):</label>
      <div class="surah-picker-box">
        <input type="text" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeAttr(surahSearchQuery)}" oninput="surahSearchQuery=this.value; renderObStep3();" />
        <div class="surah-picker-grid">
          ${filtered.map((s) => `<button type="button" class="surah-pick-item ${obDraft.stopSurahNum === s.num ? 'selected' : ''}" onclick="obDraft.stopSurahNum=${s.num}; saveObDraft(); renderObStep3();"><span>${s.num}. ${s.name}</span><small>${formatNum(s.pages)} وجه</small></button>`).join('')}
        </div>
      </div>
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm ${!obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.stopSurahCompleted=false; saveObDraft(); renderObStep3();">ما زلت أحفظ في سورة ${stopSurah.name}</button>
        <button type="button" class="btn btn-sm ${obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.stopSurahCompleted=true; saveObDraft(); renderObStep3();">أتممت سورة ${stopSurah.name} وسأبدأ بالتي بعدها</button>
      </div>
      <div class="calc-preview-card">
        <strong>الحساب الفعلي لموضعك:</strong>
        <div style="margin-top:4px;">
          • المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${summary.completedJuzCount} جزء مكتمل • <strong>${formatNum(summary.memPages)}</strong> وجه من ٦٠٤).<br/>
          • سورة الحفظ الجديد النشطة: <strong>${summary.nextSurah ? `سورة ${summary.nextSurah.name} (الجزء ${summary.nextSurah.juz})` : 'أتممت المصحف!'}</strong>
        </div>
      </div>`;

    if (summary.memCount > 0) {
      const memSet = getDiagnosedMemorizedSet(obDraft);
      const revJuzCandidates = JUZ_DB.filter((j) => getJuzSurahs(j.num).some((s) => memSet.has(s.num)));
      if (!revJuzCandidates.some((j) => j.num === obDraft.revStartJuz) && revJuzCandidates.length > 0) {
        obDraft.revStartJuz = obDraft.mode === 'from_nas' ? revJuzCandidates[revJuzCandidates.length - 1].num : revJuzCandidates[0].num;
      }
      revStartSec.innerHTML = `
        <button type="button" class="btn btn-ghost btn-sm btn-block" style="justify-content:space-between;" onclick="obShowRevStartPicker=!obShowRevStartPicker; renderObStep3();">
          <span>⚙️ تخصيص بداية مراجعة القديم (اختياري)</span>
          <span>${obShowRevStartPicker ? 'إخفاء ▲' : 'تخصيص ▼'}</span>
        </button>
        ${obShowRevStartPicker ? `
          <div style="margin-top:9px; padding:10px; border-radius:12px; background:var(--bg-surface); border:1px solid var(--border-subtle);">
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'auto' || obDraft.revStartMode === 'from_nas' ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.revStartMode='from_nas'; saveObDraft(); renderObStep3();">من الناس ← البقرة</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'from_baqarah' ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.revStartMode='from_baqarah'; saveObDraft(); renderObStep3();">من البقرة ← الناس</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'custom_juz' ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.revStartMode='custom_juz'; saveObDraft(); renderObStep3();">جزء محدد (مثلاً من المنتصف)</button>
            </div>
            ${obDraft.revStartMode === 'custom_juz' ? `<select onchange="obDraft.revStartJuz=Number(this.value); saveObDraft();">${revJuzCandidates.map((j) => `<option value="${j.num}" ${obDraft.revStartJuz === j.num ? 'selected' : ''}>${j.title} — ${j.range}</option>`).join('')}</select>` : ''}
          </div>` : ''}`;
    }
  } else if (obDraft.mode === 'beginner') {
    titleEl.textContent = '٣. من أين تفضّل بداية رحلة الحفظ؟';
    stabSec.style.display = 'none';
    const bDirs = [
      { id: 'from_nas', title: 'من الناس إلى البقرة (موصى به للمبتدئين)', sub: 'بداية مشجعة بقصار السور وتدرّج مريح' },
      { id: 'from_baqarah', title: 'من البقرة إلى الناس', sub: 'بداية من أول المصحف (الفاتحة ثم البقرة)' }
    ];
    const startSurah = obDraft.beginnerDir === 'from_baqarah' ? 'الفاتحة ثم البقرة (الجزء ١)' : 'الناس ثم الفلق والإخلاص (الجزء ٣٠)';
    dyn.innerHTML = bDirs.map((d) => `
      <button type="button" class="choice-card ${obDraft.beginnerDir === d.id ? 'selected' : ''}" onclick="obDraft.beginnerDir='${d.id}'; saveObDraft(); renderObStep3();">
        <span class="choice-radio"></span>
        <span><strong style="display:block; font-size:0.88rem;">${d.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${d.sub}</small></span>
      </button>
    `).join('') + `<div class="calc-preview-card"><strong>نقطة الانطلاق:</strong> ستبدأ خطة الحفظ الجديد من <strong>${startSurah}</strong>.</div>`;
  } else if (obDraft.mode === 'khatim') {
    titleEl.textContent = '٣. إعداد دورة مراجعة الـ ٣٠ جزءاً';
    stabSec.style.display = 'block';
    const kOpts = [
      { id: 'from_baqarah', title: 'من البقرة إلى الناس (الجزء ١ ← ٣٠)', sub: 'دورة مراجعة متسلسلة من أول المصحف' },
      { id: 'from_nas', title: 'من الناس إلى البقرة (الجزء ٣٠ ← ١)', sub: 'دورة مراجعة متسلسلة من آخر المصحف' },
      { id: 'specific_juz', title: 'أجزاء محددة أختارها بنفسي', sub: 'تبدأ بالأجزاء التي تحددها أولاً ثم تستكمل بقية المصحف' }
    ];
    let specHtml = '';
    if (obDraft.khatimStart === 'specific_juz') {
      specHtml = `<label class="field-label" style="margin-top:10px;">اختر الأجزاء التي تريد البدء بها (${obDraft.khatimSpecificJuz.length} أجزاء):</label>
        <div class="juz-pick-grid">${JUZ_DB.map((j) => `<button type="button" class="juz-pick-chip ${obDraft.khatimSpecificJuz.includes(j.num) ? 'selected' : ''}" onclick="toggleKhatimJuz(${j.num})">ج ${j.num}</button>`).join('')}</div>`;
    }
    const cycleHtml = `
      <label class="field-label" style="margin-top:12px;">هدف إنهاء دورة المراجعة الكاملة (٦٠٤ وجهاً):</label>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${[30, 60, 90].map((days) => `<button type="button" class="btn btn-sm ${(obDraft.khatimCycleDays || 60) === days ? 'btn-gold' : 'btn-ghost'}" onclick="obDraft.khatimCycleDays=${days}; saveObDraft(); renderObStep3();">${days} يوماً (${Math.ceil(604 / days)} وجه/يوم)</button>`).join('')}
      </div>`;
    dyn.innerHTML = kOpts.map((k) => `
      <button type="button" class="choice-card ${obDraft.khatimStart === k.id ? 'selected' : ''}" onclick="obDraft.khatimStart='${k.id}'; saveObDraft(); renderObStep3();">
        <span class="choice-radio"></span>
        <span><strong style="display:block; font-size:0.88rem;">${k.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${k.sub}</small></span>
      </button>
    `).join('') + specHtml + cycleHtml;
  } else if (obDraft.mode === 'scattered') {
    titleEl.textContent = '٣. اختر السور التي حفظتها فعلاً';
    stabSec.style.display = 'block';
    const q = surahSearchQuery.trim();
    const filtered = q ? SURAHS_DB.filter((s) => s.name.includes(q) || String(s.num) === q) : SURAHS_DB;
    const summary = summarizeDiagnostic(obDraft);
    const contOpts = [
      { id: 'keep_scattered', title: 'أواصل بشكل متفرّق بحرية', sub: 'أختار السورة الجديدة بنفسي في كل مرة' },
      { id: 'org_nas', title: 'أنتظم بترتيب من الناس إلى البقرة', sub: 'استكمال السور غير المحفوظة تصاعدياً' },
      { id: 'org_baqarah', title: 'أنتظم بترتيب من البقرة إلى الناس', sub: 'استكمال السور غير المحفوظة تنازلياً' }
    ];
    dyn.innerHTML = `
      <label class="field-label">حدّد السور التي حفظتها (من ١١٤ سورة):</label>
      <div class="surah-picker-box">
        <div style="display:flex; gap:6px;"><input type="text" placeholder="ابحث باسم السورة..." value="${escapeAttr(surahSearchQuery)}" oninput="surahSearchQuery=this.value; renderObStep3();" /><button type="button" class="btn btn-ghost btn-sm" onclick="obDraft.scatteredSurahs=[]; saveObDraft(); renderObStep3();">مسح</button></div>
        <div class="surah-picker-grid">${filtered.map((s) => { const sel = obDraft.scatteredSurahs.includes(s.num); return `<button type="button" class="surah-pick-item ${sel ? 'selected' : ''}" onclick="toggleScatteredSurah(${s.num})"><span>${sel ? '✓ ' : ''}${s.name}</span><small>${formatNum(s.pages)}</small></button>`; }).join('')}</div>
      </div>
      <div class="calc-preview-card"><strong>المحدد حالياً:</strong> ${summary.memCount} سورة بإجمالي <strong>${formatNum(summary.memPages)}</strong> وجهاً.</div>
      <label class="field-label" style="margin-top:12px;">كيف تفضّل المتابعة بعد ذلك؟</label>
      ${contOpts.map((c) => `<button type="button" class="choice-card ${obDraft.scatteredContinue === c.id ? 'selected' : ''}" onclick="obDraft.scatteredContinue='${c.id}'; saveObDraft(); renderObStep3();"><span class="choice-radio"></span><span><strong style="display:block; font-size:0.86rem;">${c.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${c.sub}</small></span></button>`).join('')}`;
  }

  const stabs = [
    { id: 'weak', title: 'متفلت (يحتاج مراجعة وتنشيطاً)', sub: 'تبدأ الأجزاء المحفوظة بمسار المراجعة ثم تدخل صندوق التثبيت' },
    { id: 'medium', title: 'متوسط (أستحضره بالنظر السريع)', sub: 'يبدأ برصيد ٥٠٪ لتسريع إتمام المراجعة والدخول لصندوق التثبيت' },
    { id: 'solid', title: 'ثابت ومستقر (يحتاج دورة تثبيت فقط)', sub: 'تنتقل الأجزاء المكتملة مباشرةً لصندوق التثبيت بالتكرار المتباعد' }
  ];
  document.getElementById('obStabilityOptions').innerHTML = stabs.map((s) => `
    <button type="button" class="choice-card ${obDraft.stability === s.id ? 'selected' : ''}" onclick="obDraft.stability='${s.id}'; saveObDraft(); renderObStep3();">
      <span class="choice-radio"></span>
      <span><strong style="display:block; font-size:0.86rem;">${s.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${s.sub}</small></span>
    </button>
  `).join('');
}

function toggleKhatimJuz(juzNum) {
  if (obDraft.khatimSpecificJuz.includes(juzNum)) {
    if (obDraft.khatimSpecificJuz.length > 1) obDraft.khatimSpecificJuz = obDraft.khatimSpecificJuz.filter((n) => n !== juzNum);
  } else {
    obDraft.khatimSpecificJuz.push(juzNum);
    obDraft.khatimSpecificJuz.sort((a, b) => a - b);
  }
  saveObDraft(); renderObStep3();
}

function toggleScatteredSurah(surahNum) {
  if (obDraft.scatteredSurahs.includes(surahNum)) obDraft.scatteredSurahs = obDraft.scatteredSurahs.filter((n) => n !== surahNum);
  else obDraft.scatteredSurahs.push(surahNum);
  saveObDraft(); renderObStep3();
}

function renderObStep4() {
  const styles = [
    { id: 'solo', title: 'حفظ ومراجعة ذاتية مرنة (دون أيام مقرأة ثابتة)', sub: 'توزّع جلساتك بحرية في أي وقت يناسبك خلال اليوم' },
    { id: 'maqraa', title: 'أتابع مع شيخ أو مقرأة بأيام محددة (اختياري)', sub: 'يُضبط التحضير والتسميع في جدولك حسب الأيام التي تختارها' }
  ];
  document.getElementById('obStudyStyleOptions').innerHTML = styles.map((st) => `
    <button type="button" class="choice-card ${obDraft.studyStyle === st.id ? 'selected' : ''}" onclick="obDraft.studyStyle='${st.id}'; saveObDraft(); renderObStep4();">
      <span class="choice-radio"></span>
      <span><strong style="display:block; font-size:0.87rem;">${st.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${st.sub}</small></span>
    </button>
  `).join('');
  document.getElementById('obMaqraaDaysWrap').style.display = obDraft.studyStyle === 'maqraa' ? 'block' : 'none';
  document.getElementById('obPagesPerSessionWrap').style.display = obDraft.mode === 'khatim' ? 'none' : 'block';
  document.getElementById('obMaqraaDayChips').innerHTML = DAYS_META.map((d) => `<button type="button" class="day-chip ${obDraft.maqraaDays.includes(d.id) ? 'active' : ''}" onclick="toggleObMaqraaDay('${d.id}')">${d.name}</button>`).join('');
  document.getElementById('obRemToggleRow').classList.toggle('done', obDraft.remEnabled);
  document.getElementById('obRemCheck').textContent = obDraft.remEnabled ? '✓' : '';
  document.getElementById('obRemTimesWrap').style.display = obDraft.remEnabled ? 'block' : 'none';
}

function setObMin(m) {
  obDraft.dailyMin = m;
  document.getElementById('obDailyMin').value = m;
  document.getElementById('obTimeVal').textContent = m + ' دقيقة';
  saveObDraft();
}

function toggleObMaqraaDay(dayId) {
  if (obDraft.maqraaDays.includes(dayId)) {
    if (obDraft.maqraaDays.length > 1) obDraft.maqraaDays = obDraft.maqraaDays.filter((x) => x !== dayId);
  } else { obDraft.maqraaDays.push(dayId); }
  saveObDraft(); renderObStep4();
}

function toggleObReminders() { obDraft.remEnabled = !obDraft.remEnabled; saveObDraft(); renderObStep4(); }

function renderObStep5Preview() {
  const tempProfile = { ...obDraft, dailyMin: parseInt(document.getElementById('obDailyMin').value, 10) || 45 };
  const summary = summarizeDiagnostic(tempProfile);
  const built = buildPersonalizedPlan(tempProfile);
  const sched = buildLiveSchedule(tempProfile, built.juzList, built.activeRevJuzNum, built.activeNewSurahNum, null, { hasLinkingItems: false });
  const actRevObj = built.juzList.find((j) => j.num === built.activeRevJuzNum);
  const actNewObj = built.activeNewSurahNum ? getSurahByNum(built.activeNewSurahNum) : null;

  let khatimWarn = '';
  if (tempProfile.mode === 'khatim') {
    const reqPages = Math.ceil(604 / (tempProfile.khatimCycleDays || 60));
    const reqMin = reqPages * SR_CONFIG.minutesPerRevPageByLevel.hafidh;
    if (tempProfile.dailyMin < reqMin) {
      khatimWarn = `<div style="color:var(--warn); margin-top:6px;">تنبيه: إنهاء الختمة في ${tempProfile.khatimCycleDays} يوماً يتطلب ~${reqMin} دقيقة يومياً (${reqPages} أوجه)؛ يمكنك زيادة وقتك أو اختيار دورة ٩٠ يوماً.</div>`;
    }
  }

  document.getElementById('obPlanPreviewBox').innerHTML = `
    <div style="font-weight:800; color:var(--accent-hi); margin-bottom:6px;">ملخص خطتك الفعلية المحسوبة:</div>
    <div style="line-height:1.8;">
      ${tempProfile.mode === 'khatim'
        ? `• المسار: <strong>مراجعة وتثبيت ٣٠ جزءاً</strong> (هدف الدورة: ${tempProfile.khatimCycleDays || 60} يوماً).<br/>• بداية الدورة: <strong>${actRevObj ? actRevObj.title : 'الجزء ١'}</strong>.${khatimWarn}`
        : `• المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${formatNum(summary.memPages)} وجهاً من ٦٠٤).<br/>
           • سورة الحفظ الجديد النشطة: <strong>${actNewObj ? `سورة ${actNewObj.name} (الجزء ${actNewObj.juz})` : 'مكتمل'}</strong>.<br/>
           ${actRevObj ? `• الجزء النشط لبداية المراجعة: <strong>${actRevObj.title}</strong>.` : '• بداية تأسيسية صافية من الصفر.'}`
      }
      <br/>• مثال ليوم ${sched[0].name} في جدولك الحي: <strong>${escapeHtml(sched[0].main)}</strong>
    </div>`;
}

function obNext(step) {
  if (step === 4 && obDraft.mode === 'scattered' && obDraft.scatteredSurahs.length === 0) {
    showToast('اختر سورة واحدة على الأقل من قائمة السور التي حفظتها');
    return;
  }
  obDraft.step = step;
  saveObDraft();
  for (let i = 1; i <= 5; i++) document.getElementById('obStep' + i).classList.toggle('active', i === step);
  document.querySelectorAll('#obProgressDots .ob-dot').forEach((dot, idx) => dot.classList.toggle('done', idx < step));
  if (step === 3) renderObStep3();
  if (step === 4) renderObStep4();
  if (step === 5) { renderObStep4(); renderObStep5Preview(); }
  document.getElementById('onboardingOverlay').scrollTo({ top: 0, behavior: 'smooth' });
}

function handleFinishOnboardingClick() {
  if (obDraft.isEditing && state.onboarded) openModal('rebuildChoiceModal');
  else completeOnboardingSave(true);
}

function completeOnboardingSave(shouldRebuildJuz) {
  closeModal('rebuildChoiceModal');
  if (state.onboarded) saveAutoSnapshot(state, 'قبل تعديل الملف');

  const name = (document.getElementById('obName').value || '').trim() || obDraft.name || 'حافظ القرآن';
  const dailyMin = parseInt(document.getElementById('obDailyMin').value, 10) || obDraft.dailyMin || 45;
  const pagesPerSession = obDraft.pagesPerSession || 1;
  const level = obDraft.mode === 'khatim' ? 'hafidh' : (obDraft.mode === 'beginner' ? 'beginner' : 'intermediate');

  const newProfile = {
    name, theme: obDraft.theme,
    customColors: { ...(obDraft.customColors || { bg: '#00112B', accent: '#D0A151' }) },
    level, mode: obDraft.mode,
    stopSurahNum: obDraft.stopSurahNum, stopSurahCompleted: obDraft.stopSurahCompleted,
    beginnerDir: obDraft.beginnerDir, khatimStart: obDraft.khatimStart,
    khatimSpecificJuz: [...(obDraft.khatimSpecificJuz || [1, 2, 3])],
    khatimCycleDays: obDraft.khatimCycleDays || 60,
    scatteredSurahs: [...(obDraft.scatteredSurahs || [])],
    scatteredContinue: obDraft.scatteredContinue,
    revStartMode: obDraft.revStartMode || 'auto', revStartJuz: obDraft.revStartJuz || 30,
    stability: obDraft.mode === 'beginner' ? 'weak' : obDraft.stability,
    dailyMin, studyStyle: obDraft.studyStyle,
    maqraaDays: [...(obDraft.maqraaDays || ['mon', 'thu'])],
    pagesPerSession
  };

  state.profile = newProfile;
  state.onboarded = true;
  state.simpleMode = (newProfile.mode === 'beginner');
  state.solidSubTab = newProfile.mode === 'khatim' ? 'old' : 'new';
  state.calcDailyMin = dailyMin;
  state.calcNewPages = newProfile.mode === 'khatim' ? 0 : pagesPerSession;
  if (!state.lastBackupAt) state.lastBackupAt = todayStr();
  if (!state.weekStartedAt) state.weekStartedAt = todayStr();

  if (shouldRebuildJuz || state.juzList.length !== 30) {
    const built = buildPersonalizedPlan(newProfile, state.solidMeta);
    state.juzList = built.juzList;
    state.solidMeta = built.solidMeta;
    state.activeRevJuzNum = built.activeRevJuzNum;
    state.activeNewSurahNum = built.activeNewSurahNum;
    state.surahNewProgress = {};
    state.surahAyahProgress = {};
    state.mapFilter = newProfile.mode === 'beginner' ? 'new' : 'revision';
    state.schedule = buildLiveSchedule(newProfile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, null, { hasLinkingItems: false });
  } else {
    syncPlanAndScheduleLive();
  }

  if (obDraft.remEnabled) {
    const tRev = document.getElementById('obRemRevTime').value || '09:00';
    const tSol = document.getElementById('obRemSolidTime').value || '20:00';
    state.reminders = [
      { id: 'r1', time: tRev, type: newProfile.mode === 'beginner' ? 'new' : 'revision', enabled: true, lastTriggeredDate: '', lastNotifiedDate: '' },
      { id: 'r2', time: tSol, type: 'solid', enabled: true, lastTriggeredDate: '', lastNotifiedDate: '' }
    ];
    requestNotifPermission(true);
  } else if (!obDraft.isEditing) {
    state.reminders = [];
  }

  try { localStorage.removeItem(OB_DRAFT_KEY); } catch (e) {}
  requestPersistentStorage();
  applyTheme(state.profile.theme, state.profile.customColors);
  saveState();
  document.getElementById('onboardingOverlay').classList.remove('active');
  document.getElementById('calcDailyMin').value = state.calcDailyMin;
  document.getElementById('calcNewPages').value = state.calcNewPages;
  renderAll();
  showToast(`أهلاً يا ${name}! خطتك وجدولك الحي جاهزان الآن ✓`);
}

// ================= STREAK WITH GRACE DAY =================
function touchStreak() {
  const t = todayStr();
  if (state.streak.lastDate === t) return;
  if (!state.streak.lastDate) { state.streak.count = 1; state.streak.lastDate = t; return; }
  const diff = diffDaysFromToday(t, state.streak.lastDate);
  if (diff === 1) {
    state.streak.count += 1;
  } else if (diff === 2) {
    const lastGrace = state.streak.graceUsedDate;
    const graceDiff = lastGrace ? diffDaysFromToday(t, lastGrace) : 99;
    if (graceDiff >= SR_CONFIG.streakGraceWindowDays) {
      state.streak.count += 1;
      state.streak.graceUsedDate = t;
      showToast('تم تفعيل «يوم سماح» تلقائياً للحفاظ على سلسلة التزامك 🛡️');
    } else { state.streak.count = 1; }
  } else { state.streak.count = 1; }
  state.streak.lastDate = t;
}

// ================= ACCESSIBLE MODALS =================
function openModal(id) {
  lastFocusBeforeModal = document.activeElement;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  const firstFocus = el.querySelector('button, input, select, textarea');
  if (firstFocus) setTimeout(() => firstFocus.focus(), 30);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === 'function') {
    try { lastFocusBeforeModal.focus(); } catch (e) {}
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const openModals = document.querySelectorAll('.modal-backdrop.open');
  if (openModals.length > 0) { closeModal(openModals[openModals.length - 1].id); return; }
  const ob = document.getElementById('onboardingOverlay');
  if (ob && ob.classList.contains('active') && state.onboarded) closeOnboardingSafely();
});

// ================= GLOSSARY, SIMPLE MODE & QUICK FOCUS =================
function openGlossaryModal() {
  document.getElementById('glossaryList').innerHTML = GLOSSARY.map((g) => `
    <div class="log-item" style="flex-direction:column; gap:4px;">
      <strong style="color:var(--accent-hi); font-size:0.92rem;">${escapeHtml(g.term)}</strong>
      <div style="font-size:0.83rem; color:var(--text-main);">${escapeHtml(g.desc)}</div>
    </div>`).join('');
  openModal('glossaryModal');
}

function toggleSimpleMode() {
  state.simpleMode = !state.simpleMode;
  saveState();
  renderAll();
  showToast(state.simpleMode ? 'تم تفعيل الوضع المبسط (مهام اليوم والجدول والتثبيت فقط)' : 'تم تفعيل الوضع المتقدم (عرض كامل التبويبات والأدوات)');
}

function toggleProgressCard() {
  state.progressExpanded = !state.progressExpanded;
  saveState();
  renderProgressVisibility();
}

function renderProgressVisibility() {
  const body = document.getElementById('progressDetailsBody');
  const btn = document.getElementById('toggleProgressBtn');
  if (!body || !btn) return;
  body.style.display = state.progressExpanded ? 'block' : 'none';
  btn.textContent = state.progressExpanded ? 'إخفاء التفاصيل ▲' : 'عرض التفاصيل ▼';
}

function openQuickFocusModal(kind) {
  if (kind === 'new' && state.profile.mode === 'khatim') { showToast('أنت في وضع الخاتم — يمكنك تعديل ذلك من الإعدادات'); return; }
  quickFocusSearch = '';
  renderQuickFocusModal(kind);
  openModal('quickFocusModal');
}

function renderQuickFocusModal(kind) {
  const titleEl = document.getElementById('quickFocusTitle');
  const bodyEl = document.getElementById('quickFocusBody');
  if (kind === 'rev') {
    titleEl.textContent = 'اختر الجزء الذي تريد مراجعته الآن';
    const pendingRev = state.juzList.filter((j) => j.donePages < j.totalPages - 0.01);
    if (!pendingRev.length) { bodyEl.innerHTML = '<div class="empty-state">ما شاء الله! جميع الأجزاء مكتملة في صندوق التثبيت.</div>'; return; }
    bodyEl.innerHTML = `<p class="muted-note">اختر أي جزء تبدأ به الآن — سيتحدّث جدولك الأسبوعي وصفحتك الرئيسية فوراً.</p>
      <div style="display:flex; flex-direction:column; gap:7px; max-height:55vh; overflow-y:auto;">
        ${pendingRev.map((j) => `<button type="button" class="choice-card ${state.activeRevJuzNum === j.num ? 'selected' : ''}" style="margin-bottom:0;" onclick="setActiveRevJuz(${j.num})"><span class="choice-radio"></span><span style="flex:1;"><strong style="display:block; font-size:0.88rem;">${j.title} <span class="tag ${j.track === 'new' ? 'tag-info' : 'tag-gold'}">${j.track === 'new' ? 'جديد' : 'مراجعة'}</span></strong><small style="color:var(--text-muted); font-size:0.78rem;">${j.range} • المنجز: ${formatNum(j.donePages)} / ${j.totalPages} وجهاً</small></span></button>`).join('')}
      </div>`;
  } else {
    titleEl.textContent = 'اختر السورة التي تحفظ فيها الآن';
    const q = quickFocusSearch.trim();
    const dir = getEffectiveDirection(state.profile);
    const ordered = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
    const filtered = q ? ordered.filter((s) => s.name.includes(q) || String(s.num) === q) : ordered;
    bodyEl.innerHTML = `<p class="muted-note">اختر أي سورة من الـ ١١٤ سورة لتصبح سورة الحفظ الجديد النشطة وتظل ثابتة معك حتى تتمها.</p>
      <input type="text" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeAttr(quickFocusSearch)}" oninput="quickFocusSearch=this.value; renderQuickFocusModal('new');" style="margin-bottom:8px;" />
      <div class="surah-picker-grid" style="max-height:50vh;">
        ${filtered.map((s) => `<button type="button" class="surah-pick-item ${state.activeNewSurahNum === s.num ? 'selected' : ''}" onclick="setActiveNewSurah(${s.num})"><span>${s.num}. ${s.name}</span><small>ج ${s.juz}</small></button>`).join('')}
      </div>`;
  }
}

function setActiveRevJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === Number(juzNum));
  if (!j) return;
  if (j.track !== 'revision') j.track = 'revision';
  state.activeRevJuzNum = j.num;
  syncPlanAndScheduleLive(); saveState(); closeModal('quickFocusModal'); renderAll();
  showToast(`أصبح ${j.title} هو الجزء النشط وتحدّث جدولك تلقائياً ✓`);
}

function setActiveNewSurah(surahNum) {
  const s = getSurahByNum(surahNum);
  if (!s) return;
  state.activeNewSurahNum = s.num;
  syncPlanAndScheduleLive(); saveState(); closeModal('quickFocusModal'); renderAll();
  showToast(`أصبحت سورة ${s.name} هي سورة الحفظ النشطة وتحدّث جدولك تلقائياً ✓`);
}

// ================= SPACED REPETITION DUE LIST & REVIEW MODAL (A4 FIXED + SURAH NAMES + CRITICAL) =================
function getDueItems() {
  const items = [];
  const today = todayStr();

  // 1. تثبيت جديد (مقاطع السور الطويلة)
  state.newLinkingGroups.filter((g) => !g.archived).forEach((g) => {
    const nextDate = g.nextReviewDate || today;
    const diff = diffDaysFromToday(nextDate, today);
    const hasUrgent = g.passages.some((p) => p.rating === 'يحتاج إعادة' || p.rating === 'نسيت تماماً');
    const isCritical = g.critical || g.passages.some((p) => p.rating === 'نسيت تماماً');
    if (diff <= 0 || hasUrgent) {
      const sumP = g.passages.reduce((s, p) => s + p.pages, 0);
      items.push({
        kind: 'new', id: g.id, title: g.surahName,
        subtitle: `${g.passages.length} مقاطع (${formatNum(sumP)} وجه) • تثبيت جديد وربط`,
        overdueDays: diff < 0 ? Math.abs(diff) : 0,
        priority: isCritical ? -1 : (hasUrgent ? 0 : (diff < 0 ? 1 : 3)),
        badge: isCritical ? 'موضع حرج' : (hasUrgent ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : 'مستحق اليوم'))
      });
    }
  });

  // 2. السور المكتملة المرحلة من «تثبيت الجديد» إلى «تثبيت القديم»
  (state.completedSurahsSolid || []).forEach((cs) => {
    const diff = diffDaysFromToday(cs.nextReviewDate || today, today);
    const isUrg = cs.rating === 'يحتاج إعادة' || cs.rating === 'نسيت تماماً';
    if (diff <= 0 || isUrg) {
      items.push({
        kind: 'surah_solid', id: cs.id, title: cs.surahName,
        subtitle: `سورة مكتملة (${formatNum(cs.pages)} وجه) • تثبيت دائم`,
        overdueDays: diff < 0 ? Math.abs(diff) : 0,
        priority: cs.rating === 'نسيت تماماً' ? -1 : (isUrg ? 0 : (diff < 0 ? 1 : 3)),
        badge: cs.rating === 'نسيت تماماً' ? 'موضع حرج' : (isUrg ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : 'مستحق اليوم'))
      });
    }
  });

  // 3. الأجزاء المكتملة (تثبيت قديم)
  state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01).forEach((j) => {
    const meta = state.solidMeta[j.num];
    if (!meta) return;
    const diff = diffDaysFromToday(meta.nextReviewDate || today, today);
    const hasWeak = (Array.isArray(meta.weakSurahs) && meta.weakSurahs.length > 0) || (Array.isArray(meta.weakPages) && meta.weakPages.length > 0);
    const isUrg = meta.rating === 'يحتاج إعادة' || meta.rating === 'نسيت تماماً';
    if (diff <= 0 || isUrg) {
      const weakLabel = (meta.weakSurahs && meta.weakSurahs.length)
        ? ` • سور تحتاج تقوية: ${meta.weakSurahs.slice(0, 3).join('، ')}`
        : (meta.weakPages && meta.weakPages.length ? ` • أوجه متفلتة: ص ${meta.weakPages.slice(0, 3).join('، ')}` : ' • تثبيت قديم');
      items.push({
        kind: 'old', id: j.num, title: j.title,
        subtitle: `${j.range}${weakLabel}`,
        overdueDays: diff < 0 ? Math.abs(diff) : 0,
        priority: meta.rating === 'نسيت تماماً' ? -1 : (isUrg ? 0 : (hasWeak ? 1 : (diff < 0 ? 2 : 3))),
        badge: meta.rating === 'نسيت تماماً' ? 'موضع حرج' : (isUrg ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : 'مستحق اليوم'))
      });
    }
  });

  items.sort((a, b) => a.priority - b.priority || b.overdueDays - a.overdueDays);
  return items;
}

function renderRatingButtons(containerId, currentVal, onSelectFnName) {
  document.getElementById(containerId).innerHTML = RATINGS.map((r) => `
    <button type="button" role="radio" aria-checked="${currentVal === r.id}"
      class="rating-choice ${currentVal === r.id ? r.btnClass : ''}"
      style="${r.id === 'نسيت تماماً' ? 'grid-column: 1 / -1;' : ''}"
      onclick="${onSelectFnName}('${r.id}')">
      ${r.label}<small>${r.shortHint}</small>
    </button>
  `).join('');
}

function openSrReviewModal(kind, id, title, overdueDays = 0, passageId = null) {
  srTarget = { kind, id, passageId, title, overdueDays: Number(overdueDays) || 0 };
  selectedSrRating = '';
  selectedWeakSurahs = [];
  selectedWeakPages = [];

  const kindLabel = kind === 'passage' ? 'تقييم مقطع مستقل داخل السورة'
    : (kind === 'surah_solid' ? 'صندوق التثبيت — سورة مكتملة (تثبيت دائم)'
      : (kind === 'new' ? 'صندوق التثبيت — ربط وتثبيت السورة' : 'صندوق التثبيت — مراجعة جزء مكتمل'));

  document.getElementById('srReviewTargetInfo').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(title)}</strong>
    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${kindLabel}</div>
  `;
  renderRatingButtons('srRatingGrid', '', 'selectSrRating');
  const btn = document.getElementById('confirmSrBtn');
  btn.disabled = true;
  btn.textContent = 'اختر التقييم أولاً لحفظ المراجعة';

  const wpWrap = document.getElementById('srWeakPagesWrap');
  if (kind === 'old') {
    const jDb = JUZ_DB.find((x) => x.num === Number(id));
    const meta = state.solidMeta[id];
    selectedWeakSurahs = meta && Array.isArray(meta.weakSurahs) ? [...meta.weakSurahs] : [];
    selectedWeakPages = meta && Array.isArray(meta.weakPages) ? [...meta.weakPages] : [];
    if (jDb) {
      wpWrap.style.display = 'block';
      renderWeakSurahsAndPagesPicker(jDb);
    } else { wpWrap.style.display = 'none'; }
  } else {
    wpWrap.style.display = 'none';
  }
  openModal('srReviewModal');
}

// عرض أسماء السور الفعلية في تثبيت القديم (مع أرقام الأوجه فقط للسور الطويلة > 5 أوجه)
function renderWeakSurahsAndPagesPicker(jDb) {
  const surahs = getJuzSurahs(jDb.num);
  const hasLongSurah = surahs.some((s) => s.pages > 5);
  let html = '';
  if (surahs.length > 0) {
    html += surahs.map((s) => {
      const sel = selectedWeakSurahs.includes(s.name);
      return `<button type="button" class="weak-page-chip ${sel ? 'selected' : ''}" style="padding:4px 8px; min-width:86px;" onclick="toggleWeakSurah('${escapeAttr(s.name)}', ${jDb.num})">${s.name}</button>`;
    }).join('');
  }
  if (hasLongSurah) {
    for (let p = jDb.startPage; p <= jDb.endPage; p++) {
      const sel = selectedWeakPages.includes(p);
      html += `<button type="button" class="weak-page-chip ${sel ? 'selected' : ''}" onclick="toggleWeakPage(${p}, ${jDb.num})">ص ${p}</button>`;
    }
  }
  document.getElementById('srWeakPagesGrid').innerHTML = html;
}

function toggleWeakSurah(surahName, juzNum) {
  if (selectedWeakSurahs.includes(surahName)) selectedWeakSurahs = selectedWeakSurahs.filter((x) => x !== surahName);
  else selectedWeakSurahs.push(surahName);
  const jDb = JUZ_DB.find((x) => x.num === juzNum);
  if (jDb) renderWeakSurahsAndPagesPicker(jDb);
}

function toggleWeakPage(pageNum, juzNum) {
  if (selectedWeakPages.includes(pageNum)) selectedWeakPages = selectedWeakPages.filter((x) => x !== pageNum);
  else selectedWeakPages.push(pageNum);
  selectedWeakPages.sort((a, b) => a - b);
  const jDb = JUZ_DB.find((x) => x.num === juzNum);
  if (jDb) renderWeakSurahsAndPagesPicker(jDb);
}

function selectSrRating(rate) {
  selectedSrRating = rate;
  renderRatingButtons('srRatingGrid', rate, 'selectSrRating');
  const btn = document.getElementById('confirmSrBtn');
  btn.disabled = false;
  btn.textContent = 'حفظ وجدولة المراجعة القادمة تلقائياً';
}

function confirmSrReview() {
  if (!srTarget || !selectedSrRating) return;
  const t = todayStr();
  const level = getEffectiveLevel(state.profile);
  const isCritical = selectedSrRating === 'نسيت تماماً';

  if (srTarget.kind === 'old') {
    const meta = state.solidMeta[srTarget.id] || { reviews: 0, reps: 0, lapses: 0, ease: SR_CONFIG.defaultEase, intervalDays: 2 };
    const next = computeSM2(meta, selectedSrRating, srTarget.overdueDays, level);
    const finalWeakSurahs = (selectedSrRating === 'ممتاز' && selectedWeakSurahs.length === 0) ? [] : [...selectedWeakSurahs];
    const finalWeakPages = (selectedSrRating === 'ممتاز' && selectedWeakPages.length === 0) ? [] : [...selectedWeakPages];
    state.solidMeta[srTarget.id] = {
      ...meta,
      reviews: (meta.reviews || 0) + 1,
      reps: next.reps, lapses: next.lapses, ease: next.ease,
      lastReviewed: t, rating: selectedSrRating, critical: isCritical,
      intervalDays: next.intervalDays, nextReviewDate: addDaysStr(t, next.intervalDays),
      weakSurahs: finalWeakSurahs, weakPages: finalWeakPages
    };
    if (isCritical) {
      const j = state.juzList.find((x) => x.num === Number(srTarget.id));
      if (j) { j.tags = Array.isArray(j.tags) ? j.tags : []; if (!j.tags.includes('متشابهات')) j.tags.push('متشابهات'); }
    }
    showToast(`تمت المراجعة (${selectedSrRating}) — الموعد القادم بعد ${next.intervalDays} يوم ✓`);
  } else if (srTarget.kind === 'passage') {
    // تقييم مقطع مستقل داخل «تثبيت الجديد»
    const g = state.newLinkingGroups.find((x) => x.id === srTarget.id);
    if (g) {
      const p = g.passages.find((x) => x.id === srTarget.passageId);
      if (p) {
        p.rating = selectedSrRating;
        p.lastReviewed = t;
      }
      if (isCritical) { g.tags = Array.isArray(g.tags) ? g.tags : []; if (!g.tags.includes('متشابهات')) g.tags.push('متشابهات'); g.critical = true; }
      const next = computeSM2(g, selectedSrRating, srTarget.overdueDays, level);
      g.intervalDays = next.intervalDays;
      g.nextReviewDate = addDaysStr(t, next.intervalDays);
      showToast(`تم تحديث تقييم المقطع إلى (${selectedSrRating}) ✓`);
    }
  } else if (srTarget.kind === 'surah_solid') {
    const cs = (state.completedSurahsSolid || []).find((x) => x.id === srTarget.id);
    if (cs) {
      const next = computeSM2(cs, selectedSrRating, srTarget.overdueDays, level);
      cs.reviews = (cs.reviews || 0) + 1;
      cs.reps = next.reps; cs.lapses = next.lapses; cs.ease = next.ease;
      cs.lastReviewed = t; cs.rating = selectedSrRating; cs.critical = isCritical;
      cs.intervalDays = next.intervalDays; cs.nextReviewDate = addDaysStr(t, next.intervalDays);
      showToast(`تمت مراجعة ${cs.surahName} (${selectedSrRating}) — القادمة بعد ${next.intervalDays} يوم ✓`);
    }
  } else {
    // kind === 'new' (تقييم ربط السورة بالكامل) — A4 FIXED: أي تقييم غير إعادة/نسيت يُخرجها من hasUrgent
    const g = state.newLinkingGroups.find((x) => x.id === srTarget.id);
    if (g) {
      const next = computeSM2(g, selectedSrRating, srTarget.overdueDays, level);
      g.linkCount = (g.linkCount || 0) + 1;
      g.reps = next.reps; g.lapses = next.lapses; g.ease = next.ease;
      g.lastLinked = t; g.rating = selectedSrRating; g.critical = isCritical;
      g.intervalDays = next.intervalDays; g.nextReviewDate = addDaysStr(t, next.intervalDays);
      if (selectedSrRating !== 'يحتاج إعادة' && selectedSrRating !== 'نسيت تماماً') {
        g.passages.forEach((p) => {
          if (p.rating === 'يحتاج إعادة' || p.rating === 'نسيت تماماً') p.rating = selectedSrRating;
        });
      }
      if (isCritical) { g.tags = Array.isArray(g.tags) ? g.tags : []; if (!g.tags.includes('متشابهات')) g.tags.push('متشابهات'); }
      showToast(`تم ربط ${g.surahName} (${selectedSrRating}) — الموعد القادم بعد ${next.intervalDays} يوم ✓`);
    }
  }
  touchStreak(); saveState(); closeModal('srReviewModal'); renderAll();
}

// ================= SNOWBALL MERGE & GRADUATE SURAH TO PERMANENT SOLID BOX =================
function mergeGroupPassages(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g || g.passages.length < 2) return;
  const totalPages = Number(g.passages.reduce((s, p) => s + Number(p.pages || 0), 0).toFixed(2));
  const firstLabel = g.passages[0].passage;
  const lastLabel = g.passages[g.passages.length - 1].passage;
  const mergedLabel = `كتلة مدمجة (${firstLabel} ← ${lastLabel})`;
  const hasWeak = g.passages.some((p) => p.rating === 'يحتاج إعادة' || p.rating === 'نسيت تماماً');
  g.passages = [{
    id: 'p_merged_' + Date.now(),
    passage: mergedLabel,
    pages: totalPages,
    rating: hasWeak ? 'جيد' : (g.rating || 'جيد جداً'),
    date: todayStr()
  }];
  g.linkCount = (g.linkCount || 0) + 1;
  g.lastLinked = todayStr();
  saveState(); renderAll();
  showToast(`تم ربط ودمج مقاطع ${g.surahName} في كتلة واحدة (${formatNum(totalPages)} وجه) ✓`);
}

function graduateSurahToOldSolid(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  const totalPages = Number(g.passages.reduce((s, p) => s + Number(p.pages || 0), 0).toFixed(2));
  const t = todayStr();
  state.completedSurahsSolid = Array.isArray(state.completedSurahsSolid) ? state.completedSurahsSolid : [];
  if (!state.completedSurahsSolid.some((x) => x.surahName === g.surahName)) {
    state.completedSurahsSolid.unshift({
      id: 'cs_' + Date.now(),
      surahName: g.surahName,
      pages: totalPages,
      reviews: 0, reps: 0, lapses: 0, ease: SR_CONFIG.defaultEase,
      lastReviewed: t, rating: '',
      intervalDays: SR_CONFIG.firstAutoReviewDays,
      nextReviewDate: addDaysStr(t, SR_CONFIG.firstAutoReviewDays),
      addedAt: t
    });
  }
  g.archived = true;
  touchStreak(); saveState(); renderAll();
  showToast(`مبارك! انتقلت ${g.surahName} كسورة مكتملة إلى «تثبيت القديم» بدورة مراجعة دائمة ✓`);
}

// ================= PRIORITY BANNER ROUTER (MAX 1 BANNER AT A TIME ON HOME) =================
function renderPriorityBanners() {
  const storageBox = document.getElementById('storageAlertBanner');
  const remBox = document.getElementById('inAppReminderBanner');
  const weekBox = document.getElementById('weekDueBanner');
  const guideBox = document.getElementById('firstTimeGuideBanner');
  const installBar = document.getElementById('smartInstallBar');

  if (storageBox) storageBox.innerHTML = '';
  if (remBox) remBox.innerHTML = '';
  if (weekBox) weekBox.innerHTML = '';
  if (guideBox) guideBox.innerHTML = '';
  if (installBar) installBar.classList.remove('show');

  // 1) أولوية قصوى: تلف التخزين أو امتلاء المساحة أو تذكير النسخ الاحتياطي
  if (corruptBackupKey && storageBox) {
    const hasSnap = getAutoSnapshots().length > 0;
    storageBox.innerHTML = `
      <div class="alert-banner alert-danger">
        <div><strong>تم رصد تلف في البيانات المخزّنة — وحفظنا نسخة خام منها لحمايتها</strong></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${hasSnap ? '<button type="button" class="btn btn-gold btn-sm" onclick="restoreLastAutoSnapshot()">استعادة آخر لقطة</button>' : ''}
          <button type="button" class="btn btn-outline btn-sm" onclick="emergencyExportRaw()">تصدير النسخة الخام</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="openResetConfirmModal()">البدء من جديد</button>
        </div>
      </div>`;
    return;
  }
  if (storageQuotaWarning && storageBox) {
    storageBox.innerHTML = `
      <div class="alert-banner alert-danger">
        <div><strong>مساحة تخزين المتصفح ممتلئة</strong> يُنصح بتصدير نسخة احتياطية JSON الآن.</div>
        <button type="button" class="btn btn-gold btn-sm" onclick="exportBackup()">تصدير نسخة الآن</button>
      </div>`;
    return;
  }
  if (state.onboarded && state.lastBackupAt && diffDaysFromToday(todayStr(), state.lastBackupAt) >= SR_CONFIG.backupReminderDays && storageBox) {
    storageBox.innerHTML = `
      <div class="alert-banner">
        <div><strong>تذكير النسخ الاحتياطي</strong> مرّ أكثر من أسبوعين دون حفظ نسخة احتياطية JSON.</div>
        <button type="button" class="btn btn-gold btn-sm" onclick="exportBackup()">تصدير JSON الآن</button>
      </div>`;
    return;
  }

  // 2) تذكير اليوم النشط داخل التطبيق
  if (state.reminders.length && remBox) {
    const now = new Date();
    const nowHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const activeDue = state.reminders.find((r) => r.enabled && r.time <= nowHHMM && r.lastTriggeredDate !== todayStr());
    if (activeDue) {
      remBox.innerHTML = `
        <div class="alert-banner">
          <div><strong>🔔 تذكير موعد ${activeDue.time}</strong>${escapeHtml(buildSmartMessage(activeDue.type))}</div>
          <button type="button" class="btn btn-outline btn-sm" onclick="dismissReminderToday('${activeDue.id}')">حسناً</button>
        </div>`;
      return;
    }
  }

  // 3) اقتراح إغلاق الأسبوع بعد مرور 7 أيام
  if (state.weekStartedAt && diffDaysFromToday(todayStr(), state.weekStartedAt) >= 7 && weekBox) {
    weekBox.innerHTML = `
      <div class="alert-banner">
        <div><strong>أتممت أسبوعاً كاملاً!</strong> يمكنك أرشفة الأسبوع السابق والبدء بأسبوع جديد بضغطة واحدة.</div>
        <button type="button" class="btn btn-gold btn-sm" onclick="archiveWeek()">إغلاق الأسبوع الآن</button>
      </div>`;
    return;
  }

  // 4) الدليل الترحيبي لأول مرة
  if (!state.welcomeDismissed && guideBox) {
    guideBox.innerHTML = `
      <div class="alert-banner">
        <div style="flex:1; min-width:220px;">
          <strong>دليل سريع في سطرين</strong>
          <div style="font-size:0.81rem; color:var(--text-main); margin-top:3px;">
            ١) <strong>المراجعة:</strong> راجع جزءك النشط وعند إتمامه يدخل <strong>صندوق التثبيت</strong> ويحل الجزء التالي مكانه تلقائياً.<br/>
            ٢) <strong>الجديد:</strong> سجّل وردك بالآيات، وعند تسميعه ينتقل لـ «تثبيت الجديد» لتدمج مقاطعه حتى تكتمل السورة.
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="dismissWelcomeGuide()">فهمت، إخفاء</button>
      </div>`;
    return;
  }

  // 5) شريط التثبيت الذكي (لا يظهر إلا بعد إغلاق الدليل الترحيبي وعند عدم التثبيت)
  const dismissedInstall = localStorage.getItem('rafiq_install_bar_dismissed') === '1';
  if (installBar && !isRunningStandalone() && !dismissedInstall) {
    installBar.classList.add('show');
  }
}

// ================= CORE RENDER & DASHBOARD =================
function showToast(msg) {
  const el = document.getElementById('toastEl');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.remove('show'), 3400);
}

function syncSolidBoxMembership(juz) {
  const isComplete = juz.donePages >= juz.totalPages - 0.01;
  const t = todayStr();
  if (isComplete && !state.solidMeta[juz.num]) {
    state.solidMeta[juz.num] = {
      reviews: 0, reps: 0, lapses: 0, ease: SR_CONFIG.defaultEase,
      lastReviewed: t, rating: '', intervalDays: SR_CONFIG.firstAutoReviewDays,
      nextReviewDate: addDaysStr(t, SR_CONFIG.firstAutoReviewDays),
      weakSurahs: [], weakPages: [], addedAt: t
    };
    syncPlanAndScheduleLive();
    const nextRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
    showToast(`مبارك! انتقل ${juz.title} لصندوق التثبيت${nextRev ? ` وحلّ ${nextRev.title} مكانه في جدولك` : ''} ✓`);
  } else if (!isComplete && state.solidMeta[juz.num]) {
    delete state.solidMeta[juz.num];
    syncPlanAndScheduleLive();
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  document.querySelectorAll('[data-tab]').forEach((btn) => {
    const act = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('active', act);
    btn.setAttribute('aria-selected', act ? 'true' : 'false');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}

function renderAll() {
  if (!state.onboarded) return;
  syncPlanAndScheduleLive();
  renderPriorityBanners();
  renderHeader();
  renderDashboard();
  renderSchedule();
  renderSolidTab();
  renderMap();
  renderRemindersUI();
  renderThemeGrids();
  updateCalculator();
  populateManualLinkSurahSelect();
  renderProgressVisibility();
  // الوضع المبسط للمبتدئين يخفي العناصر المتقدمة وتبويب الخريطة التفصيلية
  document.querySelectorAll('.adv-only').forEach((el) => el.classList.toggle('simple-mode-hidden', !!state.simpleMode));
  document.querySelectorAll('[data-tab="map"]').forEach((el) => el.classList.toggle('simple-mode-hidden', !!state.simpleMode));
}

function renderHeader() {
  const p = state.profile;
  const name = p.name || 'رفيق التثبيت';
  document.getElementById('headerUserTitle').textContent = `أهلاً يا ${name}`;
  const activeJuzCount = state.juzList.filter((j) => j.track === 'revision').length;
  const modeNames = { from_nas: 'الناس ← البقرة', from_baqarah: 'البقرة ← الناس', beginner: 'بداية جديدة', khatim: 'خاتم ٣٠ جزءاً', scattered: 'سور متفرقة' };
  const subCount = p.mode === 'khatim' ? `دورة #${state.khatimCycleNum || 1}` : (activeJuzCount > 0 ? `${activeJuzCount} جزء مراجعة` : 'تأسيس جديد');
  document.getElementById('headerUserSub').textContent = `${modeNames[p.mode] || 'خطتك'} • ${subCount} • ${p.dailyMin} د/يوم`;

  const graceActive = state.streak.graceUsedDate === todayStr();
  document.getElementById('streakBadge').textContent = `🔥 ${state.streak.count} أيام${graceActive ? ' (سماح)' : ''}`;

  const profLine = document.getElementById('profileSummaryLine');
  if (profLine) {
    profLine.innerHTML = `المستخدم: <strong style="color:var(--accent-hi);">${escapeHtml(name)}</strong> • المسار: <strong>${modeNames[p.mode] || 'مرن'}</strong> • الإصدار: <strong>v${APP_VERSION}</strong>`;
  }
  const legacyBtn = document.getElementById('settingsLegacyImportBtn');
  if (legacyBtn) legacyBtn.style.display = findLegacyStorageKey() ? 'inline-flex' : 'none';
  const snapBtn = document.getElementById('restoreSnapshotBtn');
  if (snapBtn) snapBtn.style.display = getAutoSnapshots().length > 0 ? 'inline-flex' : 'none';
}

function renderDashboard() {
  const isKhatim = state.profile.mode === 'khatim';
  const isBeginner = state.profile.mode === 'beginner';
  const revList = state.juzList.filter((j) => j.track === 'revision');
  const newList = state.juzList.filter((j) => j.track === 'new');

  const totalPages = state.juzList.reduce((s, j) => s + j.totalPages, 0) || 604;
  const donePages = state.juzList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const pct = Math.round((donePages / totalPages) * 100);

  const revDoneJuz = revList.filter((j) => j.donePages >= j.totalPages - 0.01).length;
  const revDonePages = revList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const revTotalPages = revList.reduce((s, j) => s + j.totalPages, 0);

  const newDoneJuz = newList.filter((j) => j.donePages >= j.totalPages - 0.01).length;
  const newDonePages = newList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const newTotalPages = newList.reduce((s, j) => s + j.totalPages, 0);

  const solidOldCount = revDoneJuz + newDoneJuz;
  const compSurahsCount = (state.completedSurahsSolid || []).length;
  const activeLinkGroups = state.newLinkingGroups.filter((g) => !g.archived);
  const solidNewPassages = activeLinkGroups.reduce((s, g) => s + g.passages.length, 0);

  const circ = 339;
  document.getElementById('khatmaRingCircle').style.strokeDashoffset = circ - (circ * pct / 100);
  document.getElementById('khatmaPct').textContent = pct + '%';
  document.getElementById('khatmaPctInline').textContent = `${pct}% • ${formatNum(donePages)} / ${totalPages} وجه`;
  document.getElementById('khatmaPagesText').textContent = `${formatNum(donePages)} / ${totalPages} وجهاً`;

  document.getElementById('heroRevBlock').style.display = revList.length > 0 ? 'block' : 'none';
  if (revList.length > 0) {
    document.getElementById('revProgressLabel').textContent = `${revDoneJuz} / ${revList.length} جزء`;
    document.getElementById('revProgressBar').style.width = `${revTotalPages ? (revDonePages / revTotalPages * 100).toFixed(1) : 0}%`;
    document.getElementById('revPagesDetail').textContent = `${formatNum(revDonePages)} من ${revTotalPages} وجهاً`;
  }

  document.getElementById('heroNewBlock').style.display = (!isKhatim && newList.length > 0) ? 'block' : 'none';
  if (!isKhatim && newList.length > 0) {
    document.getElementById('newProgressLabel').textContent = `${newDoneJuz} / ${newList.length} جزء`;
    document.getElementById('newProgressBar').style.width = `${newTotalPages ? (newDonePages / newTotalPages * 100).toFixed(1) : 0}%`;
    document.getElementById('newPagesDetail').textContent = `${formatNum(newDonePages)} من ${newTotalPages} وجهاً`;
  }

  document.getElementById('solidProgressLabel').textContent = `${solidOldCount} أجزاء • ${compSurahsCount} سور • ${solidNewPassages} مقاطع`;
  document.getElementById('solidProgressBar').style.width = `${(solidOldCount / 30 * 100).toFixed(1)}%`;

  const smBtn = document.getElementById('homeSimpleModeBtn');
  if (smBtn) smBtn.textContent = state.simpleMode ? 'عرض متقدم' : 'وضع بسيط';

  // توجيه زر «▶ ابدأ الجلسة» للمبتدئ إلى وضع الربط/الحفظ بدلاً من ترميم القديم
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const startTimerBtn = document.querySelector('#todayCardWrapper button[onclick*="openTimerModal"]');
  if (startTimerBtn) {
    const defaultTimerMode = (isBeginner || !curRev) ? 'link' : 'doctor';
    startTimerBtn.setAttribute('onclick', `openTimerModal('${defaultTimerMode}')`);
  }

  // Due Today (Anti-Overload daily cap)
  const allDue = getDueItems();
  const visibleDue = allDue.slice(0, SR_CONFIG.dailyDueLimit);
  const deferredCount = Math.max(0, allDue.length - visibleDue.length);
  document.getElementById('dueCountBadge').textContent = `${allDue.length} عناصر`;
  const dueListEl = document.getElementById('dueTodayList');
  if (allDue.length === 0) {
    dueListEl.innerHTML = '<div style="font-size:0.83rem; color:var(--text-muted); padding:4px 2px;">يومك صافٍ من المراجعات المتأخرة — كل ورد تسمّعه أو جزء تنجزه يُجدول هنا تلقائياً.</div>';
  } else {
    dueListEl.innerHTML = visibleDue.map((item) => `
      <div class="log-item" style="align-items:center;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.9rem;">${escapeHtml(item.title)}</strong>
            <span class="tag ${item.priority <= 0 ? 'tag-danger' : (item.priority === 1 ? 'tag-warn' : 'tag-gold')}">${item.badge}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(item.subtitle)}</div>
        </div>
        <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('${item.kind}', '${item.id}', '${escapeAttr(item.title)}', ${item.overdueDays})">راجعته ✓</button>
      </div>
    `).join('') + (deferredCount > 0
      ? `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-top:4px;">تم ترحيل ${deferredCount} عناصر إضافية تلقائياً للغد لمنع التراكم المرهق.</div>` : '');
  }

  const nwCard = document.getElementById('homeNewWorkflowCard');
  if (isKhatim) nwCard.innerHTML = '';
  else renderHomeNewWorkflow();

  // Today's Flexible Tasks + Busy Day Mode (7 min)
  const isBusyToday = state.busyDayDate === todayStr();
  const todayWrap = document.getElementById('todayCardWrapper');
  todayWrap.classList.toggle('card-busy', isBusyToday);
  const busyBtn = document.getElementById('busyDayToggleBtn');
  busyBtn.textContent = isBusyToday ? 'العودة للجدول العادي' : 'وقتي مضغوط اليوم';
  busyBtn.className = isBusyToday ? 'btn btn-outline btn-sm' : 'btn btn-warn btn-sm';

  const jsToday = new Date().getDay();
  const todayObj = state.schedule.find((d) => d.jsDay === jsToday) || state.schedule[0];
  document.getElementById('todayDayTitle').textContent = todayObj ? (todayObj.name + (todayObj.maqraa ? ' • يوم التسميع' : '')) : 'اليوم';

  const activeNewSurah = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);

  if (isBusyToday) {
    const weakest = allDue[0] ? allDue[0].title : (curRev ? curRev.title : (activeNewSurah ? `سورة ${activeNewSurah.name}` : 'أقرب مقطع حفظته'));
    document.getElementById('todayTasksContainer').innerHTML = `
      <div style="font-size:0.83rem; color:var(--warn); font-weight:700; margin-bottom:10px;">
        🛡️ وضع الحماية السريع (٧ دقائق فقط) — يُحسب يوماً نشطاً ويحفظ سلسلتك دون ضغط:
      </div>
      <button type="button" class="task-row ${state.busyTasksDone.t1 ? 'done' : ''}" onclick="toggleBusyTask('t1')">
        <span class="check-circle">${state.busyTasksDone.t1 ? '✓' : ''}</span>
        <span class="task-text"><strong>حماية سريعة (٣ دقائق)</strong><small>مراجعة سريعة لـ: ${escapeHtml(weakest)}</small></span>
      </button>
      <button type="button" class="task-row ${state.busyTasksDone.t2 ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleBusyTask('t2')">
        <span class="check-circle">${state.busyTasksDone.t2 ? '✓' : ''}</span>
        <span class="task-text"><strong>تنشيط التثبيت (٤ دقائق)</strong><small>سرد وجهين فقط من أي جزء أو سورة منجزة — والباقي مُرحّل بهدوء</small></span>
      </button>`;
  } else if (todayObj) {
    let tasksHtml = `
      <button type="button" class="task-row ${todayObj.mDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'mDone')">
        <span class="check-circle">${todayObj.mDone ? '✓' : ''}</span>
        <span class="task-text"><strong>١. الجلسة الأساسية (في أي وقت)</strong><small>${escapeHtml(todayObj.main)}</small></span>
      </button>`;
    if (todayObj.second) {
      tasksHtml += `
        <button type="button" class="task-row ${todayObj.eDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'eDone')">
          <span class="check-circle">${todayObj.eDone ? '✓' : ''}</span>
          <span class="task-text"><strong>٢. التسميع والربط (مرنة)</strong><small>${escapeHtml(todayObj.second)}</small></span>
        </button>`;
    }
    if (todayObj.solid) {
      tasksHtml += `
        <button type="button" class="task-row ${todayObj.sDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${todayObj.id}', 'sDone')">
          <span class="check-circle">${todayObj.sDone ? '✓' : ''}</span>
          <span class="task-text"><strong>٣. صندوق التثبيت</strong><small>${escapeHtml(todayObj.solid)}</small></span>
        </button>`;
    }
    document.getElementById('todayTasksContainer').innerHTML = tasksHtml;
  }

  const quickRevBtn = document.getElementById('quickRevBtn');
  if (quickRevBtn) {
    quickRevBtn.style.display = curRev ? 'inline-flex' : 'none';
    if (curRev) quickRevBtn.textContent = `+١ وجه في ${curRev.title}`;
  }

  // Overview Stats (tailored for Khatim!)
  document.getElementById('statCurrentRev').textContent = revList.length === 0 ? 'بداية جديدة' : (curRev ? curRev.title : 'مكتمل ✓');
  document.getElementById('statCurrentRevSub').textContent = revList.length === 0 ? 'لا يوجد قديم بعد' : (curRev ? `${formatNum(curRev.donePages)} / ${curRev.totalPages} وجهاً` : 'كل القديم في التثبيت');

  const newEditHint = document.getElementById('statNewEditHint');
  if (newEditHint) newEditHint.style.display = isKhatim ? 'none' : 'inline';

  const loggedInActiveSurah = activeNewSurah ? (state.surahNewProgress[activeNewSurah.num] || 0) : 0;
  document.getElementById('statCurrentNew').textContent = isKhatim ? 'خاتم ✓' : (activeNewSurah ? `سورة ${activeNewSurah.name}` : 'مكتمل ✓');
  document.getElementById('statCurrentNewSub').textContent = isKhatim
    ? `دورة ${state.profile.khatimCycleDays || 60} يوماً`
    : (activeNewSurah ? `الجزء ${getSurahJuzForLoggedPages(activeNewSurah.num, loggedInActiveSurah)} • ${loggedInActiveSurah > 0 ? `${formatNum(loggedInActiveSurah)} / ` : ''}${formatNum(activeNewSurah.pages)} وجه` : 'ختمة مباركة');

  const solidStatBtn = document.getElementById('statSolidNewCount').closest('button');
  if (solidStatBtn) solidStatBtn.setAttribute('onclick', `switchTab('solid'); setSolidTab('${isKhatim ? 'old' : 'new'}');`);
  document.getElementById('statSolidNewCount').textContent = isKhatim ? `${solidOldCount} أجزاء` : `${solidNewPassages} مقاطع`;
  document.getElementById('statSolidNewSub').textContent = isKhatim ? 'في تثبيت القديم' : (activeLinkGroups.length > 0 ? `في ${activeLinkGroups.length} سورة للربط` : 'جاهز لأول ورد جديد');

  let doneT = 0, totalT = 0;
  state.schedule.forEach((d) => {
    totalT++; if (d.mDone) doneT++;
    if (d.second) { totalT++; if (d.eDone) doneT++; }
    if (d.solid) { totalT++; if (d.sDone) doneT++; }
  });
  document.getElementById('statWeekPct').textContent = totalT ? Math.round(doneT / totalT * 100) + '%' : '0%';
  document.getElementById('statWeekSub').textContent = doneT === 0 ? 'ابدأ أول مهمة اليوم' : `${doneT} من ${totalT} مهمة`;

  const alertBox = document.getElementById('stabilizationAlert');
  alertBox.innerHTML = (revDoneJuz > 0 && revDoneJuz % 3 === 0 && revDoneJuz < revList.length)
    ? `<div class="alert-banner"><div><strong>تذكير أسبوع التثبيت (أتممت ${revDoneJuz} أجزاء)</strong> خصّص لفة سريعة للأجزاء الـ ${solidOldCount} في صندوق التثبيت قبل فتح الجزء التالي.</div></div>`
    : '';

  const activeJuz = curRev || newList.find((j) => j.donePages < j.totalPages - 0.01);
  const ajCard = document.getElementById('activeJuzSurahsCard');
  if (activeJuz && activeJuz.surahs && activeJuz.surahs.length > 0) {
    ajCard.style.display = 'block';
    document.getElementById('activeJuzSurahsTitle').textContent = `🎯 سور ${activeJuz.title}`;
    document.getElementById('activeJuzSurahsList').innerHTML = activeJuz.surahs.map((s, idx) => `
      <button type="button" class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${activeJuz.num}, ${idx})">
        <span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span>
        <small>${formatNum(s.pages)}</small>
      </button>`).join('');
  } else { ajCard.style.display = 'none'; }
}

function dismissWelcomeGuide() { state.welcomeDismissed = true; saveState(); renderPriorityBanners(); }

function toggleBusyDay() {
  const t = todayStr();
  if (state.busyDayDate === t) { state.busyDayDate = ''; showToast('عدنا إلى جدول اليوم العادي'); }
  else { state.busyDayDate = t; state.busyTasksDone = { t1: false, t2: false }; showToast('تم تفعيل وضع الحماية (٧ دقائق) 🛡️'); }
  saveState(); renderDashboard();
}

function toggleBusyTask(key) {
  state.busyTasksDone[key] = !state.busyTasksDone[key];
  if (state.busyTasksDone[key]) touchStreak();
  saveState(); renderDashboard();
}

// ================= NEW MEMORIZATION (AUTO-PAGES FROM AYAH RANGE + SURAH PROGRESS BAR) =================
function renderHomeNewWorkflow() {
  const container = document.getElementById('homeNewWorkflowCard');
  const activeSurah = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  const dir = getEffectiveDirection(state.profile);
  const orderedSurahs = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
  const defaultNum = activeSurah ? activeSurah.num : orderedSurahs[0].num;
  const loggedInSurah = activeSurah ? (state.surahNewProgress[activeSurah.num] || 0) : 0;
  const maxAyahReached = activeSurah ? (state.surahAyahProgress[activeSurah.num] || 0) : 0;
  const defaultJuz = activeSurah ? getSurahJuzForLoggedPages(activeSurah.num, loggedInSurah) : orderedSurahs[0].juz;
  const surahPct = activeSurah ? Math.min(100, Math.round(Math.max(loggedInSurah / activeSurah.pages, maxAyahReached / activeSurah.ayahs) * 100)) : 0;

  if (!state.activeWird) {
    if (!newWirdFormOpen) {
      container.innerHTML = `
        <div class="card">
          <div class="card-title" style="margin-bottom:8px;">
            <h2>📖 الحفظ الجديد — ${activeSurah ? `سورة ${activeSurah.name}` : 'تسجيل الورد'}</h2>
            ${activeSurah ? `<span class="tag tag-info">${surahPct}% من السورة</span>` : ''}
          </div>
          ${activeSurah ? `
            <div style="margin-bottom:11px;">
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px;">
                الجزء ${defaultJuz} • ${maxAyahReached > 0 ? `وصلت للآية ${maxAyahReached} من ${activeSurah.ayahs}` : `${activeSurah.ayahs} آية`} • ${formatNum(loggedInSurah)} / ${formatNum(activeSurah.pages)} وجهاً
              </div>
              <div class="bar-track"><div class="bar-fill-info" style="width:${surahPct}%"></div></div>
            </div>` : ''}
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-gold" style="flex:1;" onclick="toggleNewWirdForm(true)">+ تسجيل ورد جديد</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="openQuickFocusModal('new')">تغيير السورة</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="switchTab('solid'); setSolidTab('new');">صندوق التثبيت</button>
          </div>
        </div>`;
    } else {
      const surahOptions = orderedSurahs.map((s) =>
        `<option value="${s.num}" ${s.num === defaultNum ? 'selected' : ''}>${s.num}. سورة ${s.name} (${s.ayahs} آية • ${formatNum(s.pages)} وجه)</option>`
      ).join('');
      const juzOptions = JUZ_DB.map((j) =>
        `<option value="${j.num}" ${j.num === defaultJuz ? 'selected' : ''}>${j.title} — ${j.range}</option>`
      ).join('');
      const defFrom = activeSurah ? Math.min(activeSurah.ayahs, maxAyahReached + 1) : 1;
      const defTo = activeSurah ? Math.min(activeSurah.ayahs, defFrom + Math.max(3, Math.round((state.profile.pagesPerSession || 1) / activeSurah.pages * activeSurah.ayahs)) - 1) : 10;
      const defPages = activeSurah ? estimatePagesFromAyahs(activeSurah.num, defFrom, defTo) : (state.profile.pagesPerSession || 1);

      container.innerHTML = `
        <div class="card">
          <div class="card-title">
            <h2>📖 تسجيل ورد جديد — ${activeSurah ? `سورة ${activeSurah.name}` : ''}</h2>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleNewWirdForm(false)">إغلاق ✕</button>
          </div>
          <form onsubmit="registerNewWird(event)">
            <div class="form-grid form-grid-2">
              <div>
                <label class="field-label" for="nwSurahSelect">السورة (تظل ثابتة معك حتى تتمها)</label>
                <select id="nwSurahSelect" onchange="onHomeSurahChange(this.value)" required>${surahOptions}</select>
              </div>
              <div>
                <label class="field-label">نطاق الآيات (يحسب الأوجه تلقائياً)</label>
                <div class="ayah-range-row">
                  <input type="number" id="nwFromAyah" min="1" max="${activeSurah ? activeSurah.ayahs : 286}" value="${defFrom}" placeholder="من آية" oninput="autoCalcPagesFromAyahInputs()" required />
                  <input type="number" id="nwToAyah" min="1" max="${activeSurah ? activeSurah.ayahs : 286}" value="${defTo}" placeholder="إلى آية" oninput="autoCalcPagesFromAyahInputs()" required />
                </div>
              </div>
              <div>
                <label class="field-label">عدد الأوجه (محسوب تلقائياً — قابل للتعديل)</label>
                <div class="stepper-wrap">
                  <button type="button" class="stepper-btn" onclick="stepNwPages(-0.25)" aria-label="إنقاص ربع وجه">−</button>
                  <span class="stepper-val" id="nwPagesDisplay">${formatNum(defPages)} وجه</span>
                  <button type="button" class="stepper-btn" onclick="stepNwPages(0.25)" aria-label="زيادة ربع وجه">+</button>
                </div>
                <input type="hidden" id="nwPages" value="${defPages}" />
              </div>
              <div>
                <label class="field-label" for="nwJuz">الجزء التابع له (يتحدث تلقائياً للسور الطويلة)</label>
                <select id="nwJuz">${juzOptions}</select>
              </div>
            </div>
            <div style="margin-top:9px;">
              <input type="text" id="nwNote" placeholder="ملاحظة قبل الحفظ (اختياري)" />
            </div>
            <div style="margin-top:11px;">
              <button type="submit" class="btn btn-gold btn-block">حفظ وتسجيل الورد الجديد</button>
            </div>
          </form>
        </div>`;
    }
  } else {
    const w = state.activeWird;
    container.innerHTML = `
      <div class="card card-active-wird">
        <div class="card-title">
          <h2>📖 الورد الجديد المسجّل (بانتظار التسميع)</h2>
          <span class="tag tag-info">الجزء ${w.juzNum} • ${formatNum(w.pages)} وجه</span>
        </div>
        <div style="padding:11px 12px; border-radius:12px; background:var(--bg-surface-strong); border:1px solid var(--accent-border); margin-bottom:11px;">
          <div style="font-size:1.02rem; font-weight:800; color:var(--accent-hi);">${escapeHtml(w.surahName)} — ${escapeHtml(w.passage)}</div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">سُجّل في ${w.createdAt} ${w.note ? `• 📝 ${escapeHtml(w.note)}` : ''}</div>
        </div>
        <div style="margin-bottom:11px;">
          <button type="button" class="task-row ${w.prepRead ? 'done' : ''}" onclick="toggleWirdPrep('prepRead')"><span class="check-circle">${w.prepRead ? '✓' : ''}</span><span class="task-text"><strong>قراءة نظرية وفهم المعنى</strong></span></button>
          <button type="button" class="task-row ${w.prepMem ? 'done' : ''}" onclick="toggleWirdPrep('prepMem')"><span class="check-circle">${w.prepMem ? '✓' : ''}</span><span class="task-text"><strong>الحفظ والتسميع الذاتي غيباً</strong></span></button>
          <button type="button" class="task-row ${w.prepLink ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleWirdPrep('prepLink')"><span class="check-circle">${w.prepLink ? '✓' : ''}</span><span class="task-text"><strong>ربط الورد بالمقطع السابق في السورة</strong></span></button>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-gold" style="flex:1;" onclick="openReciteModal()">✅ تم التسميع + التقييم</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="cancelActiveWird()">تعديل / إلغاء</button>
        </div>
      </div>`;
  }
}

function toggleNewWirdForm(open) { newWirdFormOpen = !!open; renderHomeNewWorkflow(); }

function autoCalcPagesFromAyahInputs() {
  const sNum = parseInt(document.getElementById('nwSurahSelect').value, 10);
  const a1 = parseInt(document.getElementById('nwFromAyah').value, 10);
  const a2 = parseInt(document.getElementById('nwToAyah').value, 10);
  if (!sNum || isNaN(a1) || isNaN(a2) || a2 < a1) return;
  const est = estimatePagesFromAyahs(sNum, a1, a2);
  document.getElementById('nwPages').value = est;
  document.getElementById('nwPagesDisplay').textContent = `${formatNum(est)} وجه`;
}

function stepNwPages(delta) {
  const inp = document.getElementById('nwPages');
  const disp = document.getElementById('nwPagesDisplay');
  if (!inp || !disp) return;
  const next = Math.max(0.25, Math.min(15, Number((parseFloat(inp.value || 1) + delta).toFixed(2))));
  inp.value = next;
  disp.textContent = `${formatNum(next)} وجه`;
}

function onHomeSurahChange(surahNum) {
  const s = getSurahByNum(surahNum);
  if (!s) return;
  state.activeNewSurahNum = s.num;
  syncPlanAndScheduleLive();
  saveState();
  renderHomeNewWorkflow();
  renderSchedule();
}

function registerNewWird(e) {
  e.preventDefault();
  const surahNum = parseInt(document.getElementById('nwSurahSelect').value, 10);
  const sObj = getSurahByNum(surahNum);
  const surahName = sObj ? `سورة ${sObj.name}` : 'سورة مختارة';
  const a1 = Math.max(1, parseInt(document.getElementById('nwFromAyah').value, 10) || 1);
  const a2 = Math.max(a1, parseInt(document.getElementById('nwToAyah').value, 10) || (sObj ? sObj.ayahs : a1));
  const passage = (sObj && a1 === 1 && a2 >= sObj.ayahs) ? `السورة كاملة (${sObj.ayahs} آية)` : `آية ${a1} – ${a2}`;
  const pages = parseFloat(document.getElementById('nwPages').value) || 1;
  const juzNum = parseInt(document.getElementById('nwJuz').value, 10) || (sObj ? sObj.juz : 1);
  const note = document.getElementById('nwNote').value.trim();

  if (sObj) state.activeNewSurahNum = sObj.num;
  state.activeWird = {
    id: 'w_' + Date.now(), surahNum, surahName, passage, fromAyah: a1, toAyah: a2, pages, juzNum, note,
    createdAt: todayStr(), prepRead: false, prepMem: false, prepLink: false
  };
  newWirdFormOpen = false;
  syncPlanAndScheduleLive(); saveState(); renderAll();
  showToast(`تم تسجيل الورد الجديد: ${surahName} — ${passage}`);
}

function toggleWirdPrep(field) {
  if (!state.activeWird) return;
  state.activeWird[field] = !state.activeWird[field];
  if (state.activeWird[field]) touchStreak();
  saveState(); renderHomeNewWorkflow();
}

function cancelActiveWird() {
  if (!confirm('هل تريد إلغاء الورد المسجّل حالياً لتسجيل ورد آخر؟')) return;
  state.activeWird = null; saveState(); renderAll();
}

function openReciteModal() {
  if (!state.activeWird) return;
  const w = state.activeWird;
  const sObj = getSurahByNum(w.surahNum);
  const prevLogged = sObj ? (state.surahNewProgress[sObj.num] || 0) : 0;
  const willReachEnd = sObj ? ((w.toAyah && w.toAyah >= sObj.ayahs) || (prevLogged + w.pages >= sObj.pages - 0.01)) : false;

  selectedRating = '';
  document.getElementById('reciteModalSummary').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(w.surahName)} — ${escapeHtml(w.passage)}</strong>
    <div style="color:var(--text-muted); font-size:0.8rem; margin-top:2px;">المقدار: ${formatNum(w.pages)} وجه • الجزء ${w.juzNum}</div>`;
  renderRatingButtons('ratingGrid', '', 'selectRating');
  document.getElementById('reciteRepeatReason').style.display = 'none';
  document.getElementById('reciteSheikhNote').value = w.note || '';
  document.getElementById('reciteAutoMap').checked = true;
  document.getElementById('reciteAddToLink').checked = true;
  document.getElementById('reciteTagMut').checked = false;
  document.getElementById('reciteFinishSurah').checked = willReachEnd;

  const btn = document.getElementById('confirmReciteBtn');
  btn.disabled = true; btn.textContent = 'اختر التقييم أولاً لتأكيد التسميع';
  openModal('reciteModal');
}

function selectRating(rate) {
  selectedRating = rate;
  renderRatingButtons('ratingGrid', rate, 'selectRating');
  const isReset = rate === 'يحتاج إعادة' || rate === 'نسيت تماماً';
  document.getElementById('reciteAutoMap').checked = !isReset;
  document.getElementById('reciteRepeatReason').style.display = isReset ? 'block' : 'none';
  if (rate === 'نسيت تماماً') document.getElementById('reciteTagMut').checked = true;
  const btn = document.getElementById('confirmReciteBtn');
  btn.disabled = false; btn.textContent = 'تأكيد التسميع وإتاحة تسجيل الورد التالي';
}

function confirmRecitation() {
  if (!state.activeWird || !selectedRating) return;
  const w = state.activeWird;
  const note = document.getElementById('reciteSheikhNote').value.trim();
  const autoMap = document.getElementById('reciteAutoMap').checked;
  const addToLink = document.getElementById('reciteAddToLink').checked;
  const tagMut = document.getElementById('reciteTagMut').checked || selectedRating === 'نسيت تماماً';
  const finishSurah = document.getElementById('reciteFinishSurah').checked;
  const today = todayStr();

  state.maqraaLogs.unshift({
    id: 'mq_' + Date.now(), surahName: w.surahName, passage: w.passage,
    pages: w.pages, juzNum: w.juzNum, date: today, rating: selectedRating, note,
    tags: tagMut ? ['متشابهات'] : [], mutDismissed: false
  });

  if (autoMap) {
    const prevSurahLogged = w.surahNum ? (state.surahNewProgress[w.surahNum] || 0) : 0;
    if (w.surahNum) {
      // توزيع الأوجه بدقة عبر الأجزاء إذا امتد الورد لأكثر من جزء
      const affected = applyPagesAcrossJuzs(state.juzList, w.surahNum, w.pages, prevSurahLogged);
      affected.forEach((j) => {
        if (tagMut && !j.tags.includes('متشابهات')) j.tags.push('متشابهات');
        syncSolidBoxMembership(j);
      });
      const sObj = getSurahByNum(w.surahNum);
      const nextLogged = Number((prevSurahLogged + w.pages).toFixed(2));
      state.surahNewProgress[w.surahNum] = sObj ? Math.min(sObj.pages, nextLogged) : nextLogged;
      if (w.toAyah) {
        state.surahAyahProgress[w.surahNum] = Math.max(state.surahAyahProgress[w.surahNum] || 0, w.toAyah);
      }
      if (finishSurah || (sObj && nextLogged >= sObj.pages - 0.01)) {
        state.juzList.forEach((j) => {
          (j.surahs || []).forEach((s) => { if (s.num === w.surahNum) s.done = true; });
          recomputeJuzProgress(j);
          syncSolidBoxMembership(j);
        });
        state.activeNewSurahNum = null;
        const nextS = resolveActiveNewSurah(state.profile, state.juzList, null);
        state.activeNewSurahNum = nextS ? nextS.num : null;
      } else {
        state.activeNewSurahNum = w.surahNum;
      }
    }
  } else if (w.surahNum) {
    state.activeNewSurahNum = w.surahNum;
  }

  if (addToLink) {
    addPassageToLinkingGroup(w.surahName, w.passage, w.pages, selectedRating, today, tagMut);
  }

  state.activeWird = null;
  touchStreak(); syncPlanAndScheduleLive(); saveState(); closeModal('reciteModal'); renderAll();

  const curNew = state.activeNewSurahNum ? getSurahByNum(state.activeNewSurahNum) : null;
  showToast(
    finishSurah && curNew
      ? `مبارك إتمام ${w.surahName}! انتقلت خطتك تلقائياً إلى سورة ${curNew.name} ✓`
      : `تم التسميع (${selectedRating}) ونُقل المقطع لصندوق التثبيت ✓`
  );
}

// ================= SCHEDULE & WEEKLY ARCHIVE (NO DUPLICATE SAME-DAY ARCHIVE) =================
function renderSchedule() {
  const jsToday = new Date().getDay();
  document.getElementById('scheduleList').innerHTML = state.schedule.map((d) => {
    const isToday = d.jsDay === jsToday;
    const totalDayTasks = 1 + (d.second ? 1 : 0) + (d.solid ? 1 : 0);
    const doneCount = (d.mDone ? 1 : 0) + (d.second && d.eDone ? 1 : 0) + (d.solid && d.sDone ? 1 : 0);
    return `
      <div class="week-day-row ${isToday ? 'today' : ''}">
        <div class="week-day-head">
          <div class="day-name">
            <span>${d.name}</span>
            ${isToday ? '<span class="tag tag-gold">اليوم</span>' : ''}
            ${d.maqraa ? '<span class="tag tag-info">يوم التسميع</span>' : '<span class="tag tag-gold">وقت مرن</span>'}
            ${d.customEdited ? '<span class="tag tag-warn">معدّل يدوياً</span>' : ''}
            ${doneCount === totalDayTasks ? '<span class="tag tag-success">✓ مكتمل</span>' : `<span style="font-size:0.78rem; color:var(--text-muted);">${doneCount}/${totalDayTasks}</span>`}
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="openEditDay('${d.id}')">تعديل</button>
        </div>
        <div class="week-sessions-grid">
          <div class="session-col">
            <div class="session-col-title"><span>الجلسة الأساسية</span><span style="color:var(--text-dim); font-weight:600;">في أي وقت</span></div>
            <button type="button" class="task-row ${d.mDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${d.id}', 'mDone')">
              <span class="check-circle">${d.mDone ? '✓' : ''}</span>
              <span class="task-text"><strong>${escapeHtml(d.main)}</strong></span>
            </button>
          </div>
          ${(d.second || d.solid) ? `
            <div class="session-col">
              <div class="session-col-title"><span>جلسة التسميع والتثبيت</span><span style="color:var(--text-dim); font-weight:600;">في أي وقت</span></div>
              ${d.second ? `<button type="button" class="task-row ${d.eDone ? 'done' : ''}" onclick="toggleDayTask('${d.id}', 'eDone')"><span class="check-circle">${d.eDone ? '✓' : ''}</span><span class="task-text"><strong style="font-size:0.83rem;">${escapeHtml(d.second)}</strong></span></button>` : ''}
              ${d.solid ? `<button type="button" class="task-row ${d.sDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${d.id}', 'sDone')"><span class="check-circle">${d.sDone ? '✓' : ''}</span><span class="task-text"><strong style="font-size:0.83rem;">${escapeHtml(d.solid)}</strong></span></button>` : ''}
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  document.getElementById('archiveCountTag').textContent = `${state.weekArchives.length} أسابيع`;
  const archEl = document.getElementById('weekArchiveList');
  archEl.innerHTML = state.weekArchives.length === 0
    ? '<div class="empty-state">اضغط «إغلاق الأسبوع وعرض الملخص» في نهاية أسبوعك لتوثيق التزامك هنا.</div>'
    : state.weekArchives.map((a) => `
      <div class="log-item">
        <div>
          <strong style="font-size:0.88rem;">أسبوع منتهٍ في ${a.date}</strong>
          <div style="font-size:0.78rem; color:var(--text-muted);">أنجزت ${a.doneTasks} من ${a.totalTasks || 21} مهمة • الختمة: ${a.khatmaPct}%</div>
        </div>
        <span class="tag tag-success">${Math.round(a.doneTasks / (a.totalTasks || 21) * 100)}%</span>
      </div>`).join('');
}

function toggleDayTask(dayId, field) {
  const d = state.schedule.find((x) => x.id === dayId);
  if (!d) return;
  d[field] = !d[field];
  if (d[field]) touchStreak();
  saveState(); renderAll();
}

function openEditDay(dayId) {
  const d = state.schedule.find((x) => x.id === dayId);
  if (!d) return;
  editingDayId = dayId;
  document.getElementById('editDayName').textContent = d.name;
  document.getElementById('editMainText').value = d.main;
  document.getElementById('editSecondText').value = d.second;
  document.getElementById('editSolidText').value = d.solid;
  openModal('editDayModal');
}

function saveDayEdit() {
  const d = state.schedule.find((x) => x.id === editingDayId);
  if (d) {
    d.main = document.getElementById('editMainText').value.trim() || d.main;
    d.second = document.getElementById('editSecondText').value.trim();
    d.solid = document.getElementById('editSolidText').value.trim();
    d.customEdited = true;
    saveState(); renderAll(); showToast('تم حفظ تعديلك اليدوي على هذا اليوم ✓');
  }
  closeModal('editDayModal');
}

function resetDayToAuto() {
  const d = state.schedule.find((x) => x.id === editingDayId);
  if (d) { d.customEdited = false; syncPlanAndScheduleLive(); saveState(); renderAll(); showToast('عاد اليوم للتحديث التلقائي ✓'); }
  closeModal('editDayModal');
}

function archiveWeek() {
  const today = todayStr();
  // منع تكرار أرشفة نفس الأسبوع في نفس اليوم
  if (state.lastArchivedDate === today) {
    showToast('تمت أرشفة هذا الأسبوع اليوم بالفعل ✓');
    return;
  }
  let doneT = 0, totalT = 0;
  state.schedule.forEach((d) => {
    totalT++; if (d.mDone) doneT++;
    if (d.second) { totalT++; if (d.eDone) doneT++; }
    if (d.solid) { totalT++; if (d.sDone) doneT++; }
  });
  totalT = totalT || 7;
  const totalPages = state.juzList.reduce((s, j) => s + j.totalPages, 0) || 604;
  const donePages = state.juzList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const khatmaPct = Math.round(donePages / totalPages * 100);
  const weakItems = getDueItems().filter((x) => x.priority <= 1).slice(0, 3);
  const nextRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const nextNew = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);

  state.weekArchives.unshift({ date: today, doneTasks: doneT, totalTasks: totalT, khatmaPct });
  state.lastArchivedDate = today;
  state.weekStartedAt = today;
  const hasLinkingItems = state.newLinkingGroups.some((g) => !g.archived && g.passages.length > 0);
  state.schedule = buildLiveSchedule(state.profile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, null, { hasLinkingItems });
  saveState(); renderAll();

  document.getElementById('weekSummaryBody').innerHTML = `
    <div class="calc-preview-card" style="margin-top:0;">
      <strong>إنجازك هذا الأسبوع:</strong> ${doneT} من ${totalT} مهمة (${Math.round(doneT / totalT * 100)}%) • إجمالي الختمة: <strong>${khatmaPct}%</strong>.
    </div>
    <div style="margin-top:11px; font-size:0.84rem; line-height:1.8;">
      • <strong>العناصر التي تحتاج تركيزاً:</strong> ${weakItems.length ? weakItems.map((w) => escapeHtml(w.title)).join('، ') : 'لا توجد عناصر متعثرة — أداء ممتاز!'}<br/>
      • <strong>تركيز الأسبوع القادم:</strong> ${nextRev ? nextRev.title : 'صندوق التثبيت'}${nextNew ? ` + سورة ${nextNew.name}` : ''}.
    </div>
    <div style="margin-top:12px;">
      <button type="button" class="btn btn-gold btn-block" onclick="shareSheikhReport()">📋 مشاركة التقرير مع الشيخ / المعلّم</button>
    </div>`;
  openModal('weekSummaryModal');
}

// ================= SOLID BOX (SNOWBALL NEW + SURAH-BASED OLD + FILTERED MUTASHABIHAT) =================
function setSolidTab(sub) { state.solidSubTab = sub; saveState(); renderSolidTab(); }
function setMutFilter(f) { state.mutFilter = f; renderSolidTab(); }

function formatDueTag(nextDateStr) {
  const diff = diffDaysFromToday(nextDateStr);
  if (diff < 0) return `<span class="tag tag-danger">متأخر ${Math.abs(diff)} يوم</span>`;
  if (diff === 0) return '<span class="tag tag-warn">مستحق اليوم</span>';
  return `<span class="tag tag-success">القادم بعد ${diff} يوم</span>`;
}

function ratingBadgeHtml(r) {
  const found = RATINGS.find((x) => x.id === r);
  return found ? `<span class="tag ${found.tagClass}">${found.id}</span>` : '<span class="tag tag-gold">بانتظار التقييم</span>';
}

function renderSolidTab() {
  const isKhatim = state.profile.mode === 'khatim';
  const tabNewBtn = document.getElementById('solidTabNew');
  const tabMutBtn = document.getElementById('solidTabMut');
  if (tabNewBtn) tabNewBtn.style.display = isKhatim ? 'none' : 'block';
  if (tabMutBtn) tabMutBtn.style.display = state.simpleMode ? 'none' : 'block';

  let sub = state.solidSubTab || (isKhatim ? 'old' : 'new');
  if (isKhatim && sub === 'new') sub = 'old';
  if (state.simpleMode && sub === 'mutashabihat') sub = 'new';
  state.solidSubTab = sub;

  ['New', 'Old', 'Mut', 'Logs'].forEach((k) => {
    const mapKey = k === 'Mut' ? 'mutashabihat' : k.toLowerCase();
    document.getElementById('solidTab' + k).classList.toggle('active', sub === mapKey);
    document.getElementById('solidPanel' + k).style.display = sub === mapKey ? 'block' : 'none';
  });

  const completedList = state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01);
  const compSurahs = state.completedSurahsSolid || [];
  const activeGroups = state.newLinkingGroups.filter((g) => !g.archived);
  const archivedGroups = state.newLinkingGroups.filter((g) => g.archived);
  const totalNewPassages = activeGroups.reduce((s, g) => s + g.passages.length, 0);

  document.getElementById('solidBoxOldSummary').textContent = `${completedList.length} أجزاء${compSurahs.length ? ` • ${compSurahs.length} سور` : ''}`;
  document.getElementById('solidBoxNewSummary').textContent = isKhatim ? 'مخفي (خاتم)' : `${totalNewPassages} مقاطع (${activeGroups.length} سورة)`;

  // 1. تثبيت جديد (نظام الكرة الثلجية: تقييم مستقل لكل مقطع + ربط ودمج + ترحيل السورة المكتملة)
  const linkContainer = document.getElementById('linkingGroupsContainer');
  const linkAlert = document.getElementById('linkingAlertBanner');
  const mergeCandidate = activeGroups.find((g) => g.passages.length >= 2);
  linkAlert.innerHTML = mergeCandidate ? `
    <div class="alert-banner">
      <div><strong>جاهز للربط والدمج في ${escapeHtml(mergeCandidate.surahName)}</strong> لديك ${mergeCandidate.passages.length} مقاطع — راجع أي مقطع ضعيف لوحده ثم اضغط «ربط ودمج» لتتلاحم في كتلة واحدة.</div>
    </div>` : '';

  if (activeGroups.length === 0 && archivedGroups.length === 0) {
    linkContainer.innerHTML = isKhatim
      ? '<div class="empty-state">أنت في وضع الخاتم — جميع أجزائك تُدار من تبويب «تثبيت قديم».</div>'
      : `<div class="empty-state">قسم <strong>تثبيت الجديد</strong> بانتظار أول ورد تسمّعه من الرئيسية.
          <div style="margin-top:10px;"><button type="button" class="btn btn-gold btn-sm" onclick="switchTab('dashboard'); toggleNewWirdForm(true);">ابدأ الورد الأول</button></div>
         </div>`;
  } else {
    let html = '';
    activeGroups.forEach((g) => {
      const sumPages = g.passages.reduce((s, p) => s + Number(p.pages || 0), 0);
      const isMut = Array.isArray(g.tags) && g.tags.includes('متشابهات');
      html += `
        <div class="link-group-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
            <div>
              <strong style="font-size:0.98rem; color:var(--accent-hi);">${escapeHtml(g.surahName)} ${isMut ? '<span class="tag tag-warn">متشابهات</span>' : ''}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">${g.passages.length} مقطع (${formatNum(sumPages)} وجه) • مرات الربط: <strong>${g.linkCount}</strong></div>
            </div>
            ${formatDueTag(g.nextReviewDate || todayStr())}
          </div>
          <div>
            ${g.passages.map((p, idx) => {
              const isCrit = p.rating === 'نسيت تماماً';
              const isWeak = p.rating === 'جيد' || p.rating === 'يحتاج إعادة';
              return `
                <div class="passage-card-row ${isCrit ? 'critical' : (isWeak ? 'needs-work' : '')}">
                  <div>
                    <strong style="font-size:0.86rem;">${idx + 1}. ${escapeHtml(p.passage)}</strong>
                    <span style="font-size:0.77rem; color:var(--text-muted);"> (${formatNum(p.pages)} وجه) • ${ratingBadgeHtml(p.rating)}</span>
                  </div>
                  <div style="display:flex; gap:5px; align-items:center;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="openSrReviewModal('passage', '${g.id}', '${escapeAttr(g.surahName + ' — ' + p.passage)}', 0, '${p.id}')">مراجعة وتقييم</button>
                    <button type="button" class="btn btn-ghost btn-sm" onclick="removeLinkPassage('${g.id}','${p.id}')" aria-label="حذف المقطع">×</button>
                  </div>
                </div>`;
            }).join('')}
          </div>
          <div style="display:flex; gap:7px; flex-wrap:wrap; margin-top:10px;">
            ${g.passages.length >= 2 ? `<button type="button" class="btn btn-gold btn-sm" onclick="mergeGroupPassages('${g.id}')">🔗 ربط ودمج المقاطع (${g.passages.length})</button>` : ''}
            <button type="button" class="btn btn-outline btn-sm" onclick="openSrReviewModal('new', '${g.id}', '${escapeAttr(g.surahName)}')">تقييم السورة ككل</button>
            <button type="button" class="btn btn-success btn-sm" onclick="graduateSurahToOldSolid('${g.id}')">اكتملت ← نقل للتثبيت الدائم ✓</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleGroupMutTag('${g.id}')">${isMut ? 'إزالة المتشابهات' : '+ متشابهات'}</button>
          </div>
        </div>`;
    });
    if (archivedGroups.length > 0) {
      html += `<div style="margin-top:12px; font-size:0.83rem; font-weight:800; color:var(--success); margin-bottom:7px;">✓ سور اكتملت وانتقلت للتثبيت الدائم (${archivedGroups.length})</div>`;
      archivedGroups.forEach((g) => {
        html += `<div class="log-item"><div><strong style="font-size:0.9rem; color:var(--success);">${escapeHtml(g.surahName)}</strong></div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleArchiveLinkGroup('${g.id}')">إعادة للربط</button></div>`;
      });
    }
    linkContainer.innerHTML = html;
  }

  // 2. تثبيت قديم (دورة الخاتم + السور المكتملة المرحلة + الأجزاء المكتملة)
  const khatimBox = document.getElementById('khatimCycleBanner');
  if (khatimBox) {
    khatimBox.innerHTML = isKhatim ? `
      <div class="calc-preview-card" style="margin-top:0; margin-bottom:12px;">
        <strong>دورة الختم رقم ${state.khatimCycleNum || 1}</strong> (بدأت في ${state.khatimCycleStartedAt || todayStr()}) • الهدف: <strong>${state.profile.khatimCycleDays || 60} يوماً</strong> (${Math.ceil(604 / (state.profile.khatimCycleDays || 60))} وجه/يوم).
      </div>` : '';
  }

  const csBox = document.getElementById('completedSurahsSolidList');
  if (csBox) {
    csBox.innerHTML = compSurahs.length > 0 ? `
      <div style="font-size:0.84rem; font-weight:800; color:var(--accent-hi); margin-bottom:8px;">سور مكتملة في التثبيت الدائم (${compSurahs.length})</div>
      ${compSurahs.map((cs) => `
        <div class="log-item" style="align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="font-size:0.92rem;">${escapeHtml(cs.surahName)}</strong>
              ${formatDueTag(cs.nextReviewDate || todayStr())}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">المراجعات: <strong>${cs.reviews}</strong> • التقييم: <strong>${cs.rating || 'أول مراجعة'}</strong></div>
          </div>
          <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('surah_solid', '${cs.id}', '${escapeAttr(cs.surahName)}')">+ راجعتها</button>
        </div>`).join('')}
    ` : '';
  }

  document.getElementById('solidCountBadge').textContent = `${completedList.length} أجزاء`;
  const solidEl = document.getElementById('solidBoxList');
  if (completedList.length === 0 && compSurahs.length === 0) {
    solidEl.innerHTML = '<div class="empty-state">قسم <strong>تثبيت القديم</strong> بانتظار أول جزء مكتمل أو سورة تكتمل من «تثبيت الجديد».</div>';
  } else {
    solidEl.innerHTML = completedList.map((j) => {
      const meta = state.solidMeta[j.num] || { reviews: 0, lastReviewed: '', rating: '', nextReviewDate: todayStr(), weakSurahs: [], weakPages: [] };
      const ws = Array.isArray(meta.weakSurahs) && meta.weakSurahs.length > 0 ? ` • سور للتقوية: ${meta.weakSurahs.join('، ')}` : '';
      const wp = (!ws && Array.isArray(meta.weakPages) && meta.weakPages.length > 0) ? ` • أوجه متفلتة: ص ${meta.weakPages.join('، ')}` : '';
      return `
        <div class="log-item" style="align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="font-size:0.92rem;">${j.title}</strong>
              ${formatDueTag(meta.nextReviewDate || todayStr())}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px;">
              المراجعات: <strong style="color:var(--accent-hi);">${meta.reviews}</strong> • التقييم: <strong>${meta.rating || 'أول مراجعة'}</strong>${ws}${wp}
            </div>
          </div>
          <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('old', ${j.num}, '${escapeAttr(j.title)}')">+ راجعته</button>
        </div>`;
    }).join('');
  }

  // 3. بنك المتشابهات وملاحظات التسميع (مفصولة بفلتر واضح + حماية log.note)
  const mutItems = [];
  state.juzList.forEach((j) => {
    const meta = state.solidMeta[j.num];
    const hasTag = Array.isArray(j.tags) && j.tags.includes('متشابهات');
    const hasWeak = meta && ((Array.isArray(meta.weakSurahs) && meta.weakSurahs.length > 0) || (Array.isArray(meta.weakPages) && meta.weakPages.length > 0));
    if (hasTag || hasWeak || (j.note && j.note.includes('متشابه'))) {
      const weakTxt = (meta && meta.weakSurahs && meta.weakSurahs.length) ? `سور للتقوية: ${meta.weakSurahs.join('، ')}` : (meta && meta.weakPages && meta.weakPages.length ? `أوجه متفلتة: ص ${meta.weakPages.join('، ')}` : '');
      mutItems.push({
        cat: 'mut', title: j.title, sub: `${j.range}${weakTxt ? ' • ' + weakTxt : ''}`, note: j.note || '',
        badge: (meta && meta.critical) ? '<span class="tag tag-danger">موضع حرج</span>' : '<span class="tag tag-warn">متشابهات</span>',
        actionsHtml: `${meta ? `<button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('old', ${j.num}, '${escapeAttr(j.title)}')">تقييم ✓</button>` : ''}
          <button type="button" class="btn btn-ghost btn-sm" onclick="clearJuzMutAndWeak(${j.num})">تصفير/إزالة</button>`
      });
    }
  });
  state.newLinkingGroups.forEach((g) => {
    if (Array.isArray(g.tags) && g.tags.includes('متشابهات')) {
      mutItems.push({
        cat: 'mut', title: g.surahName, sub: `${g.passages.length} مقاطع`, note: '',
        badge: g.critical ? '<span class="tag tag-danger">موضع حرج</span>' : '<span class="tag tag-warn">متشابهات</span>',
        actionsHtml: `<button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('new', '${g.id}', '${escapeAttr(g.surahName)}')">تقييم ✓</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="toggleGroupMutTag('${g.id}')">إزالة الوسم</button>`
      });
    }
  });
  state.maqraaLogs.forEach((log) => {
    if (log.mutDismissed) return;
    const isTagged = Array.isArray(log.tags) && log.tags.includes('متشابهات');
    const hasNote = !!(log.note && log.note.trim());
    if (isTagged || hasNote) {
      mutItems.push({
        cat: isTagged ? 'mut' : 'notes',
        title: `${log.surahName} — ${log.passage}`,
        sub: `الجزء ${log.juzNum} • ${log.date}`,
        note: log.note || 'موسوم ضمن بنك المتشابهات',
        badge: isTagged ? '<span class="tag tag-warn">متشابهات</span>' : '<span class="tag tag-info">ملاحظة تسميع</span>',
        actionsHtml: `<button type="button" class="btn btn-ghost btn-sm" onclick="clearLogMutAndNote('${log.id}')">إخفاء من البنك</button>`
      });
    }
  });

  const curMutF = state.mutFilter || 'all';
  const mutFilterBar = document.getElementById('mutFilterBar');
  if (mutFilterBar) {
    mutFilterBar.innerHTML = `
      <button type="button" class="btn btn-sm ${curMutF === 'all' ? 'btn-gold' : 'btn-ghost'}" onclick="setMutFilter('all')">الكل (${mutItems.length})</button>
      <button type="button" class="btn btn-sm ${curMutF === 'mut' ? 'btn-gold' : 'btn-ghost'}" onclick="setMutFilter('mut')">المتشابهات والمواضع الحرجة</button>
      <button type="button" class="btn btn-sm ${curMutF === 'notes' ? 'btn-gold' : 'btn-ghost'}" onclick="setMutFilter('notes')">ملاحظات التسميع</button>`;
  }
  const visibleMut = curMutF === 'all' ? mutItems : mutItems.filter((x) => x.cat === curMutF);
  document.getElementById('mutCountBadge').textContent = `${visibleMut.length} مواضع`;
  const mutEl = document.getElementById('mutashabihatList');
  mutEl.innerHTML = visibleMut.length === 0
    ? '<div class="empty-state">لا توجد عناصر في هذا التصنيف حالياً.</div>'
    : visibleMut.map((m) => `
      <div class="log-item" style="align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="color:var(--warn); font-size:0.92rem;">${escapeHtml(m.title)}</strong>
            ${m.badge}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(m.sub)}</div>
          ${m.note ? `<div style="font-size:0.8rem; margin-top:3px;">📝 ${escapeHtml(m.note)}</div>` : ''}
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">${m.actionsHtml}</div>
      </div>`).join('');

  // 4. سجل التسميع
  document.getElementById('maqraaCountTag').textContent = `${state.maqraaLogs.length} حصص`;
  const logEl = document.getElementById('maqraaLogList');
  logEl.innerHTML = state.maqraaLogs.length === 0
    ? '<div class="empty-state">سجل حصص التسميع والتقييمات سيظهر هنا فور تأكيد أول تسميع.</div>'
    : state.maqraaLogs.map((item) => `
      <div class="log-item">
        <div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.9rem; color:var(--accent-hi);">${escapeHtml(item.surahName)} — ${escapeHtml(item.passage)}</strong>
            ${ratingBadgeHtml(item.rating)}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${formatNum(item.pages)} وجه • الجزء ${item.juzNum} • ${item.date}</div>
          ${item.note ? `<div style="font-size:0.8rem; color:var(--text-main); margin-top:3px;">📝 ${escapeHtml(item.note)}</div>` : ''}
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteMaqraaLog('${item.id}')">حذف</button>
      </div>`).join('');
}

function addPassageToLinkingGroup(surahName, passage, pages, rating, date, tagMut = false) {
  const cleanName = surahName.trim();
  const level = getEffectiveLevel(state.profile);
  const next = computeSM2({ reps: 0, ease: SR_CONFIG.defaultEase, intervalDays: 1 }, rating, 0, level);
  let group = state.newLinkingGroups.find((g) => g.surahName === cleanName && !g.archived);
  if (!group) {
    group = {
      id: 'lg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      surahName: cleanName, archived: false, linkCount: 0,
      reps: next.reps, lapses: next.lapses, ease: next.ease, critical: rating === 'نسيت تماماً',
      lastLinked: date, rating, intervalDays: next.intervalDays,
      nextReviewDate: addDaysStr(date, next.intervalDays),
      tags: tagMut ? ['متشابهات'] : [], passages: []
    };
    state.newLinkingGroups.unshift(group);
  } else {
    const candidateDate = addDaysStr(date, next.intervalDays);
    if (!group.nextReviewDate || candidateDate < group.nextReviewDate) { group.nextReviewDate = candidateDate; group.rating = rating; }
    if (rating === 'نسيت تماماً') group.critical = true;
    if (tagMut && !group.tags.includes('متشابهات')) group.tags.push('متشابهات');
  }
  group.passages.push({ id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000), passage: passage.trim(), pages: Number(pages) || 1, rating, date });
}

function toggleGroupMutTag(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.tags = Array.isArray(g.tags) ? g.tags : [];
  if (g.tags.includes('متشابهات')) { g.tags = g.tags.filter((t) => t !== 'متشابهات'); g.critical = false; }
  else g.tags.push('متشابهات');
  saveState(); renderAll();
}

function clearJuzMutAndWeak(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (j && Array.isArray(j.tags)) j.tags = j.tags.filter((t) => t !== 'متشابهات');
  if (state.solidMeta[juzNum]) { state.solidMeta[juzNum].weakSurahs = []; state.solidMeta[juzNum].weakPages = []; state.solidMeta[juzNum].critical = false; }
  saveState(); renderAll(); showToast('تم تنظيف الوسم والمواضع المتفلتة لهذا الجزء ✓');
}

// حماية سجل التسميع: لا تمسح log.note أبداً، بل تضبط mutDismissed = true فقط
function clearLogMutAndNote(logId) {
  const log = state.maqraaLogs.find((x) => x.id === logId);
  if (!log) return;
  log.tags = [];
  log.mutDismissed = true;
  saveState(); renderAll(); showToast('تم إخفاؤها من بنك المتشابهات مع حفظها في سجل التسميع ✓');
}

function populateManualLinkSurahSelect() {
  const sel = document.getElementById('mlSurah');
  if (!sel || sel.options.length === SURAHS_DB.length) return;
  sel.innerHTML = SURAHS_DB.map((s) => `<option value="سورة ${s.name}">${s.num}. سورة ${s.name} (الجزء ${s.juz})</option>`).join('');
}

function openManualLinkModal() {
  populateManualLinkSurahSelect();
  const activeS = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  if (activeS) document.getElementById('mlSurah').value = `سورة ${activeS.name}`;
  document.getElementById('mlTagMut').checked = false;
  openModal('manualLinkModal');
}

function saveManualLinkPassage(e) {
  e.preventDefault();
  addPassageToLinkingGroup(
    document.getElementById('mlSurah').value.trim(),
    document.getElementById('mlPassage').value.trim(),
    parseFloat(document.getElementById('mlPages').value) || 1,
    document.getElementById('mlRating').value,
    todayStr(),
    document.getElementById('mlTagMut').checked
  );
  saveState(); closeModal('manualLinkModal'); document.getElementById('mlPassage').value = '';
  renderAll(); showToast('أُضيف المقطع إلى صندوق التثبيت وجُدول تلقائياً ✓');
}

function removeLinkPassage(groupId, passageId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.passages = g.passages.filter((p) => p.id !== passageId);
  if (g.passages.length === 0) state.newLinkingGroups = state.newLinkingGroups.filter((x) => x.id !== groupId);
  saveState(); renderAll();
}

function toggleArchiveLinkGroup(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.archived = !g.archived;
  saveState(); renderAll();
}

function deleteMaqraaLog(id) { state.maqraaLogs = state.maqraaLogs.filter((x) => x.id !== id); saveState(); renderAll(); }

// ================= 30-JUZ MAP =================
function setMapFilter(filter) { state.mapFilter = filter; saveState(); renderMap(); }

function renderMap() {
  const revCount = state.juzList.filter((j) => j.track === 'revision').length;
  const newCount = state.juzList.filter((j) => j.track === 'new').length;
  const fRev = document.getElementById('filterRev');
  const fNew = document.getElementById('filterNew');
  const fMut = document.getElementById('filterMut');
  const fAll = document.getElementById('filterAll');

  fRev.textContent = `المراجعة (${revCount})`;
  fNew.textContent = `الجديد (${newCount})`;
  fRev.style.display = revCount > 0 ? 'block' : 'none';
  fNew.style.display = (state.profile.mode !== 'khatim' && newCount > 0) ? 'block' : 'none';

  if (state.mapFilter === 'new' && (newCount === 0 || state.profile.mode === 'khatim')) state.mapFilter = 'revision';
  if (state.mapFilter === 'revision' && revCount === 0) state.mapFilter = 'new';

  [fRev, fNew, fMut, fAll].forEach((b) => b.classList.remove('active'));
  if (state.mapFilter === 'revision') fRev.classList.add('active');
  if (state.mapFilter === 'new') fNew.classList.add('active');
  if (state.mapFilter === 'mutashabihat') fMut.classList.add('active');
  if (state.mapFilter === 'all') fAll.classList.add('active');

  const filtered = state.juzList.filter((j) => {
    if (state.mapFilter === 'all') return true;
    if (state.mapFilter === 'mutashabihat') {
      const meta = state.solidMeta[j.num];
      return (Array.isArray(j.tags) && j.tags.includes('متشابهات')) ||
        (meta && ((meta.weakSurahs && meta.weakSurahs.length) || (meta.weakPages && meta.weakPages.length))) ||
        (j.note && j.note.includes('متشابه'));
    }
    return j.track === state.mapFilter;
  });

  const phases = [];
  filtered.forEach((j) => {
    let group = phases.find((p) => p.name === j.phase);
    if (!group) { group = { name: j.phase, items: [] }; phases.push(group); }
    group.items.push(j);
  });

  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  let html = '';
  phases.forEach((ph) => {
    const phDone = ph.items.filter((j) => j.donePages >= j.totalPages - 0.01).length;
    html += `<div class="phase-header"><h3>${ph.name}</h3><span>${phDone} / ${ph.items.length} مكتمل</span></div>`;
    ph.items.forEach((j) => {
      const pct = Math.min(100, Math.round((j.donePages / j.totalPages) * 100));
      const completed = j.donePages >= j.totalPages - 0.01;
      const isActive = curRev && curRev.num === j.num;
      const expanded = !!state.expandedJuz[j.num];
      const isMut = Array.isArray(j.tags) && j.tags.includes('متشابهات');
      const fillClass = completed ? 'bar-fill-success' : (j.track === 'new' ? 'bar-fill-info' : 'bar-fill-gold');

      html += `
        <div class="juz-card ${completed ? 'completed' : ''} ${isActive && !completed ? 'active-juz' : ''}">
          <div class="juz-top">
            <div>
              <div class="juz-title">
                <span>${j.title}</span>
                <span class="tag ${j.track === 'new' ? 'tag-info' : 'tag-gold'}">${j.track === 'new' ? 'جديد' : 'مراجعة'}</span>
                ${isMut ? '<span class="tag tag-warn">متشابهات</span>' : ''}
                ${completed ? '<span class="tag tag-success">✓ في صندوق التثبيت</span>' : (isActive ? '<span class="tag tag-gold">النشط</span>' : '')}
              </div>
              <div class="juz-sub">${j.range}</div>
            </div>
            <div style="text-align:left; flex-shrink:0;">
              <strong style="color:${completed ? 'var(--success)' : 'var(--accent-hi)'}; font-size:0.94rem;">${formatNum(j.donePages)} / ${j.totalPages}</strong>
              <div style="font-size:0.76rem; color:var(--text-muted);">${pct}%</div>
            </div>
          </div>
          <div class="bar-track"><div class="${fillClass}" style="width:${pct}%"></div></div>
          <div class="juz-controls">
            <button type="button" class="btn btn-ghost btn-sm" onclick="adjustJuzPages(${j.num}, -1)">-١</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustJuzPages(${j.num}, 0.5)">+٠.٥</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustJuzPages(${j.num}, 1)">+١ وجه</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="adjustJuzPages(${j.num}, 3)">+٣</button>
            ${!completed ? `<button type="button" class="btn btn-success btn-sm" onclick="completeJuz(${j.num})">إتمام ✓</button>` : `<button type="button" class="btn btn-ghost btn-sm" onclick="resetJuz(${j.num})">إعادة فتح</button>`}
            ${!completed && !isActive ? `<button type="button" class="btn btn-gold btn-sm" onclick="setActiveRevJuz(${j.num})">ابدأ به الآن</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleJuzMutTag(${j.num})">${isMut ? 'إزالة المتشابهات' : '+ متشابهات'}</button>
            ${j.surahs && j.surahs.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm" onclick="toggleExpandJuz(${j.num})">${expanded ? 'السور ▲' : `السور (${j.surahs.length}) ▼`}</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" onclick="flipJuzTrack(${j.num})">نقل لـ ${j.track === 'new' ? 'المراجعة' : 'الجديد'}</button>
          </div>
          ${j.surahs && expanded ? `<div class="surah-list">${j.surahs.map((s, idx) => `<button type="button" class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${j.num}, ${idx})"><span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span><small>${formatNum(s.pages)}</small></button>`).join('')}</div>` : ''}
          <div style="margin-top:8px;"><input type="text" value="${escapeAttr(j.note || '')}" placeholder="ملاحظة أو متشابهات..." onchange="updateJuzNote(${j.num}, this.value)" style="padding:8px 10px; font-size:0.82rem;" /></div>
        </div>`;
    });
  });
  document.getElementById('juzMapContainer').innerHTML = html || '<div class="empty-state">لا توجد أجزاء مطابقة لهذا الفلتر حالياً.</div>';
}

function toggleJuzMutTag(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.tags = Array.isArray(j.tags) ? j.tags : [];
  if (j.tags.includes('متشابهات')) j.tags = j.tags.filter((t) => t !== 'متشابهات');
  else j.tags.push('متشابهات');
  saveState(); renderAll();
}

function flipJuzTrack(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.track = j.track === 'new' ? 'revision' : 'new';
  j.phase = j.track === 'new' ? 'مسار الحفظ الجديد' : 'مسار المراجعة';
  if (j.surahs) j.surahs.forEach((s) => { s.track = j.track; });
  syncPlanAndScheduleLive(); saveState(); renderAll();
}

function adjustJuzPages(juzNum, delta) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  const surahDonePages = (j.surahs || []).reduce((sum, s) => sum + (s.done ? Number(s.pages || 0) : 0), 0);
  const floorLogged = -(Number(j.basePages || 0) + surahDonePages);
  const ceilLogged = j.totalPages - (Number(j.basePages || 0) + surahDonePages);
  j.loggedPages = Math.max(floorLogged, Math.min(ceilLogged, Number(((j.loggedPages || 0) + delta).toFixed(2))));
  recomputeJuzProgress(j);
  if (delta > 0) touchStreak();
  syncSolidBoxMembership(j); syncPlanAndScheduleLive(); saveState(); renderAll();
}

function completeJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.loggedPages = Math.max(0, Number(j.loggedPages || 0));
  if (j.surahs) j.surahs.forEach((s) => { s.done = true; });
  recomputeJuzProgress(j); touchStreak(); syncSolidBoxMembership(j); syncPlanAndScheduleLive(); saveState(); renderAll();
}

function resetJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.loggedPages = 0; j.basePages = 0;
  if (j.surahs) j.surahs.forEach((s) => { s.done = false; });
  recomputeJuzProgress(j); syncSolidBoxMembership(j); syncPlanAndScheduleLive(); saveState(); renderAll();
}

function toggleSurah(juzNum, idx) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j || !j.surahs || !j.surahs[idx]) return;
  const s = j.surahs[idx];
  if (!s.done && s.pages > 5) {
    if (!confirm(`سورة ${s.name} تبلغ ${formatNum(s.pages)} وجهاً في هذا الجزء — هل أتممتها بالكامل فعلاً؟`)) return;
  }
  s.done = !s.done;
  recomputeJuzProgress(j);
  if (s.done) touchStreak();
  syncSolidBoxMembership(j); syncPlanAndScheduleLive(); saveState(); renderAll();
}

function toggleExpandJuz(juzNum) { state.expandedJuz[juzNum] = !state.expandedJuz[juzNum]; saveState(); renderMap(); }
function updateJuzNote(juzNum, val) { const j = state.juzList.find((x) => x.num === juzNum); if (j) { j.note = val; saveState(); } }

function quickAddRevPage() {
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  if (!curRev) { showToast('ما شاء الله! جميع أجزاء المراجعة مكتملة في صندوق التثبيت'); return; }
  adjustJuzPages(curRev.num, 1);
  if (curRev.donePages < curRev.totalPages - 0.01) showToast(`+١ وجه في ${curRev.title} (${formatNum(curRev.donePages)}/${curRev.totalPages})`);
}

// ================= REMINDERS, HEALTH CHECK & 2-HOUR WINDOW (B5) =================
function buildSmartMessage(type) {
  const name = state.profile.name || 'حافظ القرآن';
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const activeS = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  const due = getDueItems();
  if (type === 'revision') return curRev ? `يا ${name}، متبقّي ${formatNum(curRev.totalPages - curRev.donePages)} وجه وتتمّ ${curRev.title}.` : `يا ${name}، خصّص ١٠ دقائق لتثبيت محفوظك اليوم.`;
  if (type === 'new') return state.activeWird ? `يا ${name}، وردك الجديد: ${state.activeWird.surahName} (${state.activeWird.passage}).` : `يا ${name}، موعد وردك القادم في ${activeS ? `سورة ${activeS.name}` : 'الحفظ الجديد'}.`;
  return due.length > 0 ? `يا ${name}، لديك ${due.length} عناصر مستحقة في صندوق التثبيت — أهمها: ${due[0].title}.` : `يا ${name}، ١٠ دقائق سرد سريع من صندوق التثبيت تحفظ لك تعب شهور.`;
}

function sendSafeSystemNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return Promise.resolve(false);
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then((reg) => (reg && typeof reg.showNotification === 'function')
        ? reg.showNotification(title, { body, icon: 'icon-192.png', dir: 'rtl', lang: 'ar' }).then(() => true)
        : false)
      .catch((err) => {
        console.warn('SW showNotification failed:', err);
        try { new Notification(title, { body, icon: 'icon-192.png' }); return true; } catch (e2) { console.warn(e2); return false; }
      });
  }
  try { new Notification(title, { body, icon: 'icon-192.png' }); return Promise.resolve(true); }
  catch (e) { console.warn(e); return Promise.resolve(false); }
}

function checkNotificationHealth() {
  if (!('Notification' in window)) {
    showToast('متصفحك لا يدعم إشعارات النظام — ننصح بتصدير التقويم (.ics) لضمان التنبيه 📅');
    return;
  }
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    showToast('إشعاراتك مفعّلة وتعمل داخل التطبيق، وللتنبيه المؤكد عند الإغلاق استخدم تصدير (.ics) ✓');
  } else if (Notification.permission === 'denied') {
    showToast('متصفحك يمنع الإشعارات حالياً — ننصحك بزر «إضافة للتقويم (.ics)» لضمان التنبيه 📅');
  } else {
    showToast('لم يتم تفعيل إذن الإشعارات بعد — اضغط «تفعيل إشعارات الجهاز» أو صدّر للتقويم (.ics)');
  }
}

function addReminder(e) {
  e.preventDefault();
  const time = document.getElementById('remTimeInput').value;
  const type = document.getElementById('remTypeInput').value;
  if (!time) return;
  state.reminders.push({ id: 'rem_' + Date.now(), time, type, enabled: true, lastTriggeredDate: '', lastNotifiedDate: '' });
  saveState(); renderRemindersUI(); showToast('تم حفظ موعد التذكير الذكي ✓');
}

function toggleReminder(id) { const r = state.reminders.find((x) => x.id === id); if (r) { r.enabled = !r.enabled; saveState(); renderRemindersUI(); } }
function deleteReminder(id) { state.reminders = state.reminders.filter((x) => x.id !== id); saveState(); renderRemindersUI(); }

function renderRemindersUI() {
  const el = document.getElementById('remindersList');
  if (!el) return;
  const typeLabels = { revision: 'مراجعة المحفوظ', new: 'حفظ جديد / تسميع', solid: 'صندوق التثبيت' };
  el.innerHTML = state.reminders.length === 0
    ? '<div class="empty-state">لا توجد مواعيد تذكير مفعّلة حالياً.</div>'
    : state.reminders.map((r) => `
      <div class="log-item">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
            <strong style="font-size:0.95rem; color:var(--accent-hi);">🔔 ${r.time}</strong>
            <span class="tag tag-gold">${typeLabels[r.type] || r.type}</span>
            ${r.enabled ? '<span class="tag tag-success">مفعّل</span>' : '<span class="tag tag-danger">متوقف</span>'}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">معاينة: «${escapeHtml(buildSmartMessage(r.type))}»</div>
        </div>
        <div style="display:flex; gap:5px;">
          <button type="button" class="btn btn-ghost btn-sm" onclick="toggleReminder('${r.id}')">${r.enabled ? 'إيقاف' : 'تفعيل'}</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteReminder('${r.id}')">حذف</button>
        </div>
      </div>`).join('');
}

function requestNotifPermission(silent = false) {
  if (!('Notification' in window)) { if (!silent) showToast('استخدم زر «إضافة للتقويم (.ics)» للتنبيه الموثوق'); return; }
  Notification.requestPermission().then((res) => {
    if (!silent) showToast(res === 'granted' ? 'تم تفعيل إشعارات الجهاز بنجاح ✓' : 'ستظهر التذكيرات داخل التطبيق، ويمكنك تصدير (.ics)');
  }).catch((e) => console.warn(e));
}

function testSmartNotification() {
  const msg = buildSmartMessage(state.reminders[0] ? state.reminders[0].type : 'solid');
  sendSafeSystemNotification('رفيق التثبيت', msg).then((sent) => showToast(sent ? 'تم إرسال إشعار تجريبي على جهازك 🔔' : msg));
}

function exportRemindersIcs() {
  const active = state.reminders.filter((r) => r.enabled);
  const list = active.length > 0 ? active : [{ time: document.getElementById('remTimeInput').value || '09:00', type: document.getElementById('remTypeInput').value || 'revision' }];
  const todayCompact = todayStr().replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rafiq Al-Tathbit//v7.2//AR', 'CALSCALE:GREGORIAN'];
  list.forEach((r, idx) => {
    const [hh, mm] = (r.time || '09:00').split(':');
    const startDT = `${todayCompact}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
    const endH = String(Math.min(23, Number(hh) + (Number(mm) + 15 >= 60 ? 1 : 0))).padStart(2, '0');
    const endM = String((Number(mm) + 15) % 60).padStart(2, '0');
    const summary = r.type === 'solid' ? 'رفيق التثبيت — صندوق التثبيت' : (r.type === 'new' ? 'رفيق التثبيت — الحفظ الجديد' : 'رفيق التثبيت — مراجعة المحفوظ');
    lines.push('BEGIN:VEVENT', `UID:rafiq-${todayCompact}-${idx}@rafiq.local`, `DTSTAMP:${todayCompact}T000000Z`, `DTSTART:${startDT}`, `DTEND:${todayCompact}T${endH}${endM}00`, 'RRULE:FREQ=DAILY', `SUMMARY:${summary}`, `DESCRIPTION:${buildSmartMessage(r.type).replace(/\n/g, ' ')}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${summary}`, 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `rafiq_reminders_${todayStr()}.ics`; a.click();
  URL.revokeObjectURL(url);
  showToast('تم تحميل ملف التقويم (.ics) — افتحه لإضافة التذكير اليومي لتقويم جهازك 📅');
}

function dismissReminderToday(id) {
  const r = state.reminders.find((x) => x.id === id);
  if (r) { r.lastTriggeredDate = todayStr(); saveState(); renderPriorityBanners(); }
}

function checkDueRemindersNow() {
  if (!state.onboarded || !state.reminders.length) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = todayStr();
  let notifiedAny = false;
  state.reminders.forEach((r) => {
    if (!r.enabled || r.lastTriggeredDate === today) return;
    const [rh, rm] = (r.time || '09:00').split(':').map(Number);
    const remMin = rh * 60 + rm;
    const elapsedMin = nowMin - remMin;
    if (elapsedMin >= 0) {
      // B5: إشعار النظام يُرسل فقط خلال ساعتين من الموعد، وما بعدها بانر داخلي فقط
      if (elapsedMin <= 120 && r.lastNotifiedDate !== today) {
        r.lastNotifiedDate = today;
        notifiedAny = true;
        sendSafeSystemNotification('رفيق التثبيت', buildSmartMessage(r.type));
      }
      renderPriorityBanners();
    }
  });
  if (notifiedAny) saveState();
}
setInterval(checkDueRemindersNow, 45000);

// ================= REAL-TIME TIMER (Date.now + WAKE LOCK + DYNAMIC TOAST) =================
const TIMER_MODES = {
  doctor: {
    total: 12 * 60,
    phases: [
      { start: 0, end: 120, name: 'المرحلة ١: الكشف بالقلم الرصاص', hint: 'اقرأ الوجه نظراً بصوت مسموع وعلّم على الآيات المتفلتة فقط (دقيقتان)' },
      { start: 120, end: 420, name: 'المرحلة ٢: تقوية الآيات المتفلتة فقط', hint: 'كرّر كل آية معلّم عليها ٥ مرات واربطها بما قبلها وما بعدها (٥ دقائق)' },
      { start: 420, end: 600, name: 'المرحلة ٣: الاختبار الغيبي والتصحيح السريع', hint: 'سمّع الوجه غيباً ولا ترجع للبداية لو وقفت — صحّح وأكمل (٣ دقائق)' },
      { start: 600, end: 720, name: 'المرحلة ٤: القفلة النظيفة', hint: 'تسميعة أخيرة متصلة من أول الوجه لآخره ثم انتقل للوجه التالي (دقيقتان)' }
    ]
  },
  link: { total: 6 * 60, phases: [{ start: 0, end: 360, name: 'تثبيت الجديد — ربط المقاطع', hint: 'اسرد مقاطعك الجديدة متصلة مع التركيز على نهايات وبدايات الأوجه (٦ دقائق)' }] },
  solid: { total: 10 * 60, phases: [{ start: 0, end: 600, name: 'تثبيت القديم — سرد سريع', hint: 'اقرأ ٤ إلى ٥ أوجه غيباً بسرعة متوازنة لتنشيط الذاكرة طويلة المدى (١٠ دقائق)' }] }
};

let timerMode = 'doctor', timerRemaining = TIMER_MODES.doctor.total, timerEndAt = null, timerInterval = null, lastPhaseIdx = 0;
let sharedAudioCtx = null, wakeLockSentinel = null;

function ensureAudioContext() {
  try {
    if (!sharedAudioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) sharedAudioCtx = new AC(); }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
  } catch (e) { console.warn(e); }
}

function playChime() {
  const toggle = document.getElementById('timerSoundToggle');
  if (toggle && !toggle.checked) return;
  try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
  try {
    ensureAudioContext(); if (!sharedAudioCtx) return;
    const osc = sharedAudioCtx.createOscillator(), gain = sharedAudioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(528, sharedAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(792, sharedAudioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.65);
    osc.connect(gain); gain.connect(sharedAudioCtx.destination);
    osc.start(); osc.stop(sharedAudioCtx.currentTime + 0.65);
  } catch (e) { console.warn(e); }
}

async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      const lbl = document.getElementById('wakeLockStatus');
      if (lbl) lbl.textContent = 'الشاشة مضاءة ✓ (نغمة النهاية تتطلب بقاء الشاشة مفتوحة)';
      wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
    }
  } catch (e) { console.warn(e); }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {}); wakeLockSentinel = null;
    const lbl = document.getElementById('wakeLockStatus'); if (lbl) lbl.textContent = '';
  }
}

function openTimerModal(mode = 'doctor') { if (!timerInterval) setTimerMode(mode); openModal('timerModal'); }

function setTimerMode(mode) {
  clearInterval(timerInterval); timerInterval = null; timerEndAt = null; releaseWakeLock();
  timerMode = mode; timerRemaining = TIMER_MODES[mode].total; lastPhaseIdx = 0;
  document.getElementById('modeDoctor').classList.toggle('active', mode === 'doctor');
  document.getElementById('modeLink').classList.toggle('active', mode === 'link');
  document.getElementById('modeSolid').classList.toggle('active', mode === 'solid');
  document.getElementById('doctorPhasePills').style.display = mode === 'doctor' ? 'grid' : 'none';
  document.getElementById('timerDoneActionWrap').style.display = 'none';
  document.getElementById('timerStartBtn').textContent = 'ابدأ الجلسة';
  renderTimer();
}

function updateTimerDoneActionUI() {
  const wrap = document.getElementById('timerDoneActionWrap');
  const btn = document.getElementById('timerDoneActionBtn');
  if (!wrap || !btn) return;
  if (timerMode === 'doctor') {
    const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
    if (curRev) { btn.textContent = `اعتماد الوجه (+١ وجه في ${curRev.title}) ✓`; wrap.style.display = 'block'; }
    else { wrap.style.display = 'none'; }
  } else if (timerMode === 'link') {
    btn.textContent = 'تقييم ربط السورة في صندوق التثبيت ✓'; wrap.style.display = 'block';
  } else {
    btn.textContent = 'تقييم مراجعة جزء من صندوق التثبيت ✓'; wrap.style.display = 'block';
  }
}

function tickTimer() {
  if (!timerEndAt) return;
  const secsLeft = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
  timerRemaining = secsLeft;
  if (secsLeft <= 0) {
    clearInterval(timerInterval); timerInterval = null; timerEndAt = null; releaseWakeLock();
    document.getElementById('timerStartBtn').textContent = 'ابدأ من جديد';
    updateTimerDoneActionUI();
    playChime();
    const doneMsg = timerMode === 'doctor' ? 'انتهت جلسة مراجعة الوجه! يمكنك اعتماده الآن ✓'
      : (timerMode === 'link' ? 'انتهت جلسة ربط الجديد! يمكنك تقييمها في صندوق التثبيت ✓' : 'انتهت جلسة تثبيت القديم! بارك الله في وقتك ✓');
    sendSafeSystemNotification('رفيق التثبيت', doneMsg);
    showToast(doneMsg);
  }
  renderTimer();
}

function toggleTimer() {
  ensureAudioContext();
  if (timerInterval) {
    tickTimer(); clearInterval(timerInterval); timerInterval = null; timerEndAt = null; releaseWakeLock();
    document.getElementById('timerStartBtn').textContent = 'استكمال';
  } else {
    if (timerRemaining <= 0) timerRemaining = TIMER_MODES[timerMode].total;
    document.getElementById('timerDoneActionWrap').style.display = 'none';
    timerEndAt = Date.now() + timerRemaining * 1000;
    document.getElementById('timerStartBtn').textContent = 'إيقاف مؤقت';
    acquireWakeLock();
    timerInterval = setInterval(tickTimer, 500);
    tickTimer();
  }
}

function resetTimer() {
  clearInterval(timerInterval); timerInterval = null; timerEndAt = null; releaseWakeLock();
  timerRemaining = TIMER_MODES[timerMode].total; lastPhaseIdx = 0;
  document.getElementById('timerDoneActionWrap').style.display = 'none';
  document.getElementById('timerStartBtn').textContent = 'ابدأ الجلسة';
  renderTimer();
}

function approveTimerPage() {
  document.getElementById('timerDoneActionWrap').style.display = 'none';
  closeModal('timerModal');
  if (timerMode === 'doctor') { quickAddRevPage(); }
  else if (timerMode === 'link') {
    const dueLink = getDueItems().find((i) => i.kind === 'new');
    const firstGroup = state.newLinkingGroups.find((g) => !g.archived);
    if (dueLink) openSrReviewModal('new', dueLink.id, dueLink.title, dueLink.overdueDays);
    else if (firstGroup) openSrReviewModal('new', firstGroup.id, firstGroup.surahName, 0);
    else { switchTab('solid'); setSolidTab('new'); }
  } else {
    const dueOld = getDueItems().find((i) => i.kind === 'old');
    const firstComp = state.juzList.find((j) => j.donePages >= j.totalPages - 0.01);
    if (dueOld) openSrReviewModal('old', dueOld.id, dueOld.title, dueOld.overdueDays);
    else if (firstComp) openSrReviewModal('old', firstComp.num, firstComp.title, 0);
    else { switchTab('solid'); setSolidTab('old'); }
  }
}

function renderTimer() {
  const mins = String(Math.floor(timerRemaining / 60)).padStart(2, '0');
  const secs = String(timerRemaining % 60).padStart(2, '0');
  document.getElementById('timerClock').textContent = `${mins}:${secs}`;
  const cfg = TIMER_MODES[timerMode];
  const elapsed = cfg.total - timerRemaining;
  let pIdx = cfg.phases.findIndex((p) => elapsed >= p.start && elapsed < p.end);
  if (pIdx === -1) pIdx = cfg.phases.length - 1;
  if (timerInterval && pIdx !== lastPhaseIdx) { lastPhaseIdx = pIdx; playChime(); }
  const phase = cfg.phases[pIdx];
  document.getElementById('timerPhaseName').textContent = phase.name;
  document.getElementById('timerPhaseHint').textContent = phase.hint;
  if (timerMode === 'doctor') {
    document.querySelectorAll('#doctorPhasePills .phase-pill').forEach((el, i) => {
      el.classList.remove('current', 'passed');
      if (i < pIdx) el.classList.add('passed');
      else if (i === pIdx) el.classList.add('current');
    });
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (timerInterval && timerEndAt) { tickTimer(); acquireWakeLock(); }
    checkDueRemindersNow();
  }
});
window.addEventListener('focus', checkDueRemindersNow);

// ================= CALCULATOR, SHEIKH REPORT, BACKUP & PWA =================
function updateCalculator() {
  const isKhatim = state.profile.mode === 'khatim';
  const newBlock = document.getElementById('calcNewPagesBlock');
  if (newBlock) newBlock.style.display = isKhatim ? 'none' : 'block';
  const sessionsPerWeek = state.profile.studyStyle === 'maqraa' ? Math.max(1, (state.profile.maqraaDays || []).length) : 2;
  const sessLbl = document.getElementById('calcSessionsLabel');
  if (sessLbl) sessLbl.textContent = `مقدار الجديد في الجلسة (${sessionsPerWeek} جلسات/أسبوع)`;

  const daily = parseInt(document.getElementById('calcDailyMin').value, 10) || 45;
  const nps = isKhatim ? 0 : (isNaN(parseFloat(document.getElementById('calcNewPages').value)) ? 1 : parseFloat(document.getElementById('calcNewPages').value));
  state.calcDailyMin = daily; state.calcNewPages = nps;

  document.getElementById('calcMinVal').textContent = `${daily} دقيقة (${daily * 7} د/أسبوع)`;
  document.getElementById('calcNewPagesVal').textContent = `${nps} وجه/جلسة (${formatNum(nps * sessionsPerWeek)} وجه/أسبوع)`;

  const weeklyTotal = daily * 7;
  const newMin = nps * sessionsPerWeek * 45;
  const revPool = Math.max(0, weeklyTotal - newMin);
  const restoreMin = revPool * 0.75, solidMin = revPool * 0.25;
  const netRevPages = restoreMin / 15;
  const remRevPages = state.juzList.filter((j) => j.track === 'revision').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);
  const remNewPages = state.juzList.filter((j) => j.track === 'new').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);

  document.getElementById('calcRevWeek').textContent = netRevPages > 0 ? `${netRevPages.toFixed(1)} وجه` : '0 وجه';
  document.getElementById('calcWeeksJuz').textContent = netRevPages >= 0.5 ? `${(20 / netRevPages).toFixed(1)} أسبوع` : 'متوقف';
  document.getElementById('calcOldMonths').textContent = remRevPages <= 0 ? 'مكتمل ✓' : (netRevPages >= 0.5 ? `${(remRevPages / (netRevPages * 4.33)).toFixed(1)} شهر` : '—');
  document.getElementById('calcNewMonths').textContent = (isKhatim || remNewPages <= 0) ? 'مكتمل ✓' : (nps > 0 ? `${(remNewPages / (nps * sessionsPerWeek * 4.33)).toFixed(1)} شهر` : 'متوقف');

  const denom = Math.max(weeklyTotal, newMin) || 1;
  document.getElementById('calcDistBar').innerHTML = `<div style="width:${(Math.min(newMin, weeklyTotal) / denom) * 100}%; background:var(--info);"></div><div style="width:${(restoreMin / denom) * 100}%; background:var(--accent-grad);"></div><div style="width:${(solidMin / denom) * 100}%; background:var(--success);"></div>`;
  document.getElementById('calcDistLegend').innerHTML = `<span><i class="dot" style="background:var(--info)"></i>الجديد: ${Math.round(newMin)} د</span><span><i class="dot" style="background:var(--accent-mid)"></i>المراجعة: ${Math.round(restoreMin)} د</span><span><i class="dot" style="background:var(--success)"></i>التثبيت: ${Math.round(solidMin)} د</span>`;
  document.getElementById('calcModeBadge').textContent = weeklyTotal < newMin ? 'عجز وقت' : (netRevPages < 3 ? 'حماية فقط' : (netRevPages < 8 ? 'متوازن' : 'إنجاز سريع'));
  document.getElementById('calcAdviceBox').innerHTML = weeklyTotal < newMin ? '⚠️ وقتك اليومي أقل من المطلوب للجديد — قلّل مقدار الجديد أو زوّد الوقت اليومي.' : (netRevPages < 3 ? '🛡️ وضع الحماية: ركّز على تثبيت ما في صندوق التثبيت.' : '⚖️ إيقاع متوازن ومستقر يجمع بين التقدم في الجديد ومراجعة القديم.');
}

// تقرير أسبوعي جاهز للمشاركة مع الشيخ أو المعلّم (C5)
function shareSheikhReport() {
  const name = state.profile.name || 'طالب القرآن';
  const totalPages = state.juzList.reduce((s, j) => s + j.totalPages, 0) || 604;
  const donePages = state.juzList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const recentLogs = state.maqraaLogs.slice(0, 5).map((l) => `- ${l.surahName} (${l.passage}): ${l.rating}${l.note ? ` [${l.note}]` : ''}`).join('\n');
  const weakList = [];
  Object.keys(state.solidMeta).forEach((k) => {
    const m = state.solidMeta[k];
    if (m && ((m.weakSurahs && m.weakSurahs.length) || (m.weakPages && m.weakPages.length))) {
      weakList.push(`الجزء ${k}: ${(m.weakSurahs || []).join('، ')} ${(m.weakPages || []).map((p) => 'ص ' + p).join('، ')}`.trim());
    }
  });
  const text = [
    `📋 تقرير أسبوعي — رفيق التثبيت`,
    `الاسم: ${name} | التاريخ: ${todayStr()}`,
    `إجمالي الإنجاز: ${formatNum(donePages)} / ${totalPages} وجهاً (${Math.round(donePages / totalPages * 100)}%)`,
    `سلسلة الالتزام: ${state.streak.count} أيام`,
    recentLogs ? `\nآخر حصص التسميع:\n${recentLogs}` : '',
    weakList.length ? `\nمواضع تحتاج تقوية:\n- ${weakList.join('\n- ')}` : ''
  ].filter(Boolean).join('\n');

  if (navigator.share) {
    navigator.share({ title: 'تقرير رفيق التثبيت الأسبوعي', text }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('تم نسخ تقرير الأسبوع — يمكنك لصقه للشيخ الآن ✓')).catch(() => showToast(text));
  } else {
    showToast('التقرير جاهز في السجل');
  }
}

function exportBackup() {
  state.lastBackupAt = todayStr(); saveState(); renderPriorityBanners();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `rafiq_altathbit_v7_${todayStr()}.json`; a.click();
  URL.revokeObjectURL(url);
  showToast('تم تحميل النسخة الاحتياطية (JSON) بنجاح ✓');
}

function shareBackup() {
  state.lastBackupAt = todayStr(); saveState();
  const file = new File([JSON.stringify(state, null, 2)], `rafiq_altathbit_v7_${todayStr()}.json`, { type: 'application/json' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ title: 'نسخة احتياطية — رفيق التثبيت', files: [file] }).catch(() => exportBackup());
  } else {
    exportBackup();
  }
}

function importBackup(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || (!Array.isArray(data.juzList) && !data.profile)) throw new Error('بنية الملف غير صالحة');
      if (!confirm('سيتم استبدال البيانات الحالية بمحتوى النسخة الاحتياطية (مع حفظ لقطة احتياطية تلقائية قبل ذلك). هل تريد المتابعة؟')) return;
      saveAutoSnapshot(state, 'قبل الاستيراد');
      corruptBackupKey = null;
      state = migrateState(data);
      syncPlanAndScheduleLive();
      applyTheme(state.profile.theme || 'royal', state.profile.customColors);
      saveState(); document.getElementById('onboardingOverlay').classList.remove('active');
      renderAll(); showToast('تمت استعادة بياناتك بالكامل بنجاح ✓');
    } catch (err) { console.warn('importBackup error:', err); showToast('الملف غير صالح — اختر ملف نسخة احتياطية لرفيق التثبيت'); }
  };
  reader.readAsText(file); e.target.value = '';
}

function restoreLastAutoSnapshot() {
  const snaps = getAutoSnapshots();
  if (!snaps.length) { showToast('لا توجد لقطات تلقائية محفوظة بعد'); return; }
  const latest = snaps[0];
  if (!confirm(`استعادة اللقطة المحفوظة بتاريخ ${latest.date} (${latest.reason})؟`)) return;
  corruptBackupKey = null;
  state = migrateState(latest.data);
  saveState(); renderAll(); showToast('تمت استعادة آخر لقطة تلقائية بنجاح ✓');
}

function importLegacyFromStorage() {
  const key = findLegacyStorageKey();
  if (!key) { showToast('لا توجد بيانات محفوظة من النسخ السابقة'); return; }
  try {
    saveAutoSnapshot(state, 'قبل استيراد نسخة سابقة');
    state = migrateState(JSON.parse(localStorage.getItem(key)));
    applyTheme(state.profile.theme, state.profile.customColors);
    saveState(); document.getElementById('onboardingOverlay').classList.remove('active');
    renderAll(); showToast('تم استيراد بياناتك السابقة وترقيتها بنجاح ✓');
  } catch (e) { console.warn(e); showToast('تعذّر قراءة بيانات النسخة السابقة'); }
}

function emergencyExportRaw() {
  const raw = localStorage.getItem(corruptBackupKey || STORAGE_KEY) || JSON.stringify(state);
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `rafiq_emergency_backup_${todayStr()}.json`; a.click();
  URL.revokeObjectURL(url);
}

function openResetConfirmModal() {
  document.getElementById('resetConfirmInput').value = '';
  document.getElementById('confirmResetBtn').disabled = true;
  openModal('resetConfirmModal');
}

function executeResetAllData() {
  saveAutoSnapshot(state, 'قبل المسح الكامل');
  localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(OB_DRAFT_KEY);
  corruptBackupKey = null; state = getEmptyState();
  closeModal('resetConfirmModal'); openOnboarding(false);
  showToast('تم مسح البيانات — يمكنك بدء إعداد جديد الآن');
}

// Offline / Online + Smart PWA Install
function updateOnlineStatus() {
  const b = document.getElementById('offlineBanner');
  if (b) b.classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

let deferredPrompt = null;
function isRunningStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function dismissInstallBar() {
  try { localStorage.setItem('rafiq_install_bar_dismissed', '1'); } catch (e) {}
  renderPriorityBanners();
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; renderPriorityBanners(); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; renderPriorityBanners(); showToast('تم تثبيت «رفيق التثبيت» على هاتفك بنجاح ✓'); });

function handleSmartInstall() {
  if (isRunningStandalone()) { showToast('التطبيق مثبّت بالفعل على جهازك ✓'); return; }
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; renderPriorityBanners(); }); return; }
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isInApp = /FBAN|FBAV|Instagram|WhatsApp|Telegram|Line|Snapchat/i.test(ua);
  document.getElementById('installGuideBody').innerHTML = isInApp
    ? `<div class="calc-preview-card" style="margin-top:0;"><strong>أنت تفتح الرابط من متصفح داخلي (واتساب/تليجرام)</strong></div><ol style="padding-right:20px; font-size:0.86rem; line-height:1.9;"><li>اضغط الثلاث نقاط <strong>(⋮)</strong> أعلى الشاشة.</li><li>اختر <strong>«فتح في Chrome»</strong> (أو Safari على آيفون).</li><li>اضغط زر <strong>«تثبيت»</strong> لإضافته لشاشة هاتفك.</li></ol>`
    : (isIOS
      ? `<div class="calc-preview-card" style="margin-top:0;"><strong>تثبيت التطبيق على آيفون (Safari)</strong></div><ol style="padding-right:20px; font-size:0.86rem; line-height:1.9;"><li>اضغط زر <strong>المشاركة</strong> (المربع الذي فيه سهم لأعلى) أسفل الشاشة.</li><li>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> ثم <strong>«إضافة»</strong>.</li></ol>`
      : `<div class="calc-preview-card" style="margin-top:0;"><strong>تثبيت التطبيق على أندرويد أو الكمبيوتر</strong></div><ol style="padding-right:20px; font-size:0.86rem; line-height:1.9;"><li>اضغط قائمة المتصفح <strong>(⋮)</strong> أعلى الشاشة.</li><li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li></ol>`);
  openModal('installGuideModal');
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW register failed:', err));
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        const up = document.getElementById('swUpdateBanner');
        if (up) up.classList.add('show');
      }
    });
  });
}

window.onerror = function (msg) {
  console.warn('Global error caught:', msg);
  const fb = document.getElementById('fatalErrorFallback');
  if (fb) fb.style.display = 'block';
};

window.RafiqCore = {
  APP_VERSION, formatLocalDate, todayStr, addDaysStr, diffDaysFromToday,
  computeSM2, recomputeJuzProgress, applyPagesAcrossJuzs, migrateState, normalizeV7State,
  buildPersonalizedPlan, buildLiveSchedule, resolveActiveRevJuz, resolveActiveNewSurah,
  estimatePagesFromAyahs, getSurahJuzForLoggedPages
};

// ================= BOOT =================
updateOnlineStatus();
applyTheme(state.profile.theme || 'royal', state.profile.customColors);
if (!state.onboarded) {
  openOnboarding(false);
} else {
  document.getElementById('calcDailyMin').value = state.calcDailyMin || state.profile.dailyMin || 45;
  document.getElementById('calcNewPages').value = state.calcNewPages ?? state.profile.pagesPerSession ?? 1;
  renderAll();
  renderTimer();
}
