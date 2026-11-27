// ==========================================================================
// رفيق التثبيت v7.2 — engine.js (التاريخ المحلي، SM-2-lite، الخطة والجدول الحي)
// ==========================================================================

function formatLocalDate(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr() { return formatLocalDate(new Date()); }

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

// ================= SM-2-LITE (A1 + A2 + A3 FIXED) =================
function computeSM2(prevMeta, rating, overdueDays = 0, level = 'intermediate') {
  const cfg = SR_CONFIG;
  let ease = Number(prevMeta && prevMeta.ease) || cfg.defaultEase;
  let prevInterval = Number(prevMeta && prevMeta.intervalDays) || 1;
  let reps = Number(prevMeta && prevMeta.reps) || 0;
  let lapses = Number(prevMeta && prevMeta.lapses) || 0;

  const maxCap = (cfg.maxIntervalByLevel && cfg.maxIntervalByLevel[level]) || cfg.maxIntervalDays;
  const isReset = rating === 'يحتاج إعادة' || rating === 'نسيت تماماً';

  let nextInterval = 1;
  if (isReset) {
    nextInterval = 1;
    ease = Math.max(cfg.minEase, Number((ease - 0.2).toFixed(2)));
    lapses += 1;
    reps = 0;
  } else if (rating === 'جيد') {
    // A1: تصاعد صارم يمنع علوق «جيد» عند 2،2،2...
    nextInterval = Math.max(prevInterval + 1, Math.round(prevInterval * 1.3));
    ease = Math.max(cfg.minEase, Number((ease - 0.05).toFixed(2)));
    reps += 1;
  } else {
    // A2: خطوات تعلّم [1, 3, 7] لأول 3 مراجعات ناجحة قبل تطبيق الـ ease
    if (reps < cfg.learningSteps.length && lapses === 0 && prevInterval <= 7) {
      nextInterval = cfg.learningSteps[reps];
      if (rating === 'ممتاز') {
        ease = Math.min(cfg.maxEase, Number((ease + 0.1).toFixed(2)));
        nextInterval = Math.max(nextInterval, Math.round(nextInterval * 1.3));
      }
    } else {
      const effectivePrev = overdueDays > 0 ? prevInterval + Math.floor(overdueDays / 2) : prevInterval;
      if (rating === 'جيد جداً') {
        nextInterval = Math.max(prevInterval + 1, Math.round(effectivePrev * ease));
      } else {
        nextInterval = Math.max(prevInterval + 2, Math.round(effectivePrev * ease * 1.3));
        ease = Math.min(cfg.maxEase, Number((ease + 0.1).toFixed(2)));
      }
    }
    reps += 1;
  }

  nextInterval = Math.max(cfg.minIntervalDays, Math.min(maxCap, nextInterval));
  return { intervalDays: nextInterval, ease, reps, lapses, critical: rating === 'نسيت تماماً' };
}

// ================= SINGLE SOURCE OF TRUTH FOR JUZ PROGRESS =================
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

// توزيع أوجه ورد يمتد عبر أكثر من جزء (مثل البقرة وآل عمران) بدقة دون فقدان
function applyPagesAcrossJuzs(juzList, surahNum, pagesDelta, prevSurahLogged) {
  const s = getSurahByNum(surahNum);
  const affected = [];
  if (!s || !pagesDelta || pagesDelta <= 0) return affected;
  const spanned = JUZ_DB.filter((j) => s.startPage <= j.endPage && s.endPage >= j.startPage);
  let remaining = Number(pagesDelta);
  let cursor = Number(prevSurahLogged || 0);
  let acc = 0;

  for (const jMeta of spanned) {
    const capInJuz = getSurahPagesInJuz(s, jMeta);
    const juzEndInSurah = acc + capInJuz;
    if (cursor < juzEndInSurah && remaining > 0) {
      const room = Math.max(0, juzEndInSurah - cursor);
      const take = Number(Math.min(remaining, room).toFixed(2));
      if (take > 0) {
        const target = juzList.find((x) => x.num === jMeta.num);
        if (target) {
          target.loggedPages = Number(((target.loggedPages || 0) + take).toFixed(2));
          recomputeJuzProgress(target);
          affected.push(target);
        }
        cursor += take;
        remaining = Number((remaining - take).toFixed(2));
      }
    }
    acc = juzEndInSurah;
  }
  // في حال بقي جزء صغير بعد نهاية السورة، يضاف لآخر جزء فيها
  if (remaining > 0 && spanned.length > 0) {
    const lastTarget = juzList.find((x) => x.num === spanned[spanned.length - 1].num);
    if (lastTarget) {
      lastTarget.loggedPages = Number(((lastTarget.loggedPages || 0) + remaining).toFixed(2));
      recomputeJuzProgress(lastTarget);
      if (!affected.includes(lastTarget)) affected.push(lastTarget);
    }
  }
  return affected;
}

// ================= DIAGNOSTIC & PLAN ENGINE =================
function getEffectiveLevel(profile) {
  if (profile && profile.level && ['beginner', 'intermediate', 'hafidh'].includes(profile.level)) {
    return profile.level;
  }
  if (profile && profile.mode === 'khatim') return 'hafidh';
  if (profile && profile.mode === 'beginner') return 'beginner';
  return 'intermediate';
}

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
      num: jRaw.num, title: jRaw.title, range: jRaw.range, totalPages: jRaw.totalPages,
      track: juzTrack, phase: '', donePages: 0, basePages, loggedPages: 0,
      tags: [], surahs, note: ''
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
        solidMeta[j.num] = (prevSolidMeta && prevSolidMeta[j.num]) ? prevSolidMeta[j.num] : {
          reviews: 0, reps: 0, lapses: 0, ease: SR_CONFIG.defaultEase,
          lastReviewed: today, rating: '',
          intervalDays: SR_CONFIG.firstAutoReviewDays,
          nextReviewDate: addDaysStr(today, ((revIdx - 1) % 7) + SR_CONFIG.firstAutoReviewDays),
          weakSurahs: [], weakPages: [], addedAt: today
        };
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
    juzList, solidMeta,
    activeRevJuzNum: initialActiveRev ? initialActiveRev.num : null,
    activeNewSurahNum: initialActiveNew ? initialActiveNew.num : null
  };
}

// ================= LIVE REACTIVE SCHEDULE (A5 + A6 + A7 + A8 FIXED) =================
// دمج السور القصيرة لتكملة مقدار الحفظ المطلوب بدل «حفظ 1 وجه من سورة الناس»
function buildNewSessionTargetLabel(profile, activeNewSurah, pagesPerSess) {
  if (!activeNewSurah) return 'الورد الجديد التالي';
  const dir = getEffectiveDirection(profile);
  const ordered = dir === 'from_nas' ? [...SURAHS_DB].reverse() : [...SURAHS_DB];
  const startIdx = ordered.findIndex((s) => s.num === activeNewSurah.num);
  if (startIdx === -1) return `سورة ${activeNewSurah.name} (الجزء ${activeNewSurah.juz})`;

  if (activeNewSurah.pages >= pagesPerSess) {
    return `${formatNum(pagesPerSess)} وجه من سورة ${activeNewSurah.name} (الجزء ${activeNewSurah.juz})`;
  }
  const picked = [];
  let sum = 0;
  for (let i = startIdx; i < ordered.length && sum < pagesPerSess - 0.01 && picked.length < 4; i++) {
    picked.push(ordered[i].name);
    sum = Number((sum + ordered[i].pages).toFixed(2));
  }
  return `${picked.join('، ')} (${formatNum(sum)} وجه • الجزء ${activeNewSurah.juz})`;
}

// حساب توزيع الدقائق بحيث يساوي المجموع <= dailyMin دائماً (A5)
function splitTimeBudget(dailyMin) {
  const total = Math.max(5, parseInt(dailyMin, 10) || 45);
  if (total < 20) {
    return { mainMin: total, secMin: 0, solMin: 0, compact: true };
  }
  const mainMin = Math.max(8, Math.floor(total * 0.60));
  const secMin = Math.max(4, Math.floor(total * 0.20));
  const solMin = Math.max(0, total - mainMin - secMin);
  return { mainMin, secMin, solMin, compact: false };
}

function buildLiveSchedule(profile, juzList, activeRevJuzNum, activeNewSurahNum, existingSchedule = null, contextInfo = null) {
  const daily = Math.max(10, parseInt(profile.dailyMin, 10) || 45);
  const { mainMin, secMin, solMin, compact } = splitTimeBudget(daily);
  const level = getEffectiveLevel(profile);
  const minPerRevPage = SR_CONFIG.minutesPerRevPageByLevel[level] || 7;
  const isKhatim = profile.mode === 'khatim';
  const isBeginner = profile.mode === 'beginner';
  const hasMaqraa = profile.studyStyle === 'maqraa';
  const maqraaDays = hasMaqraa ? (profile.maqraaDays || ['mon', 'thu']) : [];
  const pagesPerSess = parseFloat(profile.pagesPerSession) || 1;

  // للخاتم: حساب الورد اليومي من هدف الدورة (30/60/90 يوماً)
  const khatimCycleDays = parseInt(profile.khatimCycleDays, 10) || 60;
  const khatimDailyPages = Math.ceil(604 / khatimCycleDays);
  const revPagesPerDay = isKhatim
    ? Math.max(2, Math.min(khatimDailyPages, Math.max(2, Math.floor(mainMin / minPerRevPage))))
    : Math.max(1, Math.floor(mainMin / minPerRevPage));

  const activeRev = resolveActiveRevJuz(juzList, activeRevJuzNum);
  const revPendingAll = (juzList || []).filter((j) => j.track === 'revision' && j.donePages < j.totalPages - 0.01);
  const revOrdered = activeRev ? [activeRev, ...revPendingAll.filter((j) => j.num !== activeRev.num)] : revPendingAll;

  const activeNewSurah = resolveActiveNewSurah(profile, juzList, activeNewSurahNum);
  const newTargetLabel = buildNewSessionTargetLabel(profile, activeNewSurah, pagesPerSess);

  const completedJuz = (juzList || []).filter((j) => j.donePages >= j.totalPages - 0.01);
  const hasLinkingItems = !!(contextInfo && contextInfo.hasLinkingItems);
  const hasSolidAnything = completedJuz.length > 0 || hasLinkingItems;

  const solidSample = completedJuz.length > 0
    ? completedJuz.slice(0, 2).map((j) => j.title).join(' و')
    : 'المستحق من صندوق التثبيت';

  // تقدم صفحات المراجعة عبر أيام الأسبوع حتى لا يتكرر نفس النص (A7)
  let revPageCursor = 0;
  const getDistinctRevTask = (dayIdx) => {
    if (revOrdered.length === 0) return null;
    const targetJuz = isKhatim ? revOrdered[dayIdx % revOrdered.length] : revOrdered[0];
    const jDb = JUZ_DB.find((x) => x.num === targetJuz.num);
    const baseOffset = Math.min(targetJuz.totalPages - 1, Math.floor(targetJuz.donePages || 0));
    const pStartOffset = (baseOffset + revPageCursor) % targetJuz.totalPages;
    const pEndOffset = Math.min(targetJuz.totalPages - 1, pStartOffset + revPagesPerDay - 1);
    revPageCursor += revPagesPerDay;

    const pFrom = jDb ? jDb.startPage + pStartOffset : 1;
    const pTo = jDb ? jDb.startPage + pEndOffset : pFrom;
    const pageRangeStr = pFrom === pTo ? `ص ${pFrom}` : `ص ${pFrom}–${pTo}`;

    const undoneSurahs = (targetJuz.surahs || []).filter((s) => !s.done && (isKhatim || s.track === 'revision'));
    const pickIdx = undoneSurahs.length > 0 ? (dayIdx % undoneSurahs.length) : 0;
    const surahHint = undoneSurahs.length > 0 ? ` • ${undoneSurahs[pickIdx].name}` : '';
    return `${targetJuz.title} (${pageRangeStr}${surahHint})`;
  };

  return DAYS_META.map((dm, idx) => {
    const prev = existingSchedule ? existingSchedule.find((d) => d.id === dm.id) : null;
    if (prev && prev.customEdited) return { ...prev };

    const isMq = maqraaDays.includes(dm.id);
    const nextDay = DAYS_META[(idx + 1) % 7];
    const isPrepDay = !isKhatim && hasMaqraa && maqraaDays.includes(nextDay.id);
    const revDesc = getDistinctRevTask(idx);

    let mainText = '';
    let secondText = '';
    let solidText = '';

    if (isKhatim) {
      mainText = dm.id === 'fri'
        ? `مراجعة شاملة لأوراد الأسبوع في ${revDesc || 'دورتك'} (${mainMin} د)`
        : `مراجعة ${revPagesPerDay} أوجه من ${revDesc || 'دورة الختم'} (${mainMin} د)`;
      secondText = compact ? '' : (isMq
        ? `تسميع ورد المراجعة وتسجيل التقييم (${secMin} د)`
        : `اختبار غيبي سريع وربط المتشابهات (${secMin} د)`);
      solidText = compact ? '' : `صندوق التثبيت: سرد سريع للمستحق من صندوق التثبيت (${solMin} د)`;
    } else if (isBeginner || !revDesc) {
      // A6: للمبتدئ في يومه الأول لا نعرض مهام ربط لمقاطع غير موجودة
      if (isMq) {
        mainText = `مراجعة وتسميع ${newTargetLabel} (${mainMin} د)`;
        secondText = compact ? '' : `تسجيل التقييم في التطبيق (${secMin} د)`;
      } else if (dm.id === 'fri') {
        mainText = hasSolidAnything
          ? `مراجعة مجمّعة لما حُفظ خلال الأسبوع (${mainMin} د)`
          : `تثبيت وتكرار أول ورد حفظته بهدوء (${mainMin} د)`;
        secondText = compact ? '' : `تسميع ذاتي غيباً لما تم حفظه (${secMin} د)`;
      } else {
        mainText = `حفظ جديد: ${newTargetLabel} (${mainMin} د)`;
        secondText = compact ? '' : (hasSolidAnything
          ? `تسميع غيبي وربط الورد بالمقاطع السابقة (${secMin} د)`
          : `تسميع غيبي للورد الجديد فقط (${secMin} د)`);
      }
      solidText = (compact || !hasSolidAnything)
        ? ''
        : `صندوق التثبيت: سرد سريع للمستحق من صندوق التثبيت (${solMin} د)`;
    } else if (isMq) {
      mainText = `تثبيت ${newTargetLabel} + مراجعة ${revDesc} (${mainMin} د)`;
      secondText = compact ? '' : `تسميع الورد الجديد وتسجيل التقييم (${secMin} د)`;
      solidText = (compact || !hasSolidAnything) ? '' : `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    } else if (isPrepDay) {
      mainText = `حفظ جديد: ${newTargetLabel} (${mainMin} د)`;
      secondText = compact ? '' : (hasLinkingItems ? `ربط الورد بالمقاطع السابقة (${secMin} د)` : `تسميع ذاتي للورد الجديد (${secMin} د)`);
      solidText = (compact || !hasSolidAnything) ? '' : `صندوق التثبيت: سرد سريع للمستحق من صندوق التثبيت (${solMin} د)`;
    } else if (dm.id === 'fri') {
      mainText = `مراجعة ${revDesc} أو تعويض ما فات بهدوء (${mainMin} د)`;
      secondText = compact ? '' : `تجميع ومراجعة ما أُنجز هذا الأسبوع (${secMin} د)`;
      solidText = (compact || !hasSolidAnything) ? '' : `صندوق التثبيت: سرد سريع للمستحق من صندوق التثبيت (${solMin} د)`;
    } else {
      const soloNewDay = !hasMaqraa && (dm.id === 'sun' || dm.id === 'wed');
      mainText = soloNewDay
        ? `حفظ جديد: ${newTargetLabel} (${mainMin} د)`
        : `مراجعة ${revPagesPerDay} أوجه من ${revDesc} (${mainMin} د)`;
      secondText = compact ? '' : (soloNewDay
        ? `تسميع ذاتي للورد الجديد (${secMin} د)`
        : `اختبار غيبي سريع على ${revDesc} (${secMin} د)`);
      solidText = (compact || !hasSolidAnything) ? '' : `صندوق التثبيت: ${solidSample} (${solMin} د)`;
    }

    return {
      id: dm.id, jsDay: dm.jsDay, name: dm.name, maqraa: isMq,
      main: mainText, second: secondText, solid: solidText,
      mainMin, secMin: secondText ? secMin : 0, solMin: solidText ? solMin : 0,
      mDone: prev ? !!prev.mDone : false,
      eDone: prev ? !!prev.eDone : false,
      sDone: prev ? !!prev.sDone : false,
      customEdited: false
    };
  });
}
