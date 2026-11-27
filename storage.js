// ==========================================================================
// رفيق التثبيت v7.2 — storage.js (الحفظ الآمن، اللقطات، الترحيل v4–v7.2)
// ==========================================================================

const STORAGE_KEY = 'rafiq_altathbit_v7';
const LEGACY_KEYS = ['rafiq_altathbit_v6', 'rafiq_altathbit_smart_v5', 'rafiq_altathbit_khatma_v4'];
const SNAPSHOTS_KEY = 'rafiq_altathbit_v7_snapshots';
const OB_DRAFT_KEY = 'rafiq_altathbit_v7_ob_draft';

function getEmptyState() {
  return {
    version: APP_VERSION,
    onboarded: false,
    welcomeDismissed: false,
    simpleMode: false,
    progressExpanded: false,
    lastBackupAt: '',
    weekStartedAt: todayStr(),
    lastArchivedDate: '',
    khatimCycleNum: 1,
    khatimCycleStartedAt: todayStr(),
    profile: {
      name: '',
      theme: 'royal',
      customColors: { bg: '#00112B', accent: '#D0A151' },
      level: 'intermediate', // beginner | intermediate | hafidh
      mode: 'from_nas',
      stopSurahNum: 78,
      stopSurahCompleted: false,
      beginnerDir: 'from_nas',
      khatimStart: 'from_baqarah',
      khatimSpecificJuz: [1, 2, 3],
      khatimCycleDays: 60,
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
    surahAyahProgress: {},   // { [surahNum]: maxAyahReached }
    completedSurahsSolid: [], // السور التي اكتملت من «تثبيت الجديد» وانتقلت لدورة التثبيت الدائمة
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
    mutFilter: 'all',
    expandedJuz: {},
    calcDailyMin: 45,
    calcNewPages: 1
  };
}

// استعادة نظيفة لنسخ v7 الحديثة (منفصلة عن ترحيل النسخ القديمة v4/v5/v6)
function normalizeV7State(raw) {
  const empty = getEmptyState();
  const merged = {
    ...empty,
    ...raw,
    version: APP_VERSION,
    profile: {
      ...empty.profile,
      ...(raw.profile || {}),
      customColors: { ...empty.profile.customColors, ...((raw.profile && raw.profile.customColors) || {}) }
    },
    streak: { ...empty.streak, ...(raw.streak || {}) },
    surahNewProgress: raw.surahNewProgress || {},
    surahAyahProgress: raw.surahAyahProgress || {},
    completedSurahsSolid: Array.isArray(raw.completedSurahsSolid) ? raw.completedSurahsSolid : [],
    reminders: (raw.reminders || []).map((r) => ({ lastNotifiedDate: '', ...r })),
    busyTasksDone: raw.busyTasksDone || { t1: false, t2: false }
  };
  if (!merged.weekStartedAt) merged.weekStartedAt = todayStr();
  if (!merged.profile.level) merged.profile.level = getEffectiveLevel(merged.profile);
  return merged;
}

// ترحيل آمن من النسخ القديمة (v4 / v5 / v6) إلى v7.2 بمعادلة loggedPages موحّدة تمنع تضاعف الرصيد
function migrateState(old) {
  const today = todayStr();
  if (!old || typeof old !== 'object') return getEmptyState();
  // إذا كانت البيانات أصلاً من الجيل السابع وبها 30 جزءاً مكتملة البنية، نستخدم الاستعادة النظيفة مباشرة
  if (String(old.version || '').startsWith('7') && Array.isArray(old.juzList) && old.juzList.length === 30) {
    return normalizeV7State(old);
  }

  const base = getEmptyState();
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
    ((prev && prev.surahs) || []).forEach((s) => { if (s.done) prevSurahDoneMap[s.num || s.name] = true; });
    const jTrack = prev ? (prev.track || 'revision') : 'revision';

    const surahs = jSurahsOrd.map((s) => {
      const prevMatch = prev && prev.surahs ? prev.surahs.find((ps) => ps.num === s.num || ps.name === s.name) : null;
      return {
        num: s.num, name: s.name, pages: getSurahPagesInJuz(s, jRaw),
        track: prevMatch && prevMatch.track ? prevMatch.track : jTrack,
        wasMemorized: prevMatch ? !!prevMatch.wasMemorized : (jTrack === 'revision'),
        done: isComplete || !!prevSurahDoneMap[s.num] || !!prevSurahDoneMap[s.name]
      };
    });

    const surahDoneSum = surahs.reduce((sum, s) => sum + (s.done ? s.pages : 0), 0);
    const basePages = prev ? Number(prev.basePages || 0) : 0;
    // معادلة موحّدة تطابق recomputeJuzProgress: basePages + surahDoneSum + loggedPages === prevDonePages
    const loggedPages = (prev && typeof prev.loggedPages === 'number')
      ? prev.loggedPages
      : Number((prevDonePages - basePages - surahDoneSum).toFixed(2));

    const juzObj = {
      num: jRaw.num, title: jRaw.title, range: jRaw.range, totalPages: jRaw.totalPages,
      track: jTrack, phase: prev ? (prev.phase || 'مسار المراجعة') : 'مسار المراجعة',
      donePages: prevDonePages, basePages, loggedPages,
      tags: Array.isArray(prev && prev.tags) ? prev.tags : [],
      surahs, note: prev ? (prev.note || '') : ''
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
        weakSurahs: Array.isArray(m.weakSurahs) ? m.weakSurahs : [],
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
      ? oldProfile.mode : (oldProfile.mode === 'custom' ? 'scattered' : 'from_nas'),
    dailyMin: oldProfile.dailyMin || old.calcDailyMin || 45,
    pagesPerSession: oldProfile.pagesPerSession || old.calcNewPages || 1
  };
  profile.level = getEffectiveLevel(profile);

  const actRev = resolveActiveRevJuz(juzList, old.activeRevJuzNum || null);
  const actNew = resolveActiveNewSurah(profile, juzList, old.activeNewSurahNum || null);

  return {
    ...base,
    version: APP_VERSION,
    onboarded: true,
    welcomeDismissed: !!old.welcomeDismissed,
    simpleMode: !!old.simpleMode,
    lastBackupAt: old.lastBackupAt || today,
    weekStartedAt: old.weekStartedAt || today,
    profile,
    solidSubTab: profile.mode === 'khatim' ? 'old' : (old.solidSubTab || 'new'),
    activeRevJuzNum: actRev ? actRev.num : null,
    activeNewSurahNum: actNew ? actNew.num : null,
    surahNewProgress: old.surahNewProgress || {},
    juzList,
    schedule: buildLiveSchedule(profile, juzList, actRev ? actRev.num : null, actNew ? actNew.num : null, old.schedule || null, { hasLinkingItems: newLinkingGroups.length > 0 }),
    weekArchives: old.weekArchives || [],
    solidMeta,
    activeWird: old.activeWird || null,
    maqraaLogs: old.maqraaLogs || [],
    newLinkingGroups,
    reminders: (old.reminders || []).map((r) => ({ lastNotifiedDate: '', ...r })),
    streak: {
      count: (old.streak && old.streak.count) || 0,
      lastDate: (old.streak && old.streak.lastDate) || '',
      graceUsedDate: (old.streak && old.streak.graceUsedDate) || ''
    },
    calcDailyMin: old.calcDailyMin || profile.dailyMin,
    calcNewPages: old.calcNewPages ?? profile.pagesPerSession
  };
}

function findLegacyStorageKey() {
  for (const key of LEGACY_KEYS) {
    if (localStorage.getItem(key)) return key;
  }
  return null;
}

function saveAutoSnapshot(stateObj, reason) {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const snap = {
      at: new Date().toISOString(),
      date: todayStr(),
      reason: reason || 'تلقائي',
      data: JSON.parse(JSON.stringify(stateObj))
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

function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch((e) => console.warn('storage.persist error:', e));
  }
}
