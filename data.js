/* ==========================================================================
   رفيق التثبيت v6 — قاعدة البيانات الكاملة (114 سورة / 30 جزءاً / 604 أوجه)
   مصحف المدينة النبوية (حفص عن عاصم) + الثيمات + إعدادات مؤقت دكتور الصفحة
   ========================================================================== */

(function (global) {
  'use strict';

  // [رقم السورة، الاسم، صفحة البداية، صفحة النهاية، عدد الأوجه الدقيق، الجزء الابتدائي، الجزء النهائي]
  const RAW_SURAHS = [
    [1, 'الفاتحة', 1, 1, 1, 1, 1],
    [2, 'البقرة', 2, 49, 48, 1, 3],
    [3, 'آل عمران', 50, 76, 27, 3, 4],
    [4, 'النساء', 77, 106, 29.5, 4, 6],
    [5, 'المائدة', 106, 127, 21.5, 6, 7],
    [6, 'الأنعام', 128, 150, 23, 7, 8],
    [7, 'الأعراف', 151, 176, 26, 8, 9],
    [8, 'الأنفال', 177, 186, 10, 9, 10],
    [9, 'التوبة', 187, 207, 21, 10, 11],
    [10, 'يونس', 208, 221, 13.5, 11, 11],
    [11, 'هود', 221, 235, 14, 11, 12],
    [12, 'يوسف', 235, 248, 13.5, 12, 13],
    [13, 'الرعد', 249, 255, 6.5, 13, 13],
    [14, 'إبراهيم', 255, 261, 6.5, 13, 13],
    [15, 'الحجر', 262, 267, 5.5, 14, 14],
    [16, 'النحل', 267, 281, 14.5, 14, 14],
    [17, 'الإسراء', 282, 293, 11.5, 15, 15],
    [18, 'الكهف', 293, 304, 11.5, 15, 16],
    [19, 'مريم', 305, 312, 7.5, 16, 16],
    [20, 'طه', 312, 321, 9.5, 16, 16],
    [21, 'الأنبياء', 322, 331, 10, 17, 17],
    [22, 'الحج', 332, 341, 10, 17, 17],
    [23, 'المؤمنون', 342, 349, 8, 18, 18],
    [24, 'النور', 350, 359, 9.5, 18, 18],
    [25, 'الفرقان', 359, 366, 7.5, 18, 19],
    [26, 'الشعراء', 367, 376, 10, 19, 19],
    [27, 'النمل', 377, 385, 8.5, 19, 20],
    [28, 'القصص', 385, 396, 11, 20, 20],
    [29, 'العنكبوت', 396, 404, 8, 20, 21],
    [30, 'الروم', 404, 410, 6.5, 21, 21],
    [31, 'لقمان', 411, 414, 4, 21, 21],
    [32, 'السجدة', 415, 417, 3, 21, 21],
    [33, 'الأحزاب', 418, 427, 10, 21, 22],
    [34, 'سبأ', 428, 434, 6.5, 22, 22],
    [35, 'فاطر', 434, 440, 6, 22, 22],
    [36, 'يس', 440, 445, 5.5, 22, 23],
    [37, 'الصافات', 446, 452, 7, 23, 23],
    [38, 'ص', 453, 458, 5.5, 23, 23],
    [39, 'الزمر', 458, 467, 9, 23, 24],
    [40, 'غافر', 467, 476, 9.5, 24, 24],
    [41, 'فصلت', 477, 482, 6, 24, 25],
    [42, 'الشورى', 483, 489, 6.5, 25, 25],
    [43, 'الزخرف', 489, 495, 6.5, 25, 25],
    [44, 'الدخان', 496, 498, 3, 25, 25],
    [45, 'الجاثية', 499, 502, 3.5, 25, 25],
    [46, 'الأحقاف', 502, 506, 4.5, 26, 26],
    [47, 'محمد', 507, 510, 4, 26, 26],
    [48, 'الفتح', 511, 515, 4.5, 26, 26],
    [49, 'الحجرات', 515, 517, 2.5, 26, 26],
    [50, 'ق', 518, 520, 2.5, 26, 26],
    [51, 'الذاريات', 520, 523, 3, 26, 27],
    [52, 'الطور', 523, 525, 2.5, 27, 27],
    [53, 'النجم', 526, 528, 2.5, 27, 27],
    [54, 'القمر', 528, 531, 3, 27, 27],
    [55, 'الرحمن', 531, 534, 3, 27, 27],
    [56, 'الواقعة', 534, 537, 3, 27, 27],
    [57, 'الحديد', 537, 541, 4.5, 27, 27],
    [58, 'المجادلة', 542, 545, 3.5, 28, 28],
    [59, 'الحشر', 545, 548, 3.5, 28, 28],
    [60, 'الممتحنة', 549, 551, 2.5, 28, 28],
    [61, 'الصف', 551, 552, 1.5, 28, 28],
    [62, 'الجمعة', 553, 554, 1.5, 28, 28],
    [63, 'المنافقون', 554, 555, 1.5, 28, 28],
    [64, 'التغابن', 556, 557, 2, 28, 28],
    [65, 'الطلاق', 558, 559, 2, 28, 28],
    [66, 'التحريم', 560, 561, 2, 28, 28],
    [67, 'الملك', 562, 564, 2.5, 29, 29],
    [68, 'القلم', 564, 566, 2, 29, 29],
    [69, 'الحاقة', 566, 568, 2, 29, 29],
    [70, 'المعارج', 568, 570, 2, 29, 29],
    [71, 'نوح', 570, 571, 1.5, 29, 29],
    [72, 'الجن', 572, 573, 2, 29, 29],
    [73, 'المزمل', 574, 575, 1.5, 29, 29],
    [74, 'المدثر', 575, 577, 2, 29, 29],
    [75, 'القيامة', 577, 578, 1, 29, 29],
    [76, 'الإنسان', 578, 580, 2, 29, 29],
    [77, 'المرسلات', 580, 581, 1.5, 29, 29],
    [78, 'النبأ', 582, 583, 1.5, 30, 30],
    [79, 'النازعات', 583, 584, 1.5, 30, 30],
    [80, 'عبس', 585, 585, 1, 30, 30],
    [81, 'التكوير', 586, 586, 1, 30, 30],
    [82, 'الانفطار', 587, 587, 0.7, 30, 30],
    [83, 'المطففين', 587, 589, 1.6, 30, 30],
    [84, 'الانشقاق', 589, 589, 0.7, 30, 30],
    [85, 'البروج', 590, 590, 1, 30, 30],
    [86, 'الطارق', 591, 591, 0.5, 30, 30],
    [87, 'الأعلى', 591, 592, 0.8, 30, 30],
    [88, 'الغاشية', 592, 592, 0.7, 30, 30],
    [89, 'الفجر', 593, 594, 1.4, 30, 30],
    [90, 'البلد', 594, 594, 0.6, 30, 30],
    [91, 'الشمس', 595, 595, 0.5, 30, 30],
    [92, 'الليل', 595, 596, 0.8, 30, 30],
    [93, 'الضحى', 596, 596, 0.4, 30, 30],
    [94, 'الشرح', 596, 596, 0.3, 30, 30],
    [95, 'التين', 597, 597, 0.4, 30, 30],
    [96, 'العلق', 597, 597, 0.6, 30, 30],
    [97, 'القدر', 598, 598, 0.3, 30, 30],
    [98, 'البينة', 598, 599, 0.9, 30, 30],
    [99, 'الزلزلة', 599, 599, 0.4, 30, 30],
    [100, 'العاديات', 599, 600, 0.6, 30, 30],
    [101, 'القارعة', 600, 600, 0.4, 30, 30],
    [102, 'التكاثر', 600, 600, 0.4, 30, 30],
    [103, 'العصر', 601, 601, 0.25, 30, 30],
    [104, 'الهمزة', 601, 601, 0.35, 30, 30],
    [105, 'الفيل', 601, 601, 0.4, 30, 30],
    [106, 'قريش', 602, 602, 0.3, 30, 30],
    [107, 'الماعون', 602, 602, 0.4, 30, 30],
    [108, 'الكوثر', 602, 602, 0.3, 30, 30],
    [109, 'الكافرون', 603, 603, 0.35, 30, 30],
    [110, 'النصر', 603, 603, 0.3, 30, 30],
    [111, 'المسد', 603, 603, 0.35, 30, 30],
    [112, 'الإخلاص', 604, 604, 0.3, 30, 30],
    [113, 'الفلق', 604, 604, 0.35, 30, 30],
    [114, 'الناس', 604, 604, 0.35, 30, 30]
  ];

  const SURAHS = RAW_SURAHS.map(([number, name, startPage, endPage, pages, juz, juzEnd]) => ({
    number,
    name,
    startPage,
    endPage,
    pages,
    juz,
    juzEnd
  }));

  const JUZ_DATA = [
    { juz: 1, name: 'الجزء ١ (الم)', startPage: 1, endPage: 21, pages: 21 },
    { juz: 2, name: 'الجزء ٢ (سيقول)', startPage: 22, endPage: 41, pages: 20 },
    { juz: 3, name: 'الجزء ٣ (تلك الرسل)', startPage: 42, endPage: 61, pages: 20 },
    { juz: 4, name: 'الجزء ٤ (لن تنالوا)', startPage: 62, endPage: 81, pages: 20 },
    { juz: 5, name: 'الجزء ٥ (والمحصنات)', startPage: 82, endPage: 101, pages: 20 },
    { juz: 6, name: 'الجزء ٦ (لا يحب الله)', startPage: 102, endPage: 120, pages: 19 },
    { juz: 7, name: 'الجزء ٧ (وإذا سمعوا)', startPage: 121, endPage: 141, pages: 21 },
    { juz: 8, name: 'الجزء ٨ (ولو أننا)', startPage: 142, endPage: 161, pages: 20 },
    { juz: 9, name: 'الجزء ٩ (قال الملأ)', startPage: 162, endPage: 181, pages: 20 },
    { juz: 10, name: 'الجزء ١٠ (واعلموا)', startPage: 182, endPage: 200, pages: 19 },
    { juz: 11, name: 'الجزء ١١ (يعتذرون)', startPage: 201, endPage: 221, pages: 21 },
    { juz: 12, name: 'الجزء ١٢ (وما من دابة)', startPage: 222, endPage: 241, pages: 20 },
    { juz: 13, name: 'الجزء ١٣ (وما أبرئ)', startPage: 242, endPage: 261, pages: 20 },
    { juz: 14, name: 'الجزء ١٤ (ربما)', startPage: 262, endPage: 281, pages: 20 },
    { juz: 15, name: 'الجزء ١٥ (سبحان الذي)', startPage: 282, endPage: 301, pages: 20 },
    { juz: 16, name: 'الجزء ١٦ (قال ألم)', startPage: 302, endPage: 321, pages: 20 },
    { juz: 17, name: 'الجزء ١٧ (اقترب للناس)', startPage: 322, endPage: 341, pages: 20 },
    { juz: 18, name: 'الجزء ١٨ (قد أفلح)', startPage: 342, endPage: 361, pages: 20 },
    { juz: 19, name: 'الجزء ١٩ (وقال الذين)', startPage: 362, endPage: 381, pages: 20 },
    { juz: 20, name: 'الجزء ٢٠ (أمن خلق)', startPage: 382, endPage: 401, pages: 20 },
    { juz: 21, name: 'الجزء ٢١ (اتل ما أوحي)', startPage: 402, endPage: 421, pages: 20 },
    { juz: 22, name: 'الجزء ٢٢ (ومن يقنت)', startPage: 422, endPage: 441, pages: 20 },
    { juz: 23, name: 'الجزء ٢٣ (ومالي)', startPage: 442, endPage: 461, pages: 20 },
    { juz: 24, name: 'الجزء ٢٤ (فمن أظلم)', startPage: 462, endPage: 481, pages: 20 },
    { juz: 25, name: 'الجزء ٢٥ (إليه يرد)', startPage: 482, endPage: 501, pages: 20 },
    { juz: 26, name: 'الجزء ٢٦ (حم)', startPage: 502, endPage: 521, pages: 20 },
    { juz: 27, name: 'الجزء ٢٧ (قال فما خطبكم)', startPage: 522, endPage: 541, pages: 20 },
    { juz: 28, name: 'الجزء ٢٨ (قد سمع)', startPage: 542, endPage: 561, pages: 20 },
    { juz: 29, name: 'الجزء ٢٩ (تبارك)', startPage: 562, endPage: 581, pages: 20 },
    { juz: 30, name: 'الجزء ٣٠ (عمّ)', startPage: 582, endPage: 604, pages: 23 }
  ];

  // 7 باليتات ألوان هادئة ومريحة للعين (داكنة وفاتحة) + دعم التخصيص الحر
  const PRESET_THEMES = [
    {
      id: 'royal-navy',
      name: 'الكحلي الملكي (الافتراضي)',
      mode: 'dark',
      bg: '#00112B',
      surface: '#081D3D',
      surface2: '#0F2952',
      accent: '#D0A151',
      accentLight: '#EFC879',
      accentDark: '#BB9042',
      text: '#F7F8FA',
      textMuted: '#B7C4D6'
    },
    {
      id: 'emerald-calm',
      name: 'الزمردي الهادئ',
      mode: 'dark',
      bg: '#061F1C',
      surface: '#0C2D28',
      surface2: '#143D37',
      accent: '#D8B36A',
      accentLight: '#F0D497',
      accentDark: '#B38B43',
      text: '#F3F8F6',
      textMuted: '#A8C7BE'
    },
    {
      id: 'amoled-charcoal',
      name: 'الفحمي AMOLED',
      mode: 'dark',
      bg: '#0B0D12',
      surface: '#141821',
      surface2: '#1D2330',
      accent: '#D4A85A',
      accentLight: '#F0CE87',
      accentDark: '#AD843D',
      text: '#F5F6F8',
      textMuted: '#9EA7B8'
    },
    {
      id: 'warm-slate',
      name: 'الأردوازي الدافئ',
      mode: 'dark',
      bg: '#1A1E29',
      surface: '#242A38',
      surface2: '#2F3749',
      accent: '#C9A26D',
      accentLight: '#E5C69A',
      accentDark: '#A6804D',
      text: '#F4F5F7',
      textMuted: '#B2BAC8'
    },
    {
      id: 'day-paper',
      name: 'الورق النهاري',
      mode: 'light',
      bg: '#F7F4EC',
      surface: '#FFFFFF',
      surface2: '#EFE9DC',
      accent: '#9A6F26',
      accentLight: '#C59643',
      accentDark: '#7A561A',
      text: '#1B2432',
      textMuted: '#566275'
    },
    {
      id: 'sage-parchment',
      name: 'الميرمية المريحة',
      mode: 'light',
      bg: '#EFF4F0',
      surface: '#FFFFFF',
      surface2: '#E1EBE3',
      accent: '#2B6E5C',
      accentLight: '#3D8C77',
      accentDark: '#1E5244',
      text: '#182924',
      textMuted: '#4F6961'
    },
    {
      id: 'pure-ivory',
      name: 'العاجي الهادئ',
      mode: 'light',
      bg: '#F8F9FB',
      surface: '#FFFFFF',
      surface2: '#EAEFF5',
      accent: '#1E467A',
      accentLight: '#3464A3',
      accentDark: '#133158',
      text: '#131D2B',
      textMuted: '#526176'
    }
  ];

  // إعدادات مؤقت «دكتور الصفحة»
  const DOCTOR_MODES = {
    restore: {
      id: 'restore',
      name: 'ترميم صفحة (١٢ د)',
      totalSeconds: 12 * 60,
      stages: [
        { title: '١. قراءة نظر بتركيز وتصحيح', duration: 3 * 60, tip: 'اقرأ الوجه كاملاً نظراً ببطء واضبط المتشابهات والتشكيل.' },
        { title: '٢. ربط الآيات ومفاصل الوجه', duration: 3 * 60, tip: 'ركّز على رؤوس الآيات والانتقال بين كل آية والتي تليها.' },
        { title: '٣. تسميع غيبي مع تصحيح فوري', duration: 4 * 60, tip: 'سمّع الوجه غيباً، وضع علامة خفيفة على أي موضع تردد.' },
        { title: '٤. تثبيت ختامي وربط بالوجه التالي', duration: 2 * 60, tip: 'أعد قراءة الوجه متصلاً مع أول آية من الوجه الذي يليه.' }
      ]
    },
    link_new: {
      id: 'link_new',
      name: 'ربط جديد (٦ د)',
      totalSeconds: 6 * 60,
      stages: [
        { title: '١. استحضار المقطع السابق', duration: 2 * 60, tip: 'راجع آخر مقطع قبل الورد الجديد لتأمين جسر الربط.' },
        { title: '٢. دمج المقطعين معاً غيباً', duration: 3 * 60, tip: 'اقرأ المقطع السابق والجديد متصلين بلا توقف.' },
        { title: '٣. تثبيت مواضع التردد', duration: 1 * 60, tip: 'كرر الآيات التي احتاجت تذكير ٣ مرات متصلة.' }
      ]
    },
    old_solid: {
      id: 'old_solid',
      name: 'تثبيت قديم (١٠ د)',
      totalSeconds: 10 * 60,
      stages: [
        { title: '١. مسح بصري سريع لمفاتيح الصفحات', duration: 2 * 60, tip: 'ألقِ نظرة سريعة على بدايات الأوجه والمتشابهات.' },
        { title: '٢. تسميع متصل بانسيابية', duration: 6 * 60, tip: 'سمّع المقطع غيباً بصوت مسموع وهادئ.' },
        { title: '٣. مراجعة الوقفات فقط', duration: 2 * 60, tip: 'ارجع للآيات التي توقفت عندها فقط وثبّتها قبل الإغلاق.' }
      ]
    },
    busy_7: {
      id: 'busy_7',
      name: 'وضع الحماية السريع (٧ د)',
      totalSeconds: 7 * 60,
      stages: [
        { title: '١. تنفس وفتح المصحف بدون ضغط', duration: 1 * 60, tip: 'القليل الدائم خير من الانقطاع — ٧ دقائق تحفظ سلسلتك اليوم.' },
        { title: '٢. مراجعة أهم بند مستحق اليوم', duration: 5 * 60, tip: 'سمّع أو اقرأ أهم مقطع مستحق للمراجعة بتركيز هادئ.' },
        { title: '٣. تسجيل الإنجاز وإغلاق الجلسة', duration: 1 * 60, tip: 'سجّل تقييمك واحتفل بحفاظك على الاستمرارية.' }
      ]
    }
  };

  // خيارات التقييم ومحرك التكرار المتباعد (SRS)
  const RATINGS = {
    repeat: { id: 'repeat', label: 'إعادة', minDays: 1, maxDays: 2, color: '#E06C75', hint: 'يعود بعد ١–٢ يوم' },
    good: { id: 'good', label: 'جيد', minDays: 4, maxDays: 4, color: '#E5A93C', hint: 'يعود بعد ٤ أيام' },
    very_good: { id: 'very_good', label: 'جيد جداً', minDays: 8, maxDays: 8, color: '#4EA8DE', hint: 'يعود بعد ٨ أيام' },
    excellent: { id: 'excellent', label: 'ممتاز', minDays: 14, maxDays: 25, color: '#3FB984', hint: 'يعود بعد ١٤–٢٥ يوماً' }
  };

  const WEEKDAYS_AR = [
    { id: 6, name: 'السبت', short: 'سبت' },
    { id: 0, name: 'الأحد', short: 'أحد' },
    { id: 1, name: 'الاثنين', short: 'إثنين' },
    { id: 2, name: 'الثلاثاء', short: 'ثلاثاء' },
    { id: 3, name: 'الأربعاء', short: 'أربعاء' },
    { id: 4, name: 'الخميس', short: 'خميس' },
    { id: 5, name: 'الجمعة', short: 'جمعة' }
  ];

  // مساعدات الاستعلام على السور والأجزاء
  function getSurahByNumber(num) {
    return SURAHS.find((s) => s.number === Number(num)) || null;
  }

  function getSurahsInJuz(juzNum) {
    const j = Number(juzNum);
    return SURAHS.filter((s) => s.juz <= j && s.juzEnd >= j);
  }

  function getJuzSummary(juzNum) {
    const info = JUZ_DATA.find((x) => x.juz === Number(juzNum));
    const surahs = getSurahsInJuz(juzNum);
    const names = surahs.length > 3
      ? `${surahs[0].name} ← ${surahs[surahs.length - 1].name}`
      : surahs.map((s) => s.name).join('، ');
    return { ...info, surahs, surahRangeLabel: names };
  }

  function calculateSurahSetStats(surahNumbers) {
    const uniqueNums = Array.from(new Set(surahNumbers.map(Number))).filter((n) => n >= 1 && n <= 114);
    const selected = uniqueNums.map(getSurahByNumber).filter(Boolean);
    const totalPages = Math.min(604, Math.round(selected.reduce((sum, s) => sum + s.pages, 0) * 10) / 10);
    const remainingPages = Math.max(0, Math.round((604 - totalPages) * 10) / 10);
    const completedJuzCount = Math.round((totalPages / 20.133) * 10) / 10;

    // حساب الأجزاء المكتملة فعلياً (التي حفظ المستخدم كل سورها أو معظم أوجهها >= 85%)
    const completedJuzNumbers = [];
    for (let j = 1; j <= 30; j++) {
      const jSurahs = getSurahsInJuz(j);
      const allIn = jSurahs.length > 0 && jSurahs.every((s) => uniqueNums.includes(s.number));
      if (allIn) completedJuzNumbers.push(j);
    }

    return {
      surahCount: selected.length,
      totalPages,
      remainingPages,
      approxJuz: Math.min(30, completedJuzCount),
      completedJuzNumbers,
      percent: Math.min(100, Math.round((totalPages / 604) * 1000) / 10)
    };
  }

  global.RAFIQ_DATA = {
    VERSION: '6.0.0',
    TOTAL_PAGES: 604,
    TOTAL_JUZ: 30,
    SURAHS,
    JUZ_DATA,
    PRESET_THEMES,
    DOCTOR_MODES,
    RATINGS,
    WEEKDAYS_AR,
    getSurahByNumber,
    getSurahsInJuz,
    getJuzSummary,
    calculateSurahSetStats
  };
})(typeof window !== 'undefined' ? window : globalThis);
