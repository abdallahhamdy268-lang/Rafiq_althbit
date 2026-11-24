// ==========================================================================
// رفيق التثبيت v6.1 — محرك الخطة الحية والتشخيص المتفرّع والتحكم الحر الكامل
// ==========================================================================

const STORAGE_KEY = 'rafiq_altathbit_v6';
const LEGACY_KEYS = ['rafiq_altathbit_smart_v5', 'rafiq_altathbit_khatma_v4'];

const CUSTOM_CSS_VARS = [
  '--bg-deep', '--bg-grad-1', '--bg-grad-2', '--bg-card', '--bg-card-end',
  '--bg-card-2', '--bg-hero-start', '--bg-hero-end', '--bg-header', '--bg-nav',
  '--bg-input', '--bg-surface', '--bg-surface-strong', '--border-subtle',
  '--accent-hi', '--accent-mid', '--accent-deep', '--accent-grad',
  '--accent-soft', '--accent-border', '--accent-border-strong',
  '--btn-primary-text', '--text-main', '--text-muted', '--text-dim',
  '--ring-track', '--shadow-card'
];

// ================= DATE & SPACED REPETITION HELPERS =================
function todayStr() { return new Date().toISOString().slice(0, 10); }

function addDaysStr(baseStr, days) {
  const d = new Date(baseStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDaysFromToday(targetDateStr) {
  if (!targetDateStr) return 0;
  const a = new Date(todayStr() + 'T00:00:00');
  const b = new Date(targetDateStr + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function computeNextInterval(rating, prevRating, prevInterval) {
  if (rating === 'يحتاج إعادة') return 1;
  if (rating === 'جيد') return 4;
  if (rating === 'جيد جداً') return 8;
  if (prevRating === 'ممتاز' && (prevInterval || 0) >= 14) return 25;
  return 14;
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

// ================= COLOR & CONTRAST ENGINE =================
function hexToRgb(hex) {
  const clean = String(hex || '#00112B').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
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
  const textMuted = mixHex(textMain, bgHex, isDark ? 0.68 : 0.66);
  const textDim = mixHex(textMain, bgHex, 0.48);
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
    '--bg-header': rgbaStr(bgHex, 0.93),
    '--bg-nav': rgbaStr(isDark ? mixHex('#000000', bgHex, 0.15) : bgCard, 0.97),
    '--bg-input': bgInput,
    '--bg-surface': rgbaStr(textMain, 0.045),
    '--bg-surface-strong': rgbaStr(isDark ? '#000000' : textMain, isDark ? 0.44 : 0.07),
    '--border-subtle': rgbaStr(textMain, 0.16),
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
    '--ring-track': rgbaStr(textMain, 0.11),
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

// ================= STATE MANAGEMENT =================
function getEmptyState() {
  return {
    version: 6,
    onboarded: false,
    welcomeDismissed: false,
    profile: {
      name: '',
      username: '',
      theme: 'royal',
      customColors: { bg: '#00112B', accent: '#D0A151' },
      mode: 'from_nas',             // from_nas | from_baqarah | beginner | khatim | scattered
      stopSurahNum: 78,             // السورة التي يقف عندها المستخدم
      stopSurahCompleted: false,    // الافتراضي: ما زال يحفظ فيها (حتى يبدأ منها مباشرة لا من التي بعدها)
      beginnerDir: 'from_nas',      // from_nas | from_baqarah
      khatimStart: 'from_baqarah',  // from_baqarah | from_nas | specific_juz
      khatimSpecificJuz: [1, 2, 3],
      scatteredSurahs: [],
      scatteredContinue: 'org_nas', // keep_scattered | org_nas | org_baqarah
      revStartMode: 'auto',         // auto | from_nas | from_baqarah | custom_juz
      revStartJuz: 30,              // بداية المراجعة المختارة من المستخدم (حتى لو من المنتصف)
      stability: 'weak',
      dailyMin: 45,
      studyStyle: 'solo',
      maqraaDays: ['mon', 'thu'],
      pagesPerSession: 1
    },
    activeRevJuzNum: null,          // الجزء النشط حالياً للمراجعة (قابل للتغيير في أي وقت)
    activeNewSurahNum: null,        // السورة النشطة حالياً للحفظ الجديد (تثبت مع المستخدم حتى يتمها أو يغيرها)
    surahNewProgress: {},           // { [surahNum]: pagesLogged } لتتبع التقدم داخل السورة الواحدة
    juzList: [],
    schedule: [],                   // { id, jsDay, name, maqraa, main, second, solid, mDone, eDone, sDone, customEdited }
    weekArchives: [],
    solidMeta: {},
    activeWird: null,
    maqraaLogs: [],
    newLinkingGroups: [],
    reminders: [],
    busyDayDate: '',
    busyTasksDone: { t1: false, t2: false },
    streak: { count: 0, lastDate: '' },
    mapFilter: 'revision',
    solidSubTab: 'new',
    expandedJuz: {},
    calcDailyMin: 45,
    calcNewPages: 1
  };
}

let state = loadState();
let editingDayId = null;
let selectedRating = 'ممتاز';
let selectedSrRating = 'ممتاز';
let srTarget = null;
let surahSearchQuery = '';
let quickFocusSearch = '';
let newWirdFormOpen = false;
let obShowRevStartPicker = false;

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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const empty = getEmptyState();
      return {
        ...empty,
        ...parsed,
        profile: {
          ...empty.profile,
          ...(parsed.profile || {}),
          customColors: {
            ...empty.profile.customColors,
            ...((parsed.profile && parsed.profile.customColors) || {})
          }
        },
        surahNewProgress: parsed.surahNewProgress || {},
        reminders: parsed.reminders || [],
        busyTasksDone: parsed.busyTasksDone || { t1: false, t2: false }
      };
    }
  } catch (e) {}
  return getEmptyState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ================= DIAGNOSTIC & ACTIVE-TARGET ENGINE =================
function getEffectiveDirection(profile) {
  if (profile.mode === 'from_nas') return 'from_nas';
  if (profile.mode === 'from_baqarah') return 'from_baqarah';
  if (profile.mode === 'beginner') return profile.beginnerDir || 'from_nas';
  if (profile.mode === 'khatim') return profile.khatimStart === 'from_nas' ? 'from_nas' : 'from_baqarah';
  if (profile.mode === 'scattered') {
    return profile.scatteredContinue === 'org_baqarah' ? 'from_baqarah' : 'from_nas';
  }
  return 'from_nas';
}

// السور المحفوظة سابقاً (قبل موضع الحفظ الجديد)
function getDiagnosedMemorizedSet(profile) {
  const set = new Set();
  if (profile.mode === 'khatim') {
    SURAHS_DB.forEach((s) => set.add(s.num));
    return set;
  }
  if (profile.mode === 'beginner') return set;
  if (profile.mode === 'scattered') {
    (profile.scatteredSurahs || []).forEach((n) => set.add(Number(n)));
    return set;
  }
  const stop = Number(profile.stopSurahNum) || (profile.mode === 'from_nas' ? 114 : 1);
  const includeStop = profile.stopSurahCompleted === true;
  if (profile.mode === 'from_nas') {
    SURAHS_DB.forEach((s) => {
      if (s.num > stop || (includeStop && s.num === stop)) set.add(s.num);
    });
  } else if (profile.mode === 'from_baqarah') {
    SURAHS_DB.forEach((s) => {
      if (s.num < stop || (includeStop && s.num === stop)) set.add(s.num);
    });
  }
  return set;
}

// حساب السورة النشطة للحفظ الجديد بدقة تامة (بدون القفز على السورة المختارة أو تجاوز السور الحدودية!)
function resolveActiveNewSurah(profile, juzList, preferredSurahNum) {
  if (profile.mode === 'khatim') return null;

  const isSurahDoneInMap = (num) => {
    if (!juzList || juzList.length !== 30) return false;
    const entries = [];
    juzList.forEach((j) => {
      (j.surahs || []).forEach((s) => {
        if (s.num === num) entries.push(s);
      });
    });
    return entries.length > 0 && entries.every((e) => e.done);
  };

  // 1) إذا اختار المستخدم سورة نشطة بنفسه ولم يتمّها بعد، نبقى عليها دون إجبار أو قفز!
  if (preferredSurahNum) {
    const pref = getSurahByNum(preferredSurahNum);
    if (pref && !isSurahDoneInMap(pref.num)) {
      return pref;
    }
  }

  // 2) البحث في السور ذات مسار 'new' بالترتيب الصحيح على مستوى الـ ١١٤ سورة (لا يُغفل الأجزاء المشتركة مثل الجزء ١١!)
  const dir = getEffectiveDirection(profile);
  const orderedAll = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];

  if (juzList && juzList.length === 30) {
    const surahStatus = new Map(); // num -> { hasNew, allDone }
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

  // 3) عند المعاينة قبل بناء الخريطة: أول سورة غير موجودة في المحفوظ السابق
  const memSet = getDiagnosedMemorizedSet(profile);
  return orderedAll.find((s) => !memSet.has(s.num)) || null;
}

// حساب الجزء النشط للمراجعة (يحترم اختيار المستخدم أولاً، وينتقل تلقائياً للجزء التالي عند إتمامه!)
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
  const memSurahs = SURAHS_DB.filter((s) => memSet.has(s.num));
  const memPages = Math.min(604, Number(memSurahs.reduce((sum, s) => sum + s.pages, 0).toFixed(1)));

  let completedJuzCount = 0;
  JUZ_DB.forEach((j) => {
    const jSurahs = getJuzSurahs(j.num);
    if (jSurahs.length > 0 && jSurahs.every((s) => memSet.has(s.num))) {
      completedJuzCount++;
    }
  });

  const nextSurah = resolveActiveNewSurah(profile, null, null);
  return {
    memCount: memSurahs.length,
    memPages,
    completedJuzCount,
    remPages: Math.max(0, Number((604 - memPages).toFixed(1))),
    nextSurah
  };
}

// ترتيب الأجزاء حسب اختيار المستخدم لبداية المراجعة (من الناس / من البقرة / من المنتصف أو جزء محدد)
function orderJuzForRevision(juzList, profile) {
  const revMode = profile.revStartMode || 'auto';
  const dir = getEffectiveDirection(profile);

  // للخاتم الذي اختار أجزاء محددة
  if (profile.mode === 'khatim' && profile.khatimStart === 'specific_juz') {
    const pNums = (profile.khatimSpecificJuz || []).map(Number);
    const pSet = new Set(pNums);
    const first = pNums.map((n) => juzList.find((j) => j.num === n)).filter(Boolean);
    const rest = juzList.filter((j) => !pSet.has(j.num));
    return [...first, ...rest];
  }

  // فصل أجزاء المراجعة عن أجزاء الجديد لترتيب كل مسار بدقة
  const revJuzs = juzList.filter((j) => j.track === 'revision');
  const newJuzs = juzList.filter((j) => j.track === 'new');

  if (revMode === 'from_baqarah') {
    revJuzs.sort((a, b) => a.num - b.num);
  } else if (revMode === 'from_nas') {
    revJuzs.sort((a, b) => b.num - a.num);
  } else if (revMode === 'custom_juz' && profile.revStartJuz) {
    const startNum = Number(profile.revStartJuz);
    // نبدأ من الجزء المختار بالضبط ثم نكمل في اتجاه المستخدم
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

// بناء خريطة الـ ٣٠ جزءاً بسورها الكاملة (١١٤ سورة) بدقة على مستوى كل سورة
function buildPersonalizedPlan(profile) {
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
    const allMemorized = profile.mode === 'khatim' || (jSurahsOrdered.length > 0 && memInJuz.length === jSurahsOrdered.length);

    // الجزء الحدودي (مثلاً جزء ١١ فيه هود محفوظ ويونس جديد) يحفظ لكل سورة مسارها الخاص!
    const juzTrack = hasMemorized ? 'revision' : 'new';

    const surahs = jSurahsOrdered.map((s) => {
      const pInJuz = Number(getSurahPagesInJuz(s, jRaw).toFixed(2));
      const wasMem = memSet.has(s.num);
      const sTrack = (profile.mode === 'khatim' || wasMem) ? 'revision' : 'new';
      const done = wasMem && stability === 'solid';
      return {
        num: s.num,
        name: s.name,
        pages: pInJuz,
        track: sTrack,
        wasMemorized: wasMem,
        done
      };
    });

    let donePages = 0;
    if (juzTrack === 'revision') {
      const memPagesInJuz = Math.min(
        jRaw.totalPages,
        surahs.reduce((sum, s) => sum + (s.wasMemorized ? s.pages : 0), 0)
      );
      if (stability === 'solid') {
        donePages = allMemorized ? jRaw.totalPages : Number(memPagesInJuz.toFixed(1));
      } else if (stability === 'medium') {
        donePages = Number((memPagesInJuz * 0.5).toFixed(1));
      }
    }

    return {
      num: jRaw.num,
      title: jRaw.title,
      range: jRaw.range,
      totalPages: jRaw.totalPages,
      track: juzTrack,
      phase: '',
      donePages,
      basePages: 0,
      surahs,
      note: ''
    };
  });

  const juzList = orderJuzForRevision(rawList, profile);

  // تعيين المراحل وصندوق التثبيت للأجزاء المكتملة
  let revIdx = 0;
  juzList.forEach((j) => {
    if (j.track === 'revision') {
      revIdx++;
      if (j.donePages >= j.totalPages - 0.01) {
        solidMeta[j.num] = {
          reviews: 1,
          lastReviewed: today,
          rating: 'ممتاز',
          intervalDays: 14,
          nextReviewDate: addDaysStr(today, ((revIdx - 1) % 14) + 1),
          addedAt: today
        };
      }
      if (profile.mode === 'khatim') {
        if (profile.khatimStart === 'specific_juz' && (profile.khatimSpecificJuz || []).includes(j.num)) {
          j.phase = 'الدورة الأولى: الأجزاء المختارة';
        } else {
          j.phase = revIdx <= 10 ? 'المرحلة ١: الثلث الأول من الدورة' : (revIdx <= 20 ? 'المرحلة ٢: الثلث الثاني' : 'المرحلة ٣: تمام الختمة');
        }
      } else if (profile.mode === 'scattered') {
        j.phase = 'مسار مراجعة وترميم السور المحفوظة';
      } else {
        j.phase = revIdx <= 5 ? 'المرحلة ١: البداية السريعة في المراجعة' : (revIdx <= 14 ? 'المرحلة ٢: التدرّج المتوازن' : 'المرحلة ٣: استكمال المراجعة');
      }
    } else {
      j.phase = dir === 'from_baqarah'
        ? 'مسار الحفظ الجديد (من البقرة نحو الناس)'
        : 'مسار الحفظ الجديد (من الناس نحو البقرة)';
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

// ================= LIVE REACTIVE SCHEDULE ENGINE =================
// يولّد الجدول الأسبوعي بأسماء السور والأجزاء والأوجه الحقيقية، ويتحدث تلقائياً مع كل تقدم أو تبديل!
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
  // وضع الجزء النشط أولاً في قائمة المراجعة
  const revOrdered = activeRev
    ? [activeRev, ...revPendingAll.filter((j) => j.num !== activeRev.num)]
    : revPendingAll;

  const activeNewSurah = resolveActiveNewSurah(profile, juzList, activeNewSurahNum);
  const nextSurahLabel = activeNewSurah
    ? `سورة ${activeNewSurah.name} (الجزء ${activeNewSurah.juz})`
    : 'الورد الجديد التالي';

  const getRevLabelForDay = (dayIdx) => {
    if (revOrdered.length === 0) return null;
    const targetJuz = isKhatim ? revOrdered[dayIdx % revOrdered.length] : revOrdered[0];
    const undoneSurahs = (targetJuz.surahs || []).filter((s) => !s.done && (isKhatim || s.track === 'revision'));
    const names = (undoneSurahs.length > 0 ? undoneSurahs : (targetJuz.surahs || []))
      .slice(0, 3)
      .map((s) => s.name)
      .join('، ');
    return `${targetJuz.title}${names ? ` (${names})` : ''}`;
  };

  // الأجزاء المكتملة التي انتقلت فعلاً لصندوق التثبيت
  const completedJuz = (juzList || []).filter((j) => j.donePages >= j.totalPages - 0.01);
  const solidSample = completedJuz.length > 0
    ? completedJuz.slice(0, 2).map((j) => j.title).join(' و')
    : (activeNewSurah ? `ربط مقاطع سورة ${activeNewSurah.name}` : 'المستحق في صندوق التثبيت');

  return DAYS_META.map((dm, idx) => {
    const prev = existingSchedule ? existingSchedule.find((d) => d.id === dm.id) : null;
    // إذا عدّل المستخدم هذا اليوم يدوياً، نحترم تعديله اليدوي!
    if (prev && prev.customEdited) {
      return { ...prev };
    }

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
        ? `تجميع ومراجعة شاملة لأوراد الأسبوع في ${revLabel || 'دورتك الحالية'} (${mainMin} د)`
        : `مراجعة ${kPages} أوجه من ${revLabel || 'دورة المراجعة'} (${mainMin} د)`;
      secondText = isMq
        ? `تسميع ورد ${revLabel || 'المراجعة'} في المقرأة + تسجيل التقييم`
        : `اختبار غيبي سريع وربط المتشابهات في ${revLabel || 'الجزء النشط'} (${secMin} د)`;
      solidText = `صندوق التثبيت: سرد سريع لـ ${solidSample} (${solMin} د)`;
    } else if (isBeginner || !revLabel) {
      if (isMq) {
        mainText = `مراجعة وتثبيت ${pagesPerSess} وجه من ${nextSurahLabel} قبل التسميع (${mainMin} د)`;
        secondText = `تسميع ورد ${nextSurahLabel} + تسجيل التقييم في التطبيق`;
      } else if (dm.id === 'fri') {
        mainText = `تجميع ومراجعة ما حُفظ خلال الأسبوع من ${nextSurahLabel} (${mainMin} د)`;
        secondText = `تسميع ذاتي متصل لمقاطع ${nextSurahLabel} (${secMin} د)`;
      } else {
        mainText = `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} (${mainMin} د)`;
        secondText = `تسميع غيبي وربط الورد بما قبله في ${nextSurahLabel} (${secMin} د)`;
      }
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    } else if (isMq) {
      mainText = `مراجعة ${pagesPerSess} وجه من ${nextSurahLabel} + ترميم وجهين من ${revLabel} (${mainMin} د)`;
      secondText = `تسميع ورد ${nextSurahLabel} (${pagesPerSess} وجه) + تسجيل التقييم`;
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    } else if (isPrepDay) {
      mainText = `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} بتركيز (${mainMin} د)`;
      secondText = `ربط الورد الجديد بالمقاطع السابقة في ${nextSurahLabel} (${secMin} د)`;
      solidText = `صندوق التثبيت: سرد سريع لـ ${solidSample} (${solMin} د)`;
    } else if (dm.id === 'fri') {
      mainText = `ترميم ${revPagesPerDay} أوجه من ${revLabel} أو تعويض ما فات (${mainMin} د)`;
      secondText = `تجميع ومراجعة مقاطع ${nextSurahLabel} خلال الأسبوع (${secMin} د)`;
      solidText = `صندوق التثبيت: مراجعة المستحق اليوم من ${solidSample} (${solMin} د)`;
    } else {
      const soloNewDay = !hasMaqraa && (dm.id === 'sun' || dm.id === 'wed');
      mainText = soloNewDay
        ? `حفظ ${pagesPerSess} وجه جديد من ${nextSurahLabel} (${mainMin} د)`
        : `ترميم ${revPagesPerDay} أوجه من ${revLabel} (${mainMin} د)`;
      secondText = soloNewDay
        ? `تسميع ذاتي وربط ${nextSurahLabel} بالمقطع السابق (${secMin} د)`
        : `اختبار غيبي سريع في ${revLabel} (${secMin} د)`;
      solidText = `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    }

    return {
      id: dm.id,
      jsDay: dm.jsDay,
      name: dm.name,
      maqraa: isMq,
      main: mainText,
      second: secondText,
      solid: solidText,
      mDone: prev ? !!prev.mDone : false,
      eDone: prev ? !!prev.eDone : false,
      sDone: prev ? !!prev.sDone : false,
      customEdited: false
    };
  });
}

// مزامنة تلقائية للخطة والجدول بعد أي تغيير (إتمام جزء، تبديل جزء مراجعة، تغيير سورة، تسميع ورد)
function syncPlanAndScheduleLive() {
  if (!state.onboarded || !state.juzList || state.juzList.length !== 30) return;

  // 1. إذا اكتمل الجزء النشط للمراجعة، ينتقل تلقائياً للجزء التالي غير المكتمل
  const resolvedRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  state.activeRevJuzNum = resolvedRev ? resolvedRev.num : null;

  // 2. إذا اكتملت السورة النشطة للجديد، ينتقل تلقائياً للسورة التالية غير المكتملة
  const resolvedNew = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  state.activeNewSurahNum = resolvedNew ? resolvedNew.num : null;

  // 3. تحديث الجدول الأسبوعي حياً مع الحفاظ على علامات الإنجاز والتعديلات اليدوية
  state.schedule = buildLiveSchedule(
    state.profile,
    state.juzList,
    state.activeRevJuzNum,
    state.activeNewSurahNum,
    state.schedule
  );
}

// ================= LEGACY DATA IMPORT (v4 & v5) =================
function findLegacyStorageKey() {
  for (const key of LEGACY_KEYS) {
    if (localStorage.getItem(key)) return key;
  }
  return null;
}

function migrateLegacyObject(old) {
  const today = todayStr();
  const base = getEmptyState();
  const oldProfile = old.profile || {};
  const oldJuzMap = {};
  (old.juzList || []).forEach((j) => { oldJuzMap[j.num] = j; });

  const dir = oldProfile.mode === 'from_baqarah' ? 'from_baqarah' : 'from_nas';
  const ordered = dir === 'from_baqarah'
    ? [...JUZ_DB].sort((a, b) => a.num - b.num)
    : [...JUZ_DB].sort((a, b) => b.num - a.num);

  const juzList = ordered.map((jRaw) => {
    const prev = oldJuzMap[jRaw.num];
    const jSurahs = getJuzSurahs(jRaw.num);
    const jSurahsOrd = dir === 'from_nas' ? [...jSurahs].reverse() : [...jSurahs];
    const donePages = prev ? Math.min(jRaw.totalPages, Number(prev.donePages) || 0) : 0;
    const isComplete = donePages >= jRaw.totalPages - 0.01;
    const prevSurahDoneNames = new Set(
      ((prev && prev.surahs) || []).filter((s) => s.done).map((s) => s.name)
    );
    const jTrack = prev ? (prev.track || 'revision') : 'revision';

    return {
      num: jRaw.num,
      title: jRaw.title,
      range: jRaw.range,
      totalPages: jRaw.totalPages,
      track: jTrack,
      phase: prev ? (prev.phase || 'مسار المراجعة') : 'مسار المراجعة',
      donePages,
      basePages: prev ? (prev.basePages || 0) : 0,
      surahs: jSurahsOrd.map((s) => ({
        num: s.num,
        name: s.name,
        pages: Number(getSurahPagesInJuz(s, jRaw).toFixed(2)),
        track: jTrack,
        wasMemorized: jTrack === 'revision',
        done: isComplete || prevSurahDoneNames.has(s.name)
      })),
      note: prev ? (prev.note || '') : ''
    };
  });

  const solidMeta = {};
  if (old.solidMeta) {
    Object.keys(old.solidMeta).forEach((k) => {
      const m = old.solidMeta[k];
      solidMeta[k] = {
        reviews: m.reviews || 0,
        lastReviewed: m.lastReviewed || today,
        rating: m.rating || 'جيد جداً',
        intervalDays: m.intervalDays || 8,
        nextReviewDate: m.nextReviewDate || addDaysStr(m.lastReviewed || today, m.intervalDays || 8),
        addedAt: m.addedAt || today
      };
    });
  }

  const newLinkingGroups = (old.newLinkingGroups || []).map((g) => ({
    ...g,
    rating: g.rating || 'جيد جداً',
    intervalDays: g.intervalDays || 4,
    nextReviewDate: g.nextReviewDate || addDaysStr(g.lastLinked || today, g.intervalDays || 4)
  }));

  const profile = {
    ...base.profile,
    ...oldProfile,
    name: oldProfile.name || (document.getElementById('obName') && document.getElementById('obName').value.trim()) || 'حافظ القرآن',
    theme: THEMES.some((t) => t.id === oldProfile.theme) || oldProfile.theme === 'custom' ? oldProfile.theme : 'royal',
    mode: ['from_nas', 'from_baqarah', 'beginner', 'khatim', 'scattered'].includes(oldProfile.mode)
      ? oldProfile.mode
      : (oldProfile.mode === 'custom' ? 'scattered' : 'from_nas'),
    dailyMin: oldProfile.dailyMin || old.calcDailyMin || 45,
    pagesPerSession: oldProfile.pagesPerSession || old.calcNewPages || 1
  };

  const actRev = resolveActiveRevJuz(juzList, null);
  const actNew = resolveActiveNewSurah(profile, juzList, null);

  return {
    ...base,
    onboarded: true,
    profile,
    activeRevJuzNum: actRev ? actRev.num : null,
    activeNewSurahNum: actNew ? actNew.num : null,
    juzList,
    schedule: buildLiveSchedule(profile, juzList, actRev ? actRev.num : null, actNew ? actNew.num : null, null),
    weekArchives: old.weekArchives || [],
    solidMeta,
    activeWird: old.activeWird || null,
    maqraaLogs: old.maqraaLogs || [],
    newLinkingGroups,
    reminders: old.reminders || [],
    streak: old.streak || { count: 0, lastDate: '' },
    calcDailyMin: old.calcDailyMin || profile.dailyMin,
    calcNewPages: old.calcNewPages ?? profile.pagesPerSession
  };
}

function importLegacyFromStorage() {
  const key = findLegacyStorageKey();
  if (!key) {
    showToast('لا توجد بيانات محفوظة من النسخ السابقة على هذا الجهاز');
    return;
  }
  try {
    const old = JSON.parse(localStorage.getItem(key));
    state = migrateLegacyObject(old);
    applyTheme(state.profile.theme, state.profile.customColors);
    saveState();
    document.getElementById('onboardingOverlay').classList.remove('active');
    renderAll();
    showToast(`تم استيراد بياناتك من (${key === 'rafiq_altathbit_smart_v5' ? 'v5' : 'v4'}) بنجاح ✓`);
  } catch (e) {
    showToast('تعذّر قراءة بيانات النسخة السابقة — يمكنك البدء بالتشخيص الذكي');
  }
}

// ================= THEMES UI =================
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
      <strong style="display:block; font-size:0.81rem; color:var(--text-main);">${t.name}</strong>
      <small style="font-size:0.7rem; color:var(--text-muted);">${t.desc}</small>
    </button>
  `).join('') + `
    <button type="button" class="theme-tile ${current === 'custom' ? 'selected' : ''}" onclick="setTheme('custom')">
      <div class="theme-swatches">
        <span class="swatch" style="background:${cc.bg};"></span>
        <span class="swatch" style="background:${cc.accent};"></span>
      </div>
      <strong style="display:block; font-size:0.81rem; color:var(--text-main);">تخصيص حر</strong>
      <small style="font-size:0.7rem; color:var(--text-muted);">اختر ألوانك بتباين تلقائي</small>
    </button>
  `;

  const ratio = getContrastRatio(cc.bg, cc.accent);
  const contrastMsg = ratio >= 4.5
    ? `<span class="tag tag-success">تباين مريح للقراءة (${ratio.toFixed(1)}:1)</span>`
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

  ['ob', 'settings'].forEach((prefix) => {
    const g = document.getElementById(prefix + 'ThemeGrid');
    const c = document.getElementById(prefix + 'CustomThemeContainer');
    if (g) g.innerHTML = tilesHtml;
    if (c) c.innerHTML = customBoxHtml;
  });
}

// ================= SMART BRANCHING ONBOARDING =================
function openOnboarding(isEditing = false) {
  obDraft.isEditing = isEditing;
  obDraft.step = 1;
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
    document.getElementById('obUsername').value = state.profile.username || '';
  }

  document.getElementById('obDailyMin').value = obDraft.dailyMin || 45;
  document.getElementById('obTimeVal').textContent = (obDraft.dailyMin || 45) + ' دقيقة';
  document.getElementById('obPagesPerSession').value = obDraft.pagesPerSession || 1;

  const legacyKey = findLegacyStorageKey();
  const migBanner = document.getElementById('obMigrationBanner');
  if (!isEditing && legacyKey) {
    const vLabel = legacyKey === 'rafiq_altathbit_smart_v5' ? 'النسخة v5' : 'النسخة v4';
    migBanner.innerHTML = `
      <div class="alert-banner" style="justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div>
          <strong>تم العثور على بياناتك المحفوظة من ${vLabel}</strong>
          يمكنك استيراد تقدمك وسجل تسميعك مباشرة دون فقدان أي بيانات.
        </div>
        <button type="button" class="btn btn-gold btn-sm" onclick="importLegacyFromStorage()">استيراد والمتابعة الآن</button>
      </div>`;
  } else {
    migBanner.innerHTML = '';
  }

  renderThemeGrids();
  renderObStep2();
  renderObStep3();
  renderObStep4();
  obNext(1);
  document.getElementById('onboardingOverlay').classList.add('active');
}

function renderObStep2() {
  const modes = [
    { id: 'from_nas', title: 'بدأت الحفظ من الناس إلى البقرة (تصاعدياً)', sub: 'تحدد السورة التي تحفظ فيها الآن، وتختار من أين تبدأ مراجعة القديم بحرية' },
    { id: 'from_baqarah', title: 'بدأت الحفظ من البقرة إلى الناس (تنازلياً)', sub: 'تحدد السورة التي تحفظ فيها الآن، وتختار من أين تبدأ مراجعة القديم بحرية' },
    { id: 'beginner', title: 'لم أحفظ شيئاً بعد (بداية من الصفر)', sub: 'نرشّح لك البداية من الناس للبقرة أو تختار البداية التي تريحك' },
    { id: 'khatim', title: 'خاتم للقرآن الكريم (٣٠ جزءاً) — مراجعة وتثبيت', sub: 'يُخفي قسم الحفظ الجديد وتختار نقطة بداية دورتك (البقرة / الناس / أجزاء محددة)' },
    { id: 'scattered', title: 'حافظ سور متفرقة من المصحف', sub: 'تختار السور التي حفظتها فعلاً، ثم تقرر هل تكمل متفرق أم تنتظم بترتيب معين' }
  ];
  document.getElementById('obModeOptions').innerHTML = modes.map((m) => `
    <div class="choice-card ${obDraft.mode === m.id ? 'selected' : ''}" onclick="selectObMode('${m.id}')">
      <div class="choice-radio"></div>
      <div>
        <strong style="display:block; font-size:0.88rem;">${m.title}</strong>
        <small style="color:var(--text-muted); font-size:0.75rem;">${m.sub}</small>
      </div>
    </div>
  `).join('');
}

function selectObMode(modeId) {
  obDraft.mode = modeId;
  surahSearchQuery = '';
  if (modeId === 'from_nas') {
    if (!obDraft.stopSurahNum || obDraft.stopSurahNum < 1) obDraft.stopSurahNum = 78;
    obDraft.revStartMode = 'auto';
  } else if (modeId === 'from_baqarah') {
    if (!obDraft.stopSurahNum || obDraft.stopSurahNum > 114) obDraft.stopSurahNum = 2;
    obDraft.revStartMode = 'auto';
  }
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
    titleEl.textContent = '٣. واقف عند أي سورة بالضبط؟';
    stabSec.style.display = 'block';
    const ordered = obDraft.mode === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
    const q = surahSearchQuery.trim();
    const filtered = q ? ordered.filter((s) => s.name.includes(q) || String(s.num) === q) : ordered;
    const summary = summarizeDiagnostic(obDraft);
    const stopSurah = getSurahByNum(obDraft.stopSurahNum) || ordered[0];

    dyn.innerHTML = `
      <label class="field-label">اختر السورة التي تقف عندها حالياً (من ١١٤ سورة):</label>
      <div class="surah-picker-box">
        <input type="text" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeAttr(surahSearchQuery)}"
          oninput="surahSearchQuery=this.value; renderObStep3();" />
        <div class="surah-picker-grid">
          ${filtered.map((s) => `
            <button type="button" class="surah-pick-item ${obDraft.stopSurahNum === s.num ? 'selected' : ''}"
              onclick="obDraft.stopSurahNum=${s.num}; renderObStep3();">
              <span>${s.num}. ${s.name}</span>
              <small>${formatNum(s.pages)} وجه</small>
            </button>
          `).join('')}
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm ${!obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}"
          onclick="obDraft.stopSurahCompleted=false; renderObStep3();">ما زلت أحفظ في سورة ${stopSurah.name} حالياً</button>
        <button type="button" class="btn btn-sm ${obDraft.stopSurahCompleted ? 'btn-gold' : 'btn-ghost'}"
          onclick="obDraft.stopSurahCompleted=true; renderObStep3();">أتممت سورة ${stopSurah.name} وسأبدأ بالتي بعدها</button>
      </div>

      <div class="calc-preview-card">
        <div><strong>الحساب الفعلي لموضعك:</strong></div>
        <div style="margin-top:4px;">
          • المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${summary.completedJuzCount} جزء مكتمل • <strong>${formatNum(summary.memPages)}</strong> وجه من ٦٠٤).<br/>
          • سورة الحفظ الجديد النشطة: <strong>${summary.nextSurah ? `سورة ${summary.nextSurah.name} (الجزء ${summary.nextSurah.juz})` : 'أتممت المصحف!'}</strong>
        </div>
      </div>
    `;

    // حرية اختيار بداية المراجعة (من الناس / من البقرة / من أي جزء يختاره المستخدم حتى من المنتصف!)
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
                onclick="obDraft.revStartMode='from_nas'; renderObStep3();">من الناس ← البقرة</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'from_baqarah' ? 'btn-gold' : 'btn-ghost'}"
                onclick="obDraft.revStartMode='from_baqarah'; renderObStep3();">من البقرة ← الناس</button>
              <button type="button" class="btn btn-sm ${obDraft.revStartMode === 'custom_juz' ? 'btn-gold' : 'btn-ghost'}"
                onclick="obDraft.revStartMode='custom_juz'; renderObStep3();">جزء محدد (مثلاً من المنتصف)</button>
            </div>
            ${obDraft.revStartMode === 'custom_juz' ? `
              <select onchange="obDraft.revStartJuz=Number(this.value);">
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
      { id: 'from_nas', title: 'من الناس إلى البقرة (موصى به للمبتدئين)', sub: 'بداية مشجعة بقصار السور (الناس، الفلق، الإخلاص...) وتدرّج مريح' },
      { id: 'from_baqarah', title: 'من البقرة إلى الناس', sub: 'بداية من أول المصحف (الفاتحة ثم سورة البقرة)' }
    ];
    const startSurah = obDraft.beginnerDir === 'from_baqarah' ? 'الفاتحة ثم البقرة (الجزء ١)' : 'الناس ثم الفلق والإخلاص (الجزء ٣٠)';
    dyn.innerHTML = `
      ${bDirs.map((d) => `
        <div class="choice-card ${obDraft.beginnerDir === d.id ? 'selected' : ''}" onclick="obDraft.beginnerDir='${d.id}'; renderObStep3();">
          <div class="choice-radio"></div>
          <div>
            <strong style="display:block; font-size:0.88rem;">${d.title}</strong>
            <small style="color:var(--text-muted); font-size:0.75rem;">${d.sub}</small>
          </div>
        </div>
      `).join('')}
      <div class="calc-preview-card">
        <strong>نقطة الانطلاق:</strong> ستبدأ خطة الحفظ الجديد مباشرةً من <strong>${startSurah}</strong>.
      </div>
    `;
  } else if (obDraft.mode === 'khatim') {
    titleEl.textContent = '٣. من أين تبدأ دورة مراجعة الـ ٣٠ جزءاً؟';
    stabSec.style.display = 'block';
    const kOpts = [
      { id: 'from_baqarah', title: 'من البقرة إلى الناس (الجزء ١ ← ٣٠)', sub: 'دورة مراجعة متسلسلة من أول المصحف' },
      { id: 'from_nas', title: 'من الناس إلى البقرة (الجزء ٣٠ ← ١)', sub: 'دورة مراجعة متسلسلة من آخر المصحف' },
      { id: 'specific_juz', title: 'أجزاء محددة أختارها بنفسي (مثلاً من المنتصف)', sub: 'تبدأ بالأجزاء التي تحددها أولاً ثم تستكمل بقية المصحف' }
    ];
    let specHtml = '';
    if (obDraft.khatimStart === 'specific_juz') {
      specHtml = `
        <label class="field-label" style="margin-top:10px;">اختر الأجزاء التي تريد البدء بها (${obDraft.khatimSpecificJuz.length} أجزاء محددة):</label>
        <div class="juz-pick-grid">
          ${JUZ_DB.map((j) => `
            <button type="button" class="juz-pick-chip ${obDraft.khatimSpecificJuz.includes(j.num) ? 'selected' : ''}"
              onclick="toggleKhatimJuz(${j.num})">ج ${j.num}</button>
          `).join('')}
        </div>`;
    }
    dyn.innerHTML = kOpts.map((k) => `
      <div class="choice-card ${obDraft.khatimStart === k.id ? 'selected' : ''}" onclick="obDraft.khatimStart='${k.id}'; renderObStep3();">
        <div class="choice-radio"></div>
        <div>
          <strong style="display:block; font-size:0.88rem;">${k.title}</strong>
          <small style="color:var(--text-muted); font-size:0.75rem;">${k.sub}</small>
        </div>
      </div>
    `).join('') + specHtml;
  } else if (obDraft.mode === 'scattered') {
    titleEl.textContent = '٣. اختر السور التي حفظتها فعلاً';
    stabSec.style.display = 'block';
    const q = surahSearchQuery.trim();
    const filtered = q ? SURAHS_DB.filter((s) => s.name.includes(q) || String(s.num) === q) : SURAHS_DB;
    const summary = summarizeDiagnostic(obDraft);

    const contOpts = [
      { id: 'keep_scattered', title: 'أكمل متفرق بحرية', sub: 'أختار السورة الجديدة بنفسي في كل مرة' },
      { id: 'org_nas', title: 'أنتظم بترتيب من الناس إلى البقرة', sub: 'استكمال السور غير المحفوظة تصاعدياً من الجزء ٣٠' },
      { id: 'org_baqarah', title: 'أنتظم بترتيب من البقرة إلى الناس', sub: 'استكمال السور غير المحفوظة تنازلياً من الجزء ١' }
    ];

    dyn.innerHTML = `
      <label class="field-label">حدّد السور التي حفظتها (من قائمة الـ ١١٤ سورة):</label>
      <div class="surah-picker-box">
        <div style="display:flex; gap:6px;">
          <input type="text" placeholder="ابحث باسم السورة..." value="${escapeAttr(surahSearchQuery)}"
            oninput="surahSearchQuery=this.value; renderObStep3();" />
          <button type="button" class="btn btn-ghost btn-sm" onclick="obDraft.scatteredSurahs=[]; renderObStep3();">مسح</button>
        </div>
        <div class="surah-picker-grid">
          ${filtered.map((s) => {
            const sel = obDraft.scatteredSurahs.includes(s.num);
            return `
              <button type="button" class="surah-pick-item ${sel ? 'selected' : ''}"
                onclick="toggleScatteredSurah(${s.num})">
                <span>${sel ? '✓ ' : ''}${s.name}</span>
                <small>${formatNum(s.pages)}</small>
              </button>`;
          }).join('')}
        </div>
      </div>

      <div class="calc-preview-card">
        <strong>المحدد حالياً:</strong> ${summary.memCount} سورة بإجمالي <strong>${formatNum(summary.memPages)}</strong> وجه من مصحف المدينة.
      </div>

      <label class="field-label" style="margin-top:12px;">كيف حابب تكمل حفظك بعد ذلك؟</label>
      ${contOpts.map((c) => `
        <div class="choice-card ${obDraft.scatteredContinue === c.id ? 'selected' : ''}" onclick="obDraft.scatteredContinue='${c.id}'; renderObStep3();">
          <div class="choice-radio"></div>
          <div>
            <strong style="display:block; font-size:0.86rem;">${c.title}</strong>
            <small style="color:var(--text-muted); font-size:0.74rem;">${c.sub}</small>
          </div>
        </div>
      `).join('')}
    `;
  }

  const stabs = [
    { id: 'weak', title: 'متفلت (يحتاج ترميماً وتنشيطاً)', sub: 'تدخل الأجزاء المحفوظة ورشة الترميم خطوة بخطوة ثم لصندوق التثبيت' },
    { id: 'medium', title: 'متوسط (أستحضره بالنظر السريع)', sub: 'يبدأ برصيد ٥٠٪ لتسريع إتمام المراجعة والدخول لصندوق التثبيت' },
    { id: 'solid', title: 'ثابت ومستقر (يحتاج دورة مراجعة فقط)', sub: 'تنتقل الأجزاء المكتملة مباشرةً لصندوق التثبيت بالتكرار المتباعد' }
  ];
  document.getElementById('obStabilityOptions').innerHTML = stabs.map((s) => `
    <div class="choice-card ${obDraft.stability === s.id ? 'selected' : ''}" onclick="obDraft.stability='${s.id}'; renderObStep3();">
      <div class="choice-radio"></div>
      <div>
        <strong style="display:block; font-size:0.86rem;">${s.title}</strong>
        <small style="color:var(--text-muted); font-size:0.74rem;">${s.sub}</small>
      </div>
    </div>
  `).join('');
}

function toggleKhatimJuz(juzNum) {
  if (obDraft.khatimSpecificJuz.includes(juzNum)) {
    if (obDraft.khatimSpecificJuz.length > 1) {
      obDraft.khatimSpecificJuz = obDraft.khatimSpecificJuz.filter((n) => n !== juzNum);
    }
  } else {
    obDraft.khatimSpecificJuz.push(juzNum);
    obDraft.khatimSpecificJuz.sort((a, b) => a - b);
  }
  renderObStep3();
}

function toggleScatteredSurah(surahNum) {
  if (obDraft.scatteredSurahs.includes(surahNum)) {
    obDraft.scatteredSurahs = obDraft.scatteredSurahs.filter((n) => n !== surahNum);
  } else {
    obDraft.scatteredSurahs.push(surahNum);
  }
  renderObStep3();
}

function renderObStep4() {
  const styles = [
    { id: 'solo', title: 'حفظ ومراجعة ذاتية مرنة (بدون أيام مقرأة ثابتة)', sub: 'توزّع جلساتك بحرية في أي وقت يناسبك خلال اليوم' },
    { id: 'maqraa', title: 'أتابع مع شيخ أو مقرأة بأيام محددة (اختياري)', sub: 'يُضبط التحضير والتسميع في جدولك حسب الأيام التي تختارها' }
  ];
  document.getElementById('obStudyStyleOptions').innerHTML = styles.map((st) => `
    <div class="choice-card ${obDraft.studyStyle === st.id ? 'selected' : ''}" onclick="obDraft.studyStyle='${st.id}'; renderObStep4();">
      <div class="choice-radio"></div>
      <div>
        <strong style="display:block; font-size:0.87rem;">${st.title}</strong>
        <small style="color:var(--text-muted); font-size:0.74rem;">${st.sub}</small>
      </div>
    </div>
  `).join('');

  document.getElementById('obMaqraaDaysWrap').style.display = obDraft.studyStyle === 'maqraa' ? 'block' : 'none';
  document.getElementById('obPagesPerSessionWrap').style.display = obDraft.mode === 'khatim' ? 'none' : 'block';

  document.getElementById('obMaqraaDayChips').innerHTML = DAYS_META.map((d) => `
    <button type="button" class="day-chip ${obDraft.maqraaDays.includes(d.id) ? 'active' : ''}"
      onclick="toggleObMaqraaDay('${d.id}')">${d.name}</button>
  `).join('');

  document.getElementById('obRemToggleRow').classList.toggle('done', obDraft.remEnabled);
  document.getElementById('obRemCheck').textContent = obDraft.remEnabled ? '✓' : '';
  document.getElementById('obRemTimesWrap').style.display = obDraft.remEnabled ? 'block' : 'none';
}

function setObMin(m) {
  obDraft.dailyMin = m;
  document.getElementById('obDailyMin').value = m;
  document.getElementById('obTimeVal').textContent = m + ' دقيقة';
}

function toggleObMaqraaDay(dayId) {
  if (obDraft.maqraaDays.includes(dayId)) {
    if (obDraft.maqraaDays.length > 1) obDraft.maqraaDays = obDraft.maqraaDays.filter((x) => x !== dayId);
  } else {
    obDraft.maqraaDays.push(dayId);
  }
  renderObStep4();
}

function toggleObReminders() {
  obDraft.remEnabled = !obDraft.remEnabled;
  renderObStep4();
}

function renderObStep5Preview() {
  const tempProfile = {
    ...obDraft,
    dailyMin: parseInt(document.getElementById('obDailyMin').value, 10) || 45,
    pagesPerSession: parseFloat(document.getElementById('obPagesPerSession').value) || 1
  };
  const summary = summarizeDiagnostic(tempProfile);
  const built = buildPersonalizedPlan(tempProfile);
  const sched = buildLiveSchedule(tempProfile, built.juzList, built.activeRevJuzNum, built.activeNewSurahNum, null);
  const actRevObj = built.juzList.find((j) => j.num === built.activeRevJuzNum);
  const actNewObj = built.activeNewSurahNum ? getSurahByNum(built.activeNewSurahNum) : null;

  document.getElementById('obPlanPreviewBox').innerHTML = `
    <div style="font-weight:800; color:var(--accent-hi); margin-bottom:6px;">ملخص خطتك الفعلية (ويمكنك تبديل أي جزء أو سورة لاحقاً بضغطة زر):</div>
    <div style="line-height:1.8;">
      ${tempProfile.mode === 'khatim'
        ? `• المسار: <strong>مراجعة وتثبيت ٣٠ جزءاً</strong> (قسم الحفظ الجديد مخفي).<br/>• الجزء النشط لبداية الدورة: <strong>${actRevObj ? actRevObj.title : 'الجزء ١'}</strong>.`
        : `• المحفوظ السابق: <strong>${summary.memCount} سورة</strong> (${formatNum(summary.memPages)} وجه من ٦٠٤).<br/>
           • سورة الحفظ الجديد النشطة: <strong>${actNewObj ? `سورة ${actNewObj.name} (الجزء ${actNewObj.juz})` : 'مكتمل'}</strong>.<br/>
           ${actRevObj ? `• الجزء النشط لبداية المراجعة: <strong>${actRevObj.title}</strong>.` : '• بداية تأسيسية نظيفة من الصفر.'}`
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

function finishOnboarding() {
  const name = document.getElementById('obName').value.trim() || 'حافظ القرآن';
  let username = document.getElementById('obUsername').value.trim();
  if (username && !username.startsWith('@')) username = '@' + username;
  const dailyMin = parseInt(document.getElementById('obDailyMin').value, 10) || 45;
  const pagesPerSession = parseFloat(document.getElementById('obPagesPerSession').value) || 1;

  const newProfile = {
    name,
    username,
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

  const shouldRebuildJuz = !obDraft.isEditing ||
    confirm('هل تريد إعادة بناء الخريطة والجدول حسب التشخيص الجديد؟ (اضغط «إلغاء» للاحتفاظ بأوجهك الحالية وتحديث الاسم والمظهر والجدول فقط)');

  state.profile = newProfile;
  state.onboarded = true;
  state.calcDailyMin = dailyMin;
  state.calcNewPages = newProfile.mode === 'khatim' ? 0 : pagesPerSession;

  if (shouldRebuildJuz || state.juzList.length !== 30) {
    const built = buildPersonalizedPlan(newProfile);
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

  applyTheme(state.profile.theme, state.profile.customColors);
  saveState();
  document.getElementById('onboardingOverlay').classList.remove('active');
  document.getElementById('calcDailyMin').value = state.calcDailyMin;
  document.getElementById('calcNewPages').value = state.calcNewPages;
  renderAll();
  showToast(`أهلاً يا ${name}! خطتك وجدولك الحي جاهزان الآن ✓`);
}

// ================= QUICK SWITCH ACTIVE REVISION JUZ OR NEW SURAH =================
function openQuickFocusModal(kind) {
  if (kind === 'new' && state.profile.mode === 'khatim') {
    showToast('أنت في وضع الخاتم — يمكنك التبديل من تعديل الملف إن أردت');
    return;
  }
  quickFocusSearch = '';
  renderQuickFocusModal(kind);
  document.getElementById('quickFocusModal').classList.add('open');
}

function renderQuickFocusModal(kind) {
  const titleEl = document.getElementById('quickFocusTitle');
  const bodyEl = document.getElementById('quickFocusBody');

  if (kind === 'rev') {
    titleEl.textContent = 'اختر الجزء الذي تريد مراجعته الآن';
    const pendingRev = state.juzList.filter((j) => j.donePages < j.totalPages - 0.01);
    if (pendingRev.length === 0) {
      bodyEl.innerHTML = '<div class="empty-state">ما شاء الله! جميع الأجزاء مكتملة في صندوق التثبيت.</div>';
      return;
    }
    bodyEl.innerHTML = `
      <p style="margin:0 0 10px; font-size:0.8rem; color:var(--text-muted);">
        اختر أي جزء تبدأ به الآن — سيتحدّث جدولك الأسبوعي وصفحتك الرئيسية فوراً بهذا الجزء.
      </p>
      <div style="display:flex; flex-direction:column; gap:7px; max-height:55vh; overflow-y:auto;">
        ${pendingRev.map((j) => `
          <button type="button" class="choice-card ${state.activeRevJuzNum === j.num ? 'selected' : ''}"
            style="width:100%; text-align:right; margin-bottom:0;" onclick="setActiveRevJuz(${j.num})">
            <div class="choice-radio"></div>
            <div style="flex:1;">
              <strong style="display:block; font-size:0.88rem;">${j.title} <span class="tag ${j.track === 'new' ? 'tag-info' : 'tag-gold'}">${j.track === 'new' ? 'جديد' : 'مراجعة'}</span></strong>
              <small style="color:var(--text-muted); font-size:0.75rem;">${j.range} • المنجز: ${formatNum(j.donePages)} / ${j.totalPages} وجهاً</small>
            </div>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    titleEl.textContent = 'اختر السورة التي تحفظ فيها الآن';
    const q = quickFocusSearch.trim();
    const dir = getEffectiveDirection(state.profile);
    const ordered = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
    const filtered = q ? ordered.filter((s) => s.name.includes(q) || String(s.num) === q) : ordered;

    bodyEl.innerHTML = `
      <p style="margin:0 0 8px; font-size:0.8rem; color:var(--text-muted);">
        اختر أي سورة من الـ ١١٤ سورة لتصبح سورة الحفظ الجديد النشطة في الرئيسية والجدول الأسبوعي (وتظل ثابتة معك حتى تتمها أو تغيرها).
      </p>
      <input type="text" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeAttr(quickFocusSearch)}"
        oninput="quickFocusSearch=this.value; renderQuickFocusModal('new');" style="margin-bottom:8px;" />
      <div class="surah-picker-grid" style="max-height:50vh;">
        ${filtered.map((s) => `
          <button type="button" class="surah-pick-item ${state.activeNewSurahNum === s.num ? 'selected' : ''}"
            onclick="setActiveNewSurah(${s.num})">
            <span>${s.num}. ${s.name}</span>
            <small>ج ${s.juz}</small>
          </button>
        `).join('')}
      </div>
    `;
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

// ================= CORE UI & NAVIGATION =================
function showToast(msg) {
  const el = document.getElementById('toastEl');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.remove('show'), 3200);
}

function touchStreak() {
  const t = todayStr();
  if (state.streak.lastDate === t) return;
  const y = addDaysStr(t, -1);
  state.streak.count = state.streak.lastDate === y ? state.streak.count + 1 : 1;
  state.streak.lastDate = t;
}

function syncSolidBoxMembership(juz) {
  const isComplete = juz.donePages >= juz.totalPages - 0.01;
  const t = todayStr();
  if (isComplete && !state.solidMeta[juz.num]) {
    state.solidMeta[juz.num] = {
      reviews: 0,
      lastReviewed: t,
      rating: 'جيد جداً',
      intervalDays: 4,
      nextReviewDate: addDaysStr(t, 4),
      addedAt: t
    };
    syncPlanAndScheduleLive();
    const nextRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
    showToast(`مبارك! انتقل ${juz.title} لصندوق التثبيت${nextRev ? ` وحلّ ${nextRev.title} مكانه في الجدول` : ''} ✓`);
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
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}

function renderAll() {
  if (!state.onboarded) return;
  syncPlanAndScheduleLive();
  renderHeader();
  renderDashboard();
  renderSchedule();
  renderSolidTab();
  renderMap();
  renderRemindersUI();
  renderThemeGrids();
  updateCalculator();
  populateManualLinkSurahSelect();
}

function renderHeader() {
  const p = state.profile;
  const name = p.name || 'رفيق التثبيت';
  document.getElementById('headerUserTitle').textContent = `أهلاً يا ${name}`;
  const modeNames = {
    from_nas: 'الناس ← البقرة',
    from_baqarah: 'البقرة ← الناس',
    beginner: 'بداية جديدة',
    khatim: 'خاتم ٣٠ جزءاً',
    scattered: 'سور متفرقة'
  };
  const modeLabel = modeNames[p.mode] || 'الختمة المرنة';
  document.getElementById('headerUserSub').textContent = `${p.username ? p.username + ' • ' : ''}${modeLabel} • ${p.dailyMin} د/يوم`;
  document.getElementById('streakBadge').textContent = `🔥 ${state.streak.count} أيام`;

  const profLine = document.getElementById('profileSummaryLine');
  if (profLine) {
    profLine.innerHTML = `المستخدم: <strong style="color:var(--accent-hi);">${escapeHtml(name)}</strong> ${p.username ? `(${escapeHtml(p.username)})` : ''} • المسار: <strong>${modeLabel}</strong> • الوقت اليومي: <strong>${p.dailyMin} دقيقة</strong>`;
  }
  const legacyBtn = document.getElementById('settingsLegacyImportBtn');
  if (legacyBtn) legacyBtn.style.display = findLegacyStorageKey() ? 'inline-flex' : 'none';
}

// ================= SPACED REPETITION ENGINE =================
function getDueItems() {
  const items = [];
  const today = todayStr();

  state.newLinkingGroups.filter((g) => !g.archived).forEach((g) => {
    const nextDate = g.nextReviewDate || today;
    const diff = diffDaysFromToday(nextDate);
    const hasUrgent = g.passages.some((p) => p.rating === 'يحتاج إعادة');
    const needsMerge = g.passages.length >= 3 && g.linkCount < Math.floor(g.passages.length / 2);
    if (diff <= 0 || hasUrgent || needsMerge) {
      const sumP = g.passages.reduce((s, p) => s + p.pages, 0);
      items.push({
        kind: 'new',
        id: g.id,
        title: g.surahName,
        subtitle: `${g.passages.length} مقاطع (${formatNum(sumP)} وجه) • تثبيت جديد وربط`,
        rating: hasUrgent ? 'يحتاج إعادة' : (g.rating || 'جيد'),
        diff,
        priority: hasUrgent ? 0 : (diff < 0 ? 1 : (needsMerge ? 2 : 3)),
        badge: hasUrgent ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : (needsMerge ? 'تجميع ٣+ مقاطع' : 'مستحق اليوم'))
      });
    }
  });

  state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01).forEach((j) => {
    const meta = state.solidMeta[j.num];
    if (!meta) return;
    const nextDate = meta.nextReviewDate || today;
    const diff = diffDaysFromToday(nextDate);
    if (diff <= 0 || meta.rating === 'يحتاج إعادة') {
      items.push({
        kind: 'old',
        id: j.num,
        title: j.title,
        subtitle: `${j.range} • تثبيت قديم`,
        rating: meta.rating || 'جيد جداً',
        diff,
        priority: meta.rating === 'يحتاج إعادة' ? 0 : (diff < 0 ? 1 : 3),
        badge: meta.rating === 'يحتاج إعادة' ? 'أولوية إعادة' : (diff < 0 ? `متأخر ${Math.abs(diff)} يوم` : 'مستحق اليوم')
      });
    }
  });

  items.sort((a, b) => a.priority - b.priority || a.diff - b.diff);
  return items;
}

function openSrReviewModal(kind, id, title) {
  srTarget = { kind, id, title };
  document.getElementById('srReviewTargetInfo').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(title)}</strong>
    <div style="font-size:0.77rem; color:var(--text-muted); margin-top:2px;">${kind === 'new' ? 'صندوق التثبيت — تثبيت جديد (ربط السورة)' : 'صندوق التثبيت — تثبيت قديم (جزء مكتمل)'}</div>
  `;
  selectSrRating('ممتاز');
  document.getElementById('srReviewModal').classList.add('open');
}

function selectSrRating(rate) {
  selectedSrRating = rate;
  document.querySelectorAll('#srRatingGrid .rating-choice').forEach((btn) => {
    btn.classList.remove('selected-excellent', 'selected-vgood', 'selected-good', 'selected-repeat');
    const r = btn.getAttribute('data-rate');
    if (r === rate) {
      if (r === 'ممتاز') btn.classList.add('selected-excellent');
      else if (r === 'جيد جداً') btn.classList.add('selected-vgood');
      else if (r === 'جيد') btn.classList.add('selected-good');
      else btn.classList.add('selected-repeat');
    }
  });
}

function confirmSrReview() {
  if (!srTarget) return;
  const t = todayStr();
  if (srTarget.kind === 'old') {
    const meta = state.solidMeta[srTarget.id] || { reviews: 0, rating: '', intervalDays: 4 };
    const nextInt = computeNextInterval(selectedSrRating, meta.rating, meta.intervalDays);
    state.solidMeta[srTarget.id] = {
      ...meta,
      reviews: (meta.reviews || 0) + 1,
      lastReviewed: t,
      rating: selectedSrRating,
      intervalDays: nextInt,
      nextReviewDate: addDaysStr(t, nextInt)
    };
    showToast(`تمت المراجعة (${selectedSrRating}) — الموعد القادم بعد ${nextInt} يوم ✓`);
  } else {
    const g = state.newLinkingGroups.find((x) => x.id === srTarget.id);
    if (g) {
      const nextInt = computeNextInterval(selectedSrRating, g.rating, g.intervalDays);
      g.linkCount = (g.linkCount || 0) + 1;
      g.lastLinked = t;
      g.rating = selectedSrRating;
      g.intervalDays = nextInt;
      g.nextReviewDate = addDaysStr(t, nextInt);
      if (selectedSrRating === 'ممتاز' || selectedSrRating === 'جيد جداً') {
        g.passages.forEach((p) => { if (p.rating === 'يحتاج إعادة') p.rating = 'جيد جداً'; });
      }
      showToast(`تم ربط ${g.surahName} (${selectedSrRating}) — الموعد القادم بعد ${nextInt} يوم ✓`);
    }
  }
  touchStreak();
  saveState();
  closeModal('srReviewModal');
  renderAll();
}

// ================= TAB 1: DASHBOARD =================
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

  // Due Today
  const dueItems = getDueItems();
  document.getElementById('dueCountBadge').textContent = `${dueItems.length} عناصر`;
  const dueListEl = document.getElementById('dueTodayList');
  if (dueItems.length === 0) {
    dueListEl.innerHTML = '<div style="font-size:0.83rem; color:var(--text-muted); padding:6px 2px;">لا توجد مراجعات متأخرة اليوم — كل ورد تسمّعه أو جزء تنجزه يُجدول هنا تلقائياً حسب تقييمك.</div>';
  } else {
    dueListEl.innerHTML = dueItems.slice(0, 5).map((item) => `
      <div class="log-item" style="align-items:center;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.9rem;">${escapeHtml(item.title)}</strong>
            <span class="tag ${item.priority === 0 ? 'tag-danger' : (item.priority === 1 ? 'tag-warn' : 'tag-gold')}">${item.badge}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(item.subtitle)}</div>
        </div>
        <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('${item.kind}', '${item.id}', '${escapeAttr(item.title)}')">راجعته ✓</button>
      </div>
    `).join('');
  }

  // New Memorization right on Home (hidden if Khatim)
  const nwCard = document.getElementById('homeNewWorkflowCard');
  if (isKhatim) {
    nwCard.innerHTML = '';
  } else {
    renderHomeNewWorkflow();
  }

  // Today's Flexible Tasks + Busy Day Mode
  const isBusyToday = state.busyDayDate === todayStr();
  const todayWrap = document.getElementById('todayCardWrapper');
  todayWrap.classList.toggle('card-busy', isBusyToday);
  const busyBtn = document.getElementById('busyDayToggleBtn');
  busyBtn.textContent = isBusyToday ? 'العودة للجدول العادي' : 'وقتي مضغوط النهارده';
  busyBtn.className = isBusyToday ? 'btn btn-outline btn-sm' : 'btn btn-warn btn-sm';

  const jsToday = new Date().getDay();
  const todayObj = state.schedule.find((d) => d.jsDay === jsToday) || state.schedule[0];
  document.getElementById('todayDayTitle').textContent = todayObj ? (todayObj.name + (todayObj.maqraa ? ' • يوم التسميع' : '')) : 'اليوم';

  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  const activeNewSurah = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);

  if (isBusyToday) {
    const weakest = dueItems[0]
      ? dueItems[0].title
      : (curRev ? curRev.title : (activeNewSurah ? `سورة ${activeNewSurah.name}` : 'أقرب مقطع حفظته'));
    document.getElementById('todayTasksContainer').innerHTML = `
      <div style="font-size:0.81rem; color:var(--warn); font-weight:700; margin-bottom:10px;">
        🛡️ وضع الحماية السريع (٧ دقائق فقط) — يحفظ سلسلتك وترابط محفوظك بدون ضغط أو إحباط:
      </div>
      <div class="task-row ${state.busyTasksDone.t1 ? 'done' : ''}" onclick="toggleBusyTask('t1')">
        <div class="check-circle">${state.busyTasksDone.t1 ? '✓' : ''}</div>
        <div class="task-text"><strong>حماية سريعة (٣ دقائق)</strong><small>مراجعة سريعة لـ: ${escapeHtml(weakest)}</small></div>
      </div>
      <div class="task-row ${state.busyTasksDone.t2 ? 'done' : ''}" onclick="toggleBusyTask('t2')">
        <div class="check-circle">${state.busyTasksDone.t2 ? '✓' : ''}</div>
        <div class="task-text"><strong>تنشيط التثبيت (٤ دقائق)</strong><small>سرد وجهين فقط من أي جزء أو سورة منجزة — والباقي مُرحّل بهدوء</small></div>
      </div>
    `;
  } else if (todayObj) {
    document.getElementById('todayTasksContainer').innerHTML = `
      <div class="task-row ${todayObj.mDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'mDone')">
        <div class="check-circle">${todayObj.mDone ? '✓' : ''}</div>
        <div class="task-text"><strong>الجلسة الأساسية (في أي وقت يناسبك)</strong><small>${escapeHtml(todayObj.main)}</small></div>
      </div>
      <div class="task-row ${todayObj.eDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'eDone')">
        <div class="check-circle">${todayObj.eDone ? '✓' : ''}</div>
        <div class="task-text"><strong>جلسة التسميع والربط (مرنة)</strong><small>${escapeHtml(todayObj.second)}</small></div>
      </div>
      <div class="task-row ${todayObj.sDone ? 'done' : ''}" onclick="toggleDayTask('${todayObj.id}', 'sDone')">
        <div class="check-circle">${todayObj.sDone ? '✓' : ''}</div>
        <div class="task-text"><strong>صندوق التثبيت (قديم وجديد)</strong><small>${escapeHtml(todayObj.solid)}</small></div>
      </div>
    `;
  }

  const quickRevBtn = document.getElementById('quickRevBtn');
  if (quickRevBtn) {
    quickRevBtn.style.display = curRev ? 'inline-flex' : 'none';
    if (curRev) quickRevBtn.textContent = `+١ وجه في ${curRev.title}`;
  }

  // Overview stats
  document.getElementById('statCurrentRev').textContent = revList.length === 0 ? '—' : (curRev ? curRev.title : 'مكتمل ✓');
  document.getElementById('statCurrentRevSub').textContent = revList.length === 0
    ? 'بداية جديدة'
    : (curRev ? `${formatNum(curRev.donePages)} / ${curRev.totalPages} وجهاً` : 'كل القديم في التثبيت');

  const newEditHint = document.getElementById('statNewEditHint');
  if (newEditHint) newEditHint.style.display = isKhatim ? 'none' : 'inline';

  const loggedInActiveSurah = activeNewSurah ? (state.surahNewProgress[activeNewSurah.num] || 0) : 0;
  document.getElementById('statCurrentNew').textContent = isKhatim
    ? 'خاتم ✓'
    : (activeNewSurah ? `سورة ${activeNewSurah.name}` : 'مكتمل ✓');
  document.getElementById('statCurrentNewSub').textContent = isKhatim
    ? 'تثبيت ٣٠ جزءاً'
    : (activeNewSurah
      ? `الجزء ${activeNewSurah.juz} • ${loggedInActiveSurah > 0 ? `${formatNum(loggedInActiveSurah)} / ` : ''}${formatNum(activeNewSurah.pages)} وجه`
      : 'ختمة مباركة');

  document.getElementById('statSolidNewCount').textContent = `${solidNewPassages} مقاطع`;
  document.getElementById('statSolidNewSub').textContent = activeLinkGroups.length > 0 ? `في ${activeLinkGroups.length} سورة للربط` : 'في صندوق التثبيت';

  let doneT = 0;
  const totalT = state.schedule.length * 3;
  state.schedule.forEach((d) => { if (d.mDone) doneT++; if (d.eDone) doneT++; if (d.sDone) doneT++; });
  document.getElementById('statWeekPct').textContent = totalT ? Math.round(doneT / totalT * 100) + '%' : '0%';
  document.getElementById('statWeekSub').textContent = `${doneT} من ${totalT} مهمة`;

  // Stabilization alert every 3 completed revision Juz
  const alertBox = document.getElementById('stabilizationAlert');
  if (revDoneJuz > 0 && revDoneJuz % 3 === 0 && revDoneJuz < revList.length) {
    alertBox.innerHTML = `
      <div class="alert-banner">
        <span style="font-size:1.25rem;">🛡️</span>
        <div>
          <strong>تذكير أسبوع التثبيت (أتممت ${revDoneJuz} أجزاء)</strong>
          لفّ على الأجزاء الـ ${solidOldCount} في صندوق التثبيت لفة سريعة قبل فتح الجزء التالي.
        </div>
      </div>`;
  } else {
    alertBox.innerHTML = '';
  }

  // Dynamic Active Juz Surahs Widget
  const activeJuz = curRev || newList.find((j) => j.donePages < j.totalPages - 0.01);
  const ajCard = document.getElementById('activeJuzSurahsCard');
  if (activeJuz && activeJuz.surahs && activeJuz.surahs.length > 0) {
    ajCard.style.display = 'block';
    document.getElementById('activeJuzSurahsTitle').textContent = `🎯 سور ${activeJuz.title}`;
    document.getElementById('activeJuzSurahsList').innerHTML = activeJuz.surahs.map((s, idx) => `
      <div class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${activeJuz.num}, ${idx})">
        <span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span>
        <small>${formatNum(s.pages)} وجه</small>
      </div>
    `).join('');
  } else {
    ajCard.style.display = 'none';
  }

  const guideBox = document.getElementById('firstTimeGuideBanner');
  if (guideBox) {
    if (!state.welcomeDismissed) {
      guideBox.innerHTML = `
        <div class="alert-banner" style="justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
          <div style="flex:1; min-width:220px;">
            <strong>دليل سريع في سطرين</strong>
            <div style="font-size:0.79rem; color:var(--text-main); margin-top:3px;">
              ١) <strong>المراجعة (الترميم):</strong> راجع جزءك النشط وعند إتمامه يدخل <strong>صندوق التثبيت</strong> ويحل الجزء التالي مكانه تلقائياً.<br/>
              ٢) <strong>الحفظ الجديد:</strong> سجّل وردك ثم اضغط «تم التسميع» ليُجدول تلقائياً بالتكرار المتباعد.
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

function dismissWelcomeGuide() {
  state.welcomeDismissed = true;
  saveState();
  renderDashboard();
}

function toggleBusyDay() {
  const t = todayStr();
  if (state.busyDayDate === t) {
    state.busyDayDate = '';
    showToast('رجعنا لجدول اليوم العادي');
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

// ================= NEW MEMORIZATION ON HOME (2-STEP CYCLE) =================
function renderHomeNewWorkflow() {
  const container = document.getElementById('homeNewWorkflowCard');
  const activeSurah = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  const dir = getEffectiveDirection(state.profile);
  const orderedSurahs = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
  const defaultNum = activeSurah ? activeSurah.num : orderedSurahs[0].num;
  const defaultJuz = activeSurah ? activeSurah.juz : orderedSurahs[0].juz;
  const loggedInSurah = activeSurah ? (state.surahNewProgress[activeSurah.num] || 0) : 0;

  if (!state.activeWird) {
    const surahOptions = orderedSurahs.map((s) =>
      `<option value="${s.num}" ${s.num === defaultNum ? 'selected' : ''}>${s.num}. سورة ${s.name} (الجزء ${s.juz} • ${formatNum(s.pages)} وجه)</option>`
    ).join('');

    const juzOptions = JUZ_DB.map((j) =>
      `<option value="${j.num}" ${j.num === defaultJuz ? 'selected' : ''}>${j.title} — ${j.range}</option>`
    ).join('');

    if (!newWirdFormOpen) {
      container.innerHTML = `
        <div class="card">
          <div class="card-title" style="margin-bottom:6px;">
            <h2>📖 الحفظ الجديد — ${activeSurah ? `سورة ${activeSurah.name}` : 'تسجيل الورد'}</h2>
            ${activeSurah && loggedInSurah > 0 ? `<span class="tag tag-info">${formatNum(loggedInSurah)} / ${formatNum(activeSurah.pages)} وجه</span>` : ''}
          </div>
          <p style="margin:0 0 11px; font-size:0.8rem; color:var(--text-muted);">
            ${activeSurah ? `سورتك النشطة: <strong>سورة ${activeSurah.name}</strong> (الجزء ${activeSurah.juz} • ${formatNum(activeSurah.pages)} وجه).` : 'سجّل وردك الجديد عند البدء.'}
          </p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-gold" style="flex:1;" onclick="toggleNewWirdForm(true)">+ تسجيل ورد جديد</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="openQuickFocusModal('new')">تغيير السورة</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="switchTab('solid'); setSolidTab('new');">تثبيت الجديد</button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card">
          <div class="card-title">
            <h2>📖 تسجيل ورد جديد — ${activeSurah ? `سورة ${activeSurah.name}` : ''}</h2>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleNewWirdForm(false)">إغلاق ✕</button>
          </div>
          <form onsubmit="registerNewWird(event)">
            <div class="form-grid form-grid-2">
              <div>
                <label class="field-label">السورة (تظل ثابتة معك حتى تتمها)</label>
                <select id="nwSurahSelect" onchange="onHomeSurahChange(this.value)" required>${surahOptions}</select>
              </div>
              <div>
                <label class="field-label">المقطع / الآيات</label>
                <input type="text" id="nwPassage" placeholder="مثلاً: آية ١ – ١٥ أو السورة كاملة" required />
              </div>
              <div>
                <label class="field-label">عدد الأوجه</label>
                <input type="number" id="nwPages" step="0.25" min="0.25" max="15" value="${state.profile.pagesPerSession || 1}" required />
              </div>
              <div>
                <label class="field-label">الجزء التابع له</label>
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
          <div style="font-size:1.04rem; font-weight:800; color:var(--accent-hi);">${escapeHtml(w.surahName)} — ${escapeHtml(w.passage)}</div>
          <div style="font-size:0.77rem; color:var(--text-muted); margin-top:2px;">سُجّل في ${w.createdAt} ${w.note ? `• 📝 ${escapeHtml(w.note)}` : ''}</div>
        </div>
        <div style="margin-bottom:11px;">
          <div class="task-row ${w.prepRead ? 'done' : ''}" onclick="toggleWirdPrep('prepRead')">
            <div class="check-circle">${w.prepRead ? '✓' : ''}</div>
            <div class="task-text"><strong>قراءة نظرية وفهم المعنى</strong></div>
          </div>
          <div class="task-row ${w.prepMem ? 'done' : ''}" onclick="toggleWirdPrep('prepMem')">
            <div class="check-circle">${w.prepMem ? '✓' : ''}</div>
            <div class="task-text"><strong>الحفظ والتسميع الذاتي غيباً</strong></div>
          </div>
          <div class="task-row ${w.prepLink ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleWirdPrep('prepLink')">
            <div class="check-circle">${w.prepLink ? '✓' : ''}</div>
            <div class="task-text"><strong>ربط الورد بالمقطع السابق في السورة</strong></div>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-gold" style="flex:1;" onclick="openReciteModal()">✅ تم التسميع + التقييم</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="cancelActiveWird()">تعديل / إلغاء</button>
        </div>
      </div>
    `;
  }
}

// عند تغيير السورة في القائمة المنسدلة بالرئيسية: تُثبت فوراً كسورة نشطة ويتحدّث الجدول!
function toggleNewWirdForm(open) { newWirdFormOpen = !!open; renderHomeNewWorkflow(); }

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
  // تحديث بطاقة الإحصاء السريعة بدون إعادة رسم القائمة المنسدلة نفسها
  const statNew = document.getElementById('statCurrentNew');
  const statNewSub = document.getElementById('statCurrentNewSub');
  if (statNew) statNew.textContent = `سورة ${s.name}`;
  if (statNewSub) statNewSub.textContent = `الجزء ${s.juz} • ${formatNum(s.pages)} وجه`;
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

  // تثبيت السورة المختارة كسورة الحفظ النشطة وتحديث الجدول فوراً
  if (sObj) state.activeNewSurahNum = sObj.num;

  state.activeWird = {
    id: 'w_' + Date.now(),
    surahNum,
    surahName,
    passage,
    pages,
    juzNum,
    note,
    createdAt: todayStr(),
    prepRead: false,
    prepMem: false,
    prepLink: false
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

  document.getElementById('reciteModalSummary').innerHTML = `
    <strong style="color:var(--accent-hi);">${escapeHtml(w.surahName)} — ${escapeHtml(w.passage)}</strong>
    <div style="color:var(--text-muted); font-size:0.78rem; margin-top:2px;">المقدار: ${formatNum(w.pages)} وجه • الجزء ${w.juzNum}</div>
  `;
  selectRating('ممتاز');
  document.getElementById('reciteSheikhNote').value = w.note || '';
  document.getElementById('reciteAutoMap').checked = true;
  document.getElementById('reciteAddToLink').checked = true;
  document.getElementById('reciteFinishSurah').checked = willReachEnd;
  document.getElementById('reciteModal').classList.add('open');
}

function selectRating(rate) {
  selectedRating = rate;
  document.querySelectorAll('#ratingGrid .rating-choice').forEach((btn) => {
    btn.classList.remove('selected-excellent', 'selected-vgood', 'selected-good', 'selected-repeat');
    const r = btn.getAttribute('data-rate');
    if (r === rate) {
      if (r === 'ممتاز') btn.classList.add('selected-excellent');
      else if (r === 'جيد جداً') btn.classList.add('selected-vgood');
      else if (r === 'جيد') btn.classList.add('selected-good');
      else btn.classList.add('selected-repeat');
    }
  });
  document.getElementById('reciteAutoMap').checked = (rate !== 'يحتاج إعادة');
}

function confirmRecitation() {
  if (!state.activeWird) return;
  const w = state.activeWird;
  const note = document.getElementById('reciteSheikhNote').value.trim();
  const autoMap = document.getElementById('reciteAutoMap').checked;
  const addToLink = document.getElementById('reciteAddToLink').checked;
  const finishSurah = document.getElementById('reciteFinishSurah').checked;
  const today = todayStr();

  state.maqraaLogs.unshift({
    id: 'mq_' + Date.now(),
    surahName: w.surahName,
    passage: w.passage,
    pages: w.pages,
    juzNum: w.juzNum,
    date: today,
    rating: selectedRating,
    note
  });

  if (autoMap) {
    const targetJuz = state.juzList.find((j) => j.num === w.juzNum);
    if (targetJuz) {
      targetJuz.donePages = Math.min(targetJuz.totalPages, Number((targetJuz.donePages + w.pages).toFixed(2)));
    }
    if (w.surahNum) {
      const sObj = getSurahByNum(w.surahNum);
      const nextLogged = Number(((state.surahNewProgress[w.surahNum] || 0) + w.pages).toFixed(2));
      state.surahNewProgress[w.surahNum] = sObj ? Math.min(sObj.pages, nextLogged) : nextLogged;

      if (finishSurah || (sObj && nextLogged >= sObj.pages - 0.01)) {
        // تعليم السورة كمنجزة في كل جزء تظهر فيه، ثم الانتقال تلقائياً للسورة التالية!
        state.juzList.forEach((j) => {
          (j.surahs || []).forEach((s) => {
            if (s.num === w.surahNum) s.done = true;
          });
        });
        // تحديد السورة التالية بعد إتمام هذه السورة
        state.activeNewSurahNum = null;
        const nextS = resolveActiveNewSurah(state.profile, state.juzList, null);
        state.activeNewSurahNum = nextS ? nextS.num : null;
      } else {
        // البقاء على نفس السورة حتى يتمها المستخدم!
        state.activeNewSurahNum = w.surahNum;
      }
    }
    if (targetJuz) syncSolidBoxMembership(targetJuz);
  } else if (w.surahNum) {
    state.activeNewSurahNum = w.surahNum;
  }

  if (addToLink) {
    addPassageToLinkingGroup(w.surahName, w.passage, w.pages, selectedRating, today);
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

// ================= TAB 2: FLEXIBLE WEEKLY SCHEDULE =================
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
            ${doneCount === 3 ? '<span class="tag tag-success">✓ مكتمل</span>' : `<span style="font-size:0.74rem; color:var(--text-muted);">${doneCount}/3</span>`}
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="openEditDay('${d.id}')">تعديل</button>
        </div>
        <div class="week-sessions-grid">
          <div class="session-col">
            <div class="session-col-title"><span>الجلسة الأساسية</span><span style="color:var(--text-dim); font-weight:600;">في أي وقت</span></div>
            <div class="task-row ${d.mDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${d.id}', 'mDone')">
              <div class="check-circle">${d.mDone ? '✓' : ''}</div>
              <div class="task-text"><strong>${escapeHtml(d.main)}</strong></div>
            </div>
          </div>
          <div class="session-col">
            <div class="session-col-title"><span>جلسة التسميع والتثبيت</span><span style="color:var(--text-dim); font-weight:600;">في أي وقت</span></div>
            <div class="task-row ${d.eDone ? 'done' : ''}" onclick="toggleDayTask('${d.id}', 'eDone')">
              <div class="check-circle">${d.eDone ? '✓' : ''}</div>
              <div class="task-text"><strong style="font-size:0.82rem;">${escapeHtml(d.second)}</strong></div>
            </div>
            <div class="task-row ${d.sDone ? 'done' : ''}" style="margin-bottom:0;" onclick="toggleDayTask('${d.id}', 'sDone')">
              <div class="check-circle">${d.sDone ? '✓' : ''}</div>
              <div class="task-text"><strong style="font-size:0.82rem;">${escapeHtml(d.solid)}</strong></div>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('archiveCountTag').textContent = `${state.weekArchives.length} أسابيع`;
  const archEl = document.getElementById('weekArchiveList');
  if (state.weekArchives.length === 0) {
    archEl.innerHTML = '<div class="empty-state">اضغط «إغلاق الأسبوع وأرشفته» في نهاية أسبوعك لحفظ سجل التزامك هنا.</div>';
  } else {
    archEl.innerHTML = state.weekArchives.map((a) => `
      <div class="log-item">
        <div>
          <strong style="font-size:0.87rem;">أسبوع منتهٍ في ${a.date}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">أنجزت ${a.doneTasks} من 21 مهمة • الختمة: ${a.khatmaPct}%</div>
        </div>
        <span class="tag tag-success">${Math.round(a.doneTasks / 21 * 100)}%</span>
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
  document.getElementById('editDayModal').classList.add('open');
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
  state.schedule.forEach((d) => { if (d.mDone) doneT++; if (d.eDone) doneT++; if (d.sDone) doneT++; });
  const totalPages = state.juzList.reduce((s, j) => s + j.totalPages, 0) || 604;
  const donePages = state.juzList.reduce((s, j) => s + Math.min(j.donePages, j.totalPages), 0);
  state.weekArchives.unshift({ date: todayStr(), doneTasks: doneT, khatmaPct: Math.round(donePages / totalPages * 100) });
  state.schedule = buildLiveSchedule(state.profile, state.juzList, state.activeRevJuzNum, state.activeNewSurahNum, null);
  saveState();
  renderAll();
  showToast('تم أرشفة الأسبوع وتوليد جدول الأسبوع الجديد ✓');
}

// ================= TAB 3: SOLID BOX =================
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

function renderSolidTab() {
  const sub = state.solidSubTab || 'new';
  document.getElementById('solidTabNew').classList.toggle('active', sub === 'new');
  document.getElementById('solidTabOld').classList.toggle('active', sub === 'old');
  document.getElementById('solidTabLogs').classList.toggle('active', sub === 'logs');
  document.getElementById('solidPanelNew').style.display = sub === 'new' ? 'block' : 'none';
  document.getElementById('solidPanelOld').style.display = sub === 'old' ? 'block' : 'none';
  document.getElementById('solidPanelLogs').style.display = sub === 'logs' ? 'block' : 'none';

  const completedList = state.juzList.filter((j) => j.donePages >= j.totalPages - 0.01);
  const activeGroups = state.newLinkingGroups.filter((g) => !g.archived);
  const archivedGroups = state.newLinkingGroups.filter((g) => g.archived);
  const totalNewPassages = activeGroups.reduce((s, g) => s + g.passages.length, 0);

  document.getElementById('solidBoxOldSummary').textContent = `${completedList.length} أجزاء`;
  document.getElementById('solidBoxNewSummary').textContent = `${totalNewPassages} مقاطع (${activeGroups.length} سورة)`;

  const linkContainer = document.getElementById('linkingGroupsContainer');
  const linkAlert = document.getElementById('linkingAlertBanner');
  const dueGroup = activeGroups.find((g) => g.passages.length >= 3 && g.linkCount < Math.floor(g.passages.length / 2));
  linkAlert.innerHTML = dueGroup ? `
    <div class="alert-banner">
      <span style="font-size:1.25rem;">🔗</span>
      <div><strong>جلسة تجميع وربط مقترحة لـ ${escapeHtml(dueGroup.surahName)}</strong> جمّعت فيها ${dueGroup.passages.length} مقاطع — اسردها متصلة الآن لتتلاحم السورة.</div>
    </div>` : '';

  if (activeGroups.length === 0 && archivedGroups.length === 0) {
    linkContainer.innerHTML = '<div class="empty-state">قسم <strong>تثبيت الجديد</strong> فارغ حالياً — أي ورد تسمّعه من الرئيسية يدخل هنا تلقائياً مجمّعاً حسب السورة.</div>';
  } else {
    let html = '';
    activeGroups.forEach((g) => {
      const sumPages = g.passages.reduce((s, p) => s + p.pages, 0);
      const hasWeak = g.passages.some((p) => p.rating === 'جيد' || p.rating === 'يحتاج إعادة');
      html += `
        <div class="link-group-card ${hasWeak ? 'priority' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <strong style="font-size:0.97rem; color:var(--accent-hi);">${escapeHtml(g.surahName)}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">
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
                <span>${idx + 1}. ${escapeHtml(p.passage)} (${formatNum(p.pages)})</span>
                <span style="opacity:0.82;">• ${escapeHtml(p.rating)}</span>
                <button type="button" onclick="removeLinkPassage('${g.id}','${p.id}')" style="background:none;border:none;color:inherit;cursor:pointer;padding:0 2px;font-weight:900;">×</button>
              </span>`;
            }).join('')}
          </div>
          <div style="display:flex; gap:7px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('new', '${g.id}', '${escapeAttr(g.surahName)}')">+ تمت المراجعة والربط</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="startLinkTimer()">مؤقت الربط (٦ د)</button>
            <button type="button" class="btn btn-success btn-sm" onclick="toggleArchiveLinkGroup('${g.id}')">تم إتقان السورة ✓</button>
          </div>
        </div>`;
    });
    if (archivedGroups.length > 0) {
      html += `<div style="margin-top:12px; font-size:0.81rem; font-weight:800; color:var(--success); margin-bottom:7px;">✓ سور تم إتقانها (${archivedGroups.length})</div>`;
      archivedGroups.forEach((g) => {
        html += `<div class="log-item"><div><strong style="font-size:0.89rem; color:var(--success);">${escapeHtml(g.surahName)}</strong><div style="font-size:0.75rem; color:var(--text-muted);">${g.passages.length} مقاطع • رُبطت ${g.linkCount} مرات</div></div><button type="button" class="btn btn-ghost btn-sm" onclick="toggleArchiveLinkGroup('${g.id}')">إعادة</button></div>`;
      });
    }
    linkContainer.innerHTML = html;
  }

  document.getElementById('solidCountBadge').textContent = `${completedList.length} أجزاء`;
  const solidEl = document.getElementById('solidBoxList');
  if (completedList.length === 0) {
    solidEl.innerHTML = '<div class="empty-state">قسم <strong>تثبيت القديم</strong> بانتظار أول جزء مكتمل من خريطة الـ ٣٠ جزءاً.</div>';
  } else {
    solidEl.innerHTML = completedList.map((j) => {
      const meta = state.solidMeta[j.num] || { reviews: 0, lastReviewed: '', rating: 'جيد جداً', nextReviewDate: todayStr() };
      return `
        <div class="log-item" style="align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <strong style="font-size:0.91rem;">${j.title}</strong>
              ${formatDueTag(meta.nextReviewDate || todayStr())}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
              اللفات: <strong style="color:var(--accent-hi);">${meta.reviews}</strong> • آخر تقييم: <strong>${meta.rating || '—'}</strong>
              ${meta.lastReviewed ? ` • ${meta.lastReviewed}` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-gold btn-sm" onclick="openSrReviewModal('old', ${j.num}, '${escapeAttr(j.title)}')">+ راجعته</button>
        </div>`;
    }).join('');
  }

  document.getElementById('maqraaCountTag').textContent = `${state.maqraaLogs.length} حصص`;
  const logEl = document.getElementById('maqraaLogList');
  if (state.maqraaLogs.length === 0) {
    logEl.innerHTML = '<div class="empty-state">سجل حصص التسميع والتقييمات سيظهر هنا فور تأكيد أول تسميع.</div>';
  } else {
    logEl.innerHTML = state.maqraaLogs.map((item) => `
      <div class="log-item">
        <div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.89rem; color:var(--accent-hi);">${escapeHtml(item.surahName)} — ${escapeHtml(item.passage)}</strong>
            ${ratingBadgeHtml(item.rating)}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${formatNum(item.pages)} وجه • الجزء ${item.juzNum} • ${item.date}</div>
          ${item.note ? `<div style="font-size:0.76rem; color:var(--text-main); margin-top:3px;">📝 ${escapeHtml(item.note)}</div>` : ''}
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteMaqraaLog('${item.id}')">حذف</button>
      </div>`).join('');
  }
}

function ratingBadgeHtml(r) {
  if (r === 'ممتاز') return '<span class="tag tag-success">ممتاز</span>';
  if (r === 'جيد جداً') return '<span class="tag tag-gold">جيد جداً</span>';
  if (r === 'جيد') return '<span class="tag tag-warn">جيد</span>';
  return '<span class="tag tag-danger">يحتاج إعادة</span>';
}

function addPassageToLinkingGroup(surahName, passage, pages, rating, date) {
  const cleanName = surahName.trim();
  const nextInt = computeNextInterval(rating, '', 0);
  let group = state.newLinkingGroups.find((g) => g.surahName === cleanName && !g.archived);
  if (!group) {
    group = {
      id: 'lg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      surahName: cleanName,
      archived: false,
      linkCount: 0,
      lastLinked: date,
      rating,
      intervalDays: nextInt,
      nextReviewDate: addDaysStr(date, nextInt),
      passages: []
    };
    state.newLinkingGroups.unshift(group);
  } else {
    const candidateDate = addDaysStr(date, nextInt);
    if (!group.nextReviewDate || candidateDate < group.nextReviewDate) {
      group.nextReviewDate = candidateDate;
      group.rating = rating;
    }
  }
  group.passages.push({
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    passage: passage.trim(),
    pages: Number(pages) || 1,
    rating,
    date
  });
}

function populateManualLinkSurahSelect() {
  const sel = document.getElementById('mlSurah');
  if (!sel || sel.options.length === SURAHS_DB.length) return;
  sel.innerHTML = SURAHS_DB.map((s) =>
    `<option value="سورة ${s.name}">${s.num}. سورة ${s.name} (الجزء ${s.juz})</option>`
  ).join('');
}

function openManualLinkModal() {
  populateManualLinkSurahSelect();
  const activeS = resolveActiveNewSurah(state.profile, state.juzList, state.activeNewSurahNum);
  if (activeS) document.getElementById('mlSurah').value = `سورة ${activeS.name}`;
  document.getElementById('manualLinkModal').classList.add('open');
}

function saveManualLinkPassage(e) {
  e.preventDefault();
  addPassageToLinkingGroup(
    document.getElementById('mlSurah').value.trim(),
    document.getElementById('mlPassage').value.trim(),
    parseFloat(document.getElementById('mlPages').value) || 1,
    document.getElementById('mlRating').value,
    todayStr()
  );
  saveState();
  closeModal('manualLinkModal');
  document.getElementById('mlPassage').value = '';
  renderAll();
  showToast('أُضيف المقطع إلى تثبيت الجديد وجُدول تلقائياً ✓');
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

function startLinkTimer() { switchTab('tools'); setTimerMode('link'); }
function deleteMaqraaLog(id) { state.maqraaLogs = state.maqraaLogs.filter((x) => x.id !== id); saveState(); renderAll(); }

// ================= TAB 4: 30-JUZ MAP =================
function setMapFilter(filter) {
  state.mapFilter = filter;
  saveState();
  renderMap();
}

function renderMap() {
  const revCount = state.juzList.filter((j) => j.track === 'revision').length;
  const newCount = state.juzList.filter((j) => j.track === 'new').length;
  const fRev = document.getElementById('filterRev');
  const fNew = document.getElementById('filterNew');
  const fAll = document.getElementById('filterAll');

  fRev.textContent = `الترميم (${revCount})`;
  fNew.textContent = `الجديد (${newCount})`;
  fRev.style.display = revCount > 0 ? 'block' : 'none';
  fNew.style.display = (state.profile.mode !== 'khatim' && newCount > 0) ? 'block' : 'none';

  if (state.mapFilter === 'new' && (newCount === 0 || state.profile.mode === 'khatim')) state.mapFilter = 'revision';
  if (state.mapFilter === 'revision' && revCount === 0) state.mapFilter = 'new';

  [fRev, fNew, fAll].forEach((b) => b.classList.remove('active'));
  if (state.mapFilter === 'revision') fRev.classList.add('active');
  if (state.mapFilter === 'new') fNew.classList.add('active');
  if (state.mapFilter === 'all') fAll.classList.add('active');

  const filtered = state.juzList.filter((j) => state.mapFilter === 'all' || j.track === state.mapFilter);
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
      const fillClass = completed ? 'bar-fill-success' : (j.track === 'new' ? 'bar-fill-info' : 'bar-fill-gold');

      html += `
        <div class="juz-card ${completed ? 'completed' : ''} ${isActive && !completed ? 'active-juz' : ''}">
          <div class="juz-top">
            <div>
              <div class="juz-title">
                <span>${j.title}</span>
                <span class="tag ${j.track === 'new' ? 'tag-info' : 'tag-gold'}">${j.track === 'new' ? 'جديد' : 'ترميم'}</span>
                ${completed ? '<span class="tag tag-success">✓ في صندوق التثبيت</span>' : (isActive ? '<span class="tag tag-gold">النشط في الجدول</span>' : '')}
              </div>
              <div class="juz-sub">${j.range}</div>
            </div>
            <div style="text-align:left; flex-shrink:0;">
              <strong style="color:${completed ? 'var(--success)' : 'var(--accent-hi)'}; font-size:0.93rem;">${formatNum(j.donePages)} / ${j.totalPages}</strong>
              <div style="font-size:0.7rem; color:var(--text-muted);">${pct}%</div>
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
            ${!completed && !isActive
              ? `<button type="button" class="btn btn-gold btn-sm" onclick="setActiveRevJuz(${j.num})">ابدأ به الآن</button>`
              : ''
            }
            ${j.surahs && j.surahs.length > 0 ? `<button type="button" class="btn btn-ghost btn-sm" onclick="toggleExpandJuz(${j.num})">${expanded ? 'السور ▲' : `السور (${j.surahs.length}) ▼`}</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" onclick="flipJuzTrack(${j.num})">نقل لـ ${j.track === 'new' ? 'المراجعة' : 'الجديد'}</button>
          </div>
          ${j.surahs && expanded ? `
            <div class="surah-list">
              ${j.surahs.map((s, idx) => `
                <div class="surah-chip ${s.done ? 'done' : ''}" onclick="toggleSurah(${j.num}, ${idx})">
                  <span>${s.done ? '✓' : '○'} ${escapeHtml(s.name)}</span>
                  <small>${formatNum(s.pages)}</small>
                </div>`).join('')}
            </div>` : ''}
          <div style="margin-top:8px;">
            <input type="text" value="${escapeAttr(j.note || '')}" placeholder="ملاحظة أو متشابهات..."
              onchange="updateJuzNote(${j.num}, this.value)" style="padding:7px 10px; font-size:0.77rem;" />
          </div>
        </div>`;
    });
  });
  document.getElementById('juzMapContainer').innerHTML = html || '<div class="empty-state">لا توجد أجزاء في هذا الفلتر</div>';
}

function flipJuzTrack(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.track = j.track === 'new' ? 'revision' : 'new';
  j.phase = j.track === 'new' ? 'مسار الحفظ الجديد' : 'مسار المراجعة والترميم';
  if (j.surahs) j.surahs.forEach((s) => { s.track = j.track; });
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function adjustJuzPages(juzNum, delta) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.donePages = Math.max(0, Math.min(j.totalPages, Number((j.donePages + delta).toFixed(2))));
  if (delta > 0) touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function completeJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.donePages = j.totalPages;
  if (j.surahs) j.surahs.forEach((s) => { s.done = true; });
  touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function resetJuz(juzNum) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j) return;
  j.donePages = j.basePages || 0;
  if (j.surahs) j.surahs.forEach((s) => { s.done = false; });
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function toggleSurah(juzNum, idx) {
  const j = state.juzList.find((x) => x.num === juzNum);
  if (!j || !j.surahs || !j.surahs[idx]) return;
  j.surahs[idx].done = !j.surahs[idx].done;
  const surahSum = j.surahs.reduce((sum, s) => sum + (s.done ? s.pages : 0), 0);
  j.donePages = Math.min(j.totalPages, Number(((j.basePages || 0) + surahSum).toFixed(2)));
  if (j.surahs[idx].done) touchStreak();
  syncSolidBoxMembership(j);
  syncPlanAndScheduleLive();
  saveState();
  renderAll();
}

function toggleExpandJuz(juzNum) { state.expandedJuz[juzNum] = !state.expandedJuz[juzNum]; saveState(); renderMap(); }
function updateJuzNote(juzNum, val) { const j = state.juzList.find((x) => x.num === juzNum); if (j) { j.note = val; saveState(); } }

function quickAddRevPage() {
  const curRev = resolveActiveRevJuz(state.juzList, state.activeRevJuzNum);
  if (!curRev) { showToast('ما شاء الله! كل أجزاء المراجعة مكتملة في صندوق التثبيت'); return; }
  adjustJuzPages(curRev.num, 1);
  if (curRev.donePages < curRev.totalPages - 0.01) {
    showToast(`+١ وجه في ${curRev.title} (${formatNum(curRev.donePages)}/${curRev.totalPages})`);
  }
}

// ================= SMART REMINDERS =================
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
    return `يا ${name}، كل أجزاء المراجعة مكتملة — خصّص ١٠ دقائق لتثبيتها اليوم.`;
  }
  if (type === 'new') {
    if (state.activeWird) {
      return `يا ${name}، وردك الجديد المسجّل: ${state.activeWird.surahName} (${state.activeWird.passage}) — راجعه واستعد للتسميع.`;
    }
    return `يا ${name}، موعد وردك القادم في ${activeS ? `سورة ${activeS.name}` : 'الحفظ الجديد'} — سجّل مقطعك من الرئيسية.`;
  }
  if (due.length > 0) {
    return `يا ${name}، لديك ${due.length} عناصر مستحقة في صندوق التثبيت اليوم — أهمها: ${due[0].title}.`;
  }
  return `يا ${name}، ١٠ دقائق سرد سريع من صندوق التثبيت تحفظ لك تعب شهور.`;
}

function addReminder(e) {
  e.preventDefault();
  const time = document.getElementById('remTimeInput').value;
  const type = document.getElementById('remTypeInput').value;
  if (!time) return;
  state.reminders.push({ id: 'rem_' + Date.now(), time, type, enabled: true, lastTriggeredDate: '' });
  saveState();
  renderRemindersUI();
  showToast('تم حفظ موعد التذكير الذكي ✓');
}

function toggleReminder(id) {
  const r = state.reminders.find((x) => x.id === id);
  if (r) { r.enabled = !r.enabled; saveState(); renderRemindersUI(); }
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter((x) => x.id !== id);
  saveState();
  renderRemindersUI();
}

function renderRemindersUI() {
  const el = document.getElementById('remindersList');
  if (!el) return;
  const typeLabels = { revision: 'مراجعة وترميم', new: 'حفظ جديد / تسميع', solid: 'صندوق التثبيت' };
  if (state.reminders.length === 0) {
    el.innerHTML = '<div class="empty-state">لا توجد مواعيد تذكير مفعّلة حالياً (مرونة كاملة بدون إشعارات).</div>';
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
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">معاينة الرسالة: «${escapeHtml(buildSmartMessage(r.type))}»</div>
      </div>
      <div style="display:flex; gap:5px;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="toggleReminder('${r.id}')">${r.enabled ? 'إيقاف' : 'تفعيل'}</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteReminder('${r.id}')">حذف</button>
      </div>
    </div>`).join('');
}

function requestNotifPermission(silent = false) {
  if (!('Notification' in window)) {
    if (!silent) showToast('المتصفح لا يدعم إشعارات النظام — ستظهر التذكيرات داخل التطبيق');
    return;
  }
  Notification.requestPermission().then((res) => {
    if (!silent) {
      showToast(res === 'granted' ? 'تم تفعيل إشعارات الجهاز بنجاح ✓' : 'تم رفض الإذن — ستظهر التذكيرات داخل التطبيق');
    }
  });
}

function testSmartNotification() {
  const msg = buildSmartMessage(state.reminders[0] ? state.reminders[0].type : 'solid');
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('رفيق التثبيت', { body: msg, icon: 'icon-192.png' });
    showToast('تم إرسال إشعار تجريبي على جهازك 🔔');
  } else {
    showToast(msg);
  }
}

function renderInAppReminderBanner() {
  const box = document.getElementById('inAppReminderBanner');
  if (!box || !state.reminders.length) { if (box) box.innerHTML = ''; return; }
  const now = new Date();
  const nowHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const activeDue = state.reminders.find((r) => r.enabled && r.time <= nowHHMM && r.lastTriggeredDate !== todayStr());
  if (activeDue) {
    const msg = buildSmartMessage(activeDue.type);
    box.innerHTML = `
      <div class="alert-banner" style="justify-content:space-between; align-items:center;">
        <div><strong>🔔 تذكير موعد ${activeDue.time}</strong>${escapeHtml(msg)}</div>
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

setInterval(() => {
  if (!state.onboarded || !state.reminders.length) return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const today = todayStr();
  state.reminders.forEach((r) => {
    if (r.enabled && r.time === hhmm && r.lastTriggeredDate !== today) {
      r.lastTriggeredDate = today;
      saveState();
      const msg = buildSmartMessage(r.type);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('رفيق التثبيت', { body: msg, icon: 'icon-192.png' });
      }
      renderInAppReminderBanner();
    }
  });
}, 45000);

// ================= DOCTOR OF PAGE TIMER & CALCULATOR =================
const TIMER_MODES = {
  doctor: {
    total: 12 * 60,
    phases: [
      { start: 0, end: 120, name: 'المرحلة ١: الكشف بالقلم الرصاص', hint: 'اقرأ الوجه نظراً بصوت مسموع وعلّم على الآيات المتفلتة فقط (دقيقتان)' },
      { start: 120, end: 420, name: 'المرحلة ٢: ترميم الآيات المتفلتة فقط', hint: 'كرّر كل آية معلّم عليها ٥ مرات واربطها بما قبلها وما بعدها (٥ دقائق)' },
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
let timerInterval = null;
let lastPhaseIdx = 0;

function playChime() {
  if (!document.getElementById('timerSoundToggle').checked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(792, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.65);
  } catch (e) {}
}

function setTimerMode(mode) {
  clearInterval(timerInterval);
  timerInterval = null;
  timerMode = mode;
  timerRemaining = TIMER_MODES[mode].total;
  lastPhaseIdx = 0;
  document.getElementById('modeDoctor').classList.toggle('active', mode === 'doctor');
  document.getElementById('modeLink').classList.toggle('active', mode === 'link');
  document.getElementById('modeSolid').classList.toggle('active', mode === 'solid');
  document.getElementById('doctorPhasePills').style.display = mode === 'doctor' ? 'grid' : 'none';
  document.getElementById('timerStartBtn').textContent = 'ابدأ الجلسة';
  renderTimer();
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('timerStartBtn').textContent = 'استكمال';
  } else {
    if (timerRemaining <= 0) timerRemaining = TIMER_MODES[timerMode].total;
    document.getElementById('timerStartBtn').textContent = 'إيقاف مؤقت';
    timerInterval = setInterval(() => {
      timerRemaining--;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('timerStartBtn').textContent = 'ابدأ من جديد';
        playChime();
        showToast('انتهت الجلسة بنجاح! بارك الله في وقتك ✓');
      }
      renderTimer();
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = TIMER_MODES[timerMode].total;
  lastPhaseIdx = 0;
  document.getElementById('timerStartBtn').textContent = 'ابدأ الجلسة';
  renderTimer();
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

function updateCalculator() {
  const isKhatim = state.profile.mode === 'khatim';
  const newBlock = document.getElementById('calcNewPagesBlock');
  if (newBlock) newBlock.style.display = isKhatim ? 'none' : 'block';

  const daily = parseInt(document.getElementById('calcDailyMin').value, 10) || 45;
  const newPerSession = isKhatim ? 0 : parseFloat(document.getElementById('calcNewPages').value);
  const nps = isNaN(newPerSession) ? 1 : newPerSession;
  state.calcDailyMin = daily;
  state.calcNewPages = nps;

  document.getElementById('calcMinVal').textContent = `${daily} دقيقة (${daily * 7} د/أسبوع)`;
  document.getElementById('calcNewPagesVal').textContent = `${nps} وجه/جلسة (${nps * 2} وجه/أسبوع)`;

  const weeklyTotal = daily * 7;
  const newMin = nps * 2 * 45;
  const revPool = Math.max(0, weeklyTotal - newMin);
  const restoreMin = revPool * 0.75;
  const solidMin = revPool * 0.25;
  const netRevPages = restoreMin / 15;

  const remRevPages = state.juzList.filter((j) => j.track === 'revision').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);
  const remNewPages = state.juzList.filter((j) => j.track === 'new').reduce((s, j) => s + Math.max(0, j.totalPages - j.donePages), 0);

  document.getElementById('calcRevWeek').textContent = netRevPages > 0 ? `${netRevPages.toFixed(1)} وجه` : '0 وجه';
  document.getElementById('calcWeeksJuz').textContent = netRevPages >= 0.5 ? `${(20 / netRevPages).toFixed(1)} أسبوع` : 'متوقف';
  document.getElementById('calcOldMonths').textContent = remRevPages <= 0 ? 'مكتمل ✓' : (netRevPages >= 0.5 ? `${(remRevPages / (netRevPages * 4.33)).toFixed(1)} شهر` : '—');
  document.getElementById('calcNewMonths').textContent = (isKhatim || remNewPages <= 0) ? 'مكتمل ✓' : (nps > 0 ? `${(remNewPages / (nps * 2 * 4.33)).toFixed(1)} شهر` : 'متوقف');

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
    <span><i class="dot" style="background:var(--accent-mid)"></i>الترميم: ${Math.round(restoreMin)} د</span>
    <span><i class="dot" style="background:var(--success)"></i>التثبيت: ${Math.round(solidMin)} د</span>`;

  const badge = document.getElementById('calcModeBadge');
  const advice = document.getElementById('calcAdviceBox');
  if (weeklyTotal < newMin) {
    badge.textContent = 'عجز وقت';
    advice.innerHTML = '⚠️ وقتك اليومي أقل من المطلوب للجديد — قلّل مقدار الجديد أو زوّد الوقت اليومي.';
  } else if (netRevPages < 3) {
    badge.textContent = 'حماية فقط';
    advice.innerHTML = '🛡️ وضع الحماية: ركّز على تثبيت ما في صندوق التثبيت واستخدم وضع «وقتي مضغوط النهارده» عند الانشغال.';
  } else if (netRevPages < 8) {
    badge.textContent = 'متوازن';
    advice.innerHTML = '⚖️ إيقاع متوازن ومستقر يجمع بين التقدم في الجديد وترميم القديم.';
  } else {
    badge.textContent = 'إنجاز سريع';
    advice.innerHTML = '🚀 إيقاع ممتاز يتيح تقدماً سريعاً مع تثبيت متين ومستقر.';
  }
}

// ================= BACKUP (JSON) & PWA INSTALL =================
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rafiq_altathbit_v6_${(state.profile.username || 'backup').replace('@', '')}_${todayStr()}.json`;
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
      if (!data || (!data.juzList && !data.profile)) throw new Error('invalid');
      if (data.version === 6 && data.juzList && data.juzList.length === 30) {
        const empty = getEmptyState();
        state = {
          ...empty,
          ...data,
          onboarded: true,
          profile: { ...empty.profile, ...(data.profile || {}) }
        };
      } else {
        state = migrateLegacyObject(data);
      }
      syncPlanAndScheduleLive();
      applyTheme(state.profile.theme || 'royal', state.profile.customColors);
      saveState();
      document.getElementById('onboardingOverlay').classList.remove('active');
      renderAll();
      showToast('تم استعادة بياناتك بالكامل بنجاح ✓');
    } catch (err) {
      showToast('الملف غير صالح — اختر ملف نسخة احتياطية لرفيق التثبيت');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetAllData() {
  if (!confirm('هل تريد مسح البيانات والبدء بتشخيص مستخدم جديد؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = getEmptyState();
  openOnboarding(false);
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installPwaBtn').style.display = 'inline-flex';
});

function promptInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('installPwaBtn').style.display = 'none';
  });
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ================= BOOT =================
applyTheme(state.profile.theme || 'royal', state.profile.customColors);
if (!state.onboarded) {
  openOnboarding(false);
} else {
  document.getElementById('calcDailyMin').value = state.calcDailyMin || state.profile.dailyMin || 45;
  document.getElementById('calcNewPages').value = state.calcNewPages ?? state.profile.pagesPerSession ?? 1;
  renderAll();
  renderTimer();
}
