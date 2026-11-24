// ==========================================================================
// رفيق التثبيت v7 — محرك الخطة الحية، SM-2-lite، سلامة البيانات، وإمكانية الوصول
// ==========================================================================

const STORAGE_KEY = 'rafiq_altathbit_v7';
const LEGACY_KEYS = ['rafiq_altathbit_v6', 'rafiq_altathbit_smart_v5', 'rafiq_altathbit_khatma_v4'];
const SNAPSHOTS_KEY = 'rafiq_altathbit_v7_snapshots';
const OB_DRAFT_KEY = 'rafiq_altathbit_v7_ob_draft';

const CUSTOM_CSS_VARS = [
  '--bg-deep', '--bg-grad-1', '--bg-grad-2', '--bg-card', '--bg-card-end',
  '--bg-card-2', '--bg-hero-start', '--bg-hero-end', '--bg-header', '--bg-nav',
  '--bg-input', '--bg-surface', '--bg-surface-strong', '--border-subtle',
  '--accent-hi', '--accent-mid', '--accent-deep', '--accent-grad',
  '--accent-soft', '--accent-border', '--accent-border-strong',
  '--btn-primary-text', '--text-main', '--text-muted', '--text-dim',
  '--ring-track', '--shadow-card'
];

// ================= 1. LOCAL DATE ENGINE (ZERO UTC BUGS) =================
function formatLocalDate(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr() {
  return formatLocalDate(new Date());
}

function parseLocalDate(str) {
  const parts = String(str || todayStr()).split('-').map(Number);
  return new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1, 12, 0, 0);
}

function addDaysStr(baseStr, days) {
  const d = parseLocalDate(baseStr);
  d.setDate(d.getDate() + Number(days || 0));
  return formatLocalDate(d);
}

function diffDaysFromToday(targetDateStr, refTodayStr) {
  if (!targetDateStr) return 0;
  const a = parseLocalDate(refTodayStr || todayStr());
  const b = parseLocalDate(targetDateStr);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatNum(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function escapeAttr(str) { return escapeHtml(str); }

// ================= 2. SM-2-LITE SPACED REPETITION ENGINE =================
function computeSM2(prevMeta, rating, overdueDays = 0) {
  const cfg = SR_CONFIG;
  let ease = Number(prevMeta && prevMeta.ease) || cfg.defaultEase;
  let prevInterval = Number(prevMeta && prevMeta.intervalDays) || 1;
  let reps = Number(prevMeta && prevMeta.reps) || 0;
  let lapses = Number(prevMeta && prevMeta.lapses) || 0;

  let nextInterval = 1;
  const effectivePrev = (overdueDays > 0 && (rating === 'جيد جداً' || rating === 'ممتاز'))
    ? prevInterval + Math.floor(overdueDays / 2)
    : prevInterval;

  if (rating === 'يحتاج إعادة') {
    nextInterval = 1;
    ease = Math.max(cfg.minEase, Number((ease - 0.2).toFixed(2)));
    lapses += 1;
    reps = 0;
  } else if (rating === 'جيد') {
    nextInterval = Math.max(2, Math.round(prevInterval * 1.2));
    ease = Math.max(cfg.minEase, Number((ease - 0.05).toFixed(2)));
    reps += 1;
  } else if (rating === 'جيد جداً') {
    nextInterval = reps === 0 ? 4 : Math.max(3, Math.round(effectivePrev * ease));
    reps += 1;
  } else {
    // ممتاز
    nextInterval = reps === 0 ? 7 : Math.max(5, Math.round(effectivePrev * ease * 1.3));
    ease = Math.min(cfg.maxEase, Number((ease + 0.1).toFixed(2)));
    reps += 1;
  }

  nextInterval = Math.max(cfg.minIntervalDays, Math.min(cfg.maxIntervalDays, nextInterval));
  return { intervalDays: nextInterval, ease, reps, lapses };
}

// ================= 3. SINGLE SOURCE OF TRUTH FOR JUZ PROGRESS =================
function recomputeJuzProgress(j) {
  if (!j) return 0;
  const surahs = Array.isArray(j.surahs) ? j.surahs : [];
  const surahDonePages = surahs.reduce((sum, s) => sum + (s.done ? Number(s.pages || 0) : 0), 0);
  const basePages = Number(j.basePages || 0);
  const loggedPages = Number(j.loggedPages || 0);
  const allSurahsDone = surahs.length > 0 && surahs.every((s) => s.done);
  if (allSurahsDone && loggedPages >= 0) {
    j.donePages = j.totalPages;
    return j.donePages;
  }
  const combined = basePages + surahDonePages + loggedPages;
  j.donePages = Math.max(0, Math.min(j.totalPages, Number(combined.toFixed(2))));
  return j.donePages;
}

// ================= 4. COLOR & CONTRAST ENGINE =================
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
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function clearCustomCssVars() {
  const root = document.documentElement;
  CUSTOM_CSS_VARS.forEach((v) => root.style.removeProperty(v));
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
    '--bg-card': bgCard,
    '--bg-card-end': bgCardEnd,
    '--bg-card-2': bgCard2,
    '--bg-hero-start': bgHeroStart,
    '--bg-hero-end': bgHeroEnd,
    '--bg-header': rgbaStr(bgHex, 0.94),
    '--bg-nav': rgbaStr(isDark ? mixHex('#000000', bgHex, 0.15) : bgCard, 0.97),
    '--bg-input': bgInput,
    '--bg-surface': rgbaStr(textMain, 0.045),
    '--bg-surface-strong': rgbaStr(isDark ? '#000000' : textMain, isDark ? 0.44 : 0.07),
    '--border-subtle': rgbaStr(textMain, 0.18),
    '--accent-hi': accentHi,
    '--accent-mid': accentMid,
    '--accent-deep': accentDeep,
    '--accent-grad': `linear-gradient(135deg, ${accentHi} 0%, ${accentMid} 55%, ${accentDeep} 100%)`,
    '--accent-soft': rgbaStr(safeAccent, isDark ? 0.15 : 0.11),
    '--accent-border': rgbaStr(safeAccent, isDark ? 0.30 : 0.24),
    '--accent-border-strong': rgbaStr(accentHi, 0.56),
    '--btn-primary-text': btnPrimaryText,
    '--text-main': textMain,
    '--text-muted': textMuted,
    '--text-dim': textDim,
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

// ================= 5. STATE, SAFE STORAGE & MIGRATION (v4/v5/v6 -> v7) =================
function getEmptyState() {
  return {
    version: 7,
    onboarded: false,
    welcomeDismissed: false,
    simpleMode: false,
    progressExpanded: false,
    lastBackupAt: '',
    profile: {
      name: '',
      theme: 'royal',
      customColors: { bg: '#00112B', accent: '#D0A151' },
      mode: 'from_nas',
      stopSurahNum: 78,
      stopSurahCompleted: false,
      beginnerDir: 'from_nas',
      khatimStart: 'from_baqarah',
      khatimSpecificJuz: [1, 2, 3],
      scatteredSurahs: [],
      scatteredContinue: 'org_nas',
      revStartMode: 'auto',
      revStartJuz: 30,
      stability: 'weak',
      dailyMin: 45,
      studyStyle: 'solo',
      maqraaDays: ['mon', 'thu'],
      pagesPerSession: 1
    },
    activeRevJuzNum: null,
    activeNewSurahNum: null,
    surahNewProgress: {},
    juzList: [],
    schedule: [],
    weekArchives: [],
    solidMeta: {},
    activeWird: null,
    maqraaLogs: [],
    newLinkingGroups: [],
    reminders: [],
    busyDayDate: '',
    busyTasksDone: { t1: false, t2: false },
    streak: { count: 0, lastDate: '', graceUsedDate: '' },
    mapFilter: 'revision',
    solidSubTab: 'new',
    expandedJuz: {},
    calcDailyMin: 45,
    calcNewPages: 1
  };
}

let corruptBackupKey = null;
let storageQuotaWarning = false;
let editingDayId = null;
let selectedRating = '';
let selectedSrRating = '';
let selectedWeakPages = [];
let srTarget = null;
let surahSearchQuery = '';
let quickFocusSearch = '';
let newWirdFormOpen = false;
let obShowRevStartPicker = false;
let lastFocusBeforeModal = null;

let obDraft = {
  step: 1,
  isEditing: false,
  theme: 'royal',
  customColors: { bg: '#00112B', accent: '#D0A151' },
  mode: 'from_nas',
  stopSurahNum: 78,
  stopSurahCompleted: false,
  beginnerDir: 'from_nas',
  khatimStart: 'from_baqarah',
  khatimSpecificJuz: [1, 2, 3],
  scatteredSurahs: [],
  scatteredContinue: 'org_nas',
  revStartMode: 'auto',
  revStartJuz: 30,
  stability: 'weak',
  dailyMin: 45,
  studyStyle: 'solo',
  maqraaDays: ['mon', 'thu'],
  pagesPerSession: 1,
  remEnabled: false
};

// ترحيل آمن من أي نسخة سابقة (v4 / v5 / v6) إلى v7 دون فقدان أي تقدم أو مواعيد مراجعة
function migrateState(old) {
  const today = todayStr();
  const base = getEmptyState();
  if (!old || typeof old !== 'object') return base;

  const oldProfile = old.profile || {};
  const oldJuzMap = {};
  (old.juzList || []).forEach((j) => { oldJuzMap[j.num] = j; });

  const dir = oldProfile.mode === 'from_baqarah' ? 'from_baqarah' : 'from_nas';
  const ordered = (old.juzList && old.juzList.length === 30)
    ? old.juzList.map((j) => JUZ_DB.find((x) => x.num === j.num)).filter(Boolean)
    : (dir === 'from_baqarah' ? [...JUZ_DB].sort((a, b) => a.num - b.num) : [...JUZ_DB].sort((a, b) => b.num - a.num));

  const juzList = ordered.map((jRaw) => {
    const prev = oldJuzMap[jRaw.num];
    const jSurahs = getJuzSurahs(jRaw.num);
    const jSurahsOrd = dir === 'from_nas' ? [...jSurahs].reverse() : [...jSurahs];
    const prevDonePages = prev ? Math.min(jRaw.totalPages, Number(prev.donePages) || 0) : 0;
    const isComplete = prevDonePages >= jRaw.totalPages - 0.01;
    const prevSurahDoneMap = {};
    ((prev && prev.surahs) || []).forEach((s) => {
      if (s.done) prevSurahDoneMap[s.num || s.name] = true;
    });
    const jTrack = prev ? (prev.track || 'revision') : 'revision';

    const surahs = jSurahsOrd.map((s) => {
      const prevMatch = prev && prev.surahs ? prev.surahs.find((ps) => ps.num === s.num || ps.name === s.name) : null;
      return {
        num: s.num,
        name: s.name,
        pages: getSurahPagesInJuz(s, jRaw),
        track: prevMatch && prevMatch.track ? prevMatch.track : jTrack,
        wasMemorized: prevMatch ? !!prevMatch.wasMemorized : (jTrack === 'revision'),
        done: isComplete || !!prevSurahDoneMap[s.num] || !!prevSurahDoneMap[s.name]
      };
    });

    const surahDoneSum = surahs.reduce((sum, s) => sum + (s.done ? s.pages : 0), 0);
    const basePages = prev ? Number(prev.basePages || 0) : 0;
    const loggedPages = prev && typeof prev.loggedPages === 'number'
      ? prev.loggedPages
      : Math.max(0, Number((prevDonePages - Math.max(basePages, surahDoneSum)).toFixed(2)));

    const juzObj = {
      num: jRaw.num,
      title: jRaw.title,
      range: jRaw.range,
      totalPages: jRaw.totalPages,
      track: jTrack,
      phase: prev ? (prev.phase || 'مسار المراجعة') : 'مسار المراجعة',
      donePages: prevDonePages,
      basePages,
      loggedPages,
      tags: Array.isArray(prev && prev.tags) ? prev.tags : [],
      surahs,
      note: prev ? (prev.note || '') : ''
    };
    recomputeJuzProgress(juzObj);
    return juzObj;
  });

  const solidMeta = {};
  if (old.solidMeta) {
    Object.keys(old.solidMeta).forEach((k) => {
      const m = old.solidMeta[k];
      solidMeta[k] = {
        reviews: m.reviews || 0,
        reps: typeof m.reps === 'number' ? m.reps : (m.reviews || 0),
        lapses: m.lapses || 0,
        ease: Number(m.ease) || SR_CONFIG.defaultEase,
        lastReviewed: m.lastReviewed || today,
        rating: m.rating || '',
        intervalDays: m.intervalDays || 4,
        nextReviewDate: m.nextReviewDate || addDaysStr(m.lastReviewed || today, m.intervalDays || 4),
        weakPages: Array.isArray(m.weakPages) ? m.weakPages : [],
        addedAt: m.addedAt || today
      };
    });
  }

  const newLinkingGroups = (old.newLinkingGroups || []).map((g) => ({
    ...g,
    reps: typeof g.reps === 'number' ? g.reps : (g.linkCount || 0),
    lapses: g.lapses || 0,
    ease: Number(g.ease) || SR_CONFIG.defaultEase,
    rating: g.rating || '',
    intervalDays: g.intervalDays || 4,
    nextReviewDate: g.nextReviewDate || addDaysStr(g.lastLinked || today, g.intervalDays || 4),
    tags: Array.isArray(g.tags) ? g.tags : []
  }));

  const profile = {
    ...base.profile,
    ...oldProfile,
    name: oldProfile.name || 'حافظ القرآن',
    theme: THEMES.some((t) => t.id === oldProfile.theme) || oldProfile.theme === 'custom' ? oldProfile.theme : 'royal',
    mode: ['from_nas', 'from_baqarah', 'beginner', 'khatim', 'scattered'].includes(oldProfile.mode)
      ? oldProfile.mode
      : (oldProfile.mode === 'custom' ? 'scattered' : 'from_nas'),
    dailyMin: oldProfile.dailyMin || old.calcDailyMin || 45,
    pagesPerSession: oldProfile.pagesPerSession || old.calcNewPages || 1
  };

  const actRev = resolveActiveRevJuz(juzList, old.activeRevJuzNum || null);
  const actNew = resolveActiveNewSurah(profile, juzList, old.activeNewSurahNum || null);

  return {
    ...base,
    version: 7,
    onboarded: true,
    welcomeDismissed: !!old.welcomeDismissed,
    simpleMode: !!old.simpleMode,
    lastBackupAt: old.lastBackupAt || today,
    profile,
    activeRevJuzNum: actRev ? actRev.num : null,
    activeNewSurahNum: actNew ? actNew.num : null,
    surahNewProgress: old.surahNewProgress || {},
    juzList,
    schedule: buildLiveSchedule(profile, juzList, actRev ? actRev.num : null, actNew ? actNew.num : null, old.schedule || null),
    weekArchives: old.weekArchives || [],
    solidMeta,
    activeWird: old.activeWird || null,
    maqraaLogs: old.maqraaLogs || [],
    newLinkingGroups,
    reminders: old.reminders || [],
    streak: {
      count: (old.streak && old.streak.count) || 0,
      lastDate: (old.streak && old.streak.lastDate) || '',
      graceUsedDate: (old.streak && old.streak.graceUsedDate) || ''
    },
    calcDailyMin: old.calcDailyMin || profile.dailyMin,
    calcNewPages: old.calcNewPages ?? profile.pagesPerSession
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.warn('Corrupt v7 JSON detected in localStorage:', parseErr);
        const backupKey = `${STORAGE_KEY}_corrupt_${Date.now()}`;
        try { localStorage.setItem(backupKey, raw); } catch (e2) { console.warn('Failed saving corrupt copy', e2); }
        corruptBackupKey = backupKey;
        return getEmptyState();
      }
      const empty = getEmptyState();
      const merged = {
        ...empty,
        ...parsed,
        profile: {
          ...empty.profile,
          ...(parsed.profile || {}),
          customColors: { ...empty.profile.customColors, ...((parsed.profile && parsed.profile.customColors) || {}) }
        },
        streak: { ...empty.streak, ...(parsed.streak || {}) },
        surahNewProgress: parsed.surahNewProgress || {},
        reminders: parsed.reminders || [],
        busyTasksDone: parsed.busyTasksDone || { t1: false, t2: false }
      };
      return merged;
    }

    // ترقية تلقائية صامتة وآمنة من v6 إذا وجدت
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

function saveAutoSnapshot(reason) {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const snap = {
      at: new Date().toISOString(),
      date: todayStr(),
      reason: reason || 'تلقائي',
      data: JSON.parse(JSON.stringify(state))
    };
    const filtered = list.filter((s) => !(reason === 'يومي' && s.date === snap.date));
    filtered.unshift(snap);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered.slice(0, 3)));
  } catch (e) {
    console.warn('saveAutoSnapshot failed:', e);
  }
}

function getAutoSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('getAutoSnapshots failed:', e);
    return [];
  }
}

function restoreLastAutoSnapshot() {
  const snaps = getAutoSnapshots();
  if (!snaps.length) { showToast('لا توجد لقطات تلقائية محفوظة بعد'); return; }
  const latest = snaps[0];
  if (!confirm(`استعادة اللقطة المحفوظة بتاريخ ${latest.date} (${latest.reason})؟`)) return;
  state = migrateState(latest.data);
  saveState();
  renderAll();
  showToast('تمت استعادة آخر لقطة تلقائية بنجاح ✓');
}

function saveState() {
  if (corruptBackupKey) return; // لا نكتب فوق بيانات تالفة حتى يقرّر المستخدم
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageQuotaWarning = false;
    // لقطة يومية تلقائية واحدة في اليوم
    const snaps = getAutoSnapshots();
    if (state.onboarded && (!snaps.length || snaps[0].date !== todayStr())) {
      saveAutoSnapshot('يومي');
    }
  } catch (e) {
    console.warn('saveState failed (quota or storage restricted):', e);
    storageQuotaWarning = true;
    showToast('تعذّر الحفظ في ذاكرة المتصفح — يُنصح بتصدير نسخة احتياطية الآن');
    renderStorageAlerts();
  }
}

function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch((e) => console.warn('storage.persist error:', e));
  }
}

// ================= 6. DIAGNOSTIC & ACTIVE-TARGET ENGINE =================
function getEffectiveDirection(profile) {
  if (profile.mode === 'from_nas') return 'from_nas';
  if (profile.mode === 'from_baqarah') return 'from_baqarah';
  if (profile.mode === 'beginner') return profile.beginnerDir || 'from_nas';
  if (profile.mode === 'khatim') return profile.khatimStart === 'from_nas' ? 'from_nas' : 'from_baqarah';
  if (profile.mode === 'scattered') return profile.scatteredContinue === 'org_baqarah' ? 'from_baqarah' : 'from_nas';
  return 'from_nas';
}

function getDiagnosedMemorizedSet(profile) {
  const set = new Set();
  if (profile.mode === 'khatim') { SURAHS_DB.forEach((s) => set.add(s.num)); return set; }
  if (profile.mode === 'beginner') return set;
  if (profile.mode === 'scattered') { (profile.scatteredSurahs || []).forEach((n) => set.add(Number(n))); return set; }
  const stop = Number(profile.stopSurahNum) || (profile.mode === 'from_nas' ? 114 : 1);
  const includeStop = profile.stopSurahCompleted === true;
  if (profile.mode === 'from_nas') {
    SURAHS_DB.forEach((s) => { if (s.num > stop || (includeStop && s.num === stop)) set.add(s.num); });
  } else if (profile.mode === 'from_baqarah') {
    SURAHS_DB.forEach((s) => { if (s.num < stop || (includeStop && s.num === stop)) set.add(s.num); });
  }
  return set;
}

function resolveActiveNewSurah(profile, juzList, preferredSurahNum) {
  if (profile.mode === 'khatim') return null;

  const isSurahDoneInMap = (num) => {
    if (!juzList || juzList.length !== 30) return false;
    const entries = [];
    juzList.forEach((j) => { (j.surahs || []).forEach((s) => { if (s.num === num) entries.push(s); }); });
    return entries.length > 0 && entries.every((e) => e.done);
  };

  if (preferredSurahNum) {
    const pref = getSurahByNum(preferredSurahNum);
    if (pref && !isSurahDoneInMap(pref.num)) return pref;
  }

  const dir = getEffectiveDirection(profile);
  const orderedAll = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];

  if (juzList && juzList.length === 30) {
    const surahStatus = new Map();
    juzList.forEach((j) => {
      (j.surahs || []).forEach((s) => {
        const cur = surahStatus.get(s.num) || { hasNew: false, allDone: true };
        if (s.track === 'new') cur.hasNew = true;
        if (!s.done) cur.allDone = false;
        surahStatus.set(s.num, cur);
      });
    });
    const nextNew = orderedAll.find((s) => {
      const st = surahStatus.get(s.num);
      return st && st.hasNew && !st.allDone;
    });
    if (nextNew) return nextNew;
  }

  const memSet = getDiagnosedMemorizedSet(profile);
  return orderedAll.find((s) => !memSet.has(s.num)) || null;
}

function resolveActiveRevJuz(juzList, preferredJuzNum) {
  if (!juzList || juzList.length === 0) return null;
  const revPending = juzList.filter((j) => j.track === 'revision' && j.donePages < j.totalPages - 0.01);
  if (revPending.length === 0) return null;
  if (preferredJuzNum) {
    const match = revPending.find((j) => j.num === Number(preferredJuzNum));
    if (match) return match;
  }
  return revPending[0];
}

function summarizeDiagnostic(profile) {
  const memSet = getDiagnosedMemorizedSet(profile);
  let memPages = 0;
  let completedJuzCount = 0;
  JUZ_DB.forEach((j) => {
    const jSurahs = getJuzSurahs(j.num);
    const inJuz = jSurahs.filter((s) => memSet.has(s.num));
    if (inJuz.length === jSurahs.length && jSurahs.length > 0) {
      completedJuzCount++;
      memPages += j.totalPages;
    } else {
      memPages += inJuz.reduce((sum, s) => sum + getSurahPagesInJuz(s, j), 0);
    }
  });
  memPages = Math.min(604, Number(memPages.toFixed(1)));
  const nextSurah = resolveActiveNewSurah(profile, null, null);
  return {
    memCount: memSet.size,
    memPages,
    completedJuzCount,
    remPages: Math.max(0, Number((604 - memPages).toFixed(1))),
    nextSurah
  };
}

function orderJuzForRevision(juzList, profile) {
  const revMode = profile.revStartMode || 'auto';
  const dir = getEffectiveDirection(profile);

  if (profile.mode === 'khatim' && profile.khatimStart === 'specific_juz') {
    const pNums = (profile.khatimSpecificJuz || []).map(Number);
    const pSet = new Set(pNums);
    const first = pNums.map((n) => juzList.find((j) => j.num === n)).filter(Boolean);
    const rest = juzList.filter((j) => !pSet.has(j.num));
    return [...first, ...rest];
  }

  const revJuzs = juzList.filter((j) => j.track === 'revision');
  const newJuzs = juzList.filter((j) => j.track === 'new');

  if (revMode === 'from_baqarah') revJuzs.sort((a, b) => a.num - b.num);
  else if (revMode === 'from_nas') revJuzs.sort((a, b) => b.num - a.num);
  else if (revMode === 'custom_juz' && profile.revStartJuz) {
    const startNum = Number(profile.revStartJuz);
    revJuzs.sort((a, b) => (dir === 'from_baqarah' ? a.num - b.num : b.num - a.num));
    const idx = revJuzs.findIndex((j) => j.num === startNum);
    if (idx > 0) {
      const rotated = [...revJuzs.slice(idx), ...revJuzs.slice(0, idx)];
      revJuzs.length = 0;
      revJuzs.push(...rotated);
    }
  } else {
    revJuzs.sort((a, b) => (dir === 'from_baqarah' ? a.num - b.num : b.num - a.num));
  }

  newJuzs.sort((a, b) => (dir === 'from_baqarah' ? a.num - b.num : b.num - a.num));
  return [...revJuzs, ...newJuzs];
}

function buildPersonalizedPlan(profile, prevSolidMeta = null) {
  const memSet = getDiagnosedMemorizedSet(profile);
  const dir = getEffectiveDirection(profile);
  const stability = profile.mode === 'beginner' ? 'weak' : (profile.stability || 'weak');
  const today = todayStr();
  const solidMeta = {};

  const rawList = JUZ_DB.map((jRaw) => {
    const jSurahsRaw = getJuzSurahs(jRaw.num);
    const jSurahsOrdered = dir === 'from_nas' ? [...jSurahsRaw].reverse() : [...jSurahsRaw];
    const memInJuz = jSurahsOrdered.filter((s) => memSet.has(s.num));
    const hasMemorized = profile.mode === 'khatim' || memInJuz.length > 0;
    const juzTrack = hasMemorized ? 'revision' : 'new';

    const surahs = jSurahsOrdered.map((s) => {
      const pInJuz = getSurahPagesInJuz(s, jRaw);
      const wasMem = memSet.has(s.num);
      const sTrack = (profile.mode === 'khatim' || wasMem) ? 'revision' : 'new';
      const done = wasMem && stability === 'solid';
      return { num: s.num, name: s.name, pages: pInJuz, track: sTrack, wasMemorized: wasMem, done };
    });

    let basePages = 0;
    if (juzTrack === 'revision' && stability === 'medium') {
      const memPagesInJuz = Math.min(jRaw.totalPages, surahs.reduce((sum, s) => sum + (s.wasMemorized ? s.pages : 0), 0));
      basePages = Number((memPagesInJuz * 0.5).toFixed(1));
    }

    const juzObj = {
      num: jRaw.num,
      title: jRaw.title,
      range: jRaw.range,
      totalPages: jRaw.totalPages,
      track: juzTrack,
      phase: '',
      donePages: 0,
      basePages,
      loggedPages: 0,
      tags: [],
      surahs,
      note: ''
    };
    recomputeJuzProgress(juzObj);
    return juzObj;
  });

  const juzList = orderJuzForRevision(rawList, profile);

  let revIdx = 0;
  juzList.forEach((j) => {
    if (j.track === 'revision') {
      revIdx++;
      if (j.donePages >= j.totalPages - 0.01) {
        if (prevSolidMeta && prevSolidMeta[j.num]) {
          solidMeta[j.num] = prevSolidMeta[j.num];
        } else {
          solidMeta[j.num] = {
            reviews: 0,
            reps: 0,
            lapses: 0,
            ease: SR_CONFIG.defaultEase,
            lastReviewed: today,
            rating: '',
            intervalDays: SR_CONFIG.firstAutoReviewDays,
            nextReviewDate: addDaysStr(today, ((revIdx - 1) % 7) + SR_CONFIG.firstAutoReviewDays),
            weakPages: [],
            addedAt: today
          };
        }
      }
      if (profile.mode === 'khatim') {
        j.phase = (profile.khatimStart === 'specific_juz' && (profile.khatimSpecificJuz || []).includes(j.num))
          ? 'الدورة الأولى: الأجزاء المختارة'
          : (revIdx <= 10 ? 'المرحلة ١: الثلث الأول' : (revIdx <= 20 ? 'المرحلة ٢: الثلث الثاني' : 'المرحلة ٣: تمام الختمة'));
      } else if (profile.mode === 'scattered') {
        j.phase = 'مسار مراجعة السور المحفوظة';
      } else {
        j.phase = revIdx <= 5 ? 'المرحلة ١: البداية السريعة في المراجعة' : (revIdx <= 14 ? 'المرحلة ٢: التدرّج المتوازن' : 'المرحلة ٣: استكمال المراجعة');
      }
    } else {
      j.phase = dir === 'from_baqarah' ? 'مسار الحفظ الجديد (من البقرة نحو الناس)' : 'مسار الحفظ الجديد (من الناس نحو البقرة)';
    }
  });

  const initialActiveRev = resolveActiveRevJuz(juzList, profile.revStartMode === 'custom_juz' ? profile.revStartJuz : null);
  const initialActiveNew = resolveActiveNewSurah(profile, juzList, null);

  return {
    juzList,
    solidMeta,
    activeRevJuzNum: initialActiveRev ? initialActiveRev.num : null,
    activeNewSurahNum: initialActiveNew ? initialActiveNew.num : null
  };
}

// ================= 7. LIVE REACTIVE SCHEDULE ENGINE =================
function buildLiveSchedule(profile, juzList, activeRevJuzNum, activeNewSurahNum, existingSchedule = null) {
  const daily = parseInt(profile.dailyMin, 10) || 45;
  const mainMin = Math.round(daily * 0.65);
  const secMin = Math.max(5, Math.round(daily * 0.17));
  const solMin = Math.max(5, daily - mainMin - secMin);
  const isKhatim = profile.mode === 'khatim';
  const isBeginner = profile.mode === 'beginner';
  const hasMaqraa = profile.studyStyle === 'maqraa';
  const maqraaDays = hasMaqraa ? (profile.maqraaDays || ['mon', 'thu']) : [];
  const pagesPerSess = parseFloat(profile.pagesPerSession) || 1;
  const revPagesPerDay = Math.max(1, Math.round(mainMin / 13));

  const activeRev = resolveActiveRevJuz(juzList, activeRevJuzNum);
  const revPendingAll = (juzList || []).filter((j) => j.track === 'revision' && j.donePages < j.totalPages - 0.01);
  const revOrdered = activeRev ? [activeRev, ...revPendingAll.filter((j) => j.num !== activeRev.num)] : revPendingAll;

  const activeNewSurah = resolveActiveNewSurah(profile, juzList, activeNewSurahNum);
  const nextSurahLabel = activeNewSurah ? `سورة ${activeNewSurah.name} (الجزء ${activeNewSurah.juz})` : 'الورد الجديد التالي';

  const getRevLabelForDay = (dayIdx) => {
    if (revOrdered.length === 0) return null;
    const targetJuz = isKhatim ? revOrdered[dayIdx % revOrdered.length] : revOrdered[0];
    const undoneSurahs = (targetJuz.surahs || []).filter((s) => !s.done && (isKhatim || s.track === 'revision'));
    const names = (undoneSurahs.length > 0 ? undoneSurahs : (targetJuz.surahs || [])).slice(0, 3).map((s) => s.name).join('، ');
    return `${targetJuz.title}${names ? ` (${names})` : ''}`;
  };

  const completedJuz = (juzList || []).filter((j) => j.donePages >= j.totalPages - 0.01);
  const solidSample = completedJuz.length > 0
    ? completedJuz.slice(0, 2).map((j) => j.title).join(' و')
    : (activeNewSurah ? `ربط مقاطع سورة ${activeNewSurah.name}` : 'المستحق في صندوق التثبيت');

  return DAYS_META.map((dm, idx) => {
    const prev = existingSchedule ? existingSchedule.find((d) => d.id === dm.id) : null;
    if (prev && prev.customEdited) return { ...prev };

    const isMq = maqraaDays.includes(dm.id);
    const nextDay = DAYS_META[(idx + 1) % 7];
    const isPrepDay = !isKhatim && hasMaqraa && maqraaDays.includes(nextDay.id);
    const revLabel = getRevLabelForDay(idx);

    let mainText = '';
    let secondText = '';
    let solidText = '';

    if (isKhatim) {
      const kPages = Math.max(2, Math.round(mainMin / 6));
      mainText = dm.id === 'fri'
        ? `مراجعة شاملة لأوراد الأسبوع في ${revLabel || 'دورتك الحالية'} (${mainMin} د)`
        : `مراجعة ${kPages} أوجه من ${revLabel || 'دورة المراجعة'} (${mainMin} د)`;
      secondText = isMq
        ? `تسميع ورد ${revLabel || 'المراجعة'} في المقرأة وتسجيل التقييم`
        : `اختبار غيبي سريع وربط المتشابهات في ${revLabel || 'الجزء النشط'} (${secMin} د)`;
      solidText = `صندوق التثبيت: سرد سريع لـ ${solidSample} (${solMin} د)`;
    } else if (isBeginner || !revLabel) {
      if (isMq) {
        mainText = `مراجعة وتثبيت ${pagesPerSess} وجه من ${nextSurahLabel} قبل التسميع (${mainMin} د)`;
        secondText = `تسميع ورد ${nextSurahLabel} وتسجيل التقييم`;
      } else if (dm.id === 'fri') {
        mainText = `مراجعة مجمّعة لما حُفظ خلال الأسبوع من ${nextSurahLabel} (${mainMin} د)`;
        secondText = `تسميع ذاتي متصل لمقاطع ${nextSurahLabel} (${secMin} د)`;
      } else {
        mainText = `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} (${mainMin} د)`;
        secondText = `تسميع غيبي وربط الورد بما قبله في ${nextSurahLabel} (${secMin} د)`;
      }
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    } else if (isMq) {
      mainText = `مراجعة ${pagesPerSess} وجه من ${nextSurahLabel} + مراجعة وجهين من ${revLabel} (${mainMin} د)`;
      secondText = `تسميع ورد ${nextSurahLabel} (${pagesPerSess} وجه) وتسجيل التقييم`;
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    } else if (isPrepDay) {
      mainText = `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} بتركيز (${mainMin} د)`;
      secondText = `ربط الورد الجديد بالمقاطع السابقة في ${nextSurahLabel} (${secMin} د)`;
      solidText = `صندوق التثبيت: سرد سريع لـ ${solidSample} (${solMin} د)`;
    } else if (dm.id === 'fri') {
      mainText = `مراجعة ${revPagesPerDay} أوجه من ${revLabel} أو تعويض ما فات بهدوء (${mainMin} د)`;
      secondText = `مراجعة مجمّعة لمقاطع ${nextSurahLabel} خلال الأسبوع (${secMin} د)`;
      solidText = `صندوق التثبيت: مراجعة المستحق اليوم من ${solidSample} (${solMin} د)`;
    } else {
      const soloNewDay = !hasMaqraa && (dm.id === 'sun' || dm.id === 'wed');
      mainText = soloNewDay
        ? `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} (${mainMin} د)`
        : `مراجعة ${revPagesPerDay} أوجه من ${revLabel} (${mainMin} د)`;
      secondText = soloNewDay
        ? `تسميع ذاتي وربط ${nextSurahLabel} بالمقطع السابق (${secMin} د)`
        : `اختبار غيبي سريع في ${revLabel} (${secMin} د)`;
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    }

    return {
      id: dm.id, jsDay: dm.jsDay, name: dm.name, maqraa: isMq,
      main: mainText, second: secondText, solid: solidText,
      mDone: prev ? !!prev.mDone : false,
      eDone: prev ? !!prev.eDone : false,
      sDone: prev ? !!prev.sDone : false,
      customEdited: false
    };
  });
}

function syncPlanAndScheduleLive() {
  if (!state.onboarded || !state.juzList || state.juzList.length !== 30) return;
  const resolvedRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  state.activeRevJuzNum = resolvedRev ? resolvedRev.num : null;
  const resolvedNew = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  state.activeNewSurahNum = resolvedNew ? resolvedNew.num : null;
  state.schedule = buildLiveSchedule(state.profile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, state.schedule);
}

// ================= 8. LEGACY IMPORT & EMERGENCY EXPORT =================
function findLegacyStorageKey() {
  for (const key of LEGACY_KEYS) {
    if (localStorage.getItem(key)) return key;
  }
  return null;
}

function importLegacyFromStorage() {
  const key = findLegacyStorageKey();
  if (!key) { showToast('لا توجد بيانات محفوظة من النسخ السابقة على هذا الجهاز'); return; }
  try {
    saveAutoSnapshot('قبل استيراد نسخة سابقة');
    const old = JSON.parse(localStorage.getItem(key));
    state = migrateState(old);
    applyTheme(state.profile.theme, state.profile.customColors);
    saveState();
    document.getElementById('onboardingOverlay').classList.remove('active');
    renderAll();
    showToast('تم استيراد بياناتك السابقة وترقيتها للنسخة السابعة بنجاح ✓');
  } catch (e) {
    console.warn('Legacy import failed:', e);
    showToast('تعذّر قراءة بيانات النسخة السابقة — يمكنك البدء بالإعداد الجديد');
  }
}

function emergencyExportRaw() {
  const raw = localStorage.getItem(corruptBackupKey || STORAGE_KEY) || JSON.stringify(state);
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rafiq_emergency_backup_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ================= 9. THEMES UI (SINGLE REUSABLE RENDERER) =================
function setTheme(themeId) {
  state.profile.theme = themeId;
  obDraft.theme = themeId;
  const cc = state.onboarded ? state.profile.customColors : obDraft.customColors;
  applyTheme(themeId, cc);
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
      <div class="theme-swatches">
        ${t.swatches.map((c) => `<span class="swatch" style="background:${c};"></span>`).join('')}
      </div>
      <strong style="display:block; font-size:0.82rem; color:var(--text-main);">${t.name}</strong>
      <small style="font-size:0.74rem; color:var(--text-muted);">${t.desc}</small>
    </button>
  `).join('') + `
    <button type="button" class="theme-tile ${current === 'custom' ? 'selected' : ''}" onclick="setTheme('custom')">
      <div class="theme-swatches">
        <span class="swatch" style="background:${cc.bg};"></span>
        <span class="swatch" style="background:${cc.accent};"></span>
      </div>
      <strong style="display:block; font-size:0.82rem; color:var(--text-main);">تخصيص حر</strong>
      <small style="font-size:0.74rem; color:var(--text-muted);">اختر ألوانك بتباين تلقائي</small>
    </button>
  `;

  const ratio = getContrastRatio(cc.bg, cc.accent);
  const contrastMsg = ratio >= 4.5
    ? `<span class="tag tag-success">تباين مريح (${ratio.toFixed(1)}:1)</span>`
    : '<span class="tag tag-gold">تم ضبط تباين النصوص تلقائياً لراحة العين</span>';

  const customBoxHtml = current === 'custom' ? `
    <div class="custom-theme-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="font-size:0.84rem; color:var(--accent-hi);">إعدادات التخصيص الحر</strong>
        ${contrastMsg}
      </div>
      <div class="color-picker-row">
        <label class="color-input-wrap">
          <input type="color" value="${cc.bg}" oninput="updateCustomColor('bg', this.value)" />
          <div class="color-input-meta"><strong>لون الخلفية</strong><span>${cc.bg.toUpperCase()}</span></div>
        </label>
        <label class="color-input-wrap">
          <input type="color" value="${cc.accent}" oninput="updateCustomColor('accent', this.value)" />
          <div class="color-input-meta"><strong>اللون الأساسي</strong><span>${cc.accent.toUpperCase()}</span></div>
        </label>
      </div>
    </div>` : '';

  ['modal', 'settings'].forEach((prefix) => {
    const g = document.getElementById(prefix + 'ThemeGrid');
    const c = document.getElementById(prefix + 'CustomThemeContainer');
    if (g) g.innerHTML = tilesHtml;
    if (c) c.innerHTML = customBoxHtml;
  });
}

function openThemeModal() {
  renderThemeGrids();
  openModal('themeModal');
}

// ================= 10. SIMPLIFIED ONBOARDING (WITH AUTO-SAVE & QUICK SKIP) =================
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
    if (raw) {
      const parsed = JSON.parse(raw);
      obDraft = { ...obDraft, ...parsed };
      return true;
    }
  } catch (e) { console.warn('loadObDraft error:', e); }
  return false;
}

function openOnboarding(isEditing = false) {
  obDraft.isEditing = isEditing;
  obShowRevStartPicker = false;
  surahSearchQuery = '';

  if (isEditing && state.profile) {
    obDraft = {
      ...obDraft,
      ...JSON.parse(JSON.stringify(state.profile)),
      step: 1,
      isEditing: true,
      remEnabled: state.reminders.length > 0
    };
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
  if (!isEditing && legacyKey) {
    migBanner.innerHTML = `
      <div class="alert-banner">
        <div>
          <strong>تم العثور على بياناتك المحفوظة من نسخة سابقة</strong>
          يمكنك استيراد تقدمك وسجل تسميعك مباشرة دون فقدان أي بيانات.
        </div>
        <button type="button" class="btn btn-gold btn-sm" onclick="importLegacyFromStorage()">استيراد والمتابعة الآن</button>
      </div>`;
  } else {
    migBanner.innerHTML = '';
  }

  renderObStep2();
  renderObStep3();
  renderObStep4();
  obNext(obDraft.step || 1);
  document.getElementById('onboardingOverlay').classList.add('active');
}

function closeOnboardingSafely() {
  if (state.onboarded) {
    document.getElementById('onboardingOverlay').classList.remove('active');
  } else {
    skipOnboardingQuick();
  }
}

function skipOnboardingQuick() {
  const name = (document.getElementById('obName').value || '').trim() || 'حافظ القرآن';
  obDraft.name = name;
  obDraft.mode = 'beginner';
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
    { id: 'beginner', title: 'لم أحفظ شيئاً بعد (بداية من الصفر)', sub: 'نرشّح لك البداية من الناس للبقرة أو تختار البداية التي تناسبك' },
    { id: 'khatim', title: 'خاتم للقرآن الكريم (٣٠ جزءاً) — مراجعة وتثبيت', sub: 'يُخفي قسم الحفظ الجديد وتختار نقطة بداية دورتك' },
    { id: 'scattered', title: 'حافظ سوراً متفرقة من المصحف', sub: 'تختار السور التي حفظتها فعلاً، ثم تقرر طريقة المتابعة' }
  ];
  document.getElementById('obModeOptions').innerHTML = modes.map((m) => `
    <button type="button" class="choice-card ${obDraft.mode === m.id ? 'selected' : ''}" onclick="selectObMode('${m.id}')">
      <span class="choice-radio"></span>
      <span>
        <strong style="display:block; font-size:0.88rem;">${m.title}</strong>
        <small style="color:var(--text-muted); font-size:0.78rem;">${m.sub}</small>
      </span>
    </button>
  `).join('');
}

function selectObMode(modeId) {
  obDraft.mode = modeId;
  surahSearchQuery = '';
  if (modeId === 'from_nas' && (!obDraft.stopSurahNum || obDraft.stopSurahNum < 1)) obDraft.stopSurahNum = 78;
  if (modeId === 'from_baqarah' && (!obDraft.stopSurahNum || obDraft.stopSurahNum > 114)) obDraft.stopSurahNum = 2;
  obDraft.revStartMode = 'auto';
  saveObDraft();
  renderObStep2();
  renderObStep3();
  renderObStep4();
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
        <input type="text" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeAttr(surahSearchQuery)}"
          oninput="surahSearchQuery=this.value; renderObStep3();" />
        <div class="surah-picker-grid">
          ${filtered.map((s) => `
            <button type="button" class="surah-pick-item ${obDraft.stopSurahNum === s.num ? 'selected' : ''}"
              onclick="obDraft.stopSurahNum=${s.num}; saveObDraft(); renderObStep3();">
              <span>${s.num}. ${s.name}</span>
              <small>${formatNum(s.pages)} وجه</small>
            </button>
          `).join('')}
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm ${!obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}"
          onclick="obDraft.stopSurahCompleted=false; saveObDraft(); renderObStep3();">ما زلت أحفظ في سورة ${stopSurah.name}</button>
        <button type="button" class="btn btn-sm ${obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}"
          onclick="obDraft.stopSurahCompleted=true; saveObDraft(); renderObStep3();">أتممت سورة ${stopSurah.name} وسأبدأ بالتي بعدها</button>
      </div>

      <div class="calc-preview-card">
        <strong>الحساب الفعلي لموضعك:</strong>
        <div style="margin-top:4px;">
          • المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${summary.completedJuzCount} جزء مكتمل • <strong>${formatNum(summary.memPages)}</strong> وجه من ٦٠٤).<br/>
          • سورة الحفظ الجديد النشطة: <strong>${summary.nextSurah ? `سورة ${summary.nextSurah.name} (الجزء ${summary.nextSurah.juz})` : 'أتممت المصحف!'}</strong>
        </div>
      </div>
    `;

    if (summary.memCount > 0) {
      const memSet = getDiagnosedMemorizedSet(obDraft);
      const revJuzCandidates = JUZ_DB.filter((j) => getJuzSurahs(j.num).some((s) => memSet.has(s.num)));
      if (!revJuzCandidates.some((j) => j.num === obDraft.revStartJuz) && revJuzCandidates.length > 0) {
        obDraft.revStartJuz = obDraft.mode === 'from_nas' ? revJuzCandidates[revJuzCandidates.length - 1].num : revJuzCandidates[0].num;
      }
      revStartSec.innerHTML = `
        <button type="button" class="btn btn-ghost btn-sm btn-block" style="justify-content:space-between;"
          onclick="obShowRevStartPicker=!obShowRevStartPicker; renderObStep3();">
          <span>⚙️ تخصيص بداية مراجعة القديم (اختياري)</span>
          <span>${obShowRevStartPicker ? 'إخفاء ▲' : 'تخصيص ▼'}</span>
        </button>
        ${obShowRevStartPicker ? `
          <div style="margin-top:9px; padding:10px; border-radius:12px; background:var(--bg-surface); border:1px solid var(--border-subtle);">
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'auto' || obDraft.revStartMode === 'from_nas' ? 'btn-gold' : 'btn-ghost'}"
                onclick="obDraft.revStartMode='from_nas'; saveObDraft(); renderObStep3();">من الناس ← البقرة</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'from_baqarah' ? 'btn-gold' : 'btn-ghost'}"
                onclick="obDraft.revStartMode='from_baqarah'; saveObDraft(); renderObStep3();">من البقرة ← الناس</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'custom_juz' ? 'btn-gold' : 'btn-ghost'}"
                onclick="obDraft.revStartMode='custom_juz'; saveObDraft(); renderObStep3();">جزء محدد (مثلاً من المنتصف)</button>
            </div>
            ${obDraft.revStartMode === 'custom_juz' ? `
              <select onchange="obDraft.revStartJuz=Number(this.value); saveObDraft();">
                ${revJuzCandidates.map((j) => `<option value="${j.num}" ${obDraft.revStartJuz === j.num ? 'selected' : ''}>${j.title} — ${j.range}</option>`).join('')}
              </select>
            ` : ''}
          </div>
        ` : ''}
      `;
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
        <span>
          <strong style="display:block; font-size:0.88rem;">${d.title}</strong>
          <small style="color:var(--text-muted); font-size:0.78rem;">${d.sub}</small>
        </span>
      </button>
    `).join('') + `<div class="calc-preview-card"><strong>نقطة الانطلاق:</strong> ستبدأ خطة الحفظ الجديد من <strong>${startSurah}</strong>.</div>`;
  } else if (obDraft.mode === 'khatim') {
    titleEl.textContent = '٣. من أين تبدأ دورة مراجعة الـ ٣٠ جزءاً؟';
    stabSec.style.display = 'block';
    const kOpts = [
      { id: 'from_baqarah', title: 'من البقرة إلى الناس (الجزء ١ ← ٣٠)', sub: 'دورة مراجعة متسلسلة من أول المصحف' },
      { id: 'from_nas', title: 'من الناس إلى البقرة (الجزء ٣٠ ← ١)', sub: 'دورة مراجعة متسلسلة من آخر المصحف' },
      { id: 'specific_juz', title: 'أجزاء محددة أختارها بنفسي', sub: 'تبدأ بالأجزاء التي تحددها أولاً ثم تستكمل بقية المصحف' }
    ];
    let specHtml = '';
    if (obDraft.khatimStart === 'specific_juz') {
      specHtml = `
        <label class="field-label" style="margin-top:10px;">اختر الأجزاء التي تريد البدء بها (${obDraft.khatimSpecificJuz.length} أجزاء محددة):</label>
        <div class="juz-pick-grid">
          ${JUZ_DB.map((j) => `<button type="button" class="juz-pick-chip ${obDraft.khatimSpecificJuz.includes(j.num) ? 'selected' : ''}" onclick="toggleKhatimJuz(${j.num})">ج ${j.num}</button>`).join('')}
        </div>`;
    }
    dyn.innerHTML = kOpts.map((k) => `
      <button type="button" class="choice-card ${obDraft.khatimStart === k.id ? 'selected' : ''}" onclick="obDraft.khatimStart='${k.id}'; saveObDraft(); renderObStep3();">
        <span class="choice-radio"></span>
        <span>
          <strong style="display:block; font-size:0.88rem;">${k.title}</strong>
          <small style="color:var(--text-muted); font-size:0.78rem;">${k.sub}</small>
        </span>
      </button>
    `).join('') + specHtml;
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
      <label class="field-label">حدّد السور التي حفظتها (من قائمة الـ ١١٤ سورة):</label>
      <div class="surah-picker-box">
        <div style="display:flex; gap:6px;">
          <input type="text" placeholder="ابحث باسم السورة..." value="${escapeAttr(surahSearchQuery)}" oninput="surahSearchQuery=this.value; renderObStep3();" />
          <button type="button" class="btn btn-ghost btn-sm" onclick="obDraft.scatteredSurahs=[]; saveObDraft(); renderObStep3();">مسح</button>
        </div>
        <div class="surah-picker-grid">
          ${filtered.map((s) => {
            const sel = obDraft.scatteredSurahs.includes(s.num);
            return `<button type="button" class="surah-pick-item ${sel ? 'selected' : ''}" onclick="toggleScatteredSurah(${s.num})"><span>${sel ? '✓ ' : ''}${s.name}</span><small>${formatNum(s.pages)}</small></button>`;
          }).join('')}
        </div>
      </div>
      <div class="calc-preview-card"><strong>المحدد حالياً:</strong> ${summary.memCount} سورة بإجمالي <strong>${formatNum(summary.memPages)}</strong> وجهاً.</div>
      <label class="field-label" style="margin-top:12px;">كيف تفضّل المتابعة بعد ذلك؟</label>
      ${contOpts.map((c) => `
        <button type="button" class="choice-card ${obDraft.scatteredContinue === c.id ? 'selected' : ''}" onclick="obDraft.scatteredContinue='${c.id}'; saveObDraft(); renderObStep3();">
          <span class="choice-radio"></span>
          <span><strong style="display:block; font-size:0.86rem;">${c.title}</strong><small style="color:var(--text-muted); font-size:0.78rem;">${c.sub}</small></span>
        </button>
      `).join('')}
    `;
  }

  const stabs = [
    { id: 'weak', title: 'متفلت (يحتاج مراجعة وتنشيطاً)', sub: 'تبدأ الأجزاء المحفوظة بمسار المراجعة خطوة بخطوة ثم تدخل صندوق التثبيت' },
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
  saveObDraft();
  renderObStep3();
}

function toggleScatteredSurah(surahNum) {
  if (obDraft.scatteredSurahs.includes(surahNum)) obDraft.scatteredSurahs = obDraft.scatteredSurahs.filter((n) => n !== surahNum);
  else obDraft.scatteredSurahs.push(surahNum);
  saveObDraft();
  renderObStep3();
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
  document.getElementById('obMaqraaDayChips').innerHTML = DAYS_META.map((d) => `
    <button type="button" class="day-chip ${obDraft.maqraaDays.includes(d.id) ? 'active' : ''}" onclick="toggleObMaqraaDay('${d.id}')">${d.name}</button>
  `).join('');

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
  } else {
    obDraft.maqraaDays.push(dayId);
  }
  saveObDraft();
  renderObStep4();
}

function toggleObReminders() {
  obDraft.remEnabled = !obDraft.remEnabled;
  saveObDraft();
  renderObStep4();
}

function renderObStep5Preview() {
  const tempProfile = { ...obDraft, dailyMin: parseInt(document.getElementById('obDailyMin').value, 10) || 45 };
  const summary = summarizeDiagnostic(tempProfile);
  const built = buildPersonalizedPlan(tempProfile);
  const sched = buildLiveSchedule(tempProfile, built.juzList, built.activeRevJuzNum, built.activeNewSurahNum, null);
  const actRevObj = built.juzList.find((j) => j.num === built.activeRevJuzNum);
  const actNewObj = built.activeNewSurahNum ? getSurahByNum(built.activeNewSurahNum) : null;

  document.getElementById('obPlanPreviewBox').innerHTML = `
    <div style="font-weight:800; color:var(--accent-hi); margin-bottom:6px;">ملخص خطتك الفعلية المحسوبة:</div>
    <div style="line-height:1.8;">
      ${tempProfile.mode === 'khatim'
        ? `• المسار: <strong>مراجعة وتثبيت ٣٠ جزءاً</strong> (قسم الحفظ الجديد مخفي).<br/>• بداية الدورة: <strong>${actRevObj ? actRevObj.title : 'الجزء ١'}</strong>.`
        : `• المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${formatNum(summary.memPages)} وجهاً من ٦٠٤).<br/>
           • سورة الحفظ الجديد النشطة: <strong>${actNewObj ? `سورة ${actNewObj.name} (الجزء ${actNewObj.juz})` : 'مكتمل'}</strong>.<br/>
           ${actRevObj ? `• الجزء النشط لبداية المراجعة: <strong>${actRevObj.title}</strong>.` : '• بداية تأسيسية صافية من الصفر.'}`
      }
      <br/>• مثال ليوم ${sched[0].name} في جدولك الحي: <strong>${escapeHtml(sched[0].main)}</strong>
    </div>
  `;
}

function obNext(step) {
  if (step === 4 && obDraft.mode === 'scattered' && obDraft.scatteredSurahs.length === 0) {
    showToast('اختر سورة واحدة على الأقل من قائمة السور التي حفظتها');
    return;
  }
  obDraft.step = step;
  saveObDraft();
  for (let i = 1; i <= 5; i++) {
    document.getElementById('obStep' + i).classList.toggle('active', i === step);
  }
  document.querySelectorAll('#obProgressDots .ob-dot').forEach((dot, idx) => {
    dot.classList.toggle('done', idx < step);
  });
  if (step === 3) renderObStep3();
  if (step === 4) renderObStep4();
  if (step === 5) { renderObStep4(); renderObStep5Preview(); }
  document.getElementById('onboardingOverlay').scrollTo({ top: 0, behavior: 'smooth' });
}

function handleFinishOnboardingClick() {
  if (obDraft.isEditing && state.onboarded) {
    openModal('rebuildChoiceModal');
  } else {
    completeOnboardingSave(true);
  }
}

function completeOnboardingSave(shouldRebuildJuz) {
  closeModal('rebuildChoiceModal');
  if (state.onboarded) saveAutoSnapshot('قبل تعديل الملف');

  const name = (document.getElementById('obName').value || '').trim() || obDraft.name || 'حافظ القرآن';
  const dailyMin = parseInt(document.getElementById('obDailyMin').value, 10) || obDraft.dailyMin || 45;
  const pagesPerSession = obDraft.pagesPerSession || 1;

  const newProfile = {
    name,
    theme: obDraft.theme,
    customColors: { ...(obDraft.customColors || { bg: '#00112B', accent: '#D0A151' }) },
    mode: obDraft.mode,
    stopSurahNum: obDraft.stopSurahNum,
    stopSurahCompleted: obDraft.stopSurahCompleted,
    beginnerDir: obDraft.beginnerDir,
    khatimStart: obDraft.khatimStart,
    khatimSpecificJuz: [...(obDraft.khatimSpecificJuz || [1, 2, 3])],
    scatteredSurahs: [...(obDraft.scatteredSurahs || [])],
    scatteredContinue: obDraft.scatteredContinue,
    revStartMode: obDraft.revStartMode || 'auto',
    revStartJuz: obDraft.revStartJuz || 30,
    stability: obDraft.mode === 'beginner' ? 'weak' : obDraft.stability,
    dailyMin,
    studyStyle: obDraft.studyStyle,
    maqraaDays: [...(obDraft.maqraaDays || ['mon', 'thu'])],
    pagesPerSession
  };

  state.profile = newProfile;
  state.onboarded = true;
  state.calcDailyMin = dailyMin;
  state.calcNewPages = newProfile.mode === 'khatim' ? 0 : pagesPerSession;
  if (!state.lastBackupAt) state.lastBackupAt = todayStr();

  if (shouldRebuildJuz || state.juzList.length !== 30) {
    const built = buildPersonalizedPlan(newProfile, state.solidMeta);
    state.juzList = built.juzList;
    state.solidMeta = built.solidMeta;
    state.activeRevJuzNum = built.activeRevJuzNum;
    state.activeNewSurahNum = built.activeNewSurahNum;
    state.surahNewProgress = {};
    state.mapFilter = newProfile.mode === 'beginner' ? 'new' : 'revision';
    state.schedule = buildLiveSchedule(newProfile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, null);
  } else {
    syncPlanAndScheduleLive();
  }

  if (obDraft.remEnabled) {
    const tRev = document.getElementById('obRemRevTime').value || '09:00';
    const tSol = document.getElementById('obRemSolidTime').value || '20:00';
    state.reminders = [
      { id: 'r1', time: tRev, type: newProfile.mode === 'beginner' ? 'new' : 'revision', enabled: true, lastTriggeredDate: '' },
      { id: 'r2', time: tSol, type: 'solid', enabled: true, lastTriggeredDate: '' }
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

// ================= 11. STREAK WITH GRACE DAY (1 EVERY 7 DAYS) =================
function touchStreak() {
  const t = todayStr();
  if (state.streak.lastDate === t) return;
  if (!state.streak.lastDate) {
    state.streak.count = 1;
    state.streak.lastDate = t;
    return;
  }
  const diff = diffDaysFromToday(t, state.streak.lastDate); // positive days elapsed since lastDate
  if (diff === 1) {
    state.streak.count += 1;
  } else if (diff === 2) {
    // يوم سماح واحد كل ٧ أيام لا يكسر السلسلة
    const lastGrace = state.streak.graceUsedDate;
    const graceDiff = lastGrace ? diffDaysFromToday(t, lastGrace) : 99;
    if (graceDiff >= SR_CONFIG.streakGraceWindowDays) {
      state.streak.count += 1;
      state.streak.graceUsedDate = t;
      showToast('تم تفعيل «يوم سماح» تلقائياً للحفاظ على سلسلة التزامك 🛡️');
    } else {
      state.streak.count = 1;
    }
  } else {
    state.streak.count = 1;
  }
  state.streak.lastDate = t;
}

// ================= 12. ACCESSIBLE MODAL MANAGER (ESC + FOCUS RESTORE) =================
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
  if (openModals.length > 0) {
    closeModal(openModals[openModals.length - 1].id);
    return;
  }
  const ob = document.getElementById('onboardingOverlay');
  if (ob && ob.classList.contains('active') && state.onboarded) {
    closeOnboardingSafely();
  }
});

// ================= 13. QUICK FOCUS, GLOSSARY & SIMPLE MODE =================
function openGlossaryModal() {
  document.getElementById('glossaryList').innerHTML = GLOSSARY.map((g) => `
    <div class="log-item" style="flex-direction:column; gap:4px;">
      <strong style="color:var(--accent-hi); font-size:0.92rem;">${escapeHtml(g.term)}</strong>
      <div style="font-size:0.83rem; color:var(--text-main);">${escapeHtml(g.desc)}</div>
    </div>
  `).join('');
  openModal('glossaryModal');
}

function toggleSimpleMode() {
  state.simpleMode = !state.simpleMode;
  saveState();
  renderAll();
  showToast(state.simpleMode ? 'تم تفعيل الوضع البسيط (تركيز على مهام اليوم فقط)' : 'تم تفعيل الوضع المتقدم (عرض كامل البطاقات)');
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
  if (kind === 'new' && state.profile.mode === 'khatim') {
    showToast('أنت في وضع الخاتم — يمكنك تعديل ذلك من الإعدادات إن أردت');
    return;
  }
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
    if (!pendingRev.length) {
      bodyEl.innerHTML = '<div class="empty-state">ما شاء الله! جميع الأجزاء مكتملة في صندوق التثبيت.</div>';
      return;
    }
    bodyEl.innerHTML = `
      <p class="muted-note">اختر أي جزء تبدأ به الآن — سيتحدّث جدولك الأسبوعي وصفحتك الرئيسية فوراً بهذا الجزء.</p>
      <div style="display:flex; flex-direction:column; gap:7px; max-height:55vh; overflow-y:auto;">
        ${pendingRev.map((j) => `
          <button type="button" class="choice-card ${state.activeRevJuzNum === j.num ? 'selected' : ''}" style="margin-bottom:0;" onclick="setActiveRevJuz(${j.num})">
            <span class="choice-radio"></span>
            <span style="flex:1;">
              <strong style="display:block; font-size:0.88rem;">${j.title} <span class="tag ${j.track === 'new' ? 'tag-info' : 'tag-gold'}">${j.track === 'new' ? 'جديد' : 'مراجعة'}</span></strong>
              <small style="color:var(--text-muted); font-size:0.78rem;">${j.range} • المنجز: ${formatNum(j.donePages)} / ${j.totalPages} وجهاً</small>
            </span>
          </button>
        `).join('')}
      </div>`;
  } else {
    titleEl.textContent = 'اختر السورة التي تحفظ فيها الآن';
    const q = quickFocusSearch.trim();
    const dir = getEffectiveDirection(state.profile);
    const ordered = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
    const filtered = q ? ordered.filter((s) => s.name.includes(q) || String(s.num) === q) : ordered;
    bodyEl.innerHTML = `
      <p class="muted-note">اختر أي سورة من الـ ١١٤ سورة لتصبح سورة الحفظ الجديد النشطة وتظل ثابتة معك حتى تتمها.</p>
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
  syncPlanAndScheduleLive();
  saveState();
  closeModal('quickFocusModal');
  renderAll();
  showToast(`أصبح ${j.title} هو الجزء النشط وتحدّث جدولك تلقائياً ✓`);
}

function setActiveNewSurah(surahNum) {
  const s = getSurahByNum(surahNum);
  if (!s) return;
  state.activeNewSurahNum = s.num;
  syncPlanAndScheduleLive();
  saveState();
  closeModal('quickFocusModal');
  renderAll();
  showToast(`أصبحت سورة ${s.name} هي سورة الحفظ النشطة وتحدّث جدولك تلقائياً ✓`);
}

// ================= 14. SPACED REPETITION DUE LIST & AUTO-REDISTRIBUTION =================
function getDueItems() {
  const items = [];
  const today = todayStr();

  state.newLinkingGroups.filter((g) => !g.archived).forEach((g) => {
    const nextDate = g.nextReviewDate || today;
    const diff = diffDaysFromToday(nextDate, today);
    const hasUrgent = g.passages.some((p) => p.rating === 'يحتاج إعادة');
    const needsMerge = g.passages.length >= 3 && g.linkCount < Math.floor(g.passages.length / 2);
    if (diff <= 0 || hasUrgent || needsMerge) {
      const sumP = g.passages.reduce((s, p) => s + p.pages, 0);
      items.push({
        kind: 'new', id: g.id, title: g.surahName,
        subtitle: `${g.passages.length} مقاطع (${formatNum(sumP)} وجه) • تثبيت جديد وربط`,
        overdueDays: diff < 0 ? Math.abs(diff) : 0,
        priority: hasUrgent ? 0 : (diff < 0 ? 1 : (needsMerge ? 2 : 3)),
        badge: hasUrgent ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : (needsMerge ? 'تجميع ٣+ مقاطع' : 'مستحق اليوم'))
      });
    }
  });

  state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01).forEach((j) => {
    const meta = state.solidMeta[j.num];
    if (!meta) return;
    const nextDate = meta.nextReviewDate || today;
    const diff = diffDaysFromToday(nextDate, today);
    const hasWeakPages = Array.isArray(meta.weakPages) && meta.weakPages.length > 0;
    if (diff <= 0 || meta.rating === 'يحتاج إعادة') {
      items.push({
        kind: 'old', id: j.num, title: j.title,
        subtitle: `${j.range}${hasWeakPages ? ` • أوجه متفلتة: ${meta.weakPages.slice(0, 4).join('، ')}` : ' • تثبيت قديم'}`,
        overdueDays: diff < 0 ? Math.abs(diff) : 0,
        priority: meta.rating === 'يحتاج إعادة' ? 0 : (hasWeakPages ? 1 : (diff < 0 ? 2 : 3)),
        badge: meta.rating === 'يحتاج إعادة' ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : 'مستحق اليوم')
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
      onclick="${onSelectFnName}('${r.id}')">
      ${r.label}<small>${r.shortHint}</small>
    </button>
  `).join('');
}

function openSrReviewModal(kind, id, title, overdueDays = 0) {
  srTarget = { kind, id, title, overdueDays: Number(overdueDays) || 0 };
  selectedSrRating = '';
  selectedWeakPages = [];

  document.getElementById('srReviewTargetInfo').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(title)}</strong>
    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${kind === 'new' ? 'صندوق التثبيت — تثبيت جديد (ربط السورة)' : 'صندوق التثبيت — تثبيت قديم (جزء مكتمل)'}</div>
  `;
  renderRatingButtons('srRatingGrid', '', 'selectSrRating');
  const btn = document.getElementById('confirmSrBtn');
  btn.disabled = true;
  btn.textContent = 'اختر التقييم أولاً لحفظ المراجعة';

  const wpWrap = document.getElementById('srWeakPagesWrap');
  if (kind === 'old') {
    const jDb = JUZ_DB.find((x) => x.num === Number(id));
    const meta = state.solidMeta[id];
    selectedWeakPages = meta && Array.isArray(meta.weakPages) ? [...meta.weakPages] : [];
    if (jDb) {
      wpWrap.style.display = 'block';
      renderWeakPagesPicker(jDb.startPage, jDb.endPage);
    } else {
      wpWrap.style.display = 'none';
    }
  } else {
    wpWrap.style.display = 'none';
  }
  openModal('srReviewModal');
}

function renderWeakPagesPicker(startPage, endPage) {
  let html = '';
  for (let p = startPage; p <= endPage; p++) {
    const sel = selectedWeakPages.includes(p);
    html += `<button type="button" class="weak-page-chip ${sel ? 'selected' : ''}" onclick="toggleWeakPage(${p}, ${startPage}, ${endPage})">ص ${p}</button>`;
  }
  document.getElementById('srWeakPagesGrid').innerHTML = html;
}

function toggleWeakPage(pageNum, startPage, endPage) {
  if (selectedWeakPages.includes(pageNum)) selectedWeakPages = selectedWeakPages.filter((x) => x !== pageNum);
  else selectedWeakPages.push(pageNum);
  selectedWeakPages.sort((a, b) => a - b);
  renderWeakPagesPicker(startPage, endPage);
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
  if (srTarget.kind === 'old') {
    const meta = state.solidMeta[srTarget.id] || { reviews: 0, reps: 0, lapses: 0, ease: SR_CONFIG.defaultEase, intervalDays: 2 };
    const next = computeSM2(meta, selectedSrRating, srTarget.overdueDays);
    // إذا كان التقييم جيد جداً فأعلى ولم يحدد المستخدم أوجه متفلتة، تُصفَّر الأوجه المتفلتة
    const finalWeak = (selectedSrRating === 'ممتاز' && selectedWeakPages.length === 0) ? [] : [...selectedWeakPages];
    state.solidMeta[srTarget.id] = {
      ...meta,
      reviews: (meta.reviews || 0) + 1,
      reps: next.reps,
      lapses: next.lapses,
      ease: next.ease,
      lastReviewed: t,
      rating: selectedSrRating,
      intervalDays: next.intervalDays,
      nextReviewDate: addDaysStr(t, next.intervalDays),
      weakPages: finalWeak
    };
    showToast(`تمت المراجعة (${selectedSrRating}) — الموعد القادم بعد ${next.intervalDays} يوم ✓`);
  } else {
    const g = state.newLinkingGroups.find((x) => x.id === srTarget.id);
    if (g) {
      const next = computeSM2(g, selectedSrRating, srTarget.overdueDays);
      g.linkCount = (g.linkCount || 0) + 1;
      g.reps = next.reps;
      g.lapses = next.lapses;
      g.ease = next.ease;
      g.lastLinked = t;
      g.rating = selectedSrRating;
      g.intervalDays = next.intervalDays;
      g.nextReviewDate = addDaysStr(t, next.intervalDays);
      if (selectedSrRating === 'ممتاز' || selectedSrRating === 'جيد جداً') {
        g.passages.forEach((p) => { if (p.rating === 'يحتاج إعادة') p.rating = 'جيد جداً'; });
      }
      showToast(`تم ربط ${g.surahName} (${selectedSrRating}) — الموعد القادم بعد ${next.intervalDays} يوم ✓`);
    }
  }
  touchStreak();
  saveState();
  closeModal('srReviewModal');
  renderAll();
}

// ================= 15. CORE RENDER & DASHBOARD =================
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
    // عند اكتمال الجزء لأول مرة لا نفترض تقييماً: أول مراجعة بعد يومين
    state.solidMeta[juz.num] = {
      reviews: 0,
      reps: 0,
      lapses: 0,
      ease: SR_CONFIG.defaultEase,
      lastReviewed: t,
      rating: '',
      intervalDays: SR_CONFIG.firstAutoReviewDays,
      nextReviewDate: addDaysStr(t, SR_CONFIG.firstAutoReviewDays),
      weakPages: [],
      addedAt: t
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

function renderStorageAlerts() {
  const box = document.getElementById('storageAlertBanner');
  if (!box) return;
  let html = '';
  if (corruptBackupKey) {
    html += `
      <div class="alert-banner alert-danger">
        <div>
          <strong>تم رصد تلف في البيانات المخزّنة — وحفظنا نسخة خام منها لحمايتها</strong>
          يمكنك تصدير الملف الخام أو استيراد نسخة احتياطية سابقة دون فقدان بياناتك.
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn btn-gold btn-sm" onclick="emergencyExportRaw()">تصدير النسخة الخام</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="corruptBackupKey=null; openOnboarding(false);">البدء من جديد</button>
        </div>
      </div>`;
  }
  if (storageQuotaWarning) {
    html += `
      <div class="alert-banner alert-danger">
        <div><strong>مساحة تخزين المتصفح ممتلئة</strong> يُنصح بتصدير نسخة احتياطية JSON الآن لحفظ تقدمك.</div>
        <button type="button" class="btn btn-gold btn-sm" onclick="exportBackup()">تصدير نسخة الآن</button>
      </div>`;
  }
  if (state.onboarded && state.lastBackupAt) {
    const daysSince = diffDaysFromToday(todayStr(), state.lastBackupAt);
    if (daysSince >= SR_CONFIG.backupReminderDays) {
      html += `
        <div class="alert-banner">
          <div><strong>تذكير النسخ الاحتياطي</strong> مرّ ${daysSince} يوماً منذ آخر نسخة احتياطية — احفظ نسخة JSON على جهازك للأمان.</div>
          <button type="button" class="btn btn-gold btn-sm" onclick="exportBackup()">تصدير JSON الآن</button>
        </div>`;
    }
  }
  box.innerHTML = html;
}

function renderAll() {
  if (!state.onboarded) return;
  syncPlanAndScheduleLive();
  renderStorageAlerts();
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
  document.querySelectorAll('.adv-only').forEach((el) => el.classList.toggle('simple-mode-hidden', !!state.simpleMode));
}

function renderHeader() {
  const p = state.profile;
  const name = p.name || 'رفيق التثبيت';
  document.getElementById('headerUserTitle').textContent = `أهلاً يا ${name}`;
  const activeJuzCount = state.juzList.filter((j) => j.track === 'revision').length;
  const modeNames = {
    from_nas: 'الناس ← البقرة',
    from_baqarah: 'البقرة ← الناس',
    beginner: 'بداية جديدة',
    khatim: 'خاتم ٣٠ جزءاً',
    scattered: 'سور متفرقة'
  };
  const subCount = p.mode === 'khatim' ? '٣٠ جزءاً' : (activeJuzCount > 0 ? `${activeJuzCount} جزء مراجعة` : 'تأسيس جديد');
  document.getElementById('headerUserSub').textContent = `${modeNames[p.mode] || 'خطتك'} • ${subCount} • ${p.dailyMin} د/يوم`;

  const graceActive = state.streak.graceUsedDate === todayStr();
  document.getElementById('streakBadge').textContent = `🔥 ${state.streak.count} أيام${graceActive ? ' (سماح)' : ''}`;

  const profLine = document.getElementById('profileSummaryLine');
  if (profLine) {
    profLine.innerHTML = `المستخدم: <strong style="color:var(--accent-hi);">${escapeHtml(name)}</strong> • المسار: <strong>${modeNames[p.mode] || 'مرن'}</strong> • الوقت اليومي: <strong>${p.dailyMin} دقيقة</strong>`;
  }
  const legacyBtn = document.getElementById('settingsLegacyImportBtn');
  if (legacyBtn) legacyBtn.style.display = findLegacyStorageKey() ? 'inline-flex' : 'none';
  const snapBtn = document.getElementById('restoreSnapshotBtn');
  if (snapBtn) snapBtn.style.display = getAutoSnapshots().length > 0 ? 'inline-flex' : 'none';
}

function renderDashboard() {
  const isKhatim = state.profile.mode === 'khatim';
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

  document.getElementById('solidProgressLabel').textContent = `${solidOldCount} أجزاء قديم • ${solidNewPassages} مقاطع جديد`;
  document.getElementById('solidProgressBar').style.width = `${(solidOldCount / 30 * 100).toFixed(1)}%`;

  // Simple mode button label
  const smBtn = document.getElementById('homeSimpleModeBtn');
  if (smBtn) smBtn.textContent = state.simpleMode ? 'عرض متقدم' : 'وضع بسيط';

  // Due Today (Anti-Overload daily cap = SR_CONFIG.dailyDueLimit)
  const allDue = getDueItems();
  const visibleDue = allDue.slice(0, SR_CONFIG.dailyDueLimit);
  const deferredCount = Math.max(0, allDue.length - visibleDue.length);
  document.getElementById('dueCountBadge').textContent = `${allDue.length} عناصر`;
  const dueListEl = document.getElementById('dueTodayList');
  if (allDue.length === 0) {
    dueListEl.innerHTML = '<div style="font-size:0.83rem; color:var(--text-muted); padding:4px 2px;">يومك صافٍ من المراجعات المتأخرة — كل ورد تسمّعه أو جزء تنجزه سيُجدول هنا تلقائياً.</div>';
  } else {
    dueListEl.innerHTML = visibleDue.map((item) => `
      <div class="log-item" style="align-items:center;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.9rem;">${escapeHtml(item.title)}</strong>
            <span class="tag ${item.priority === 0 ? 'tag-danger' : (item.priority === 1 ? 'tag-warn' : 'tag-gold')}">${item.badge}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(item.subtitle)}</div>
        </div>
        <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('${item.kind}', '${item.id}', '${escapeAttr(item.title)}', ${item.overdueDays})">راجعته ✓</button>
      </div>
    `).join('') + (deferredCount > 0
      ? `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-top:4px;">تم ترحيل ${deferredCount} عناصر إضافية تلقائياً للغد لمنع التراكم المرهق.</div>`
      : '');
  }

  // New Memorization card on Home
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

  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
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
      <button type="button" class="task-row ${state.busyTasksDone.t2 ? 'done' : ''}" onclick="toggleBusyTask('t2')">
        <span class="check-circle">${state.busyTasksDone.t2 ? '✓' : ''}</span>
        <span class="task-text"><strong>تنشيط التثبيت (٤ دقائق)</strong><small>سرد وجهين فقط من أي جزء أو سورة منجزة — والباقي مُرحّل بهدوء</small></span>
      </button>
    `;
  } else if (todayObj) {
    document.getElementById('todayTasksContainer').innerHTML = `
      <button type="button" class="task-row ${todayObj.mDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'mDone')">
        <span class="check-circle">${todayObj.mDone ? '✓' : ''}</span>
        <span class="task-text"><strong>١. الجلسة الأساسية (في أي وقت)</strong><small>${escapeHtml(todayObj.main)}</small></span>
      </button>
      <button type="button" class="task-row ${todayObj.eDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'eDone')">
        <span class="check-circle">${todayObj.eDone ? '✓' : ''}</span>
        <span class="task-text"><strong>٢. التسميع والربط (مرنة)</strong><small>${escapeHtml(todayObj.second)}</small></span>
      </button>
      <button type="button" class="task-row ${todayObj.sDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${todayObj.id}', 'sDone')">
        <span class="check-circle">${todayObj.sDone ? '✓' : ''}</span>
        <span class="task-text"><strong>٣. صندوق التثبيت</strong><small>${escapeHtml(todayObj.solid)}</small></span>
      </button>
    `;
  }

  const quickRevBtn = document.getElementById('quickRevBtn');
  if (quickRevBtn) {
    quickRevBtn.style.display = curRev ? 'inline-flex' : 'none';
    if (curRev) quickRevBtn.textContent = `+١ وجه في ${curRev.title}`;
  }

  // Overview Stats
  document.getElementById('statCurrentRev').textContent = revList.length === 0 ? 'بداية جديدة' : (curRev ? curRev.title : 'مكتمل ✓');
  document.getElementById('statCurrentRevSub').textContent = revList.length === 0 ? 'لا يوجد قديم بعد' : (curRev ? `${formatNum(curRev.donePages)} / ${curRev.totalPages} وجهاً` : 'كل القديم في التثبيت');

  const newEditHint = document.getElementById('statNewEditHint');
  if (newEditHint) newEditHint.style.display = isKhatim ? 'none' : 'inline';

  const loggedInActiveSurah = activeNewSurah ? (state.surahNewProgress[activeNewSurah.num] || 0) : 0;
  document.getElementById('statCurrentNew').textContent = isKhatim ? 'خاتم ✓' : (activeNewSurah ? `سورة ${activeNewSurah.name}` : 'مكتمل ✓');
  document.getElementById('statCurrentNewSub').textContent = isKhatim
    ? 'تثبيت ٣٠ جزءاً'
    : (activeNewSurah ? `الجزء ${activeNewSurah.juz} • ${loggedInActiveSurah > 0 ? `${formatNum(loggedInActiveSurah)} / ` : ''}${formatNum(activeNewSurah.pages)} وجه` : 'ختمة مباركة');

  document.getElementById('statSolidNewCount').textContent = `${solidNewPassages} مقاطع`;
  document.getElementById('statSolidNewSub').textContent = activeLinkGroups.length > 0 ? `في ${activeLinkGroups.length} سورة للربط` : 'جاهز لأول ورد جديد';

  let doneT = 0;
  const totalT = state.schedule.length * 3;
  state.schedule.forEach((d) => { if (d.mDone) doneT++; if (d.eDone) doneT++; if (d.sDone) doneT++; });
  document.getElementById('statWeekPct').textContent = totalT ? Math.round(doneT / totalT * 100) + '%' : '0%';
  document.getElementById('statWeekSub').textContent = doneT === 0 ? 'ابدأ أول مهمة اليوم' : `${doneT} من ${totalT} مهمة`;

  // Stabilization alert every 3 completed revision Juz
  const alertBox = document.getElementById('stabilizationAlert');
  if (revDoneJuz > 0 && revDoneJuz % 3 === 0 && revDoneJuz < revList.length) {
    alertBox.innerHTML = `
      <div class="alert-banner">
        <div><strong>تذكير أسبوع التثبيت (أتممت ${revDoneJuz} أجزاء)</strong> خصّص لفة سريعة للأجزاء الـ ${solidOldCount} في صندوق التثبيت قبل فتح الجزء التالي.</div>
      </div>`;
  } else {
    alertBox.innerHTML = '';
  }

  // Active Juz Surahs Widget
  const activeJuz = curRev || newList.find((j) => j.donePages < j.totalPages - 0.01);
  const ajCard = document.getElementById('activeJuzSurahsCard');
  if (activeJuz && activeJuz.surahs && activeJuz.surahs.length > 0) {
    ajCard.style.display = 'block';
    document.getElementById('activeJuzSurahsTitle').textContent = `🎯 سور ${activeJuz.title}`;
    document.getElementById('activeJuzSurahsList').innerHTML = activeJuz.surahs.map((s, idx) => `
      <button type="button" class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${activeJuz.num}, ${idx})">
        <span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span>
        <small>${formatNum(s.pages)}</small>
      </button>
    `).join('');
  } else {
    ajCard.style.display = 'none';
  }

  // First-time Welcome Guide
  const guideBox = document.getElementById('firstTimeGuideBanner');
  if (guideBox) {
    if (!state.welcomeDismissed) {
      guideBox.innerHTML = `
        <div class="alert-banner">
          <div style="flex:1; min-width:220px;">
            <strong>دليل سريع في سطرين</strong>
            <div style="font-size:0.81rem; color:var(--text-main); margin-top:3px;">
              ١) <strong>المراجعة:</strong> راجع جزءك النشط وعند إتمامه يدخل <strong>صندوق التثبيت</strong> ويحل الجزء التالي مكانه تلقائياً.<br/>
              ٢) <strong>الجديد:</strong> سجّل وردك ثم اضغط «تم التسميع» ليُجدول تلقائياً بالتكرار المتباعد الذكي.
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="dismissWelcomeGuide()">فهمت، إخفاء</button>
        </div>`;
    } else {
      guideBox.innerHTML = '';
    }
  }
  renderInAppReminderBanner();
}

function dismissWelcomeGuide() { state.welcomeDismissed = true; saveState(); renderDashboard(); }

function toggleBusyDay() {
  const t = todayStr();
  if (state.busyDayDate === t) {
    state.busyDayDate = '';
    showToast('عدنا إلى جدول اليوم العادي');
  } else {
    state.busyDayDate = t;
    state.busyTasksDone = { t1: false, t2: false };
    showToast('تم تفعيل وضع الحماية (٧ دقائق) — حافظ على استمراريتك بهدوء 🛡️');
  }
  saveState();
  renderDashboard();
}

function toggleBusyTask(key) {
  state.busyTasksDone[key] = !state.busyTasksDone[key];
  if (state.busyTasksDone[key]) touchStreak();
  saveState();
  renderDashboard();
}

// ================= 16. NEW MEMORIZATION (2-STEP CYCLE WITH STEPPER) =================
function renderHomeNewWorkflow() {
  const container = document.getElementById('homeNewWorkflowCard');
  const activeSurah = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  const dir = getEffectiveDirection(state.profile);
  const orderedSurahs = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
  const defaultNum = activeSurah ? activeSurah.num : orderedSurahs[0].num;
  const defaultJuz = activeSurah ? activeSurah.juz : orderedSurahs[0].juz;
  const loggedInSurah = activeSurah ? (state.surahNewProgress[activeSurah.num] || 0) : 0;

  if (!state.activeWird) {
    if (!newWirdFormOpen) {
      container.innerHTML = `
        <div class="card">
          <div class="card-title" style="margin-bottom:6px;">
            <h2>📖 الحفظ الجديد — ${activeSurah ? `سورة ${activeSurah.name}` : 'تسجيل الورد'}</h2>
            ${activeSurah && loggedInSurah > 0 ? `<span class="tag tag-info">${formatNum(loggedInSurah)} / ${formatNum(activeSurah.pages)} وجه</span>` : ''}
          </div>
          <p class="muted-note">
            ${activeSurah ? `سورتك النشطة: <strong>سورة ${activeSurah.name}</strong> (الجزء ${activeSurah.juz} • ${formatNum(activeSurah.pages)} وجهاً).` : 'ابدأ بتسجيل وردك الجديد الأول.'}
          </p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-gold" style="flex:1;" onclick="toggleNewWirdForm(true)">+ تسجيل ورد جديد</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="openQuickFocusModal('new')">تغيير السورة</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="switchTab('solid'); setSolidTab('new');">صندوق التثبيت</button>
          </div>
        </div>
      `;
    } else {
      const surahOptions = orderedSurahs.map((s) =>
        `<option value="${s.num}" ${s.num === defaultNum ? 'selected' : ''}>${s.num}. سورة ${s.name} (الجزء ${s.juz} • ${formatNum(s.pages)} وجه)</option>`
      ).join('');
      const juzOptions = JUZ_DB.map((j) =>
        `<option value="${j.num}" ${j.num === defaultJuz ? 'selected' : ''}>${j.title} — ${j.range}</option>`
      ).join('');
      const defPages = state.profile.pagesPerSession || 1;
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
                <label class="field-label" for="nwPassage">المقطع / الآيات</label>
                <input type="text" id="nwPassage" placeholder="مثلاً: آية ١ – ١٥ أو السورة كاملة" required />
              </div>
              <div>
                <label class="field-label">عدد الأوجه</label>
                <div class="stepper-wrap">
                  <button type="button" class="stepper-btn" onclick="stepNwPages(-0.25)" aria-label="إنقاص ربع وجه">−</button>
                  <span class="stepper-val" id="nwPagesDisplay">${formatNum(defPages)} وجه</span>
                  <button type="button" class="stepper-btn" onclick="stepNwPages(0.25)" aria-label="زيادة ربع وجه">+</button>
                </div>
                <input type="hidden" id="nwPages" value="${defPages}" />
              </div>
              <div>
                <label class="field-label" for="nwJuz">الجزء التابع له</label>
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
        </div>
      `;
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
          <button type="button" class="task-row ${w.prepRead ? 'done' : ''}" onclick="toggleWirdPrep('prepRead')">
            <span class="check-circle">${w.prepRead ? '✓' : ''}</span>
            <span class="task-text"><strong>قراءة نظرية وفهم المعنى</strong></span>
          </button>
          <button type="button" class="task-row ${w.prepMem ? 'done' : ''}" onclick="toggleWirdPrep('prepMem')">
            <span class="check-circle">${w.prepMem ? '✓' : ''}</span>
            <span class="task-text"><strong>الحفظ والتسميع الذاتي غيباً</strong></span>
          </button>
          <button type="button" class="task-row ${w.prepLink ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleWirdPrep('prepLink')">
            <span class="check-circle">${w.prepLink ? '✓' : ''}</span>
            <span class="task-text"><strong>ربط الورد بالمقطع السابق في السورة</strong></span>
          </button>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-gold" style="flex:1;" onclick="openReciteModal()">✅ تم التسميع + التقييم</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="cancelActiveWird()">تعديل / إلغاء</button>
        </div>
      </div>
    `;
  }
}

function toggleNewWirdForm(open) { newWirdFormOpen = !!open; renderHomeNewWorkflow(); }

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
  const juzSel = document.getElementById('nwJuz');
  if (juzSel) juzSel.value = String(s.juz);
  syncPlanAndScheduleLive();
  saveState();
  renderHeader();
  renderSchedule();
}

function registerNewWird(e) {
  e.preventDefault();
  const surahNum = parseInt(document.getElementById('nwSurahSelect').value, 10);
  const sObj = getSurahByNum(surahNum);
  const surahName = sObj ? `سورة ${sObj.name}` : 'سورة مختارة';
  const passage = document.getElementById('nwPassage').value.trim();
  const pages = parseFloat(document.getElementById('nwPages').value) || 1;
  const juzNum = parseInt(document.getElementById('nwJuz').value, 10) || (sObj ? sObj.juz : 1);
  const note = document.getElementById('nwNote').value.trim();

  if (sObj) state.activeNewSurahNum = sObj.num;
  state.activeWird = {
    id: 'w_' + Date.now(), surahNum, surahName, passage, pages, juzNum, note,
    createdAt: todayStr(), prepRead: false, prepMem: false, prepLink: false
  };
  newWirdFormOpen = false;
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
  showToast(`تم تسجيل الورد الجديد: ${surahName} — ${passage}`);
}

function toggleWirdPrep(field) {
  if (!state.activeWird) return;
  state.activeWird[field] = !state.activeWird[field];
  if (state.activeWird[field]) touchStreak();
  saveState();
  renderHomeNewWorkflow();
}

function cancelActiveWird() {
  if (!confirm('هل تريد إلغاء الورد المسجّل حالياً لتسجيل ورد آخر؟')) return;
  state.activeWird = null;
  saveState();
  renderAll();
}

function openReciteModal() {
  if (!state.activeWird) return;
  const w = state.activeWird;
  const sObj = getSurahByNum(w.surahNum);
  const prevLogged = sObj ? (state.surahNewProgress[sObj.num] || 0) : 0;
  const willReachEnd = sObj ? (prevLogged + w.pages >= sObj.pages - 0.01) : false;

  selectedRating = '';
  document.getElementById('reciteModalSummary').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(w.surahName)} — ${escapeHtml(w.passage)}</strong>
    <div style="color:var(--text-muted); font-size:0.8rem; margin-top:2px;">المقدار: ${formatNum(w.pages)} وجه • الجزء ${w.juzNum}</div>
  `;
  renderRatingButtons('ratingGrid', '', 'selectRating');
  document.getElementById('reciteRepeatReason').style.display = 'none';
  document.getElementById('reciteSheikhNote').value = w.note || '';
  document.getElementById('reciteAutoMap').checked = true;
  document.getElementById('reciteAddToLink').checked = true;
  document.getElementById('reciteTagMut').checked = false;
  document.getElementById('reciteFinishSurah').checked = willReachEnd;

  const btn = document.getElementById('confirmReciteBtn');
  btn.disabled = true;
  btn.textContent = 'اختر التقييم أولاً لتأكيد التسميع';
  openModal('reciteModal');
}

function selectRating(rate) {
  selectedRating = rate;
  renderRatingButtons('ratingGrid', rate, 'selectRating');
  const isRepeat = rate === 'يحتاج إعادة';
  document.getElementById('reciteAutoMap').checked = !isRepeat;
  document.getElementById('reciteRepeatReason').style.display = isRepeat ? 'block' : 'none';
  const btn = document.getElementById('confirmReciteBtn');
  btn.disabled = false;
  btn.textContent = 'تأكيد التسميع وإتاحة تسجيل الورد التالي';
}

function confirmRecitation() {
  if (!state.activeWird || !selectedRating) return;
  const w = state.activeWird;
  const note = document.getElementById('reciteSheikhNote').value.trim();
  const autoMap = document.getElementById('reciteAutoMap').checked;
  const addToLink = document.getElementById('reciteAddToLink').checked;
  const tagMut = document.getElementById('reciteTagMut').checked;
  const finishSurah = document.getElementById('reciteFinishSurah').checked;
  const today = todayStr();

  state.maqraaLogs.unshift({
    id: 'mq_' + Date.now(), surahName: w.surahName, passage: w.passage,
    pages: w.pages, juzNum: w.juzNum, date: today, rating: selectedRating, note,
    tags: tagMut ? ['متشابهات'] : []
  });

  if (autoMap) {
    const targetJuz = state.juzList.find((j) => j.num === w.juzNum);
    if (targetJuz) {
      targetJuz.loggedPages = Number(((targetJuz.loggedPages || 0) + w.pages).toFixed(2));
      if (tagMut && !targetJuz.tags.includes('متشابهات')) targetJuz.tags.push('متشابهات');
    }
    if (w.surahNum) {
      const sObj = getSurahByNum(w.surahNum);
      const nextLogged = Number(((state.surahNewProgress[w.surahNum] || 0) + w.pages).toFixed(2));
      state.surahNewProgress[w.surahNum] = sObj ? Math.min(sObj.pages, nextLogged) : nextLogged;

      if (finishSurah || (sObj && nextLogged >= sObj.pages - 0.01)) {
        state.juzList.forEach((j) => {
          (j.surahs || []).forEach((s) => { if (s.num === w.surahNum) s.done = true; });
          recomputeJuzProgress(j);
        });
        state.activeNewSurahNum = null;
        const nextS = resolveActiveNewSurah(state.profile, state.juzList, null);
        state.activeNewSurahNum = nextS ? nextS.num : null;
      } else {
        state.activeNewSurahNum = w.surahNum;
      }
    }
    if (targetJuz) {
      recomputeJuzProgress(targetJuz);
      syncSolidBoxMembership(targetJuz);
    }
  } else if (w.surahNum) {
    state.activeNewSurahNum = w.surahNum;
  }

  if (addToLink) {
    addPassageToLinkingGroup(w.surahName, w.passage, w.pages, selectedRating, today, tagMut);
  }

  state.activeWird = null;
  touchStreak();
  syncPlanAndScheduleLive();
  saveState();
  closeModal('reciteModal');
  renderAll();

  const curNew = state.activeNewSurahNum ? getSurahByNum(state.activeNewSurahNum) : null;
  showToast(
    finishSurah && curNew
      ? `مبارك إتمام ${w.surahName}! انتقلت خطتك تلقائياً إلى سورة ${curNew.name} ✓`
      : `تم التسميع (${selectedRating}) ونُقل المقطع لصندوق التثبيت ✓`
  );
}

// ================= 17. SCHEDULE & WEEKLY SUMMARY =================
function renderSchedule() {
  const jsToday = new Date().getDay();
  document.getElementById('scheduleList').innerHTML = state.schedule.map((d) => {
    const isToday = d.jsDay === jsToday;
    const doneCount = (d.mDone ? 1 : 0) + (d.eDone ? 1 : 0) + (d.sDone ? 1 : 0);
    return `
      <div class="week-day-row ${isToday ? 'today' : ''}">
        <div class="week-day-head">
          <div class="day-name">
            <span>${d.name}</span>
            ${isToday ? '<span class="tag tag-gold">اليوم</span>' : ''}
            ${d.maqraa ? '<span class="tag tag-info">يوم التسميع</span>' : '<span class="tag tag-gold">وقت مرن</span>'}
            ${d.customEdited ? '<span class="tag tag-warn">معدّل يدوياً</span>' : ''}
            ${doneCount === 3 ? '<span class="tag tag-success">✓ مكتمل</span>' : `<span style="font-size:0.78rem; color:var(--text-muted);">${doneCount}/3</span>`}
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
          <div class="session-col">
            <div class="session-col-title"><span>جلسة التسميع والتثبيت</span><span style="color:var(--text-dim); font-weight:600;">في أي وقت</span></div>
            <button type="button" class="task-row ${d.eDone ? 'done' : ''}" onclick="toggleDayTask('${d.id}', 'eDone')">
              <span class="check-circle">${d.eDone ? '✓' : ''}</span>
              <span class="task-text"><strong style="font-size:0.83rem;">${escapeHtml(d.second)}</strong></span>
            </button>
            <button type="button" class="task-row ${d.sDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${d.id}', 'sDone')">
              <span class="check-circle">${d.sDone ? '✓' : ''}</span>
              <span class="task-text"><strong style="font-size:0.83rem;">${escapeHtml(d.solid)}</strong></span>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('archiveCountTag').textContent = `${state.weekArchives.length} أسابيع`;
  const archEl = document.getElementById('weekArchiveList');
  if (state.weekArchives.length === 0) {
    archEl.innerHTML = '<div class="empty-state">اضغط «إغلاق الأسبوع وعرض الملخص» في نهاية أسبوعك لتوثيق التزامك هنا.</div>';
  } else {
    archEl.innerHTML = state.weekArchives.map((a) => `
      <div class="log-item">
        <div>
          <strong style="font-size:0.88rem;">أسبوع منتهٍ في ${a.date}</strong>
          <div style="font-size:0.78rem; color:var(--text-muted);">أنجزت ${a.doneTasks} من ${a.totalTasks || 21} مهمة • الختمة: ${a.khatmaPct}%</div>
        </div>
        <span class="tag tag-success">${Math.round(a.doneTasks / (a.totalTasks || 21) * 100)}%</span>
      </div>`).join('');
  }
}

function toggleDayTask(dayId, field) {
  const d = state.schedule.find((x) => x.id === dayId);
  if (!d) return;
  d[field] = !d[field];
  if (d[field]) touchStreak();
  saveState();
  renderAll();
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
    d.second = document.getElementById('editSecondText').value.trim() || d.second;
    d.solid = document.getElementById('editSolidText').value.trim() || d.solid;
    d.customEdited = true;
    saveState();
    renderAll();
    showToast('تم حفظ تعديلك اليدوي على هذا اليوم ✓');
  }
  closeModal('editDayModal');
}

function resetDayToAuto() {
  const d = state.schedule.find((x) => x.id === editingDayId);
  if (d) {
    d.customEdited = false;
    syncPlanAndScheduleLive();
    saveState();
    renderAll();
    showToast('عاد اليوم للتحديث التلقائي حسب خطتك ✓');
  }
  closeModal('editDayModal');
}

function archiveWeek() {
  let doneT = 0;
  const totalT = state.schedule.length * 3 || 21;
  state.schedule.forEach((d) => { if (d.mDone) doneT++; if (d.eDone) doneT++; if (d.sDone) doneT++; });
  const totalPages = state.juzList.reduce((s, j) => s + j.totalPages, 0) || 604;
  const donePages = state.juzList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  const khatmaPct = Math.round(donePages / totalPages * 100);
  const weakItems = getDueItems().filter((x) => x.priority <= 1).slice(0, 3);
  const nextRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const nextNew = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);

  state.weekArchives.unshift({ date: todayStr(), doneTasks: doneT, totalTasks: totalT, khatmaPct });
  state.schedule = buildLiveSchedule(state.profile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, null);
  saveState();
  renderAll();

  document.getElementById('weekSummaryBody').innerHTML = `
    <div class="calc-preview-card" style="margin-top:0;">
      <strong>إنجازك هذا الأسبوع:</strong> ${doneT} من ${totalT} مهمة (${Math.round(doneT / totalT * 100)}%) • إجمالي الختمة: <strong>${khatmaPct}%</strong>.
    </div>
    <div style="margin-top:11px; font-size:0.84rem; line-height:1.8;">
      • <strong>العناصر التي تحتاج تركيزاً:</strong> ${weakItems.length ? weakItems.map((w) => escapeHtml(w.title)).join('، ') : 'لا توجد عناصر متعثرة — أداء ممتاز!'}<br/>
      • <strong>تركيز الأسبوع القادم:</strong> ${nextRev ? nextRev.title : 'صندوق التثبيت'}${nextNew ? ` + سورة ${nextNew.name}` : ''}.
    </div>
  `;
  openModal('weekSummaryModal');
}

// ================= 18. SOLID BOX & MUTASHABIHAT BANK =================
function setSolidTab(sub) {
  state.solidSubTab = sub;
  saveState();
  renderSolidTab();
}

function formatDueTag(nextDateStr) {
  const diff = diffDaysFromToday(nextDateStr);
  if (diff < 0) return `<span class="tag tag-danger">متأخر ${Math.abs(diff)} يوم</span>`;
  if (diff === 0) return '<span class="tag tag-warn">مستحق اليوم</span>';
  return `<span class="tag tag-success">القادم بعد ${diff} يوم</span>`;
}

function ratingBadgeHtml(r) {
  const found = RATINGS.find((x) => x.id === r);
  if (found) return `<span class="tag ${found.tagClass}">${found.id}</span>`;
  return '<span class="tag tag-gold">بانتظار التقييم</span>';
}

function renderSolidTab() {
  const sub = state.solidSubTab || 'new';
  ['New', 'Old', 'Mut', 'Logs'].forEach((k) => {
    const mapKey = k === 'Mut' ? 'mutashabihat' : k.toLowerCase();
    document.getElementById('solidTab' + k).classList.toggle('active', sub === mapKey);
    document.getElementById('solidPanel' + k).style.display = sub === mapKey ? 'block' : 'none';
  });

  const completedList = state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01);
  const activeGroups = state.newLinkingGroups.filter((g) => !g.archived);
  const archivedGroups = state.newLinkingGroups.filter((g) => g.archived);
  const totalNewPassages = activeGroups.reduce((s, g) => s + g.passages.length, 0);

  document.getElementById('solidBoxOldSummary').textContent = `${completedList.length} أجزاء`;
  document.getElementById('solidBoxNewSummary').textContent = `${totalNewPassages} مقاطع (${activeGroups.length} سورة)`;

  // تثبيت جديد
  const linkContainer = document.getElementById('linkingGroupsContainer');
  const linkAlert = document.getElementById('linkingAlertBanner');
  const dueGroup = activeGroups.find((g) => g.passages.length >= 3 && g.linkCount < Math.floor(g.passages.length / 2));
  linkAlert.innerHTML = dueGroup ? `
    <div class="alert-banner">
      <div><strong>جلسة تجميع وربط مقترحة لـ ${escapeHtml(dueGroup.surahName)}</strong> جمّعت فيها ${dueGroup.passages.length} مقاطع — اسردها متصلة لتتلاحم السورة.</div>
    </div>` : '';

  if (activeGroups.length === 0 && archivedGroups.length === 0) {
    linkContainer.innerHTML = `
      <div class="empty-state">
        قسم <strong>تثبيت الجديد</strong> بانتظار أول ورد تسمّعه من الرئيسية.
        <div style="margin-top:10px;"><button type="button" class="btn btn-gold btn-sm" onclick="switchTab('dashboard'); toggleNewWirdForm(true);">ابدأ الورد الأول</button></div>
      </div>`;
  } else {
    let html = '';
    activeGroups.forEach((g) => {
      const sumPages = g.passages.reduce((s, p) => s + p.pages, 0);
      const hasWeak = g.passages.some((p) => p.rating === 'جيد' || p.rating === 'يحتاج إعادة');
      const isMut = Array.isArray(g.tags) && g.tags.includes('متشابهات');
      html += `
        <div class="link-group-card ${hasWeak ? 'priority' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <strong style="font-size:0.97rem; color:var(--accent-hi);">${escapeHtml(g.surahName)} ${isMut ? '<span class="tag tag-warn">متشابهات</span>' : ''}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">
                ${g.passages.length} مقاطع (${formatNum(sumPages)} وجه) • مرات التثبيت: <strong>${g.linkCount}</strong>
                ${g.lastLinked ? ` • آخر تثبيت: ${g.lastLinked}` : ''}
              </div>
            </div>
            ${formatDueTag(g.nextReviewDate || todayStr())}
          </div>
          <div class="passage-chain">
            ${g.passages.map((p, idx) => {
              const weak = p.rating === 'جيد' || p.rating === 'يحتاج إعادة';
              return `<span class="passage-pill ${weak ? 'needs-work' : ''}">
                <span>${idx + 1}. ${escapeHtml(p.passage)} (${formatNum(p.pages)}) • ${escapeHtml(p.rating)}</span>
                <button type="button" onclick="removeLinkPassage('${g.id}','${p.id}')" aria-label="حذف المقطع" style="background:none;border:none;color:inherit;cursor:pointer;padding:0 4px;font-weight:900;">×</button>
              </span>`;
            }).join('')}
          </div>
          <div style="display:flex; gap:7px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('new', '${g.id}', '${escapeAttr(g.surahName)}')">+ تمت المراجعة والربط</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="openTimerModal('link')">مؤقت الربط (٦ د)</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleGroupMutTag('${g.id}')">${isMut ? 'إزالة المتشابهات' : '+ متشابهات'}</button>
            <button type="button" class="btn btn-success btn-sm" onclick="toggleArchiveLinkGroup('${g.id}')">تم إتقان السورة ✓</button>
          </div>
        </div>`;
    });
    if (archivedGroups.length > 0) {
      html += `<div style="margin-top:12px; font-size:0.83rem; font-weight:800; color:var(--success); margin-bottom:7px;">✓ سور تم إتقانها (${archivedGroups.length})</div>`;
      archivedGroups.forEach((g) => {
        html += `<div class="log-item"><div><strong style="font-size:0.9rem; color:var(--success);">${escapeHtml(g.surahName)}</strong><div style="font-size:0.78rem; color:var(--text-muted);">${g.passages.length} مقاطع • رُبطت ${g.linkCount} مرات</div></div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleArchiveLinkGroup('${g.id}')">إعادة</button></div>`;
      });
    }
    linkContainer.innerHTML = html;
  }

  // تثبيت قديم
  document.getElementById('solidCountBadge').textContent = `${completedList.length} أجزاء`;
  const solidEl = document.getElementById('solidBoxList');
  if (completedList.length === 0) {
    solidEl.innerHTML = '<div class="empty-state">قسم <strong>تثبيت القديم</strong> بانتظار أول جزء تكتمل مراجعته من خريطة الـ ٣٠ جزءاً.</div>';
  } else {
    solidEl.innerHTML = completedList.map((j) => {
      const meta = state.solidMeta[j.num] || { reviews: 0, lastReviewed: '', rating: '', nextReviewDate: todayStr(), weakPages: [] };
      const wp = Array.isArray(meta.weakPages) && meta.weakPages.length > 0 ? ` • أوجه متفلتة: ص ${meta.weakPages.join('، ')}` : '';
      return `
        <div class="log-item" style="align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="font-size:0.92rem;">${j.title}</strong>
              ${formatDueTag(meta.nextReviewDate || todayStr())}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px;">
              المراجعات: <strong style="color:var(--accent-hi);">${meta.reviews}</strong> • التقييم: <strong>${meta.rating || 'أول مراجعة'}</strong>${wp}
            </div>
          </div>
          <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('old', ${j.num}, '${escapeAttr(j.title)}')">+ راجعته</button>
        </div>`;
    }).join('');
  }

  // بنك المتشابهات (يشمل الأجزاء + مجموعات الربط + ملاحظات الشيخ والمقاطع الموسومة في سجل التسميع)
  const mutItems = [];
  state.juzList.forEach((j) => {
    const meta = state.solidMeta[j.num];
    const hasTag = Array.isArray(j.tags) && j.tags.includes('متشابهات');
    const hasWeak = meta && Array.isArray(meta.weakPages) && meta.weakPages.length > 0;
    if (hasTag || hasWeak || (j.note && j.note.includes('متشابه'))) {
      const canReview = !!meta;
      mutItems.push({
        title: j.title,
        sub: `${j.range}${hasWeak ? ` • أوجه متفلتة: ص ${meta.weakPages.join('، ')}` : ''}`,
        note: j.note || '',
        actionsHtml: `
          ${canReview ? `<button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('old', ${j.num}, '${escapeAttr(j.title)}')">تقييم ✓</button>` : ''}
          <button type="button" class="btn btn-ghost btn-sm" onclick="clearJuzMutAndWeak(${j.num})">${hasWeak ? 'تصفير المتفلت' : 'إزالة الوسم'}</button>
        `
      });
    }
  });
  state.newLinkingGroups.forEach((g) => {
    if (Array.isArray(g.tags) && g.tags.includes('متشابهات')) {
      mutItems.push({
        title: g.surahName,
        sub: `${g.passages.length} مقاطع موسومة بالمتشابهات`,
        note: '',
        actionsHtml: `
          <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('new', '${g.id}', '${escapeAttr(g.surahName)}')">تقييم الربط ✓</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="toggleGroupMutTag('${g.id}')">إزالة الوسم</button>
        `
      });
    }
  });
  state.maqraaLogs.forEach((log) => {
    const isTagged = Array.isArray(log.tags) && log.tags.includes('متشابهات');
    const hasNote = !!(log.note && log.note.trim());
    if (isTagged || hasNote) {
      mutItems.push({
        title: `${log.surahName} — ${log.passage}`,
        sub: `ملاحظة تسميع • الجزء ${log.juzNum} • ${log.date}`,
        note: log.note || 'موسوم ضمن بنك المتشابهات',
        actionsHtml: `
          <button type="button" class="btn btn-ghost btn-sm" onclick="clearLogMutAndNote('${log.id}')">إزالة من البنك</button>
        `
      });
    }
  });
  document.getElementById('mutCountBadge').textContent = `${mutItems.length} مواضع`;
  const mutEl = document.getElementById('mutashabihatList');
  if (mutItems.length === 0) {
    mutEl.innerHTML = '<div class="empty-state">لا توجد متشابهات أو ملاحظات مسجّلة بعد — أضف ملاحظة عند التسميع أو اضغط «+ متشابهات» على أي جزء لتجميعها هنا.</div>';
  } else {
    mutEl.innerHTML = mutItems.map((m) => `
      <div class="log-item" style="align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <strong style="color:var(--warn); font-size:0.92rem;">${escapeHtml(m.title)}</strong>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(m.sub)}</div>
          ${m.note ? `<div style="font-size:0.8rem; margin-top:3px;">📝 ${escapeHtml(m.note)}</div>` : ''}
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">${m.actionsHtml}</div>
      </div>`).join('');
  }

  // سجل التسميع
  document.getElementById('maqraaCountTag').textContent = `${state.maqraaLogs.length} حصص`;
  const logEl = document.getElementById('maqraaLogList');
  if (state.maqraaLogs.length === 0) {
    logEl.innerHTML = '<div class="empty-state">سجل حصص التسميع والتقييمات سيظهر هنا فور تأكيد أول تسميع.</div>';
  } else {
    logEl.innerHTML = state.maqraaLogs.map((item) => `
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
}

function addPassageToLinkingGroup(surahName, passage, pages, rating, date, tagMut = false) {
  const cleanName = surahName.trim();
  const next = computeSM2({ reps: 0, ease: SR_CONFIG.defaultEase, intervalDays: 1 }, rating, 0);
  let group = state.newLinkingGroups.find((g) => g.surahName === cleanName && !g.archived);
  if (!group) {
    group = {
      id: 'lg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      surahName: cleanName, archived: false, linkCount: 0,
      reps: next.reps, lapses: next.lapses, ease: next.ease,
      lastLinked: date, rating, intervalDays: next.intervalDays,
      nextReviewDate: addDaysStr(date, next.intervalDays),
      tags: tagMut ? ['متشابهات'] : [],
      passages: []
    };
    state.newLinkingGroups.unshift(group);
  } else {
    const candidateDate = addDaysStr(date, next.intervalDays);
    if (!group.nextReviewDate || candidateDate < group.nextReviewDate) {
      group.nextReviewDate = candidateDate;
      group.rating = rating;
    }
    if (tagMut && !group.tags.includes('متشابهات')) group.tags.push('متشابهات');
  }
  group.passages.push({
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    passage: passage.trim(), pages: Number(pages) || 1, rating, date
  });
}

function toggleGroupMutTag(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.tags = Array.isArray(g.tags) ? g.tags : [];
  if (g.tags.includes('متشابهات')) g.tags = g.tags.filter((t) => t !== 'متشابهات');
  else g.tags.push('متشابهات');
  saveState();
  renderAll();
}

function clearJuzMutAndWeak(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (j && Array.isArray(j.tags)) j.tags = j.tags.filter((t) => t !== 'متشابهات');
  if (state.solidMeta[juzNum]) state.solidMeta[juzNum].weakPages = [];
  saveState();
  renderAll();
  showToast('تم تنظيف الوسم والأوجه المتفلتة لهذا الجزء ✓');
}

function clearLogMutAndNote(logId) {
  const log = state.maqraaLogs.find((x) => x.id === logId);
  if (!log) return;
  log.tags = [];
  log.note = '';
  saveState();
  renderAll();
  showToast('تمت إزالة الملاحظة من بنك المتشابهات ✓');
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
  saveState();
  closeModal('manualLinkModal');
  document.getElementById('mlPassage').value = '';
  renderAll();
  showToast('أُضيف المقطع إلى صندوق التثبيت وجُدول تلقائياً ✓');
}

function removeLinkPassage(groupId, passageId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.passages = g.passages.filter((p) => p.id !== passageId);
  if (g.passages.length === 0) state.newLinkingGroups = state.newLinkingGroups.filter((x) => x.id !== groupId);
  saveState();
  renderAll();
}

function toggleArchiveLinkGroup(groupId) {
  const g = state.newLinkingGroups.find((x) => x.id === groupId);
  if (!g) return;
  g.archived = !g.archived;
  saveState();
  renderAll();
  showToast(g.archived ? `تم توثيق إتقان ${g.surahName} ✓` : `أُعيدت ${g.surahName} للتثبيت النشط`);
}

function deleteMaqraaLog(id) { state.maqraaLogs = state.maqraaLogs.filter((x) => x.id !== id); saveState(); renderAll(); }

// ================= 19. 30-JUZ MAP (WITH MUTASHABIHAT FILTER) =================
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
        (meta && Array.isArray(meta.weakPages) && meta.weakPages.length > 0) ||
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
            ${!completed
              ? `<button type="button" class="btn btn-success btn-sm" onclick="completeJuz(${j.num})">إتمام ✓</button>`
              : `<button type="button" class="btn btn-ghost btn-sm" onclick="resetJuz(${j.num})">إعادة فتح</button>`
            }
            ${!completed && !isActive ? `<button type="button" class="btn btn-gold btn-sm" onclick="setActiveRevJuz(${j.num})">ابدأ به الآن</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleJuzMutTag(${j.num})">${isMut ? 'إزالة المتشابهات' : '+ متشابهات'}</button>
            ${j.surahs && j.surahs.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm" onclick="toggleExpandJuz(${j.num})">${expanded ? 'السور ▲' : `السور (${j.surahs.length}) ▼`}</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" onclick="flipJuzTrack(${j.num})">نقل لـ ${j.track === 'new' ? 'المراجعة' : 'الجديد'}</button>
          </div>
          ${j.surahs && expanded ? `
            <div class="surah-list">
              ${j.surahs.map((s, idx) => `
                <button type="button" class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${j.num}, ${idx})">
                  <span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span>
                  <small>${formatNum(s.pages)}</small>
                </button>`).join('')}
            </div>` : ''}
          <div style="margin-top:8px;">
            <input type="text" value="${escapeAttr(j.note || '')}" placeholder="ملاحظة أو متشابهات..." onchange="updateJuzNote(${j.num}, this.value)" style="padding:8px 10px; font-size:0.82rem;" />
          </div>
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
  saveState();
  renderAll();
}

function flipJuzTrack(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.track = j.track === 'new' ? 'revision' : 'new';
  j.phase = j.track === 'new' ? 'مسار الحفظ الجديد' : 'مسار المراجعة';
  if (j.surahs) j.surahs.forEach((s) => { s.track = j.track; });
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function adjustJuzPages(juzNum, delta) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  const surahDonePages = (j.surahs || []).reduce((sum, s) => sum + (s.done ? Number(s.pages || 0) : 0), 0);
  const floorLogged = -(Number(j.basePages || 0) + surahDonePages);
  const ceilLogged = j.totalPages - (Number(j.basePages || 0) + surahDonePages);
  const nextLogged = Number(((j.loggedPages || 0) + delta).toFixed(2));
  j.loggedPages = Math.max(floorLogged, Math.min(ceilLogged, nextLogged));
  recomputeJuzProgress(j);
  if (delta > 0) touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function completeJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.loggedPages = Math.max(0, Number(j.loggedPages || 0));
  if (j.surahs) j.surahs.forEach((s) => { s.done = true; });
  recomputeJuzProgress(j);
  touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function resetJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.loggedPages = 0;
  j.basePages = 0;
  if (j.surahs) j.surahs.forEach((s) => { s.done = false; });
  recomputeJuzProgress(j);
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function toggleSurah(juzNum, idx) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j || !j.surahs || !j.surahs[idx]) return;
  const s = j.surahs[idx];
  // تأكيد عند تعليم سورة أكبر من ٥ أوجه لتجنب الضغط العارض
  if (!s.done && s.pages > 5) {
    if (!confirm(`سورة ${s.name} تبلغ ${formatNum(s.pages)} وجهاً في هذا الجزء — هل أتممتها بالكامل فعلاً؟`)) return;
  }
  s.done = !s.done;
  recomputeJuzProgress(j);
  if (s.done) touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function toggleExpandJuz(juzNum) { state.expandedJuz[juzNum] = !state.expandedJuz[juzNum]; saveState(); renderMap(); }
function updateJuzNote(juzNum, val) { const j = state.juzList.find((x) => x.num === juzNum); if (j) { j.note = val; saveState(); } }

function quickAddRevPage() {
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  if (!curRev) { showToast('ما شاء الله! جميع أجزاء المراجعة مكتملة في صندوق التثبيت'); return; }
  adjustJuzPages(curRev.num, 1);
  if (curRev.donePages < curRev.totalPages - 0.01) {
    showToast(`+١ وجه في ${curRev.title} (${formatNum(curRev.donePages)}/${curRev.totalPages})`);
  }
}

// ================= 20. SMART REMINDERS (ANDROID SW SAFE + .ICS EXPORT) =================
function buildSmartMessage(type) {
  const name = state.profile.name || 'حافظ القرآن';
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const activeS = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  const due = getDueItems();

  if (type === 'revision') {
    if (curRev) {
      const rem = formatNum(curRev.totalPages - curRev.donePages);
      return `يا ${name}، متبقّي ${rem} وجه وتتمّ ${curRev.title} — جلسة ١٢ دقيقة بمؤقت دكتور الصفحة تصنع فرقاً.`;
    }
    return `يا ${name}، جميع أجزاء المراجعة مكتملة — خصّص ١٠ دقائق لتثبيتها اليوم.`;
  }
  if (type === 'new') {
    if (state.activeWird) return `يا ${name}، وردك الجديد المسجّل: ${state.activeWird.surahName} (${state.activeWird.passage}) — راجعه واستعد للتسميع.`;
    return `يا ${name}، موعد وردك القادم في ${activeS ? `سورة ${activeS.name}` : 'الحفظ الجديد'} — سجّل مقطعك من الرئيسية.`;
  }
  if (due.length > 0) return `يا ${name}، لديك ${due.length} عناصر مستحقة في صندوق التثبيت اليوم — أهمها: ${due[0].title}.`;
  return `يا ${name}، ١٠ دقائق سرد سريع من صندوق التثبيت تحفظ لك تعب شهور.`;
}

function sendSafeSystemNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return Promise.resolve(false);
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then((reg) => {
        if (reg && typeof reg.showNotification === 'function') {
          return reg.showNotification(title, { body, icon: 'icon-192.png', dir: 'rtl', lang: 'ar' }).then(() => true);
        }
        return false;
      })
      .catch((err) => {
        console.warn('SW showNotification failed:', err);
        try { new Notification(title, { body, icon: 'icon-192.png' }); return true; } catch (e2) { console.warn(e2); return false; }
      });
  }
  try { new Notification(title, { body, icon: 'icon-192.png' }); return Promise.resolve(true); }
  catch (e) { console.warn('Notification constructor failed:', e); return Promise.resolve(false); }
}

function addReminder(e) {
  e.preventDefault();
  const time = document.getElementById('remTimeInput').value;
  const type = document.getElementById('remTypeInput').value;
  if (!time) return;
  state.reminders.push({ id: 'rem_' + Date.now(), time, type, enabled: true, lastTriggeredDate: '', lastNotifiedDate: '' });
  saveState();
  renderRemindersUI();
  showToast('تم حفظ موعد التذكير الذكي ✓');
}

function toggleReminder(id) { const r = state.reminders.find((x) => x.id === id); if (r) { r.enabled = !r.enabled; saveState(); renderRemindersUI(); } }
function deleteReminder(id) { state.reminders = state.reminders.filter((x) => x.id !== id); saveState(); renderRemindersUI(); }

function renderRemindersUI() {
  const el = document.getElementById('remindersList');
  if (!el) return;
  const typeLabels = { revision: 'مراجعة المحفوظ', new: 'حفظ جديد / تسميع', solid: 'صندوق التثبيت' };
  if (state.reminders.length === 0) {
    el.innerHTML = '<div class="empty-state">لا توجد مواعيد تذكير مفعّلة حالياً.</div>';
    return;
  }
  el.innerHTML = state.reminders.map((r) => `
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
  if (!('Notification' in window)) {
    if (!silent) showToast('المتصفح لا يدعم إشعارات النظام — ستظهر التذكيرات داخل التطبيق أو عبر ملف التقويم (.ics)');
    return;
  }
  Notification.requestPermission().then((res) => {
    if (!silent) showToast(res === 'granted' ? 'تم تفعيل إشعارات الجهاز بنجاح ✓' : 'ستظهر التذكيرات داخل التطبيق، ويمكنك تصدير ملف التقويم (.ics)');
  }).catch((e) => console.warn('Notification permission error:', e));
}

function testSmartNotification() {
  const msg = buildSmartMessage(state.reminders[0] ? state.reminders[0].type : 'solid');
  sendSafeSystemNotification('رفيق التثبيت', msg).then((sent) => {
    showToast(sent ? 'تم إرسال إشعار تجريبي على جهازك 🔔' : msg);
  });
}

function exportRemindersIcs() {
  const active = state.reminders.filter((r) => r.enabled);
  const list = active.length > 0 ? active : [{ time: document.getElementById('remTimeInput').value || '09:00', type: document.getElementById('remTypeInput').value || 'revision' }];
  const todayCompact = todayStr().replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rafiq Al-Tathbit//v7//AR',
    'CALSCALE:GREGORIAN'
  ];
  list.forEach((r, idx) => {
    const [hh, mm] = (r.time || '09:00').split(':');
    const startDT = `${todayCompact}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
    const endH = String(Math.min(23, Number(hh) + (Number(mm) + 15 >= 60 ? 1 : 0))).padStart(2, '0');
    const endM = String((Number(mm) + 15) % 60).padStart(2, '0');
    const endDT = `${todayCompact}T${endH}${endM}00`;
    const summary = r.type === 'solid' ? 'رفيق التثبيت — صندوق التثبيت' : (r.type === 'new' ? 'رفيق التثبيت — الحفظ الجديد' : 'رفيق التثبيت — مراجعة المحفوظ');
    lines.push(
      'BEGIN:VEVENT',
      `UID:rafiq-${todayCompact}-${idx}@rafiq.local`,
      `DTSTAMP:${todayCompact}T000000Z`,
      `DTSTART:${startDT}`,
      `DTEND:${endDT}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${summary}`,
      `DESCRIPTION:${buildSmartMessage(r.type).replace(/\n/g, ' ')}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      `DESCRIPTION:${summary}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rafiq_reminders_${todayStr()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تحميل ملف التقويم (.ics) — افتحه لإضافة التذكير اليومي لتقويم جهازك 📅');
}

function renderInAppReminderBanner() {
  const box = document.getElementById('inAppReminderBanner');
  if (!box || !state.reminders.length) { if (box) box.innerHTML = ''; return; }
  const now = new Date();
  const nowHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const activeDue = state.reminders.find((r) => r.enabled && r.time <= nowHHMM && r.lastTriggeredDate !== todayStr());
  if (activeDue) {
    box.innerHTML = `
      <div class="alert-banner">
        <div><strong>🔔 تذكير موعد ${activeDue.time}</strong>${escapeHtml(buildSmartMessage(activeDue.type))}</div>
        <button type="button" class="btn btn-outline btn-sm" onclick="dismissReminderToday('${activeDue.id}')">حسناً</button>
      </div>`;
  } else {
    box.innerHTML = '';
  }
}

function dismissReminderToday(id) {
  const r = state.reminders.find((x) => x.id === id);
  if (r) { r.lastTriggeredDate = todayStr(); saveState(); renderInAppReminderBanner(); }
}

function checkDueRemindersNow() {
  if (!state.onboarded || !state.reminders.length) return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const today = todayStr();
  let notifiedAny = false;
  state.reminders.forEach((r) => {
    if (r.enabled && r.time <= hhmm && r.lastTriggeredDate !== today) {
      if (r.lastNotifiedDate !== today) {
        r.lastNotifiedDate = today;
        notifiedAny = true;
        sendSafeSystemNotification('رفيق التثبيت', buildSmartMessage(r.type));
      }
      renderInAppReminderBanner();
    }
  });
  if (notifiedAny) saveState();
}

setInterval(checkDueRemindersNow, 45000);

// ================= 21. REAL-TIME TIMER (Date.now + WAKE LOCK + SINGLE AudioContext + VIBRATE) =================
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
  link: {
    total: 6 * 60,
    phases: [{ start: 0, end: 360, name: 'تثبيت الجديد — ربط السورة الطويلة', hint: 'اسرد مقاطعك الجديدة متصلة مع التركيز على نهايات وبدايات الأوجه (٦ دقائق)' }]
  },
  solid: {
    total: 10 * 60,
    phases: [{ start: 0, end: 600, name: 'تثبيت القديم — سرد سريع', hint: 'اقرأ ٤ إلى ٥ أوجه غيباً بسرعة متوازنة لتنشيط الذاكرة طويلة المدى (١٠ دقائق)' }]
  }
};

let timerMode = 'doctor';
let timerRemaining = TIMER_MODES.doctor.total;
let timerEndAt = null;
let timerInterval = null;
let lastPhaseIdx = 0;
let sharedAudioCtx = null;
let wakeLockSentinel = null;

function ensureAudioContext() {
  try {
    if (!sharedAudioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) sharedAudioCtx = new AC();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch (e) { console.warn('AudioContext init error:', e); }
}

function playChime() {
  const toggle = document.getElementById('timerSoundToggle');
  if (toggle && !toggle.checked) return;
  try {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  } catch (e) {}
  try {
    ensureAudioContext();
    if (!sharedAudioCtx) return;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, sharedAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(792, sharedAudioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.65);
    osc.connect(gain); gain.connect(sharedAudioCtx.destination);
    osc.start(); osc.stop(sharedAudioCtx.currentTime + 0.65);
  } catch (e) { console.warn('playChime error:', e); }
}

async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      const lbl = document.getElementById('wakeLockStatus');
      if (lbl) lbl.textContent = 'الشاشة مبقية مضاءة ✓';
      wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
    }
  } catch (e) { console.warn('WakeLock unavailable:', e); }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
    const lbl = document.getElementById('wakeLockStatus');
    if (lbl) lbl.textContent = '';
  }
}

function openTimerModal(mode = 'doctor') {
  if (!timerInterval) setTimerMode(mode);
  openModal('timerModal');
}

function setTimerMode(mode) {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEndAt = null;
  releaseWakeLock();
  timerMode = mode;
  timerRemaining = TIMER_MODES[mode].total;
  lastPhaseIdx = 0;
  document.getElementById('modeDoctor').classList.toggle('active', mode === 'doctor');
  document.getElementById('modeLink').classList.toggle('active', mode === 'link');
  document.getElementById('modeSolid').classList.toggle('active', mode === 'solid');
  document.getElementById('doctorPhasePills').style.display = mode === 'doctor' ? 'grid' : 'none';
  document.getElementById('timerDoneActionWrap').style.display = 'none';
  document.getElementById('timerStartBtn').textContent = 'ابدأ الجلسة';
  renderTimer();
}

function tickTimer() {
  if (!timerEndAt) return;
  const secsLeft = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
  timerRemaining = secsLeft;
  if (secsLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndAt = null;
    releaseWakeLock();
    document.getElementById('timerStartBtn').textContent = 'ابدأ من جديد';
    updateTimerDoneActionUI();
    playChime();
    sendSafeSystemNotification('رفيق التثبيت', 'انتهت جلسة المؤقت بنجاح! بارك الله في وقتك.');
    showToast('انتهت الجلسة بنجاح! يمكنك اعتماد الوجه الآن ✓');
  }
  renderTimer();
}

function toggleTimer() {
  ensureAudioContext();
  if (timerInterval) {
    tickTimer();
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndAt = null;
    releaseWakeLock();
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
  clearInterval(timerInterval);
  timerInterval = null;
  timerEndAt = null;
  releaseWakeLock();
  timerRemaining = TIMER_MODES[timerMode].total;
  lastPhaseIdx = 0;
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
    if (curRev) {
      btn.textContent = `اعتماد الوجه (+١ وجه في ${curRev.title}) ✓`;
      wrap.style.display = 'block';
    } else {
      wrap.style.display = 'none';
    }
  } else if (timerMode === 'link') {
    btn.textContent = 'تقييم ربط السورة في صندوق التثبيت ✓';
    wrap.style.display = 'block';
  } else {
    btn.textContent = 'تقييم مراجعة جزء من صندوق التثبيت ✓';
    wrap.style.display = 'block';
  }
}

function approveTimerPage() {
  document.getElementById('timerDoneActionWrap').style.display = 'none';
  closeModal('timerModal');
  if (timerMode === 'doctor') {
    quickAddRevPage();
  } else if (timerMode === 'link') {
    const dueLink = getDueItems().find((i) => i.kind === 'new');
    const firstGroup = state.newLinkingGroups.find((g) => !g.archived);
    if (dueLink) {
      openSrReviewModal('new', dueLink.id, dueLink.title, dueLink.overdueDays);
    } else if (firstGroup) {
      openSrReviewModal('new', firstGroup.id, firstGroup.surahName, 0);
    } else {
      switchTab('solid');
      setSolidTab('new');
    }
  } else {
    const dueOld = getDueItems().find((i) => i.kind === 'old');
    const firstComp = state.juzList.find((j) => j.donePages >= j.totalPages - 0.01);
    if (dueOld) {
      openSrReviewModal('old', dueOld.id, dueOld.title, dueOld.overdueDays);
    } else if (firstComp) {
      openSrReviewModal('old', firstComp.num, firstComp.title, 0);
    } else {
      switchTab('solid');
      setSolidTab('old');
    }
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
    if (timerInterval && timerEndAt) {
      tickTimer();
      acquireWakeLock();
    }
    checkDueRemindersNow();
  }
});
window.addEventListener('focus', checkDueRemindersNow);

// ================= 22. FLEXIBLE CALCULATOR (LINKED TO ACTUAL maqraaDays) =================
function updateCalculator() {
  const isKhatim = state.profile.mode === 'khatim';
  const newBlock = document.getElementById('calcNewPagesBlock');
  if (newBlock) newBlock.style.display = isKhatim ? 'none' : 'block';

  const sessionsPerWeek = state.profile.studyStyle === 'maqraa'
    ? Math.max(1, (state.profile.maqraaDays || []).length)
    : 2;
  const sessLbl = document.getElementById('calcSessionsLabel');
  if (sessLbl) sessLbl.textContent = `مقدار الجديد في الجلسة (${sessionsPerWeek} جلسات/أسبوع)`;

  const daily = parseInt(document.getElementById('calcDailyMin').value, 10) || 45;
  const newPerSession = isKhatim ? 0 : parseFloat(document.getElementById('calcNewPages').value);
  const nps = isNaN(newPerSession) ? 1 : newPerSession;
  state.calcDailyMin = daily;
  state.calcNewPages = nps;

  document.getElementById('calcMinVal').textContent = `${daily} دقيقة (${daily * 7} د/أسبوع)`;
  document.getElementById('calcNewPagesVal').textContent = `${nps} وجه/جلسة (${formatNum(nps * sessionsPerWeek)} وجه/أسبوع)`;

  const weeklyTotal = daily * 7;
  const newMin = nps * sessionsPerWeek * 45;
  const revPool = Math.max(0, weeklyTotal - newMin);
  const restoreMin = revPool * 0.75;
  const solidMin = revPool * 0.25;
  const netRevPages = restoreMin / 15;

  const remRevPages = state.juzList.filter((j) => j.track === 'revision').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);
  const remNewPages = state.juzList.filter((j) => j.track === 'new').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);

  document.getElementById('calcRevWeek').textContent = netRevPages > 0 ? `${netRevPages.toFixed(1)} وجه` : '0 وجه';
  document.getElementById('calcWeeksJuz').textContent = netRevPages >= 0.5 ? `${(20 / netRevPages).toFixed(1)} أسبوع` : 'متوقف';
  document.getElementById('calcOldMonths').textContent = remRevPages <= 0 ? 'مكتمل ✓' : (netRevPages >= 0.5 ? `${(remRevPages / (netRevPages * 4.33)).toFixed(1)} شهر` : '—');
  document.getElementById('calcNewMonths').textContent = (isKhatim || remNewPages <= 0) ? 'مكتمل ✓' : (nps > 0 ? `${(remNewPages / (nps * sessionsPerWeek * 4.33)).toFixed(1)} شهر` : 'متوقف');

  const denom = Math.max(weeklyTotal, newMin) || 1;
  const pNew = (Math.min(newMin, weeklyTotal) / denom) * 100;
  const pRes = (restoreMin / denom) * 100;
  const pSol = (solidMin / denom) * 100;
  const pDef = newMin > weeklyTotal ? ((newMin - weeklyTotal) / denom) * 100 : 0;

  document.getElementById('calcDistBar').innerHTML = `
    <div style="width:${pNew}%; background:var(--info);"></div>
    <div style="width:${pRes}%; background:var(--accent-grad);"></div>
    <div style="width:${pSol}%; background:var(--success);"></div>
    ${pDef > 0 ? `<div style="width:${pDef}%; background:var(--danger);"></div>` : ''}`;
  document.getElementById('calcDistLegend').innerHTML = `
    <span><i class="dot" style="background:var(--info)"></i>الجديد: ${Math.round(newMin)} د</span>
    <span><i class="dot" style="background:var(--accent-mid)"></i>المراجعة: ${Math.round(restoreMin)} د</span>
    <span><i class="dot" style="background:var(--success)"></i>التثبيت: ${Math.round(solidMin)} د</span>`;

  const badge = document.getElementById('calcModeBadge');
  const advice = document.getElementById('calcAdviceBox');
  if (weeklyTotal < newMin) {
    badge.textContent = 'عجز وقت';
    advice.innerHTML = '⚠️ وقتك اليومي أقل من المطلوب للجديد — قلّل مقدار الجديد أو زوّد الوقت اليومي.';
  } else if (netRevPages < 3) {
    badge.textContent = 'حماية فقط';
    advice.innerHTML = '🛡️ وضع الحماية: ركّز على تثبيت ما في صندوق التثبيت واستخدم وضع «وقتي مضغوط اليوم» عند الانشغال.';
  } else if (netRevPages < 8) {
    badge.textContent = 'متوازن';
    advice.innerHTML = '⚖️ إيقاع متوازن ومستقر يجمع بين التقدم في الجديد ومراجعة القديم.';
  } else {
    badge.textContent = 'إنجاز سريع';
    advice.innerHTML = '🚀 إيقاع ممتاز يتيح تقدماً سريعاً مع تثبيت متين ومستقر.';
  }
}

// ================= 23. JSON BACKUP, DOUBLE-CONFIRM RESET & PWA LIFECYCLE =================
function exportBackup() {
  state.lastBackupAt = todayStr();
  saveState();
  renderStorageAlerts();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rafiq_altathbit_v7_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تحميل النسخة الاحتياطية (JSON) بنجاح ✓');
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || (!Array.isArray(data.juzList) && !data.profile)) {
        throw new Error('بنية الملف غير صالحة');
      }
      if (!confirm('سيتم استبدال البيانات الحالية بمحتوى النسخة الاحتياطية (مع حفظ لقطة احتياطية تلقائية قبل ذلك). هل تريد المتابعة؟')) return;
      saveAutoSnapshot('قبل الاستيراد');
      corruptBackupKey = null;
      state = migrateState(data);
      syncPlanAndScheduleLive();
      applyTheme(state.profile.theme || 'royal', state.profile.customColors);
      saveState();
      document.getElementById('onboardingOverlay').classList.remove('active');
      renderAll();
      showToast('تم استعادة بياناتك بالكامل بنجاح ✓');
    } catch (err) {
      console.warn('importBackup error:', err);
      showToast('الملف غير صالح — اختر ملف نسخة احتياطية لرفيق التثبيت');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function openResetConfirmModal() {
  document.getElementById('resetConfirmInput').value = '';
  document.getElementById('confirmResetBtn').disabled = true;
  openModal('resetConfirmModal');
}

function executeResetAllData() {
  saveAutoSnapshot('قبل المسح الكامل');
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OB_DRAFT_KEY);
  corruptBackupKey = null;
  state = getEmptyState();
  closeModal('resetConfirmModal');
  openOnboarding(false);
  showToast('تم مسح البيانات — يمكنك بدء إعداد جديد الآن');
}

// Offline / Online banner
function updateOnlineStatus() {
  const b = document.getElementById('offlineBanner');
  if (b) b.classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// PWA Install Button + Installed State
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installPwaBtn');
  if (btn) { btn.style.display = 'inline-flex'; btn.textContent = 'تثبيت'; }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const btn = document.getElementById('installPwaBtn');
  if (btn) { btn.style.display = 'inline-flex'; btn.textContent = '✓ مثبّت'; btn.disabled = true; }
});

function promptInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}

// Service Worker registration + Update banner
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

// Global fatal error shield
window.onerror = function (msg) {
  console.warn('Global error caught:', msg);
  const fb = document.getElementById('fatalErrorFallback');
  if (fb) {
    fb.style.display = 'block';
    const m = document.getElementById('fatalErrorMsg');
    if (m) m.textContent = 'حدث خطأ تقني بسيط؛ يمكنك إعادة تحميل التطبيق أو تصدير بياناتك المحفوظة بأمان.';
  }
};

// Export pure core helpers for automated testing (tests.html & Node)
window.RafiqCore = {
  formatLocalDate, todayStr, addDaysStr, diffDaysFromToday,
  computeSM2, recomputeJuzProgress, migrateState,
  buildPersonalizedPlan, buildLiveSchedule,
  resolveActiveRevJuz, resolveActiveNewSurah
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
