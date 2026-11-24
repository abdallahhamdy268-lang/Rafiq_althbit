/* ==========================================================================
   رفيق التثبيت v6 — المنطق البرمجي الكامل
   اختبار تشخيصي متفرع (114 سورة) + خطة وجدول حقيقيان + SRS + ألوان حرة + استيراد v4/v5
   ========================================================================== */

(function () {
  'use strict';

  const DATA = window.RAFIQ_DATA;
  const STORAGE_KEY = 'rafiq_altathbit_v6_state';
  const LEGACY_KEYS = ['rafiq_altathbit_smart_v5', 'rafiq_altathbit_khatma_v4'];

  // ---------------- أدوات التاريخ والرياضيات والألوان ----------------
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDaysISO(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function diffDays(isoA, isoB) {
    const [ya, ma, da] = isoA.split('-').map(Number);
    const [yb, mb, db] = isoB.split('-').map(Number);
    const a = Date.UTC(ya, ma - 1, da);
    const b = Date.UTC(yb, mb - 1, db);
    return Math.round((a - b) / 86400000);
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPages(num) {
    const v = Math.round(Number(num || 0) * 10) / 10;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  function hexToRgb(hex) {
    const clean = (hex || '#00112B').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const conv = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * conv[0] + 0.7152 * conv[1] + 0.0722 * conv[2];
  }

  function mixHex(hex1, hex2, weight) {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    return rgbToHex(
      a.r * (1 - weight) + b.r * weight,
      a.g * (1 - weight) + b.g * weight,
      a.b * (1 - weight) + b.b * weight
    );
  }

  function buildCustomThemeTokens(bgHex, accentHex) {
    const bgLum = relativeLuminance(bgHex);
    const isLight = bgLum > 0.42;
    const accentLum = relativeLuminance(accentHex);

    const surface = isLight ? mixHex(bgHex, '#FFFFFF', 0.65) : mixHex(bgHex, '#FFFFFF', 0.07);
    const surface2 = isLight ? mixHex(bgHex, '#000000', 0.05) : mixHex(bgHex, '#FFFFFF', 0.13);
    const text = isLight ? '#141D2B' : '#F7F8FA';
    const textMuted = isLight ? '#4E5D70' : '#B7C4D6';
    const accentLight = isLight ? mixHex(accentHex, '#000000', 0.1) : mixHex(accentHex, '#FFFFFF', 0.28);
    const accentDark = mixHex(accentHex, '#000000', 0.18);
    const accentContrast = accentLum > 0.36 ? '#00112B' : '#F7F8FA';

    return {
      mode: isLight ? 'light' : 'dark',
      bg: bgHex,
      surface,
      surface2,
      accent: accentHex,
      accentLight,
      accentDark,
      accentContrast,
      text,
      textMuted
    };
  }

  // ---------------- الحالة الافتراضية ----------------
  function createDefaultState() {
    return {
      version: 6,
      onboarded: false,
      profile: {
        firstName: '',
        username: '',
        path: 'from_nas', // from_nas | from_baqarah | fresh | khatim | scattered
        stopSurah: 114,
        freshStartMode: 'from_nas', // from_nas | from_baqarah | custom_surah
        freshStartSurah: 114,
        khatimReviewMode: 'from_baqarah', // from_baqarah | from_nas | specific_juz
        khatimJuzList: [],
        scatteredSurahs: [],
        scatteredContinueMode: 'from_nas', // scattered | from_nas | from_baqarah
        stability: 'medium', // weak | medium | strong
        dailyMinutes: 60,
        maqraaDays: [1, 4] // الاثنين والخميس افتراضياً (قابل للتعديل)
      },
      memorizedSurahs: [], // أرقام السور المحفوظة بالكامل (1..114)
      activeWird: null, // { id, surahNumber, surahName, segmentLabel, pages, notes, createdAt }
      newBox: [], // [{ id, surahNumber, surahName, segmentLabel, pages, rating, nextDue, intervalDays, reps, updatedAt }]
      oldBox: [], // [{ id, title, kind, juz, surahNumbers, pages, rating, nextDue, intervalDays, reps, updatedAt }]
      recitationLog: [], // [{ id, date, type, title, pages, rating, notes }]
      weeklySchedule: [], // [{ dayId, dayName, isMaqraa, primarySession, secondarySession, donePrimary, doneSecondary }]
      streak: { count: 0, lastActiveDate: null },
      settings: {
        themeId: 'royal-navy',
        customColors: { bg: '#00112B', accent: '#D0A151' },
        smartReminders: true
      }
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('تعذر قراءة الحالة المحفوظة:', e);
    }
    return createDefaultState();
  }

  function mergeWithDefaults(parsed) {
    const def = createDefaultState();
    return {
      ...def,
      ...parsed,
      profile: { ...def.profile, ...(parsed.profile || {}) },
      streak: { ...def.streak, ...(parsed.streak || {}) },
      settings: {
        ...def.settings,
        ...(parsed.settings || {}),
        customColors: { ...def.settings.customColors, ...((parsed.settings && parsed.settings.customColors) || {}) }
      },
      memorizedSurahs: Array.isArray(parsed.memorizedSurahs) ? parsed.memorizedSurahs : [],
      newBox: Array.isArray(parsed.newBox) ? parsed.newBox : [],
      oldBox: Array.isArray(parsed.oldBox) ? parsed.oldBox : [],
      recitationLog: Array.isArray(parsed.recitationLog) ? parsed.recitationLog : [],
      weeklySchedule: Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule : []
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('تعذر الحفظ المحلي — تأكد من مساحة المتصفح.');
    }
  }

  function touchStreak() {
    const today = todayISO();
    const last = state.streak.lastActiveDate;
    if (last === today) return;
    if (last && diffDays(today, last) === 1) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastActiveDate = today;
  }

  // ---------------- محرك التكرار المتباعد (SRS) ----------------
  function computeNextSRS(ratingId, prevReps) {
    const reps = Number(prevReps || 0);
    if (ratingId === 'repeat') {
      return { days: reps === 0 ? 1 : 2, nextReps: 0 };
    }
    if (ratingId === 'good') {
      return { days: 4, nextReps: Math.max(1, reps) };
    }
    if (ratingId === 'very_good') {
      return { days: 8, nextReps: reps + 1 };
    }
    // excellent: 14 -> 18 -> 22 -> 25 يوماً
    const scale = [14, 18, 22, 25];
    const idx = Math.min(scale.length - 1, reps);
    return { days: scale[idx], nextReps: reps + 1 };
  }

  // ---------------- محرك الخطة الحقيقية والجدول الأسبوعي ----------------
  function getMemorizedSurahsFromWizard(p) {
    if (p.path === 'khatim') {
      return DATA.SURAHS.map((s) => s.number);
    }
    if (p.path === 'fresh') {
      return [];
    }
    if (p.path === 'from_nas') {
      const stop = Number(p.stopSurah || 114);
      const list = [];
      for (let n = stop; n <= 114; n++) list.push(n);
      return list;
    }
    if (p.path === 'from_baqarah') {
      const stop = Number(p.stopSurah || 1);
      const list = [];
      for (let n = 1; n <= stop; n++) list.push(n);
      return list;
    }
    if (p.path === 'scattered') {
      return Array.from(new Set((p.scatteredSurahs || []).map(Number))).sort((a, b) => a - b);
    }
    return [];
  }

  function getOrderedUnmemorizedSurahs(profile, memorizedSet) {
    const mem = new Set(memorizedSet);
    const unmem = DATA.SURAHS.filter((s) => !mem.has(s.number));
    if (profile.path === 'khatim') return [];

    let direction = 'from_nas';
    if (profile.path === 'from_baqarah') direction = 'from_baqarah';
    else if (profile.path === 'fresh') direction = profile.freshStartMode;
    else if (profile.path === 'scattered') direction = profile.scatteredContinueMode;

    if (direction === 'custom_surah') {
      const start = Number(profile.freshStartSurah || 114);
      const before = unmem.filter((s) => s.number >= start).sort((a, b) => a.number - b.number);
      const after = unmem.filter((s) => s.number < start).sort((a, b) => a.number - b.number);
      return [...before, ...after];
    }
    if (direction === 'from_baqarah') {
      return unmem.sort((a, b) => a.number - b.number);
    }
    // from_nas أو scattered: نرتب من الناس للبقرة كترتيب اقتراحي واضح
    return unmem.sort((a, b) => b.number - a.number);
  }

  function calculateDailyPace(profile, memorizedSurahs) {
    const mins = Number(profile.dailyMinutes || 60);
    const stats = DATA.calculateSurahSetStats(memorizedSurahs);
    const isKhatim = profile.path === 'khatim';
    const isFresh = stats.surahCount === 0;

    // تقسيم الوقت بمرونة لجلستين (أساسية ~67% + تسميع وتثبيت ~33%)
    const primaryMin = Math.max(10, Math.round((mins * 2) / 3 / 5) * 5);
    const secondaryMin = Math.max(5, mins - primaryMin);

    let reviewPagesPerDay = 0;
    let newPagesPerDay = 0;

    if (isKhatim) {
      // للخاتم: كل الوقت للمراجعة والتثبيت (~10 دقائق لكل وجه مراجعة متقنة أو 5 دقائق للمستقر)
      const minsPerReviewPage = profile.stability === 'weak' ? 8 : profile.stability === 'medium' ? 5 : 3.5;
      reviewPagesPerDay = Math.max(2, Math.round((mins / minsPerReviewPage) * 2) / 2);
      newPagesPerDay = 0;
    } else if (isFresh) {
      // بداية جديدة: 75% حفظ جديد و25% ربط وتثبيت القريب
      newPagesPerDay = Math.max(0.5, Math.round(((mins * 0.75) / 22) * 2) / 2);
      reviewPagesPerDay = Math.max(0.5, Math.round((newPagesPerDay * 2) * 2) / 2);
    } else {
      // مسار مزدوج: ترميم القديم + حفظ جديد حسب مستوى التثبيت
      const reviewShare = profile.stability === 'weak' ? 0.7 : profile.stability === 'medium' ? 0.6 : 0.45;
      const newShare = 1 - reviewShare;
      const minsPerReviewPage = profile.stability === 'weak' ? 9 : profile.stability === 'medium' ? 6 : 4;
      reviewPagesPerDay = Math.max(1, Math.round(((mins * reviewShare) / minsPerReviewPage) * 2) / 2);
      newPagesPerDay = Math.max(0.5, Math.round(((mins * newShare) / 22) * 2) / 2);
    }

    const daysToFinishNew = newPagesPerDay > 0 ? Math.ceil(stats.remainingPages / newPagesPerDay) : 0;
    const daysForReviewCycle = reviewPagesPerDay > 0 && stats.totalPages > 0
      ? Math.ceil(stats.totalPages / reviewPagesPerDay)
      : 0;

    return {
      mins,
      primaryMin,
      secondaryMin,
      reviewPagesPerDay,
      newPagesPerDay,
      daysToFinishNew,
      daysForReviewCycle,
      stats
    };
  }

  function buildInitialOldBox(profile, memorizedSurahs) {
    const today = todayISO();
    const items = [];
    const memSet = new Set(memorizedSurahs);
    if (memSet.size === 0) return items;

    // للخاتم الذي اختار أجزاء محددة
    if (profile.path === 'khatim' && profile.khatimReviewMode === 'specific_juz' && profile.khatimJuzList.length > 0) {
      const chosen = [...profile.khatimJuzList].sort((a, b) => a - b);
      chosen.forEach((j, idx) => {
        const jInfo = DATA.getJuzSummary(j);
        items.push({
          id: uid('old'),
          title: `${jInfo.name} (${jInfo.surahRangeLabel})`,
          kind: 'juz',
          juz: j,
          surahNumbers: jInfo.surahs.map((s) => s.number),
          pages: jInfo.pages,
          rating: null,
          nextDue: addDaysISO(today, idx),
          intervalDays: 0,
          reps: 0,
          updatedAt: today
        });
      });
      return items;
    }

    // تحديد الأجزاء المكتملة بالكامل أولاً
    const stats = DATA.calculateSurahSetStats(memorizedSurahs);
    let orderedJuz = [...stats.completedJuzNumbers];
    if (profile.path === 'from_nas' || (profile.path === 'khatim' && profile.khatimReviewMode === 'from_nas')) {
      orderedJuz.sort((a, b) => b - a);
    } else {
      orderedJuz.sort((a, b) => a - b);
    }

    const coveredSurahs = new Set();
    orderedJuz.forEach((j, idx) => {
      const jInfo = DATA.getJuzSummary(j);
      jInfo.surahs.forEach((s) => coveredSurahs.add(s.number));
      items.push({
        id: uid('old'),
        title: `${jInfo.name} (${jInfo.surahRangeLabel})`,
        kind: 'juz',
        juz: j,
        surahNumbers: jInfo.surahs.map((s) => s.number),
        pages: jInfo.pages,
        rating: null,
        nextDue: addDaysISO(today, Math.floor(idx / 1)), // توزيع هادئ يومياً
        intervalDays: 0,
        reps: 0,
        updatedAt: today
      });
    });

    // السور المحفوظة التي لا تشكّل جزءاً كاملاً بعد (تُضاف كعناصر حقيقية بأسمائها)
    const leftover = memorizedSurahs
      .filter((n) => !coveredSurahs.has(n))
      .map(DATA.getSurahByNumber)
      .filter(Boolean);

    if (profile.path === 'from_nas') leftover.sort((a, b) => b.number - a.number);

    leftover.forEach((s, idx) => {
      items.push({
        id: uid('old'),
        title: `سورة ${s.name} (الجزء ${s.juz})`,
        kind: 'surah',
        juz: s.juz,
        surahNumbers: [s.number],
        pages: s.pages,
        rating: null,
        nextDue: addDaysISO(today, Math.min(7, idx)),
        intervalDays: 0,
        reps: 0,
        updatedAt: today
      });
    });

    return items;
  }

  function generateWeeklySchedule(profile, memorizedSurahs, oldBox) {
    const pace = calculateDailyPace(profile, memorizedSurahs);
    const unmemQueue = getOrderedUnmemorizedSurahs(profile, memorizedSurahs);
    const maqraaSet = new Set((profile.maqraaDays || []).map(Number));
    const isKhatim = profile.path === 'khatim';

    // قائمة عناصر المراجعة الحقيقية للتوزيع الأسبوعي
    const reviewPool = oldBox.length > 0
      ? oldBox
      : memorizedSurahs.map((n) => {
          const s = DATA.getSurahByNumber(n);
          return s ? { title: `سورة ${s.name}`, pages: s.pages, juz: s.juz } : null;
        }).filter(Boolean);

    let newCursorIdx = 0;
    let newSurahOffsetPages = 0;
    let revCursorIdx = 0;

    return DATA.WEEKDAYS_AR.map((day, idx) => {
      const isMaqraa = maqraaSet.has(day.id);
      let primaryText = '';
      let secondaryText = '';

      // 1) الجلسة الأساسية (حفظ جديد أو مراجعة أساسية للخاتم)
      if (isKhatim) {
        const revItem = reviewPool.length > 0 ? reviewPool[revCursorIdx % reviewPool.length] : null;
        revCursorIdx++;
        if (revItem) {
          primaryText = `مراجعة وتثبيت ${revItem.title} — بمعدل ${formatPages(pace.reviewPagesPerDay)} وجه`;
        } else {
          primaryText = `دورة مراجعة متصلة — ${formatPages(pace.reviewPagesPerDay)} وجه`;
        }
      } else if (unmemQueue.length > 0) {
        // اختيار السورة الفعلية القادمة وحساب الأوجه
        const targetSurah = unmemQueue[newCursorIdx % unmemQueue.length];
        const remainingInSurah = Math.max(0.5, Math.round((targetSurah.pages - newSurahOffsetPages) * 10) / 10);
        const takePages = Math.min(pace.newPagesPerDay, remainingInSurah);
        const startP = Math.min(targetSurah.endPage, Math.floor(targetSurah.startPage + newSurahOffsetPages));
        const endP = Math.min(targetSurah.endPage, Math.ceil(startP + takePages - 0.5));

        primaryText = `حفظ جديد: سورة ${targetSurah.name} (الجزء ${targetSurah.juz}) — ${formatPages(takePages)} وجه (ص ${startP}${endP > startP ? '–' + endP : ''})`;

        newSurahOffsetPages += takePages;
        if (newSurahOffsetPages >= targetSurah.pages - 0.1) {
          newCursorIdx++;
          newSurahOffsetPages = 0;
        }
      } else {
        primaryText = `تثبيت شامل للمحفوظ — ${formatPages(pace.reviewPagesPerDay)} وجه`;
      }

      // 2) جلسة التسميع والتثبيت
      if (isMaqraa) {
        if (isKhatim) {
          const revItem2 = reviewPool.length > 0 ? reviewPool[(revCursorIdx) % reviewPool.length] : null;
          secondaryText = revItem2
            ? `يوم تسميع / مقرأة: عرض ${revItem2.title} وتقييم الأداء في صندوق التثبيت`
            : `يوم تسميع / مقرأة: عرض ورد المراجعة الأسبوعي وتقييمه`;
        } else {
          secondaryText = `يوم تسميع / مقرأة: تسميع الورد الجديد + ربط مقاطع «تثبيت جديد» (${pace.secondaryMin} د)`;
        }
      } else if (reviewPool.length > 0) {
        const revItem = reviewPool[revCursorIdx % reviewPool.length];
        revCursorIdx++;
        secondaryText = `ترميم وتثبيت: ${revItem.title} (${formatPages(Math.min(revItem.pages, pace.reviewPagesPerDay))} وجه) + تقييم SRS`;
      } else {
        secondaryText = `ربط وتسميع المحفوظ الجديد في صندوق التثبيت (${pace.secondaryMin} د)`;
      }

      // يوم الجمعة (أو اليوم الأخير) نضيف ملاحظة ربط أسبوعي هادئة
      if (idx === 6 && !isMaqraa && !isKhatim) {
        secondaryText = `جبر وربط أسبوعي: تجميع مقاطع السورة الحالية في «تثبيت جديد» + مراجعة المستحق`;
      }

      return {
        dayId: day.id,
        dayName: day.name,
        isMaqraa,
        primaryMin: pace.primaryMin,
        secondaryMin: pace.secondaryMin,
        primarySession: primaryText,
        secondarySession: secondaryText,
        donePrimary: false,
        doneSecondary: false
      };
    });
  }

  // ---------------- تطبيق الثيمات والألوان الحرة ----------------
  function applyTheme() {
    const root = document.documentElement;
    const themeId = state.settings.themeId || 'royal-navy';
    let tokens;

    if (themeId === 'custom') {
      const c = state.settings.customColors || { bg: '#00112B', accent: '#D0A151' };
      tokens = buildCustomThemeTokens(c.bg, c.accent);
    } else {
      const preset = DATA.PRESET_THEMES.find((t) => t.id === themeId) || DATA.PRESET_THEMES[0];
      const accentContrast = relativeLuminance(preset.accent) > 0.36 ? '#00112B' : '#F7F8FA';
      tokens = { ...preset, accentContrast };
    }

    root.style.setProperty('--bg', tokens.bg);
    root.style.setProperty('--surface', tokens.surface);
    root.style.setProperty('--surface-2', tokens.surface2);
    root.style.setProperty('--accent', tokens.accent);
    root.style.setProperty('--accent-light', tokens.accentLight);
    root.style.setProperty('--accent-dark', tokens.accentDark);
    root.style.setProperty('--accent-contrast', tokens.accentContrast);
    root.style.setProperty('--text', tokens.text);
    root.style.setProperty('--text-muted', tokens.textMuted);

    const isLight = tokens.mode === 'light';
    document.body.classList.toggle('theme-light', isLight);
    root.style.setProperty('--border', isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(208, 161, 81, 0.24)');
    root.style.setProperty('--border-soft', isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(247, 248, 250, 0.11)');

    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', tokens.bg);
  }

  // ---------------- الإشعار السريع (Toast) ----------------
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  // ---------------- الاختبار التشخيصي الذكي المتفرع ----------------
  const wizard = {
    step: 1,
    draft: null,
    surahFilter: ''
  };

  function openOnboarding(prefillFromState) {
    wizard.step = 1;
    wizard.surahFilter = '';
    wizard.draft = JSON.parse(JSON.stringify(prefillFromState ? state.profile : createDefaultState().profile));

    document.getElementById('onboardingView').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');

    document.getElementById('inpFirstName').value = wizard.draft.firstName || '';
    document.getElementById('inpUsername').value = wizard.draft.username || '';
    document.getElementById('rngDailyMinutes').value = wizard.draft.dailyMinutes || 60;
    document.getElementById('lblDailyMinutes').textContent = `${wizard.draft.dailyMinutes || 60} دقيقة`;

    checkLegacyLocalStorageBanner();
    renderWizardMaqraaPills();
    updateWizardUI();
  }

  function checkLegacyLocalStorageBanner() {
    const banner = document.getElementById('legacyDetectBanner');
    const txt = document.getElementById('legacyDetectText');
    const found = findLegacyLocalStorage();
    if (found) {
      banner.classList.remove('hidden');
      txt.textContent = `تم العثور على بيانات محفوظة (${found.key === 'rafiq_altathbit_smart_v5' ? 'الإصدار الخامس v5' : 'الإصدار الرابع v4'}). يمكنك استيرادها بنقرة واحدة.`;
    } else {
      banner.classList.add('hidden');
    }
  }

  function renderWizardMaqraaPills() {
    const wrap = document.getElementById('maqraaDaysPills');
    const selected = new Set(wizard.draft.maqraaDays || []);
    wrap.innerHTML = DATA.WEEKDAYS_AR.map(
      (d) => `<button type="button" class="pill ${selected.has(d.id) ? 'active' : ''}" data-day="${d.id}">${d.name}</button>`
    ).join('');
    wrap.querySelectorAll('.pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.day);
        const set = new Set(wizard.draft.maqraaDays || []);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        wizard.draft.maqraaDays = Array.from(set);
        btn.classList.toggle('active', set.has(id));
      });
    });
  }

  function updateWizardUI() {
    const pct = (wizard.step / 5) * 100;
    document.getElementById('wizardProgressBar').style.width = `${pct}%`;
    document.getElementById('wizardStepLabel').textContent = `الخطوة ${wizard.step} من ٥`;

    document.querySelectorAll('.wizard-step').forEach((el) => {
      el.classList.toggle('hidden', Number(el.dataset.step) !== wizard.step);
    });

    const prevBtn = document.getElementById('btnWizardPrev');
    const nextBtn = document.getElementById('btnWizardNext');
    prevBtn.classList.toggle('hidden', wizard.step === 1);
    nextBtn.textContent = wizard.step === 5 ? 'اعتماد خطتي وابدأ الآن' : 'التالي';

    if (wizard.step === 2) {
      document.querySelectorAll('#pathChoiceGrid .choice-card').forEach((card) => {
        card.classList.toggle('selected', card.dataset.path === wizard.draft.path);
      });
    } else if (wizard.step === 3) {
      renderBranchStep();
    } else if (wizard.step === 4) {
      const stabGroup = document.getElementById('stabilityGroup');
      stabGroup.classList.toggle('hidden', wizard.draft.path === 'fresh');
      document.querySelectorAll('#stabilityPills .pill').forEach((p) => {
        p.classList.toggle('active', p.dataset.val === wizard.draft.stability);
      });
    } else if (wizard.step === 5) {
      renderPlanPreview();
    }
  }

  function renderBranchStep() {
    const container = document.getElementById('branchStepContainer');
    const path = wizard.draft.path;

    // 1) بادئ من الناس للبقرة أو من البقرة للناس
    if (path === 'from_nas' || path === 'from_baqarah') {
      const isNas = path === 'from_nas';
      const ordered = isNas ? [...DATA.SURAHS].reverse() : [...DATA.SURAHS];
      const filtered = ordered.filter((s) => !wizard.surahFilter || s.name.includes(wizard.surahFilter) || String(s.number) === wizard.surahFilter);
      const memNums = getMemorizedSurahsFromWizard(wizard.draft);
      const stats = DATA.calculateSurahSetStats(memNums);
      const stopObj = DATA.getSurahByNumber(wizard.draft.stopSurah);
      const nextNum = isNas ? Math.max(1, (wizard.draft.stopSurah || 114) - 1) : Math.min(114, (wizard.draft.stopSurah || 1) + 1);
      const nextObj = DATA.getSurahByNumber(nextNum);

      container.innerHTML = `
        <h2>واقف عند أي سورة بالضبط؟</h2>
        <p class="muted">اختر آخر سورة أتممت حفظها (${isNas ? 'من الناس باتجاه البقرة' : 'من البقرة باتجاه الناس'}) لنحسب أجزاءك وأوجهك بدقة.</p>
        <div class="form-group">
          <input type="search" id="inpSurahSearch" placeholder="ابحث باسم السورة أو رقمها..." value="${escapeHTML(wizard.surahFilter)}" />
        </div>
        <div class="picker-list" id="singleSurahPicker">
          ${filtered.map((s) => `
            <button type="button" class="surah-chip ${Number(wizard.draft.stopSurah) === s.number ? 'selected' : ''}" data-surah="${s.number}">
              <span>${s.number}. ${s.name}</span>
              <small>ج${s.juz} · ${formatPages(s.pages)}و</small>
            </button>
          `).join('')}
        </div>
        <div class="live-calc-box">
          <div><strong>موضعك المحدد:</strong> أتممت حتى سورة <strong>${stopObj ? stopObj.name : ''}</strong></div>
          <div class="small muted mt-xs">
            المحفوظ المحسوب: <strong>${stats.surahCount} سورة</strong> · <strong>${formatPages(stats.totalPages)} وجهاً</strong> من ٦٠٤ (قرابة <strong>${stats.approxJuz} جزءاً</strong>)
          </div>
          <div class="small muted mt-xs">
            المتبقي للختمة: <strong>${formatPages(stats.remainingPages)} وجهاً</strong> · السورة القادمة للحفظ الجديد: <strong>${nextObj ? 'سورة ' + nextObj.name : 'اكتملت الختمة'}</strong>
          </div>
        </div>
      `;

      const searchEl = document.getElementById('inpSurahSearch');
      searchEl.addEventListener('input', (e) => {
        wizard.surahFilter = e.target.value.trim();
        renderBranchStep();
        const again = document.getElementById('inpSurahSearch');
        if (again) {
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }
      });

      container.querySelectorAll('.surah-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          wizard.draft.stopSurah = Number(btn.dataset.surah);
          renderBranchStep();
        });
      });
      return;
    }

    // 2) بداية جديدة (لم يحفظ بعد)
    if (path === 'fresh') {
      const mode = wizard.draft.freshStartMode || 'from_nas';
      container.innerHTML = `
        <h2>من أين تحب أن تبدأ رحلتك؟</h2>
        <p class="muted">نرشّح لك البداية من الناس للبقرة لتدرّج طول السور وسهولة التثبيت المبكر.</p>
        <div class="choice-grid" id="freshChoiceGrid">
          <button type="button" class="choice-card ${mode === 'from_nas' ? 'selected' : ''}" data-fresh="from_nas">
            <span class="choice-title">من الناس ← البقرة (مُرشّح)</span>
            <span class="choice-desc">تبدأ بسورة الناس وجزء عمّ وتبني زخماً سريعاً ومشجعاً.</span>
          </button>
          <button type="button" class="choice-card ${mode === 'from_baqarah' ? 'selected' : ''}" data-fresh="from_baqarah">
            <span class="choice-title">من البقرة ← الناس</span>
            <span class="choice-desc">تبدأ بترتيب المصحف من الفاتحة والبقرة.</span>
          </button>
          <button type="button" class="choice-card ${mode === 'custom_surah' ? 'selected' : ''}" data-fresh="custom_surah">
            <span class="choice-title">البدء من سورة محددة</span>
            <span class="choice-desc">اختر السورة التي تود البدء منها مباشرة.</span>
          </button>
        </div>
        ${mode === 'custom_surah' ? `
          <div class="form-group">
            <label for="selFreshCustomSurah">اختر سورة البداية</label>
            <select id="selFreshCustomSurah">
              ${DATA.SURAHS.map((s) => `<option value="${s.number}" ${Number(wizard.draft.freshStartSurah) === s.number ? 'selected' : ''}>${s.number}. سورة ${s.name} (الجزء ${s.juz} · ${formatPages(s.pages)} وجه)</option>`).join('')}
            </select>
          </div>
        ` : ''}
      `;
      container.querySelectorAll('[data-fresh]').forEach((card) => {
        card.addEventListener('click', () => {
          wizard.draft.freshStartMode = card.dataset.fresh;
          renderBranchStep();
        });
      });
      const sel = document.getElementById('selFreshCustomSurah');
      if (sel) {
        sel.addEventListener('change', (e) => {
          wizard.draft.freshStartSurah = Number(e.target.value);
        });
      }
      return;
    }

    // 3) خاتم للقرآن (30 جزءاً)
    if (path === 'khatim') {
      const kMode = wizard.draft.khatimReviewMode || 'from_baqarah';
      const chosenJuz = new Set(wizard.draft.khatimJuzList || []);
      container.innerHTML = `
        <h2>من أين تحب أن تبدأ دورة المراجعة؟</h2>
        <p class="muted">سيتم إخفاء قسم «الحفظ الجديد» تلقائياً ليركّز التطبيق بالكامل على تثبيت الختمة الكاملة (٣٠ جزءاً / ٦٠٤ أوجه).</p>
        <div class="choice-grid">
          <button type="button" class="choice-card ${kMode === 'from_baqarah' ? 'selected' : ''}" data-kmode="from_baqarah">
            <span class="choice-title">من البقرة ← الناس (الجزء ١ إلى ٣٠)</span>
            <span class="choice-desc">دورة مراجعة متسلسلة من أول المصحف.</span>
          </button>
          <button type="button" class="choice-card ${kMode === 'from_nas' ? 'selected' : ''}" data-kmode="from_nas">
            <span class="choice-title">من الناس ← البقرة (الجزء ٣٠ إلى ١)</span>
            <span class="choice-desc">دورة مراجعة عكسية تبدأ من جزء عمّ.</span>
          </button>
          <button type="button" class="choice-card ${kMode === 'specific_juz' ? 'selected' : ''}" data-kmode="specific_juz">
            <span class="choice-title">أجزاء محددة تحتاج أولوية تثبيت</span>
            <span class="choice-desc">اختر الأجزاء التي تريد التركيز عليها في هذه الدورة.</span>
          </button>
        </div>
        ${kMode === 'specific_juz' ? `
          <div class="form-group">
            <label>اختر الأجزاء المستهدفة (${chosenJuz.size} جزء محدد)</label>
            <div class="juz-grid">
              ${DATA.JUZ_DATA.map((j) => `
                <button type="button" class="surah-chip ${chosenJuz.has(j.juz) ? 'selected' : ''}" data-juz="${j.juz}">
                  <span>جزء ${j.juz}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
      container.querySelectorAll('[data-kmode]').forEach((card) => {
        card.addEventListener('click', () => {
          wizard.draft.khatimReviewMode = card.dataset.kmode;
          renderBranchStep();
        });
      });
      container.querySelectorAll('[data-juz]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const j = Number(btn.dataset.juz);
          if (chosenJuz.has(j)) chosenJuz.delete(j);
          else chosenJuz.add(j);
          wizard.draft.khatimJuzList = Array.from(chosenJuz).sort((a, b) => a - b);
          renderBranchStep();
        });
      });
      return;
    }

    // 4) حافظ سور متفرقة
    if (path === 'scattered') {
      const selectedSet = new Set(wizard.draft.scatteredSurahs || []);
      const filtered = DATA.SURAHS.filter((s) => !wizard.surahFilter || s.name.includes(wizard.surahFilter) || String(s.number) === wizard.surahFilter);
      const stats = DATA.calculateSurahSetStats(Array.from(selectedSet));
      const contMode = wizard.draft.scatteredContinueMode || 'from_nas';

      container.innerHTML = `
        <h2>اختر السور التي حفظتها فعلاً</h2>
        <p class="muted">حدد كل سورة تحفظها الآن من قائمة الـ ١١٤ سورة، ثم اختر طريقة إكمال الحفظ.</p>
        <div class="form-group">
          <input type="search" id="inpScatteredSearch" placeholder="ابحث باسم السورة..." value="${escapeHTML(wizard.surahFilter)}" />
        </div>
        <div class="picker-list">
          ${filtered.map((s) => `
            <button type="button" class="surah-chip ${selectedSet.has(s.number) ? 'selected' : ''}" data-msurah="${s.number}">
              <span>${s.number}. ${s.name}</span>
              <small>${formatPages(s.pages)}و</small>
            </button>
          `).join('')}
        </div>
        <div class="live-calc-box">
          <strong>المحدد حالياً:</strong> ${stats.surahCount} سورة · ${formatPages(stats.totalPages)} وجهاً من ٦٠٤ (قرابة ${stats.approxJuz} جزءاً)
        </div>
        <div class="form-group">
          <label>كيف تحب أن تكمل الحفظ الجديد؟</label>
          <div class="pill-group">
            <button type="button" class="pill ${contMode === 'scattered' ? 'active' : ''}" data-scont="scattered">أكمّل متفرق بسور أختارها</button>
            <button type="button" class="pill ${contMode === 'from_nas' ? 'active' : ''}" data-scont="from_nas">أنتظم من الناس ← البقرة</button>
            <button type="button" class="pill ${contMode === 'from_baqarah' ? 'active' : ''}" data-scont="from_baqarah">أنتظم من البقرة ← الناس</button>
          </div>
        </div>
      `;

      const searchEl = document.getElementById('inpScatteredSearch');
      searchEl.addEventListener('input', (e) => {
        wizard.surahFilter = e.target.value.trim();
        renderBranchStep();
        const again = document.getElementById('inpScatteredSearch');
        if (again) {
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }
      });

      container.querySelectorAll('[data-msurah]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const n = Number(btn.dataset.msurah);
          if (selectedSet.has(n)) selectedSet.delete(n);
          else selectedSet.add(n);
          wizard.draft.scatteredSurahs = Array.from(selectedSet).sort((a, b) => a - b);
          renderBranchStep();
        });
      });

      container.querySelectorAll('[data-scont]').forEach((btn) => {
        btn.addEventListener('click', () => {
          wizard.draft.scatteredContinueMode = btn.dataset.scont;
          renderBranchStep();
        });
      });
    }
  }

  function renderPlanPreview() {
    const box = document.getElementById('planPreviewBox');
    const memNums = getMemorizedSurahsFromWizard(wizard.draft);
    const pace = calculateDailyPace(wizard.draft, memNums);
    const unmem = getOrderedUnmemorizedSurahs(wizard.draft, memNums);
    const nextSurah = unmem[0];
    const maqraaLabels = (wizard.draft.maqraaDays || [])
      .map((id) => (DATA.WEEKDAYS_AR.find((d) => d.id === id) || {}).name)
      .filter(Boolean);

    box.innerHTML = `
      <div class="stack-list">
        <div><strong>الاسم:</strong> ${escapeHTML(wizard.draft.firstName || 'صاحب الهمة')}</div>
        <div><strong>المحفوظ الفعلي:</strong> ${pace.stats.surahCount} سورة · ${formatPages(pace.stats.totalPages)} وجهاً من ٦٠٤ (${pace.stats.percent}%)</div>
        <div><strong>الوقت اليومي المرن:</strong> ${pace.mins} دقيقة (جلسة أساسية ${pace.primaryMin} د + جلسة تسميع وتثبيت ${pace.secondaryMin} د في أي وقت)</div>
        ${wizard.draft.path === 'khatim'
          ? `<div><strong>وضع الخاتم:</strong> قسم الحفظ الجديد مخفي — معدل المراجعة المقترح <strong>${formatPages(pace.reviewPagesPerDay)} وجه يومياً</strong> (دورة كاملة كل ${pace.daysForReviewCycle} يوماً تقريباً).</div>`
          : `
            <div><strong>السورة القادمة للحفظ الجديد:</strong> ${nextSurah ? `سورة ${nextSurah.name} (الجزء ${nextSurah.juz} · ${formatPages(nextSurah.pages)} وجه)` : 'اكتملت السور'}</div>
            <div><strong>الوتيرة المحسوبة:</strong> حفظ جديد <strong>${formatPages(pace.newPagesPerDay)} وجه/يوم</strong> + مراجعة وترميم <strong>${formatPages(pace.reviewPagesPerDay)} وجه/يوم</strong></div>
            <div><strong>المدة التقديرية للمتبقي (${formatPages(pace.stats.remainingPages)} وجه):</strong> قرابة ${Math.max(1, Math.round(pace.daysToFinishNew / 30))} شهر (${pace.daysToFinishNew} يوماً)</div>
          `
        }
        <div><strong>أيام التسميع / المقرأة:</strong> ${maqraaLabels.length > 0 ? maqraaLabels.join('، ') : 'مرن بدون أيام محددة'}</div>
      </div>
    `;
  }

  function commitWizardPlan() {
    const memNums = getMemorizedSurahsFromWizard(wizard.draft);
    state.profile = JSON.parse(JSON.stringify(wizard.draft));
    state.memorizedSurahs = memNums;
    state.oldBox = buildInitialOldBox(state.profile, memNums);
    state.weeklySchedule = generateWeeklySchedule(state.profile, memNums, state.oldBox);
    state.onboarded = true;
    saveState();

    document.getElementById('onboardingView').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    renderAll();
    showToast('تم بناء خطتك وجدولك الحقيقي بنجاح.');
  }

  // ---------------- عرض الصفحة الرئيسية ----------------
  function getAllDueItems() {
    const today = todayISO();
    const list = [];

    state.newBox.forEach((item) => {
      if (!item.nextDue || item.nextDue <= today) {
        list.push({ ...item, boxType: 'newBox', overdueDays: item.nextDue ? diffDays(today, item.nextDue) : 0 });
      }
    });
    state.oldBox.forEach((item) => {
      if (!item.nextDue || item.nextDue <= today) {
        list.push({ ...item, boxType: 'oldBox', overdueDays: item.nextDue ? diffDays(today, item.nextDue) : 0 });
      }
    });

    list.sort((a, b) => b.overdueDays - a.overdueDays);
    return list;
  }

  function renderHome() {
    const p = state.profile;
    const stats = DATA.calculateSurahSetStats(state.memorizedSurahs);
    const dueItems = getAllDueItems();
    const unmem = getOrderedUnmemorizedSurahs(p, state.memorizedSurahs);
    const nextSurah = unmem[0];

    document.getElementById('topGreeting').textContent = `أهلاً ${p.firstName || 'بك'}`;
    document.getElementById('streakBadge').textContent = `${state.streak.count || 0} يوم`;

    // التذكير الذكي الديناميكي
    const remBanner = document.getElementById('smartReminderCard');
    const remText = document.getElementById('smartReminderText');
    if (state.settings.smartReminders) {
      remBanner.classList.remove('hidden');
      remText.textContent = buildDynamicReminderMessage(dueItems, nextSurah);
    } else {
      remBanner.classList.add('hidden');
    }

    // شبكة الإحصائيات
    document.getElementById('homeStatsGrid').innerHTML = `
      <div class="stat-tile">
        <div class="stat-val">${formatPages(stats.totalPages)} / ٦٠٤</div>
        <div class="stat-label">أوجه محفوظة (${stats.percent}%)</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${stats.approxJuz} / ٣٠</div>
        <div class="stat-label">أجزاء منجزة</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${dueItems.length}</div>
        <div class="stat-label">مستحق للمراجعة اليوم</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${p.path === 'khatim' ? 'دورة تثبيت' : (nextSurah ? nextSurah.name : 'مكتمل')}</div>
        <div class="stat-label">${p.path === 'khatim' ? 'خاتم للقرآن' : 'السورة القادمة'}</div>
      </div>
    `;

    // قائمة المستحق للمراجعة اليوم
    document.getElementById('dueCountPill').textContent = String(dueItems.length);
    const dueWrap = document.getElementById('dueListContainer');
    if (dueItems.length === 0) {
      dueWrap.innerHTML = `<div class="empty-state">أحسنت — لا توجد مراجعات متأخرة مستحقة اليوم. يمكنك التقدم في الورد الجديد أو مراجعة أي بند من صندوق التثبيت.</div>`;
    } else {
      const shown = dueItems.slice(0, 6);
      dueWrap.innerHTML = shown.map((item) => {
        const title = item.boxType === 'newBox'
          ? `سورة ${item.surahName} — ${item.segmentLabel}`
          : item.title;
        const badge = item.overdueDays > 0
          ? `<span class="badge-status badge-overdue">متأخر ${item.overdueDays} يوم</span>`
          : `<span class="badge-status">مستحق اليوم</span>`;
        const timerMode = item.boxType === 'newBox' ? 'link_new' : 'restore';
        return `
          <div class="item-card">
            <div class="item-top">
              <div>
                <div class="item-title">${escapeHTML(title)}</div>
                <div class="item-meta">${item.boxType === 'newBox' ? 'تثبيت جديد' : 'تثبيت قديم'} · ${formatPages(item.pages)} وجه</div>
              </div>
              ${badge}
            </div>
            <div class="inline-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-open-timer="${timerMode}">افتح في دكتور الصفحة</button>
            </div>
            <div class="rating-row">
              ${Object.values(DATA.RATINGS).map((r) => `
                <button type="button" class="rate-btn" data-rate="${r.id}" data-box="${item.boxType}" data-id="${item.id}" title="${r.hint}">${r.label}</button>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');

      dueWrap.querySelectorAll('.rate-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          rateBoxItem(btn.dataset.box, btn.dataset.id, btn.dataset.rate);
        });
      });
      dueWrap.querySelectorAll('[data-open-timer]').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchTab('tools');
          setDoctorMode(btn.dataset.openTimer);
        });
      });
    }

    // بطاقة الحفظ الجديد المدمجة في الرئيسية (تختفي للخاتم)
    const newCard = document.getElementById('newMemCard');
    if (p.path === 'khatim') {
      newCard.classList.add('hidden');
    } else {
      newCard.classList.remove('hidden');
      renderNewMemorizationCard(unmem);
    }
  }

  function renderNewMemorizationCard(unmemQueue) {
    const body = document.getElementById('newMemBody');
    const tag = document.getElementById('nextSurahTag');
    const pace = calculateDailyPace(state.profile, state.memorizedSurahs);

    if (state.activeWird) {
      const w = state.activeWird;
      tag.textContent = 'الخطوة ٢: التسميع والتقييم';
      body.innerHTML = `
        <div class="highlight-box">
          <div class="item-title">وردك المسجّل الآن: سورة ${escapeHTML(w.surahName)} — ${escapeHTML(w.segmentLabel)}</div>
          <div class="item-meta mt-xs">المقدار: ${formatPages(w.pages)} وجه ${w.notes ? '· ' + escapeHTML(w.notes) : ''}</div>
          <div class="inline-actions mt-sm">
            <button type="button" class="btn btn-ghost btn-sm" id="btnWirdLinkTimer">ربط في دكتور الصفحة (٦ د)</button>
            <button type="button" class="btn btn-ghost btn-sm" id="btnCancelActiveWird">تعديل الورد</button>
          </div>
        </div>
        <div class="form-group">
          <label>تم التسميع + التقييم (ينتقل تلقائياً لصندوق التثبيت):</label>
          <div class="rating-row">
            ${Object.values(DATA.RATINGS).map((r) => `
              <button type="button" class="rate-btn" data-rate="${r.id}" data-wird-rate="${r.id}" title="${r.hint}">${r.label}</button>
            `).join('')}
          </div>
        </div>
      `;

      document.getElementById('btnWirdLinkTimer').addEventListener('click', () => {
        switchTab('tools');
        setDoctorMode('link_new');
      });
      document.getElementById('btnCancelActiveWird').addEventListener('click', () => {
        state.activeWird = null;
        saveState();
        renderHome();
      });
      body.querySelectorAll('[data-wird-rate]').forEach((btn) => {
        btn.addEventListener('click', () => completeActiveWird(btn.dataset.wirdRate));
      });
      return;
    }

    // الخطوة 1: تسجيل الورد الجديد
    const defaultSurah = unmemQueue[0] || DATA.SURAHS[113];
    tag.textContent = 'الخطوة ١: تسجيل الورد';
    const existingSegments = state.newBox.filter((x) => x.surahNumber === defaultSurah.number).length;
    const defaultSegLabel = `المقطع ${existingSegments + 1} (${formatPages(Math.min(pace.newPagesPerDay, defaultSurah.pages))} وجه)`;

    body.innerHTML = `
      <div class="form-group">
        <label for="selNewSurah">السورة الحالية للحفظ الجديد</label>
        <select id="selNewSurah">
          ${(unmemQueue.length > 0 ? unmemQueue : DATA.SURAHS).map((s) => `
            <option value="${s.number}" ${s.number === defaultSurah.number ? 'selected' : ''}>
              ${s.number}. سورة ${s.name} (الجزء ${s.juz} · ${formatPages(s.pages)} وجه)
            </option>
          `).join('')}
        </select>
      </div>
      <div class="custom-color-row">
        <div class="form-group">
          <label for="inpWirdSegment">وصف المقطع / الآيات</label>
          <input type="text" id="inpWirdSegment" value="${escapeHTML(defaultSegLabel)}" placeholder="مثال: وجه ١ – ٢ أو آية ١–١٥" />
        </div>
        <div class="form-group">
          <label for="inpWirdPages">عدد الأوجه</label>
          <input type="number" id="inpWirdPages" min="0.25" max="20" step="0.25" value="${Math.min(pace.newPagesPerDay, defaultSurah.pages)}" />
        </div>
      </div>
      <div class="form-group">
        <label for="inpWirdNotes">ملاحظة سريعة (اختياري)</label>
        <input type="text" id="inpWirdNotes" placeholder="مثال: الانتباه للمتشابهات في آخر الوجه" />
      </div>
      <button type="button" class="btn btn-gold full-width mt-sm" id="btnRegisterWird">تسجيل الورد الجديد</button>
    `;

    document.getElementById('btnRegisterWird').addEventListener('click', () => {
      const surahNum = Number(document.getElementById('selNewSurah').value);
      const sObj = DATA.getSurahByNumber(surahNum);
      const segLabel = document.getElementById('inpWirdSegment').value.trim() || 'مقطع جديد';
      const pages = Math.max(0.25, Number(document.getElementById('inpWirdPages').value) || 1);
      const notes = document.getElementById('inpWirdNotes').value.trim();

      state.activeWird = {
        id: uid('wird'),
        surahNumber: surahNum,
        surahName: sObj ? sObj.name : '',
        segmentLabel: segLabel,
        pages,
        notes,
        createdAt: todayISO()
      };
      saveState();
      renderHome();
      showToast(`تم تسجيل ورد سورة ${state.activeWird.surahName}. عند الانتهاء اضغط التقييم.`);
    });
  }

  function completeActiveWird(ratingId) {
    if (!state.activeWird) return;
    const w = state.activeWird;
    const today = todayISO();
    const srs = computeNextSRS(ratingId, 0);

    state.newBox.unshift({
      id: uid('new'),
      surahNumber: w.surahNumber,
      surahName: w.surahName,
      segmentLabel: w.segmentLabel,
      pages: w.pages,
      rating: ratingId,
      nextDue: addDaysISO(today, srs.days),
      intervalDays: srs.days,
      reps: srs.nextReps,
      updatedAt: today
    });

    state.recitationLog.unshift({
      id: uid('log'),
      date: today,
      type: 'new',
      title: `سورة ${w.surahName} — ${w.segmentLabel}`,
      pages: w.pages,
      rating: ratingId,
      notes: w.notes || ''
    });

    // إذا بلغ مجموع مقاطع السورة في تثبيت جديد عدد صفحاتها، نضيف السورة لقائمة المحفوظة
    const sObj = DATA.getSurahByNumber(w.surahNumber);
    if (sObj) {
      const sumPages = state.newBox
        .filter((x) => x.surahNumber === w.surahNumber)
        .reduce((acc, x) => acc + Number(x.pages || 0), 0);
      if (sumPages >= sObj.pages - 0.1 && !state.memorizedSurahs.includes(w.surahNumber)) {
        state.memorizedSurahs.push(w.surahNumber);
      }
    }

    state.activeWird = null;
    touchStreak();
    saveState();
    renderAll();
    showToast(`نُقل المقطع لصندوق «تثبيت جديد» (المراجعة القادمة بعد ${srs.days} ${srs.days === 1 ? 'يوم' : 'أيام'}).`);
  }

  function rateBoxItem(boxType, itemId, ratingId) {
    const arr = boxType === 'newBox' ? state.newBox : state.oldBox;
    const item = arr.find((x) => x.id === itemId);
    if (!item) return;

    const today = todayISO();
    const srs = computeNextSRS(ratingId, item.reps);
    item.rating = ratingId;
    item.intervalDays = srs.days;
    item.reps = srs.nextReps;
    item.nextDue = addDaysISO(today, srs.days);
    item.updatedAt = today;

    const title = boxType === 'newBox' ? `سورة ${item.surahName} — ${item.segmentLabel}` : item.title;
    state.recitationLog.unshift({
      id: uid('log'),
      date: today,
      type: 'review',
      title,
      pages: item.pages,
      rating: ratingId,
      notes: boxType === 'newBox' ? 'تثبيت جديد' : 'تثبيت قديم'
    });

    touchStreak();
    saveState();
    renderAll();
    showToast(`تم التقييم — سيعود للمراجعة بعد ${srs.days} ${srs.days === 1 ? 'يوم' : 'أيام'}.`);
  }

  // ---------------- صندوق التثبيت (3 تبويبات) ----------------
  let currentBoxSubTab = 'new_solid';
  let logFilter = 'all';

  function renderBox() {
    const wrap = document.getElementById('boxSubContent');
    const today = todayISO();

    if (currentBoxSubTab === 'new_solid') {
      if (state.newBox.length === 0) {
        wrap.innerHTML = `<div class="card empty-state">لا توجد مقاطع في «تثبيت جديد» بعد. كل ورد جديد تسمّعه من الصفحة الرئيسية يُجمع هنا تلقائياً لربط مقاطع السور الطويلة معاً.</div>`;
        return;
      }

      // تجميع المقاطع حسب السورة لسهولة ربط السور الطويلة
      const grouped = new Map();
      state.newBox.forEach((item) => {
        const key = item.surahNumber;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      });

      let html = '';
      grouped.forEach((segments, surahNum) => {
        const sObj = DATA.getSurahByNumber(surahNum);
        const totalSegPages = segments.reduce((sum, x) => sum + Number(x.pages || 0), 0);
        html += `
          <article class="card">
            <div class="card-head">
              <div>
                <h3>سورة ${escapeHTML(sObj ? sObj.name : segments[0].surahName)} (${segments.length} ${segments.length === 1 ? 'مقطع' : 'مقاطع'})</h3>
                <p class="muted small">إجمالي المجمّع: ${formatPages(totalSegPages)} وجه ${sObj ? `من أصل ${formatPages(sObj.pages)} وجه` : ''}</p>
              </div>
              <button type="button" class="btn btn-outline btn-sm" data-promote-surah="${surahNum}">ترقية لتثبيت قديم</button>
            </div>
            <div class="inline-actions mb-sm">
              <button type="button" class="btn btn-ghost btn-sm" data-link-surah="${surahNum}">ربط مقاطع السورة معاً (٦ د)</button>
            </div>
            <div class="stack-list mt-sm">
              ${segments.map((seg) => {
                const daysLeft = seg.nextDue ? diffDays(seg.nextDue, today) : 0;
                const dueLabel = daysLeft <= 0 ? 'مستحق اليوم' : `بعد ${daysLeft} يوم`;
                return `
                  <div class="item-card">
                    <div class="item-top">
                      <div>
                        <div class="item-title">${escapeHTML(seg.segmentLabel)}</div>
                        <div class="item-meta">${formatPages(seg.pages)} وجه · آخر تقييم: ${seg.rating ? DATA.RATINGS[seg.rating].label : 'جديد'}</div>
                      </div>
                      <span class="badge-status ${daysLeft <= 0 ? 'badge-overdue' : ''}">${dueLabel}</span>
                    </div>
                    <div class="rating-row">
                      ${Object.values(DATA.RATINGS).map((r) => `
                        <button type="button" class="rate-btn" data-rate="${r.id}" data-box="newBox" data-id="${seg.id}">${r.label}</button>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </article>
        `;
      });

      wrap.innerHTML = html;
      wrap.querySelectorAll('.rate-btn').forEach((btn) => {
        btn.addEventListener('click', () => rateBoxItem(btn.dataset.box, btn.dataset.id, btn.dataset.rate));
      });
      wrap.querySelectorAll('[data-link-surah]').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchTab('tools');
          setDoctorMode('link_new');
        });
      });
      wrap.querySelectorAll('[data-promote-surah]').forEach((btn) => {
        btn.addEventListener('click', () => promoteSurahToOldBox(Number(btn.dataset.promoteSurah)));
      });
      return;
    }

    if (currentBoxSubTab === 'old_solid') {
      const addForm = `
        <article class="card">
          <div class="card-head">
            <h3>تثبيت قديم (${state.oldBox.length} عنصر)</h3>
          </div>
          <div class="inline-actions">
            <select id="selAddOldJuz" style="flex:1; min-width:170px;">
              ${DATA.JUZ_DATA.map((j) => `<option value="${j.juz}">${j.name}</option>`).join('')}
            </select>
            <button type="button" class="btn btn-gold btn-sm" id="btnAddOldJuz">إضافة جزء</button>
          </div>
        </article>
      `;

      const listHtml = state.oldBox.length === 0
        ? `<div class="card empty-state">لا توجد عناصر في «تثبيت قديم» حالياً.</div>`
        : `<div class="stack-list">${state.oldBox.map((item) => {
            const daysLeft = item.nextDue ? diffDays(item.nextDue, today) : 0;
            const dueLabel = daysLeft <= 0 ? 'مستحق اليوم' : `بعد ${daysLeft} يوم`;
            return `
              <div class="card">
                <div class="item-top">
                  <div>
                    <div class="item-title">${escapeHTML(item.title)}</div>
                    <div class="item-meta">${formatPages(item.pages)} وجه · ${item.rating ? 'آخر تقييم: ' + DATA.RATINGS[item.rating].label : 'بانتظار أول مراجعة'}</div>
                  </div>
                  <span class="badge-status ${daysLeft <= 0 ? 'badge-overdue' : ''}">${dueLabel}</span>
                </div>
                <div class="inline-actions">
                  <button type="button" class="btn btn-ghost btn-sm" data-old-timer="old_solid">مؤقت تثبيت قديم (١٠ د)</button>
                </div>
                <div class="rating-row">
                  ${Object.values(DATA.RATINGS).map((r) => `
                    <button type="button" class="rate-btn" data-rate="${r.id}" data-box="oldBox" data-id="${item.id}">${r.label}</button>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}</div>`;

      wrap.innerHTML = addForm + listHtml;
      document.getElementById('btnAddOldJuz').addEventListener('click', () => {
        const j = Number(document.getElementById('selAddOldJuz').value);
        const info = DATA.getJuzSummary(j);
        state.oldBox.unshift({
          id: uid('old'),
          title: `${info.name} (${info.surahRangeLabel})`,
          kind: 'juz',
          juz: j,
          surahNumbers: info.surahs.map((s) => s.number),
          pages: info.pages,
          rating: null,
          nextDue: todayISO(),
          intervalDays: 0,
          reps: 0,
          updatedAt: todayISO()
        });
        saveState();
        renderAll();
        showToast(`أُضيف ${info.name} إلى صندوق التثبيت القديم.`);
      });

      wrap.querySelectorAll('.rate-btn').forEach((btn) => {
        btn.addEventListener('click', () => rateBoxItem(btn.dataset.box, btn.dataset.id, btn.dataset.rate));
      });
      wrap.querySelectorAll('[data-old-timer]').forEach((btn) => {
        btn.addEventListener('click', () => {
          switchTab('tools');
          setDoctorMode('old_solid');
        });
      });
      return;
    }

    // تبويب سجل التسميع
    const filteredLogs = state.recitationLog.filter((l) => logFilter === 'all' || l.type === logFilter);
    wrap.innerHTML = `
      <article class="card">
        <div class="card-head">
          <h3>سجل التسميع (${filteredLogs.length})</h3>
          <div class="pill-group">
            <button type="button" class="pill ${logFilter === 'all' ? 'active' : ''}" data-lf="all">الكل</button>
            <button type="button" class="pill ${logFilter === 'new' ? 'active' : ''}" data-lf="new">حفظ جديد</button>
            <button type="button" class="pill ${logFilter === 'review' ? 'active' : ''}" data-lf="review">مراجعة</button>
          </div>
        </div>
        ${filteredLogs.length === 0
          ? `<div class="empty-state">سجل التسميع فارغ حتى الآن. سيُحفظ هنا كل ورد ومراجعة تقيمها تلقائياً.</div>`
          : `<div class="stack-list">
              ${filteredLogs.slice(0, 60).map((l) => {
                const rObj = DATA.RATINGS[l.rating] || { label: l.rating || 'تم' };
                return `
                  <div class="item-card">
                    <div class="item-top">
                      <div>
                        <div class="item-title">${escapeHTML(l.title)}</div>
                        <div class="item-meta">${escapeHTML(l.date)} · ${l.type === 'new' ? 'حفظ جديد' : 'مراجعة وتثبيت'} · ${formatPages(l.pages)} وجه</div>
                      </div>
                      <span class="badge-status">${escapeHTML(rObj.label)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
        }
      </article>
    `;

    wrap.querySelectorAll('[data-lf]').forEach((btn) => {
      btn.addEventListener('click', () => {
        logFilter = btn.dataset.lf;
        renderBox();
      });
    });
  }

  function promoteSurahToOldBox(surahNum) {
    const segs = state.newBox.filter((x) => x.surahNumber === surahNum);
    if (segs.length === 0) return;
    const sObj = DATA.getSurahByNumber(surahNum);
    const totalPages = sObj ? sObj.pages : segs.reduce((sum, x) => sum + Number(x.pages || 0), 0);

    state.newBox = state.newBox.filter((x) => x.surahNumber !== surahNum);
    if (!state.memorizedSurahs.includes(surahNum)) {
      state.memorizedSurahs.push(surahNum);
    }

    state.oldBox.unshift({
      id: uid('old'),
      title: `سورة ${sObj ? sObj.name : segs[0].surahName} (مكتملة)`,
      kind: 'surah',
      juz: sObj ? sObj.juz : 30,
      surahNumbers: [surahNum],
      pages: totalPages,
      rating: 'good',
      nextDue: addDaysISO(todayISO(), 4),
      intervalDays: 4,
      reps: 1,
      updatedAt: todayISO()
    });

    saveState();
    renderAll();
    showToast(`تمت ترقية سورة ${sObj ? sObj.name : ''} إلى «تثبيت قديم».`);
  }

  // ---------------- عرض الجدول الأسبوعي المرن ----------------
  function renderSchedule() {
    if (!state.weeklySchedule || state.weeklySchedule.length === 0) {
      state.weeklySchedule = generateWeeklySchedule(state.profile, state.memorizedSurahs, state.oldBox);
      saveState();
    }

    const pace = calculateDailyPace(state.profile, state.memorizedSurahs);
    const todayDayId = new Date().getDay();

    document.getElementById('scheduleMetaBar').innerHTML = `
      <span class="tag-pill">وقتك المرن: ${pace.mins} د/يوم</span>
      <span class="tag-pill">جلسة أساسية: ${pace.primaryMin} د</span>
      <span class="tag-pill">جلسة تسميع وتثبيت: ${pace.secondaryMin} د</span>
      <span class="tag-pill">بدون أوقات ثابتة مفروضة</span>
    `;

    const container = document.getElementById('weeklyScheduleContainer');
    container.innerHTML = state.weeklySchedule.map((day, idx) => `
      <div class="day-card ${day.dayId === todayDayId ? 'is-today' : ''}">
        <div class="day-head">
          <div class="day-name">${escapeHTML(day.dayName)} ${day.dayId === todayDayId ? '· اليوم' : ''}</div>
          ${day.isMaqraa ? '<span class="tag-pill">يوم تسميع / مقرأة</span>' : ''}
        </div>
        <label class="session-row">
          <div>
            <strong>الجلسة الأساسية (${day.primaryMin} د):</strong>
            <div>${escapeHTML(day.primarySession)}</div>
          </div>
          <input type="checkbox" data-sched-idx="${idx}" data-field="donePrimary" ${day.donePrimary ? 'checked' : ''} />
        </label>
        <label class="session-row">
          <div>
            <strong>جلسة التسميع والتثبيت (${day.secondaryMin} د):</strong>
            <div>${escapeHTML(day.secondarySession)}</div>
          </div>
          <input type="checkbox" data-sched-idx="${idx}" data-field="doneSecondary" ${day.doneSecondary ? 'checked' : ''} />
        </label>
      </div>
    `).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const i = Number(chk.dataset.schedIdx);
        const f = chk.dataset.field;
        state.weeklySchedule[i][f] = chk.checked;
        if (chk.checked) touchStreak();
        saveState();
        document.getElementById('streakBadge').textContent = `${state.streak.count || 0} يوم`;
      });
    });
  }

  // ---------------- مؤقت دكتور الصفحة + صوت تنبيه محلي أوفلاين ----------------
  const doctorTimer = {
    modeId: 'restore',
    stageIdx: 0,
    remainingSec: 3 * 60,
    running: false,
    intervalRef: null
  };

  function playGentleChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      // تجاهل إذا كان الصوت غير متاح
    }
  }

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function setDoctorMode(modeId) {
    stopDoctorTimer();
    const mode = DATA.DOCTOR_MODES[modeId] || DATA.DOCTOR_MODES.restore;
    doctorTimer.modeId = mode.id;
    doctorTimer.stageIdx = 0;
    doctorTimer.remainingSec = mode.stages[0].duration;

    document.querySelectorAll('#doctorModePills .pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.mode === mode.id);
    });
    renderDoctorTimer();
  }

  function stopDoctorTimer() {
    doctorTimer.running = false;
    if (doctorTimer.intervalRef) {
      clearInterval(doctorTimer.intervalRef);
      doctorTimer.intervalRef = null;
    }
  }

  function renderDoctorTimer() {
    const mode = DATA.DOCTOR_MODES[doctorTimer.modeId] || DATA.DOCTOR_MODES.restore;
    const stage = mode.stages[doctorTimer.stageIdx] || mode.stages[0];

    document.getElementById('timerDisplay').textContent = formatMMSS(doctorTimer.remainingSec);
    document.getElementById('timerStageTitle').textContent = stage.title;
    document.getElementById('timerStageTip').textContent = stage.tip;
    document.getElementById('btnTimerToggle').textContent = doctorTimer.running ? 'إيقاف مؤقت' : 'ابدأ المؤقت';

    const elapsedInPrev = mode.stages.slice(0, doctorTimer.stageIdx).reduce((a, s) => a + s.duration, 0);
    const elapsedInCurr = stage.duration - doctorTimer.remainingSec;
    const pct = Math.min(100, Math.round(((elapsedInPrev + elapsedInCurr) / mode.totalSeconds) * 100));
    document.getElementById('timerProgressFill').style.width = `${pct}%`;

    document.getElementById('timerStagesList').innerHTML = mode.stages.map((st, idx) => `
      <div class="stage-item ${idx === doctorTimer.stageIdx ? 'active' : ''}">
        <span>${escapeHTML(st.title)}</span>
        <span>${Math.round(st.duration / 60)} د</span>
      </div>
    `).join('');
  }

  function toggleDoctorTimer() {
    if (doctorTimer.running) {
      stopDoctorTimer();
      renderDoctorTimer();
      return;
    }
    doctorTimer.running = true;
    renderDoctorTimer();
    doctorTimer.intervalRef = setInterval(() => {
      doctorTimer.remainingSec -= 1;
      if (doctorTimer.remainingSec <= 0) {
        playGentleChime();
        const mode = DATA.DOCTOR_MODES[doctorTimer.modeId];
        if (doctorTimer.stageIdx < mode.stages.length - 1) {
          doctorTimer.stageIdx += 1;
          doctorTimer.remainingSec = mode.stages[doctorTimer.stageIdx].duration;
          showToast(`انتقل إلى: ${mode.stages[doctorTimer.stageIdx].title}`);
        } else {
          stopDoctorTimer();
          doctorTimer.remainingSec = 0;
          touchStreak();
          saveState();
          showToast('أحسنت — أتممت جلسة دكتور الصفحة بنجاح.');
        }
      }
      renderDoctorTimer();
    }, 1000);
  }

  // ---------------- حاسبة الوقت المرنة ----------------
  function renderTimeCalculator() {
    const slider = document.getElementById('calcMinutesSlider');
    const mins = Number(slider.value || state.profile.dailyMinutes || 60);
    document.getElementById('calcMinutesVal').textContent = `${mins} دقيقة`;

    const simProfile = { ...state.profile, dailyMinutes: mins };
    const pace = calculateDailyPace(simProfile, state.memorizedSurahs);

    document.getElementById('calcOutputGrid').innerHTML = `
      <div class="stat-tile">
        <div class="stat-val">${pace.primaryMin} + ${pace.secondaryMin} د</div>
        <div class="stat-label">توزيع الجلستين المرن</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${formatPages(pace.reviewPagesPerDay)} وجه</div>
        <div class="stat-label">مراجعة وترميم يومياً</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${state.profile.path === 'khatim' ? '—' : formatPages(pace.newPagesPerDay) + ' وجه'}</div>
        <div class="stat-label">حفظ جديد يومياً</div>
      </div>
      <div class="stat-tile">
        <div class="stat-val">${state.profile.path === 'khatim' ? pace.daysForReviewCycle + ' يوم' : Math.max(1, Math.round(pace.daysToFinishNew / 30)) + ' شهر'}</div>
        <div class="stat-label">${state.profile.path === 'khatim' ? 'مدة دورة الختمة' : 'تقدير إتمام المتبقي'}</div>
      </div>
    `;
  }

  // ---------------- وضع حماية الـ 7 دقائق (وقتي مضغوط النهارده) ----------------
  const busyTimer = { remainingSec: 7 * 60, running: false, intervalRef: null };

  function openBusyModal() {
    const due = getAllDueItems();
    const targetBox = document.getElementById('busyTargetBox');
    if (due.length > 0) {
      const top = due[0];
      const title = top.boxType === 'newBox' ? `سورة ${top.surahName} — ${top.segmentLabel}` : top.title;
      targetBox.innerHTML = `<strong>هدفك الوحيد اليوم (٧ دقائق فقط):</strong><div class="mt-xs">${escapeHTML(title)} (${formatPages(Math.min(2, top.pages))} وجه سريع)</div>`;
    } else if (state.activeWird) {
      targetBox.innerHTML = `<strong>هدفك الوحيد اليوم (٧ دقائق فقط):</strong><div class="mt-xs">قراءة وربط وردك الحالي: سورة ${escapeHTML(state.activeWird.surahName)}</div>`;
    } else {
      targetBox.innerHTML = `<strong>هدفك الوحيد اليوم (٧ دقائق فقط):</strong><div class="mt-xs">تلاوة وجه واحد مما تحفظه بتركيز وهدوء لحماية الاستمرارية.</div>`;
    }

    resetBusyTimer();
    document.getElementById('busyModal').classList.remove('hidden');
  }

  function resetBusyTimer() {
    busyTimer.running = false;
    clearInterval(busyTimer.intervalRef);
    busyTimer.intervalRef = null;
    busyTimer.remainingSec = 7 * 60;
    document.getElementById('busyTimerDisplay').textContent = '07:00';
    document.getElementById('btnBusyTimerToggle').textContent = 'ابدأ ٧ دقائق';
  }

  function toggleBusyTimer() {
    if (busyTimer.running) {
      busyTimer.running = false;
      clearInterval(busyTimer.intervalRef);
      document.getElementById('btnBusyTimerToggle').textContent = 'استكمال';
      return;
    }
    busyTimer.running = true;
    document.getElementById('btnBusyTimerToggle').textContent = 'إيقاف مؤقت';
    busyTimer.intervalRef = setInterval(() => {
      busyTimer.remainingSec -= 1;
      document.getElementById('busyTimerDisplay').textContent = formatMMSS(busyTimer.remainingSec);
      if (busyTimer.remainingSec <= 0) {
        clearInterval(busyTimer.intervalRef);
        busyTimer.running = false;
        playGentleChime();
        showToast('أحسنت — أتممت ٧ دقائق وحافظت على سلسلتك.');
      }
    }, 1000);
  }

  // ---------------- التذكيرات الذكية الديناميكية ----------------
  function buildDynamicReminderMessage(dueItems, nextSurah) {
    const name = state.profile.firstName || 'صاحب الهمة';
    if (dueItems.length > 0) {
      const top = dueItems[0];
      const title = top.boxType === 'newBox' ? `سورة ${top.surahName}` : top.title;
      return `يا ${name}، لديك ${dueItems.length} ${dueItems.length === 1 ? 'بند مستحق' : 'بنود مستحقة'} للمراجعة اليوم (أهمها: ${title}). وإذا كان يومك مزدحماً، زر «وقتي مضغوط (٧ د)» يحفظ استمراريتك.`;
    }
    if (state.activeWird) {
      return `وردك الحالي في سورة ${state.activeWird.surahName} بانتظار التسميع والتقييم لينتقل تلقائياً لصندوق التثبيت.`;
    }
    if (state.profile.path === 'khatim') {
      return `يوم هادئ يا ${name} — راجع جزءاً من جدولك المرن في أي وقت يناسبك لتبقى ختمتك حاضرة.`;
    }
    return `يومك جاهز يا ${name}: ${nextSurah ? `وردك القادم في سورة ${nextSurah.name}` : 'استمر في تثبيت محفوظك'} في الوقت الذي يناسب يومك.`;
  }

  // ---------------- الإعدادات والألوان والنسخ الاحتياطي واستيراد v4/v5 ----------------
  function renderSettings() {
    const p = state.profile;
    const stats = DATA.calculateSurahSetStats(state.memorizedSurahs);
    const pathNames = {
      from_nas: 'من الناس ← البقرة',
      from_baqarah: 'من البقرة ← الناس',
      fresh: 'بداية جديدة',
      khatim: 'خاتم للقرآن (٣٠ جزءاً)',
      scattered: 'سور متفرقة'
    };

    document.getElementById('profileSummaryBox').innerHTML = `
      <div><strong>الاسم:</strong> ${escapeHTML(p.firstName || '—')}</div>
      <div><strong>المسار:</strong> ${escapeHTML(pathNames[p.path] || p.path)}</div>
      <div><strong>المحفوظ:</strong> ${formatPages(stats.totalPages)} / ٦٠٤ وجه</div>
      <div><strong>الوقت اليومي:</strong> ${p.dailyMinutes} دقيقة مرنة</div>
    `;

    // عرض الثيمات
    const grid = document.getElementById('themeSwatchesGrid');
    grid.innerHTML = DATA.PRESET_THEMES.map((t) => `
      <button type="button" class="theme-card ${state.settings.themeId === t.id ? 'active' : ''}" data-theme-id="${t.id}">
        <div class="swatch-bar">
          <span style="background:${t.bg}"></span>
          <span style="background:${t.surface2}"></span>
          <span style="background:${t.accent}"></span>
          <span style="background:${t.text}"></span>
        </div>
        <span class="small"><strong>${escapeHTML(t.name)}</strong></span>
      </button>
    `).join('');

    grid.querySelectorAll('.theme-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.settings.themeId = card.dataset.themeId;
        saveState();
        applyTheme();
        renderSettings();
      });
    });

    document.getElementById('inpCustomBg').value = state.settings.customColors.bg || '#00112B';
    document.getElementById('inpCustomAccent').value = state.settings.customColors.accent || '#D0A151';
    document.getElementById('chkSmartReminders').checked = !!state.settings.smartReminders;

    const notifText = document.getElementById('notifStatusText');
    if (!('Notification' in window)) {
      notifText.textContent = 'متصفحك لا يدعم إشعارات النظام؛ ستظهر التذكيرات الذكية داخل التطبيق.';
    } else if (Notification.permission === 'granted') {
      notifText.textContent = 'إشعارات المتصفح مفعّلة وجاهزة.';
    } else {
      notifText.textContent = 'يمكنك تفعيل إشعارات المتصفح اختيارياً للتذكير الهادئ.';
    }
  }

  function findLegacyLocalStorage() {
    for (const key of LEGACY_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return { key, data: parsed };
        }
      } catch (e) {
        // تجاهل البيانات غير الصالحة
      }
    }
    return null;
  }

  function importAnyBackupObject(rawObj, sourceLabel) {
    if (!rawObj || typeof rawObj !== 'object') {
      throw new Error('ملف غير صالح');
    }

    // 1) نسخة v6 كاملة
    if (rawObj.version === 6 && rawObj.profile && Array.isArray(rawObj.memorizedSurahs)) {
      state = mergeWithDefaults(rawObj);
      state.onboarded = true;
      saveState();
      applyTheme();
      document.getElementById('onboardingView').classList.add('hidden');
      document.getElementById('appShell').classList.remove('hidden');
      renderAll();
      showToast(`تم استيراد نسخة v6 بنجاح (${sourceLabel}).`);
      return;
    }

    // 2) استيراد ذكي مرن لبيانات v4 (rafiq_altathbit_khatma_v4) أو v5 (rafiq_altathbit_smart_v5)
    const migrated = createDefaultState();
    migrated.onboarded = true;

    const oldUser = rawObj.user || rawObj.profile || {};
    migrated.profile.firstName = oldUser.firstName || oldUser.name || rawObj.name || 'صاحب الهمة';
    migrated.profile.username = oldUser.username || rawObj.username || '';
    migrated.profile.dailyMinutes = Number(oldUser.dailyMinutes || rawObj.dailyMinutes || 60);

    // استخراج السجل والتثبيت من أي مفاتيح محتملة في v4 / v5
    const logs = rawObj.recitationLog || rawObj.log || rawObj.history || [];
    if (Array.isArray(logs)) {
      migrated.recitationLog = logs.map((l) => ({
        id: l.id || uid('log'),
        date: l.date || todayISO(),
        type: l.type === 'new' ? 'new' : 'review',
        title: l.title || l.surah || l.label || 'مراجعة مستوردة',
        pages: Number(l.pages || 1),
        rating: DATA.RATINGS[l.rating] ? l.rating : 'good',
        notes: l.notes || `مستورد من ${sourceLabel}`
      }));
    }

    const oldNewItems = rawObj.newBox || rawObj.newConsolidation || rawObj.newItems || [];
    if (Array.isArray(oldNewItems)) {
      migrated.newBox = oldNewItems.map((x) => {
        const sMatch = DATA.SURAHS.find((s) => s.number === Number(x.surahNumber) || (x.surahName && s.name === x.surahName));
        return {
          id: x.id || uid('new'),
          surahNumber: sMatch ? sMatch.number : 114,
          surahName: sMatch ? sMatch.name : (x.surahName || x.title || 'مقطع مستورد'),
          segmentLabel: x.segmentLabel || x.label || x.title || 'مقطع مستورد',
          pages: Number(x.pages || 1),
          rating: DATA.RATINGS[x.rating] ? x.rating : 'good',
          nextDue: x.nextDue || addDaysISO(todayISO(), 2),
          intervalDays: Number(x.intervalDays || 4),
          reps: Number(x.reps || 1),
          updatedAt: x.updatedAt || todayISO()
        };
      });
    }

    const oldOldItems = rawObj.oldBox || rawObj.oldConsolidation || rawObj.oldItems || rawObj.juzList || [];
    if (Array.isArray(oldOldItems)) {
      migrated.oldBox = oldOldItems.map((x, idx) => ({
        id: x.id || uid('old'),
        title: x.title || x.name || `بند تثبيت قديم #${idx + 1}`,
        kind: x.kind || 'juz',
        juz: Number(x.juz || 30),
        surahNumbers: Array.isArray(x.surahNumbers) ? x.surahNumbers : [],
        pages: Number(x.pages || 20),
        rating: DATA.RATINGS[x.rating] ? x.rating : null,
        nextDue: x.nextDue || addDaysISO(todayISO(), idx % 5),
        intervalDays: Number(x.intervalDays || 0),
        reps: Number(x.reps || 0),
        updatedAt: x.updatedAt || todayISO()
      }));
    }

    if (Array.isArray(rawObj.memorizedSurahs) && rawObj.memorizedSurahs.length > 0) {
      migrated.memorizedSurahs = rawObj.memorizedSurahs.map(Number);
    } else if (migrated.oldBox.length > 0) {
      const gathered = new Set();
      migrated.oldBox.forEach((o) => {
        if (o.surahNumbers && o.surahNumbers.length) o.surahNumbers.forEach((n) => gathered.add(n));
        else if (o.juz) DATA.getSurahsInJuz(o.juz).forEach((s) => gathered.add(s.number));
      });
      migrated.memorizedSurahs = Array.from(gathered);
    }

    migrated.weeklySchedule = generateWeeklySchedule(migrated.profile, migrated.memorizedSurahs, migrated.oldBox);
    state = migrated;
    saveState();
    applyTheme();
    document.getElementById('onboardingView').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    renderAll();
    showToast(`تم استيراد بياناتك من ${sourceLabel} بنجاح! يمكنك مراجعة مسارك من «إعادة الاختبار التشخيصي» لو رغبت.`);
  }

  function exportJsonBackup() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rafiq_altathbit_v6_backup_${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('تم تحميل ملف النسخة الاحتياطية JSON.');
  }

  function handleJsonFileInput(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        importAnyBackupObject(parsed, file.name);
      } catch (e) {
        showToast('تعذر قراءة الملف — تأكد أنه ملف JSON صحيح.');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  // ---------------- التنقل والتحديث العام ----------------
  function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${tabId}`);
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach((n) => {
      n.classList.toggle('active', n.dataset.tab === tabId);
    });
    if (tabId === 'tools') {
      document.getElementById('calcMinutesSlider').value = state.profile.dailyMinutes || 60;
      renderTimeCalculator();
    }
  }

  function renderAll() {
    renderHome();
    renderBox();
    renderSchedule();
    renderDoctorTimer();
    renderTimeCalculator();
    renderSettings();
  }

  // ---------------- ربط الأحداث وتسجيل Service Worker ----------------
  function bindEvents() {
    // التنقل السفلي
    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // تبويبات صندوق التثبيت
    document.querySelectorAll('#boxSubTabs .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentBoxSubTab = btn.dataset.subtab;
        document.querySelectorAll('#boxSubTabs .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderBox();
      });
    });

    // خطوات الاختبار التشخيصي
    document.getElementById('pathChoiceGrid').querySelectorAll('.choice-card').forEach((card) => {
      card.addEventListener('click', () => {
        wizard.draft.path = card.dataset.path;
        if (wizard.draft.path === 'from_nas' && !wizard.draft.stopSurah) wizard.draft.stopSurah = 114;
        if (wizard.draft.path === 'from_baqarah' && wizard.draft.stopSurah === 114) wizard.draft.stopSurah = 1;
        updateWizardUI();
      });
    });

    document.getElementById('stabilityPills').querySelectorAll('.pill').forEach((p) => {
      p.addEventListener('click', () => {
        wizard.draft.stability = p.dataset.val;
        updateWizardUI();
      });
    });

    document.getElementById('rngDailyMinutes').addEventListener('input', (e) => {
      wizard.draft.dailyMinutes = Number(e.target.value);
      document.getElementById('lblDailyMinutes').textContent = `${wizard.draft.dailyMinutes} دقيقة`;
    });

    document.getElementById('btnWizardPrev').addEventListener('click', () => {
      if (wizard.step > 1) {
        wizard.step -= 1;
        updateWizardUI();
      }
    });

    document.getElementById('btnWizardNext').addEventListener('click', () => {
      if (wizard.step === 1) {
        const fn = document.getElementById('inpFirstName').value.trim();
        if (!fn) {
          showToast('من فضلك أدخل اسمك الأول للمتابعة.');
          document.getElementById('inpFirstName').focus();
          return;
        }
        wizard.draft.firstName = fn;
        wizard.draft.username = document.getElementById('inpUsername').value.trim();
      } else if (wizard.step === 3) {
        if (wizard.draft.path === 'scattered' && (!wizard.draft.scatteredSurahs || wizard.draft.scatteredSurahs.length === 0)) {
          showToast('اختر سورة واحدة على الأقل، أو ارجع واختر «بداية جديدة».');
          return;
        }
        if (wizard.draft.path === 'khatim' && wizard.draft.khatimReviewMode === 'specific_juz' && (!wizard.draft.khatimJuzList || wizard.draft.khatimJuzList.length === 0)) {
          showToast('اختر جزءاً واحداً على الأقل لدورة المراجعة.');
          return;
        }
      }

      if (wizard.step < 5) {
        wizard.step += 1;
        updateWizardUI();
      } else {
        commitWizardPlan();
      }
    });

    // استيراد من شاشة الترحيب
    document.getElementById('inpOnboardingImport').addEventListener('change', (e) => {
      handleJsonFileInput(e.target.files[0]);
      e.target.value = '';
    });

    document.getElementById('btnImportDetectedLegacy').addEventListener('click', () => {
      const found = findLegacyLocalStorage();
      if (found) importAnyBackupObject(found.data, found.key);
    });

    // التذكير
    document.getElementById('btnDismissReminder').addEventListener('click', () => {
      document.getElementById('smartReminderCard').classList.add('hidden');
    });

    // زر وقتي مضغوط (7 دقائق)
    document.getElementById('btnBusyMode').addEventListener('click', openBusyModal);
    document.getElementById('btnCloseBusyModal').addEventListener('click', () => {
      resetBusyTimer();
      document.getElementById('busyModal').classList.add('hidden');
    });
    document.getElementById('btnBusyTimerToggle').addEventListener('click', toggleBusyTimer);
    document.getElementById('btnBusyTimerReset').addEventListener('click', resetBusyTimer);
    document.getElementById('btnCompleteBusyDay').addEventListener('click', () => {
      resetBusyTimer();
      document.getElementById('busyModal').classList.add('hidden');
      touchStreak();
      state.recitationLog.unshift({
        id: uid('log'),
        date: todayISO(),
        type: 'review',
        title: 'جلسة حماية اليوم المزدحم (٧ دقائق)',
        pages: 1,
        rating: 'good',
        notes: 'حماية الاستمرارية بدون انقطاع'
      });
      saveState();
      renderAll();
      showToast('بارك الله في وقتك — تم تسجيل جلسة الحماية وحفظ سلسلتك اليوم.');
    });

    // الجدول
    document.getElementById('btnRegenerateSchedule').addEventListener('click', () => {
      state.weeklySchedule = generateWeeklySchedule(state.profile, state.memorizedSurahs, state.oldBox);
      saveState();
      renderSchedule();
      showToast('تم تحديث توزيع الجدول الأسبوعي بأسماء سورك الحالية.');
    });

    // مؤقت دكتور الصفحة
    document.querySelectorAll('#doctorModePills .pill').forEach((p) => {
      p.addEventListener('click', () => setDoctorMode(p.dataset.mode));
    });
    document.getElementById('btnTimerToggle').addEventListener('click', toggleDoctorTimer);
    document.getElementById('btnTimerReset').addEventListener('click', () => setDoctorMode(doctorTimer.modeId));
    document.getElementById('btnTimerNextStage').addEventListener('click', () => {
      const mode = DATA.DOCTOR_MODES[doctorTimer.modeId];
      if (doctorTimer.stageIdx < mode.stages.length - 1) {
        doctorTimer.stageIdx += 1;
        doctorTimer.remainingSec = mode.stages[doctorTimer.stageIdx].duration;
        renderDoctorTimer();
      } else {
        showToast('أنت بالفعل في المرحلة الأخيرة من المؤقت.');
      }
    });

    // حاسبة الوقت
    document.getElementById('calcMinutesSlider').addEventListener('input', renderTimeCalculator);
    document.getElementById('btnApplyCalcTime').addEventListener('click', () => {
      const mins = Number(document.getElementById('calcMinutesSlider').value);
      state.profile.dailyMinutes = mins;
      state.weeklySchedule = generateWeeklySchedule(state.profile, state.memorizedSurahs, state.oldBox);
      saveState();
      renderAll();
      showToast(`تم اعتماد ${mins} دقيقة يومياً وتحديث جدولك الأسبوعي.`);
    });

    // الإعدادات والألوان الحرة
    document.getElementById('btnRerunDiagnostic').addEventListener('click', () => openOnboarding(true));
    document.getElementById('btnApplyCustomTheme').addEventListener('click', () => {
      state.settings.themeId = 'custom';
      state.settings.customColors = {
        bg: document.getElementById('inpCustomBg').value,
        accent: document.getElementById('inpCustomAccent').value
      };
      saveState();
      applyTheme();
      renderSettings();
      showToast('تم تطبيق ألوانك الخاصة مع ضبط التباين تلقائياً.');
    });

    document.getElementById('btnResetDefaultTheme').addEventListener('click', () => {
      state.settings.themeId = 'royal-navy';
      state.settings.customColors = { bg: '#00112B', accent: '#D0A151' };
      saveState();
      applyTheme();
      renderSettings();
      showToast('تمت العودة لهوية الكحلي الملكي والذهبي.');
    });

    document.getElementById('chkSmartReminders').addEventListener('change', (e) => {
      state.settings.smartReminders = e.target.checked;
      saveState();
      renderHome();
    });

    document.getElementById('btnEnableBrowserNotif').addEventListener('click', () => {
      if (!('Notification' in window)) {
        showToast('إشعارات النظام غير مدعومة في هذا المتصفح.');
        return;
      }
      Notification.requestPermission().then((perm) => {
        renderSettings();
        showToast(perm === 'granted' ? 'تم تفعيل الإشعارات بنجاح.' : 'لم يتم منح إذن الإشعارات.');
      });
    });

    document.getElementById('btnPreviewNotif').addEventListener('click', () => {
      const msg = buildDynamicReminderMessage(getAllDueItems(), getOrderedUnmemorizedSurahs(state.profile, state.memorizedSurahs)[0]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('رفيق التثبيت', { body: msg, icon: './icon-192.png' });
      } else {
        showToast(msg);
      }
    });

    // النسخ الاحتياطي واستيراد v4/v5
    document.getElementById('btnExportJson').addEventListener('click', exportJsonBackup);
    document.getElementById('inpImportJson').addEventListener('change', (e) => {
      handleJsonFileInput(e.target.files[0]);
      e.target.value = '';
    });

    document.getElementById('btnScanLegacyStorage').addEventListener('click', () => {
      const found = findLegacyLocalStorage();
      const status = document.getElementById('backupStatusText');
      if (found) {
        importAnyBackupObject(found.data, found.key);
        status.textContent = `تم العثور على ${found.key} واستيراد بياناته.`;
      } else {
        status.textContent = 'لم يتم العثور على مفاتيح v4 أو v5 محفوظة في هذا المتصفح (يمكنك استيراد ملف JSON مباشرة).';
      }
    });

    // تحديث الكاش الفوري
    document.getElementById('btnCheckUpdate').addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update().then(() => {
              showToast('جارٍ التحقق من أحدث نسخة وتحديث الملفات...');
              setTimeout(() => window.location.reload(), 600);
            });
          } else {
            window.location.reload();
          }
        });
      } else {
        window.location.reload();
      }
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
              showToast('تم تنزيل تحديث جديد للتطبيق وسيتم تفعيله فوراً.');
            }
          });
        });
      }).catch((err) => {
        console.warn('Service Worker registration note:', err);
      });
    });
  }

  // ---------------- الإقلاع ----------------
  function init() {
    applyTheme();
    bindEvents();
    registerServiceWorker();

    if (!state.onboarded) {
      openOnboarding(false);
    } else {
      document.getElementById('onboardingView').classList.add('hidden');
      document.getElementById('appShell').classList.remove('hidden');
      renderAll();
    }
  }

  init();
})();
