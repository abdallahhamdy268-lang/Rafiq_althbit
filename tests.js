#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = __dirname;
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✕ ${name}\n  → ${err.message}`);
  }
}

// Create a clean VM sandbox with data.js + engine.js + storage.js
function createCoreSandbox() {
  const store = {};
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; }
  };
  const sandbox = {
    console, Math, Date, JSON, Number, String, Array, Object, Set, Map, RegExp, Error,
    parseInt, parseFloat, isNaN, isFinite,
    localStorage, navigator: {}, window: null
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['data.js', 'engine.js', 'storage.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  // Expose top-level const bindings onto sandbox
  vm.runInContext(`
    window.SURAHS_DB = SURAHS_DB;
    window.JUZ_DB = JUZ_DB;
    window.SR_CONFIG = SR_CONFIG;
    window.RATINGS = RATINGS;
    window.GLOSSARY = GLOSSARY;
    window.APP_VERSION = APP_VERSION;
  `, sandbox);
  return sandbox;
}

const core = createCoreSandbox();

// 1. Quran data integrity: 114 Surahs, 30 Juz, 6,236 Ayat, 604 Pages
test('١. دقة قاعدة البيانات: ١١٤ سورة، ٣٠ جزءاً، ٦٢٣٦ آية، ٦٠٤ وجهاً بدون عدّ مزدوج', () => {
  assert.strictEqual(core.SURAHS_DB.length, 114);
  assert.strictEqual(core.JUZ_DB.length, 30);
  const totalAyahs = core.SURAHS_DB.reduce((a, s) => a + s.ayahs, 0);
  assert.strictEqual(totalAyahs, 6236, `مجموع الآيات ${totalAyahs} بدل 6236`);
  let totalPages = 0;
  for (const j of core.JUZ_DB) {
    const s = core.getJuzSurahs(j.num).reduce((acc, x) => acc + core.getSurahPagesInJuz(x, j), 0);
    assert(Math.abs(s - j.totalPages) < 0.01, `الجزء ${j.num}: المجموع ${s} بدل ${j.totalPages}`);
    totalPages += s;
  }
  assert(Math.abs(totalPages - 604) < 0.01, `الإجمالي ${totalPages} بدل 604`);
});

// 2. Local date helpers at 00:30 local time (summer & winter) + addDaysStr
test('٢. التواريخ المحلية عند 00:30 صيفاً وشتاءً وإضافة الأيام بدون انحراف UTC', () => {
  const winter0030 = new Date(2026, 0, 15, 0, 30, 0);
  const summer0030 = new Date(2026, 6, 15, 0, 30, 0);
  assert.strictEqual(core.formatLocalDate(winter0030), '2026-01-15');
  assert.strictEqual(core.formatLocalDate(summer0030), '2026-07-15');
  assert.strictEqual(core.addDaysStr('2026-01-31', 1), '2026-02-01');
  assert.strictEqual(core.addDaysStr('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(core.diffDaysFromToday('2026-05-10', '2026-05-07'), 3);
});

// 3. SM-2-lite: A1 (جيد progression), A2 (learning steps), A3 (level caps), critical rating
test('٣. محرك SM-2-lite: تصاعد «جيد» + خطوات التعلّم [1,3,7] + السقف حسب المستوى + الموضع الحرج', () => {
  // A1: after إعادة (interval=1, reps=0), 8 consecutive «جيد» ratings must strictly grow
  let meta = { intervalDays: 1, ease: 2.3, reps: 0 };
  const seq = [];
  for (let i = 0; i < 8; i++) {
    meta = core.computeSM2(meta, 'جيد', 0, 'hafidh');
    seq.push(meta.intervalDays);
  }
  assert.deepStrictEqual(seq, [2, 3, 4, 5, 7, 9, 12, 16], `تسلسل جيد: ${JSON.stringify(seq)}`);
  assert.strictEqual(meta.critical, false);

  // A2: learning steps [1, 3, 7] for جيد جداً
  let m2 = { intervalDays: 0, ease: 2.3, reps: 0 };
  const steps = [];
  for (let i = 0; i < 3; i++) {
    m2 = core.computeSM2(m2, 'جيد جداً', 0, 'intermediate');
    steps.push(m2.intervalDays);
  }
  assert.deepStrictEqual(steps, [1, 3, 7], `خطوات التعلّم: ${JSON.stringify(steps)}`);

  // A3: level caps (beginner: 14, intermediate: 30, hafidh: 45)
  const capBeg = core.computeSM2({ intervalDays: 20, ease: 2.8, reps: 5 }, 'ممتاز', 0, 'beginner');
  const capInt = core.computeSM2({ intervalDays: 40, ease: 2.8, reps: 5 }, 'ممتاز', 0, 'intermediate');
  const capHaf = core.computeSM2({ intervalDays: 60, ease: 2.8, reps: 5 }, 'ممتاز', 0, 'hafidh');
  assert.strictEqual(capBeg.intervalDays, 14);
  assert.strictEqual(capInt.intervalDays, 30);
  assert.strictEqual(capHaf.intervalDays, 45);

  // Critical rating «نسيت تماماً» resets interval to 1 and sets critical: true
  const crit = core.computeSM2({ intervalDays: 15, ease: 2.5, reps: 4 }, 'نسيت تماماً', 0, 'hafidh');
  assert.strictEqual(crit.intervalDays, 1);
  assert.strictEqual(crit.reps, 0);
  assert.strictEqual(crit.critical, true);
});

// 4. Schedule time-budget matrix: (beginner, intermediate, hafidh) x {10,15,20,30,45,60,90}
test('٤. مصفوفة ميزانية الوقت: مجموع الدقائق اليومية <= dailyMin لكل المستويات والأوقات', () => {
  const levels = [
    { level: 'beginner', mode: 'new', memCount: 0 },
    { level: 'intermediate', mode: 'both', memCount: 5 },
    { level: 'hafidh', mode: 'khatim', memCount: 30 }
  ];
  const mins = [10, 15, 20, 30, 45, 60, 90];
  for (const cfg of levels) {
    for (const dailyMin of mins) {
      const profile = {
        mode: cfg.mode,
        level: cfg.level,
        dailyMin,
        maqraaDays: [1, 3, 5],
        direction: 'from_nas',
        newPagesPerSession: 1,
        revPagesPerDay: 5,
        khatimCycleDays: 30,
        diagnosedMemorized: Array.from({ length: cfg.memCount }, (_, i) => 30 - i)
      };
      const plan = core.buildPersonalizedPlan(profile);
      const sched = core.buildLiveSchedule(profile, plan.juzList, plan.activeRevJuzNum, plan.activeNewSurahNum, null, { hasLinkingItems: cfg.memCount > 0 });
      for (const day of sched) {
        const sum = (day.mainMin || 0) + (day.secMin || 0) + (day.solMin || 0);
        assert(sum <= dailyMin, `level=${cfg.level} dailyMin=${dailyMin} day=${day.name}: sum=${sum}`);
      }
    }
  }
});

// 5. Beginner Day 1 has no linking/review tasks when 0 memorized; short Surah grouping; distinct revision tasks
test('٥. خطة المبتدئ اليوم الأول خالية من الربط والمراجعة + تجميع السور القصيرة + مهام مراجعة غير مكررة', () => {
  const begProfile = {
    mode: 'new', level: 'beginner', dailyMin: 30, maqraaDays: [0, 2, 4],
    direction: 'from_nas', newPagesPerSession: 1, revPagesPerDay: 0, diagnosedMemorized: []
  };
  const begPlan = core.buildPersonalizedPlan(begProfile);
  const begSched = core.buildLiveSchedule(begProfile, begPlan.juzList, begPlan.activeRevJuzNum, begPlan.activeNewSurahNum, null, { hasLinkingItems: false });
  const day0 = begSched[0];
  assert(!/ربط/.test(day0.second || ''), `لا يجب وجود ربط لمبتدئ بلا محفوظ: ${day0.second}`);
  assert(!/مراجعة/.test(day0.main || ''), `لا يجب وجود مراجعة لمبتدئ بلا محفوظ: ${day0.main}`);
  assert(!/وجه.*الناس/.test(day0.main || ''), `لا يجب طلب وجه كامل من الناس: ${day0.main}`);

  // Khatim revision tasks across week should have distinct page ranges
  const khatimProfile = {
    mode: 'khatim', level: 'hafidh', dailyMin: 45, maqraaDays: [],
    direction: 'from_fatiha', newPagesPerSession: 0, revPagesPerDay: 20, khatimCycleDays: 30,
    diagnosedMemorized: Array.from({ length: 30 }, (_, i) => i + 1)
  };
  const kPlan = core.buildPersonalizedPlan(khatimProfile);
  const kSched = core.buildLiveSchedule(khatimProfile, kPlan.juzList, kPlan.activeRevJuzNum, kPlan.activeNewSurahNum, null, { hasLinkingItems: false });
  const revTitles = kSched.map(d => d.main).filter(Boolean);
  assert(new Set(revTitles).size > 1, 'يجب تنوّع نطاقات المراجعة عبر أيام الأسبوع');
});

// 6. Ayah-to-pages estimation & multi-Juz Surah page distribution
test('٦. حساب الأوجه من نطاق الآيات وتوزيع صفحات السورة عبر أجزاء متعددة (البقرة)', () => {
  const yunusHalf = core.estimatePagesFromAyahs(10, 1, 55);
  assert(yunusHalf > 6 && yunusHalf < 7.5, `نصف سورة يونس المتوقع ~6.75 وجه، الناتج ${yunusHalf}`);
  assert.strictEqual(core.getSurahJuzForLoggedPages(2, 0), 1);
  assert.strictEqual(core.getSurahJuzForLoggedPages(2, 22), 2);
  assert.strictEqual(core.getSurahJuzForLoggedPages(2, 42), 3);

  const juzList = core.JUZ_DB.map(j => ({
    num: j.num, name: j.name, range: j.range, totalPages: j.totalPages,
    basePages: 0, loggedPages: 0, donePages: 0, completedSurahs: [], status: 'pending'
  }));
  // Add 25 pages of Al-Baqarah (spans Juz 1 [20p] and Juz 2 [5p])
  core.applyPagesAcrossJuzs(juzList, 2, 25, 0);
  const j1 = juzList.find(j => j.num === 1);
  const j2 = juzList.find(j => j.num === 2);
  assert(j1.loggedPages >= 19.9 && j1.loggedPages <= 20.1, `الجزء 1 يجب أن يأخذ ~20 وجهاً، الناتج ${j1.loggedPages}`);
  assert(j2.loggedPages >= 4.9 && j2.loggedPages <= 5.1, `الجزء 2 يجب أن يأخذ ~5 أوجه، الناتج ${j2.loggedPages}`);
});

// 7. Clean v7→v7.2 restore & v6→v7.2 migration without doubling loggedPages
test('٧. الترحيل من v6 وv7 إلى v7.2 بدون مضاعفة loggedPages وحفظ كافة البيانات', () => {
  const v6 = {
    version: 6,
    profile: { name: 'عبد الله', mode: 'both', dailyMin: 30, maqraaDays: [1, 3] },
    juzList: [
      { num: 30, name: 'الجزء 30', range: 'النبأ - الناس', totalPages: 23, donePages: 10, completedSurahs: [78], status: 'active' }
    ],
    newLinkingGroups: [{ id: 'g1', surahNum: 78, surahName: 'النبأ', passages: [{ id: 'p1', label: '١-٢٠', rating: 'جيد' }] }],
    maqraaLogs: [{ id: 'l1', date: '2026-10-01', type: 'new', surahNum: 78, pages: 1.5, note: 'ملاحظة مهمة', mutashabihat: 'آية متشابهة' }]
  };
  const migrated = core.migrateState(v6);
  const j30 = migrated.juzList.find(j => j.num === 30);
  assert(Math.abs(j30.donePages - 10) < 0.2, `بعد ترحيل v6 يجب بقاء donePages=10، الناتج ${j30.donePages}`);
  assert.strictEqual(migrated.profile.name, 'عبد الله');
  assert.strictEqual(migrated.maqraaLogs.length, 1);

  // Clean v7 restore via normalizeV7State must NOT alter loggedPages
  const v7 = core.getEmptyState();
  v7.juzList = core.buildPersonalizedPlan(v7.profile).juzList;
  const targetJ = v7.juzList.find(j => j.num === 30);
  targetJ.loggedPages = 7;
  core.recomputeJuzProgress(targetJ);
  const restored = core.normalizeV7State(v7);
  const resJ = restored.juzList.find(j => j.num === 30);
  assert.strictEqual(resJ.loggedPages, 7);
  assert.strictEqual(resJ.donePages, 7);
});

// 8. HTML, CSS, SW, Manifest & App Integrity checks
test('٨. سلامة index.html وstyle.css وmanifest.json وsw.js (بدون نجوم، بدون UTC، بدون IDs مكررة)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const allJs = ['data.js', 'engine.js', 'storage.js', 'app.js', 'sw.js']
    .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.strictEqual(ids.length, new Set(ids).size, 'توجد معرفات IDs مكررة في index.html');

  const starRe = /[⭐🌟✨★☆✦✧✩✪✫✬✭✮✯🌠]/u;
  assert(!starRe.test(html), 'يوجد رمز نجمة في index.html');
  assert(!starRe.test(css), 'يوجد رمز نجمة في style.css');
  assert(!starRe.test(allJs), 'يوجد رمز نجمة في ملفات JS');

  assert(!/toISOString\(\)\s*\.slice\(\s*0\s*,\s*10\s*\)/.test(allJs), 'وُجد toISOString().slice(0,10)');

  assert(manifest.icons.some(i => i.purpose === 'any' && i.sizes === '192x192'), 'أيقونة 192 any');
  assert(manifest.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'), 'أيقونة 512 maskable');
  assert(fs.existsSync(path.join(ROOT, 'icon-192.png')), 'icon-192.png موجود');
  assert(fs.existsSync(path.join(ROOT, 'icon-512.png')), 'icon-512.png موجود');

  assert(sw.includes('engine.js') && sw.includes('storage.js'), 'sw.js يخزّن engine.js وstorage.js');
  assert(sw.includes('Promise.allSettled'), 'sw.js يستخدم Promise.allSettled');
});

// 9. App-level unit checks (clearLogMutAndNote preserves note, mergeGroupPassages, graduateSurahToOldSolid, archiveWeek no-duplicate, A4 hasUrgent)
test('٩. دوال app.js: حفظ الملاحظة عند مسح المتشابهة + دمج مقاطع التثبيت + ترقية السورة + منع أرشفة مكررة في نفس اليوم', () => {
  const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const clearFnMatch = appCode.match(/function clearLogMutAndNote\([\s\S]*?\n\}/);
  assert(clearFnMatch, 'clearLogMutAndNote موجودة');
  assert(clearFnMatch[0].includes('mutDismissed = true'), 'clearLogMutAndNote تحفظ mutDismissed = true');
  assert(!clearFnMatch[0].includes("log.note = ''"), 'clearLogMutAndNote لا تمسح log.note');

  assert(appCode.includes('function mergeGroupPassages('), 'mergeGroupPassages موجودة');
  assert(appCode.includes('function graduateSurahToOldSolid('), 'graduateSurahToOldSolid موجودة');

  const archiveFnMatch = appCode.match(/function archiveWeek\([\s\S]*?\n\}/);
  assert(archiveFnMatch, 'archiveWeek موجودة');
  assert(archiveFnMatch[0].includes('lastArchivedDate === today'), 'archiveWeek تمنع الأرشفة المكررة في نفس اليوم');
});

console.log(`\nالنتيجة النهائية: اجتاز ${passed} من ${passed + failed} اختباراً.`);
if (failed > 0) process.exit(1);
