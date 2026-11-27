// ==========================================================================
// رفيق التثبيت v7.2 — قاعدة البيانات الدقيقة (١١٤ سورة • ٦٢٣٦ آية • ٦٠٤ وجهاً)
// ==========================================================================

const APP_VERSION = '7.2.0';

const THEMES = [
  { id: 'royal',   name: 'الكحلي الملكي والذهبي', desc: 'الهوية الافتراضية • تركيز عالٍ', mode: 'dark',  meta: '#00112B', swatches: ['#00112B', '#071C3B', '#D0A151', '#EFC879'] },
  { id: 'emerald', name: 'الزمردي والعاجي',        desc: 'بطابع المصحف الكلاسيكي',          mode: 'dark',  meta: '#051D17', swatches: ['#051D17', '#0A2B23', '#CFA658', '#EED48E'] },
  { id: 'amoled',  name: 'الليلي الفحمي (AMOLED)', desc: 'هادئ للعين وموفّر للبطارية',      mode: 'dark',  meta: '#07080B', swatches: ['#07080B', '#111319', '#C89B62', '#E6BC84'] },
  { id: 'olive',   name: 'الزيتوني الهادئ',        desc: 'داكن دافئ ومريح للقراءة الطويلة', mode: 'dark',  meta: '#121B17', swatches: ['#121B17', '#1B2822', '#C6A868', '#E5CE95'] },
  { id: 'mushaf',  name: 'الورق الدافئ (نهاري)',   desc: 'فاتح مريح للعين في ضوء النهار',   mode: 'light', meta: '#F5F0E4', swatches: ['#F5F0E4', '#FFFDF8', '#1F4D3A', '#B0863B'] },
  { id: 'sky',     name: 'النهاري الصافي',         desc: 'فاتح نقي بتباين أزرق هادئ',       mode: 'light', meta: '#F2F6FA', swatches: ['#F2F6FA', '#FFFFFF', '#1B4965', '#2D6A8E'] },
  { id: 'sepia',   name: 'المخطوط الكلاسيكي',      desc: 'ورق عتيق دافئ بتباين عنّابي هادئ', mode: 'light', meta: '#F7EFE2', swatches: ['#F7EFE2', '#FFFBF4', '#6B3A2A', '#9A5B3E'] }
];

const DAYS_META = [
  { id: 'sat', jsDay: 6, name: 'السبت' },
  { id: 'sun', jsDay: 0, name: 'الأحد' },
  { id: 'mon', jsDay: 1, name: 'الإثنين' },
  { id: 'tue', jsDay: 2, name: 'الثلاثاء' },
  { id: 'wed', jsDay: 3, name: 'الأربعاء' },
  { id: 'thu', jsDay: 4, name: 'الخميس' },
  { id: 'fri', jsDay: 5, name: 'الجمعة' }
];

// مصدر واحد لإعدادات التكرار المتباعد (SM-2-lite) والمستويات
const SR_CONFIG = {
  defaultEase: 2.3,
  minEase: 1.3,
  maxEase: 3.0,
  minIntervalDays: 1,
  maxIntervalDays: 45,
  learningSteps: [1, 3, 7],
  maxIntervalByLevel: {
    beginner: 14,
    intermediate: 30,
    hafidh: 45
  },
  minutesPerRevPageByLevel: {
    beginner: 12,
    intermediate: 7,
    hafidh: 3
  },
  firstAutoReviewDays: 2,
  dailyDueLimit: 6,
  backupReminderDays: 14,
  streakGraceWindowDays: 7
};

const RATINGS = [
  { id: 'ممتاز',        label: 'ممتاز (متقن)',        shortHint: 'تتباعد الفترة بأعلى معامل ثبات',  btnClass: 'selected-excellent', tagClass: 'tag-success' },
  { id: 'جيد جداً',     label: 'جيد جداً',            shortHint: 'تتباعد الفترة بانتظام متوازن',     btnClass: 'selected-vgood',     tagClass: 'tag-gold' },
  { id: 'جيد',          label: 'جيد (يحتاج تثبيتاً)', shortHint: 'تتباعد تدريجياً (٢ ← ٣ ← ٤...)',  btnClass: 'selected-good',      tagClass: 'tag-warn' },
  { id: 'يحتاج إعادة',  label: 'يحتاج إعادة',         shortHint: 'أولوية للمراجعة غداً (١ يوم)',     btnClass: 'selected-repeat',    tagClass: 'tag-danger' },
  { id: 'نسيت تماماً',  label: 'نسيت الورد تماماً',   shortHint: 'موضع حرج — أولوية قصوى وبنك المتشابهات', btnClass: 'selected-repeat', tagClass: 'tag-danger' }
];

const GLOSSARY = [
  { term: 'الجديد', desc: 'الورد الذي تحفظه لأول مرة. تسجّله بالآيات أو الأوجه، وعند تأكيد تسميعه ينتقل تلقائياً لصندوق التثبيت.' },
  { term: 'المراجعة (الترميم)', desc: 'إحياء وتنشيط ما حفظته سابقاً؛ وعند إتمام أي جزء ينتقل فوراً لصندوق التثبيت ويحل الجزء التالي مكانه في جدولك.' },
  { term: 'صندوق التثبيت (الكرة الثلجية)', desc: 'في «تثبيت الجديد» تراجع كل مقطع وتدمج المقاطع المتجاورة في كتلة واحدة حتى تكتمل السورة، فتنتقل تلقائياً لـ «تثبيت القديم» بدورة مراجعة دائمة لا تتفلت أبداً.' },
  { term: 'مؤقت دكتور الصفحة (١٢ دقيقة)', desc: 'دقيقتان كشف بالنظر + ٥ دقائق تقوية للمتفلت + ٣ دقائق اختبار غيبي + دقيقتان قفلة متصلة.' },
  { term: 'وضع اليوم المضغوط (٧ دقائق)', desc: 'وضع حماية سريع لأيام الانشغال الشديد؛ يحفظ سلسلتك دون إحباط أو تراكم مرهق.' }
];

const JUZ_DB = [
  { num: 1,  title: 'الجزء ١',  range: 'الفاتحة – البقرة (١٤١)',       startPage: 1,   endPage: 21,  totalPages: 21 },
  { num: 2,  title: 'الجزء ٢',  range: 'البقرة (١٤٢ – ٢٥٢)',           startPage: 22,  endPage: 41,  totalPages: 20 },
  { num: 3,  title: 'الجزء ٣',  range: 'البقرة (٢٥٣) – آل عمران (٩٢)', startPage: 42,  endPage: 61,  totalPages: 20 },
  { num: 4,  title: 'الجزء ٤',  range: 'آل عمران (٩٣) – النساء (٢٣)',  startPage: 62,  endPage: 81,  totalPages: 20 },
  { num: 5,  title: 'الجزء ٥',  range: 'النساء (٢٤ – ١٤٧)',            startPage: 82,  endPage: 101, totalPages: 20 },
  { num: 6,  title: 'الجزء ٦',  range: 'النساء (١٤٨) – المائدة (٨١)',  startPage: 102, endPage: 121, totalPages: 20 },
  { num: 7,  title: 'الجزء ٧',  range: 'المائدة (٨٢) – الأنعام (١١٠)', startPage: 122, endPage: 141, totalPages: 20 },
  { num: 8,  title: 'الجزء ٨',  range: 'الأنعام (١١١) – الأعراف (٨٧)', startPage: 142, endPage: 161, totalPages: 20 },
  { num: 9,  title: 'الجزء ٩',  range: 'الأعراف (٨٨) – الأنفال (٤٠)',  startPage: 162, endPage: 181, totalPages: 20 },
  { num: 10, title: 'الجزء ١٠', range: 'الأنفال (٤١) – التوبة (٩٢)',   startPage: 182, endPage: 201, totalPages: 20 },
  { num: 11, title: 'الجزء ١١', range: 'التوبة (٩٣) – هود (٥)',        startPage: 202, endPage: 221, totalPages: 20 },
  { num: 12, title: 'الجزء ١٢', range: 'هود (٦) – يوسف (٥٢)',          startPage: 222, endPage: 241, totalPages: 20 },
  { num: 13, title: 'الجزء ١٣', range: 'يوسف (٥٣) – إبراهيم',          startPage: 242, endPage: 261, totalPages: 20 },
  { num: 14, title: 'الجزء ١٤', range: 'الحجر – النحل',                startPage: 262, endPage: 281, totalPages: 20 },
  { num: 15, title: 'الجزء ١٥', range: 'الإسراء – الكهف (٧٤)',         startPage: 282, endPage: 301, totalPages: 20 },
  { num: 16, title: 'الجزء ١٦', range: 'الكهف (٧٥) – طه',              startPage: 302, endPage: 321, totalPages: 20 },
  { num: 17, title: 'الجزء ١٧', range: 'الأنبياء – الحج',              startPage: 322, endPage: 341, totalPages: 20 },
  { num: 18, title: 'الجزء ١٨', range: 'المؤمنون – الفرقان (٢٠)',      startPage: 342, endPage: 361, totalPages: 20 },
  { num: 19, title: 'الجزء ١٩', range: 'الفرقان (٢١) – النمل (٥٥)',    startPage: 362, endPage: 381, totalPages: 20 },
  { num: 20, title: 'الجزء ٢٠', range: 'النمل (٥٦) – العنكبوت (٤٥)',   startPage: 382, endPage: 401, totalPages: 20 },
  { num: 21, title: 'الجزء ٢١', range: 'العنكبوت (٤٦) – الأحزاب (٣٠)', startPage: 402, endPage: 421, totalPages: 20 },
  { num: 22, title: 'الجزء ٢٢', range: 'الأحزاب (٣١) – يس (٢٧)',       startPage: 422, endPage: 441, totalPages: 20 },
  { num: 23, title: 'الجزء ٢٣', range: 'يس (٢٨) – الزمر (٣١)',         startPage: 442, endPage: 461, totalPages: 20 },
  { num: 24, title: 'الجزء ٢٤', range: 'الزمر (٣٢) – فصلت (٤٦)',       startPage: 462, endPage: 481, totalPages: 20 },
  { num: 25, title: 'الجزء ٢٥', range: 'فصلت (٤٧) – الجاثية',          startPage: 482, endPage: 501, totalPages: 20 },
  { num: 26, title: 'الجزء ٢٦', range: 'الأحقاف – الذاريات (٣٠)',      startPage: 502, endPage: 521, totalPages: 20 },
  { num: 27, title: 'الجزء ٢٧', range: 'الذاريات (٣١) – الحديد',       startPage: 522, endPage: 541, totalPages: 20 },
  { num: 28, title: 'الجزء ٢٨ (قد سمع)', range: 'المجادلة – التحريم',  startPage: 542, endPage: 561, totalPages: 20 },
  { num: 29, title: 'الجزء ٢٩ (تبارك)',  range: 'الملك – المرسلات',    startPage: 562, endPage: 581, totalPages: 20 },
  { num: 30, title: 'الجزء ٣٠ (عمّ)',    range: 'النبأ – الناس',       startPage: 582, endPage: 604, totalPages: 23 }
];

// قاعدة بيانات الـ ١١٤ سورة كاملة بالآيات الدقيقة (٦٢٣٦ آية) ومصحف المدينة (٦٠٤ وجهاً)
const SURAHS_DB = [
  { num: 1,   name: 'الفاتحة',   ayahs: 7,   pages: 1,    juz: 1,  startPage: 1,   endPage: 1 },
  { num: 2,   name: 'البقرة',    ayahs: 286, pages: 48,   juz: 1,  startPage: 2,   endPage: 49 },
  { num: 3,   name: 'آل عمران',  ayahs: 200, pages: 27,   juz: 3,  startPage: 50,  endPage: 76 },
  { num: 4,   name: 'النساء',    ayahs: 176, pages: 29.5, juz: 4,  startPage: 77,  endPage: 106 },
  { num: 5,   name: 'المائدة',   ayahs: 120, pages: 21.5, juz: 6,  startPage: 106, endPage: 127 },
  { num: 6,   name: 'الأنعام',   ayahs: 165, pages: 23,   juz: 7,  startPage: 128, endPage: 150 },
  { num: 7,   name: 'الأعراف',   ayahs: 206, pages: 26,   juz: 8,  startPage: 151, endPage: 176 },
  { num: 8,   name: 'الأنفال',   ayahs: 75,  pages: 10,   juz: 9,  startPage: 177, endPage: 186 },
  { num: 9,   name: 'التوبة',    ayahs: 129, pages: 21,   juz: 10, startPage: 187, endPage: 207 },
  { num: 10,  name: 'يونس',      ayahs: 109, pages: 13.5, juz: 11, startPage: 208, endPage: 221 },
  { num: 11,  name: 'هود',       ayahs: 123, pages: 14,   juz: 11, startPage: 221, endPage: 235 },
  { num: 12,  name: 'يوسف',      ayahs: 111, pages: 13.5, juz: 12, startPage: 235, endPage: 248 },
  { num: 13,  name: 'الرعد',     ayahs: 43,  pages: 6.5,  juz: 13, startPage: 249, endPage: 255 },
  { num: 14,  name: 'إبراهيم',   ayahs: 52,  pages: 6.5,  juz: 13, startPage: 255, endPage: 261 },
  { num: 15,  name: 'الحجر',     ayahs: 99,  pages: 5.5,  juz: 14, startPage: 262, endPage: 267 },
  { num: 16,  name: 'النحل',     ayahs: 128, pages: 14.5, juz: 14, startPage: 267, endPage: 281 },
  { num: 17,  name: 'الإسراء',   ayahs: 111, pages: 11.5, juz: 15, startPage: 282, endPage: 293 },
  { num: 18,  name: 'الكهف',     ayahs: 110, pages: 11.5, juz: 15, startPage: 293, endPage: 304 },
  { num: 19,  name: 'مريم',      ayahs: 98,  pages: 7.5,  juz: 16, startPage: 305, endPage: 312 },
  { num: 20,  name: 'طه',        ayahs: 135, pages: 9.5,  juz: 16, startPage: 312, endPage: 321 },
  { num: 21,  name: 'الأنبياء',  ayahs: 112, pages: 10,   juz: 17, startPage: 322, endPage: 331 },
  { num: 22,  name: 'الحج',      ayahs: 78,  pages: 10,   juz: 17, startPage: 332, endPage: 341 },
  { num: 23,  name: 'المؤمنون',  ayahs: 118, pages: 8,    juz: 18, startPage: 342, endPage: 349 },
  { num: 24,  name: 'النور',     ayahs: 64,  pages: 9.5,  juz: 18, startPage: 350, endPage: 359 },
  { num: 25,  name: 'الفرقان',   ayahs: 77,  pages: 7.5,  juz: 18, startPage: 359, endPage: 366 },
  { num: 26,  name: 'الشعراء',   ayahs: 227, pages: 10,   juz: 19, startPage: 367, endPage: 376 },
  { num: 27,  name: 'النمل',     ayahs: 93,  pages: 8.5,  juz: 19, startPage: 377, endPage: 385 },
  { num: 28,  name: 'القصص',     ayahs: 88,  pages: 11,   juz: 20, startPage: 385, endPage: 396 },
  { num: 29,  name: 'العنكبوت',  ayahs: 69,  pages: 8,    juz: 20, startPage: 396, endPage: 404 },
  { num: 30,  name: 'الروم',     ayahs: 60,  pages: 6.5,  juz: 21, startPage: 404, endPage: 410 },
  { num: 31,  name: 'لقمان',     ayahs: 34,  pages: 4,    juz: 21, startPage: 411, endPage: 414 },
  { num: 32,  name: 'السجدة',    ayahs: 30,  pages: 3,    juz: 21, startPage: 415, endPage: 417 },
  { num: 33,  name: 'الأحزاب',   ayahs: 73,  pages: 10,   juz: 21, startPage: 418, endPage: 427 },
  { num: 34,  name: 'سبأ',       ayahs: 54,  pages: 6.5,  juz: 22, startPage: 428, endPage: 434 },
  { num: 35,  name: 'فاطر',      ayahs: 45,  pages: 6,    juz: 22, startPage: 434, endPage: 440 },
  { num: 36,  name: 'يس',        ayahs: 83,  pages: 5.5,  juz: 22, startPage: 440, endPage: 445 },
  { num: 37,  name: 'الصافات',   ayahs: 182, pages: 7,    juz: 23, startPage: 446, endPage: 452 },
  { num: 38,  name: 'ص',         ayahs: 88,  pages: 5.5,  juz: 23, startPage: 453, endPage: 458 },
  { num: 39,  name: 'الزمر',     ayahs: 75,  pages: 9,    juz: 23, startPage: 458, endPage: 467 },
  { num: 40,  name: 'غافر',      ayahs: 85,  pages: 9.5,  juz: 24, startPage: 467, endPage: 476 },
  { num: 41,  name: 'فصلت',      ayahs: 54,  pages: 6,    juz: 24, startPage: 477, endPage: 482 },
  { num: 42,  name: 'الشورى',    ayahs: 53,  pages: 6.5,  juz: 25, startPage: 483, endPage: 489 },
  { num: 43,  name: 'الزخرف',    ayahs: 89,  pages: 6.5,  juz: 25, startPage: 489, endPage: 495 },
  { num: 44,  name: 'الدخان',    ayahs: 59,  pages: 3,    juz: 25, startPage: 496, endPage: 498 },
  { num: 45,  name: 'الجاثية',   ayahs: 37,  pages: 3.5,  juz: 25, startPage: 499, endPage: 502 },
  { num: 46,  name: 'الأحقاف',   ayahs: 35,  pages: 4.5,  juz: 26, startPage: 502, endPage: 506 },
  { num: 47,  name: 'محمد',      ayahs: 38,  pages: 4,    juz: 26, startPage: 507, endPage: 510 },
  { num: 48,  name: 'الفتح',     ayahs: 29,  pages: 4.5,  juz: 26, startPage: 511, endPage: 515 },
  { num: 49,  name: 'الحجرات',   ayahs: 18,  pages: 2.5,  juz: 26, startPage: 515, endPage: 517 },
  { num: 50,  name: 'ق',         ayahs: 45,  pages: 2.5,  juz: 26, startPage: 518, endPage: 520 },
  { num: 51,  name: 'الذاريات',  ayahs: 60,  pages: 3,    juz: 26, startPage: 520, endPage: 523 },
  { num: 52,  name: 'الطور',     ayahs: 49,  pages: 2.5,  juz: 27, startPage: 523, endPage: 525 },
  { num: 53,  name: 'النجم',     ayahs: 62,  pages: 2.5,  juz: 27, startPage: 526, endPage: 528 },
  { num: 54,  name: 'القمر',     ayahs: 55,  pages: 3,    juz: 27, startPage: 528, endPage: 531 },
  { num: 55,  name: 'الرحمن',    ayahs: 78,  pages: 3,    juz: 27, startPage: 531, endPage: 534 },
  { num: 56,  name: 'الواقعة',   ayahs: 96,  pages: 3.5,  juz: 27, startPage: 534, endPage: 537 },
  { num: 57,  name: 'الحديد',    ayahs: 29,  pages: 4.5,  juz: 27, startPage: 537, endPage: 541 },
  { num: 58,  name: 'المجادلة',  ayahs: 22,  pages: 3.5,  juz: 28, startPage: 542, endPage: 545 },
  { num: 59,  name: 'الحشر',     ayahs: 24,  pages: 3.5,  juz: 28, startPage: 545, endPage: 548 },
  { num: 60,  name: 'الممتحنة',  ayahs: 13,  pages: 2.5,  juz: 28, startPage: 549, endPage: 551 },
  { num: 61,  name: 'الصف',      ayahs: 14,  pages: 1.5,  juz: 28, startPage: 551, endPage: 552 },
  { num: 62,  name: 'الجمعة',    ayahs: 11,  pages: 1.5,  juz: 28, startPage: 553, endPage: 554 },
  { num: 63,  name: 'المنافقون', ayahs: 11,  pages: 1.5,  juz: 28, startPage: 554, endPage: 555 },
  { num: 64,  name: 'التغابن',   ayahs: 18,  pages: 2,    juz: 28, startPage: 556, endPage: 557 },
  { num: 65,  name: 'الطلاق',    ayahs: 12,  pages: 2,    juz: 28, startPage: 558, endPage: 559 },
  { num: 66,  name: 'التحريم',   ayahs: 12,  pages: 2,    juz: 28, startPage: 560, endPage: 561 },
  { num: 67,  name: 'الملك',     ayahs: 30,  pages: 2.5,  juz: 29, startPage: 562, endPage: 564 },
  { num: 68,  name: 'القلم',     ayahs: 52,  pages: 2,    juz: 29, startPage: 564, endPage: 566 },
  { num: 69,  name: 'الحاقة',    ayahs: 52,  pages: 2,    juz: 29, startPage: 566, endPage: 568 },
  { num: 70,  name: 'المعارج',   ayahs: 44,  pages: 2,    juz: 29, startPage: 568, endPage: 570 },
  { num: 71,  name: 'نوح',       ayahs: 28,  pages: 1.5,  juz: 29, startPage: 570, endPage: 571 },
  { num: 72,  name: 'الجن',      ayahs: 28,  pages: 2,    juz: 29, startPage: 572, endPage: 573 },
  { num: 73,  name: 'المزمل',    ayahs: 20,  pages: 1.5,  juz: 29, startPage: 574, endPage: 575 },
  { num: 74,  name: 'المدثر',    ayahs: 56,  pages: 2,    juz: 29, startPage: 575, endPage: 577 },
  { num: 75,  name: 'القيامة',   ayahs: 40,  pages: 1,    juz: 29, startPage: 577, endPage: 578 },
  { num: 76,  name: 'الإنسان',   ayahs: 31,  pages: 2,    juz: 29, startPage: 578, endPage: 580 },
  { num: 77,  name: 'المرسلات',  ayahs: 50,  pages: 1.5,  juz: 29, startPage: 580, endPage: 581 },
  { num: 78,  name: 'النبأ',     ayahs: 40,  pages: 1.5,  juz: 30, startPage: 582, endPage: 583 },
  { num: 79,  name: 'النازعات',  ayahs: 46,  pages: 1.5,  juz: 30, startPage: 583, endPage: 584 },
  { num: 80,  name: 'عبس',       ayahs: 42,  pages: 1,    juz: 30, startPage: 585, endPage: 585 },
  { num: 81,  name: 'التكوير',   ayahs: 29,  pages: 1,    juz: 30, startPage: 586, endPage: 586 },
  { num: 82,  name: 'الانفطار',  ayahs: 19,  pages: 0.75, juz: 30, startPage: 587, endPage: 587 },
  { num: 83,  name: 'المطففين',  ayahs: 36,  pages: 1.5,  juz: 30, startPage: 587, endPage: 589 },
  { num: 84,  name: 'الانشقاق',  ayahs: 25,  pages: 1,    juz: 30, startPage: 589, endPage: 590 },
  { num: 85,  name: 'البروج',    ayahs: 22,  pages: 1,    juz: 30, startPage: 590, endPage: 590 },
  { num: 86,  name: 'الطارق',    ayahs: 17,  pages: 0.5,  juz: 30, startPage: 591, endPage: 591 },
  { num: 87,  name: 'الأعلى',    ayahs: 19,  pages: 0.75, juz: 30, startPage: 591, endPage: 592 },
  { num: 88,  name: 'الغاشية',   ayahs: 26,  pages: 0.75, juz: 30, startPage: 592, endPage: 592 },
  { num: 89,  name: 'الفجر',     ayahs: 30,  pages: 1.25, juz: 30, startPage: 593, endPage: 594 },
  { num: 90,  name: 'البلد',     ayahs: 20,  pages: 0.75, juz: 30, startPage: 594, endPage: 594 },
  { num: 91,  name: 'الشمس',     ayahs: 15,  pages: 0.5,  juz: 30, startPage: 595, endPage: 595 },
  { num: 92,  name: 'الليل',     ayahs: 21,  pages: 0.75, juz: 30, startPage: 595, endPage: 596 },
  { num: 93,  name: 'الضحى',     ayahs: 11,  pages: 0.5,  juz: 30, startPage: 596, endPage: 596 },
  { num: 94,  name: 'الشرح',     ayahs: 8,   pages: 0.25, juz: 30, startPage: 596, endPage: 596 },
  { num: 95,  name: 'التين',     ayahs: 8,   pages: 0.25, juz: 30, startPage: 597, endPage: 597 },
  { num: 96,  name: 'العلق',     ayahs: 19,  pages: 0.75, juz: 30, startPage: 597, endPage: 597 },
  { num: 97,  name: 'القدر',     ayahs: 5,   pages: 0.25, juz: 30, startPage: 598, endPage: 598 },
  { num: 98,  name: 'البينة',    ayahs: 8,   pages: 0.75, juz: 30, startPage: 598, endPage: 599 },
  { num: 99,  name: 'الزلزلة',   ayahs: 8,   pages: 0.25, juz: 30, startPage: 599, endPage: 599 },
  { num: 100, name: 'العاديات',  ayahs: 11,  pages: 0.5,  juz: 30, startPage: 599, endPage: 600 },
  { num: 101, name: 'القارعة',   ayahs: 11,  pages: 0.25, juz: 30, startPage: 600, endPage: 600 },
  { num: 102, name: 'التكاثر',   ayahs: 8,   pages: 0.25, juz: 30, startPage: 600, endPage: 600 },
  { num: 103, name: 'العصر',     ayahs: 3,   pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 104, name: 'الهمزة',    ayahs: 9,   pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 105, name: 'الفيل',     ayahs: 5,   pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 106, name: 'قريش',      ayahs: 4,   pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 107, name: 'الماعون',   ayahs: 7,   pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 108, name: 'الكوثر',    ayahs: 3,   pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 109, name: 'الكافرون',  ayahs: 6,   pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 110, name: 'النصر',     ayahs: 3,   pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 111, name: 'المسد',     ayahs: 5,   pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 112, name: 'الإخلاص',   ayahs: 4,   pages: 0.25, juz: 30, startPage: 604, endPage: 604 },
  { num: 113, name: 'الفلق',     ayahs: 5,   pages: 0.25, juz: 30, startPage: 604, endPage: 604 },
  { num: 114, name: 'الناس',     ayahs: 6,   pages: 0.25, juz: 30, startPage: 604, endPage: 604 }
];

function getSurahByNum(num) {
  return SURAHS_DB.find((s) => s.num === Number(num)) || null;
}

function getSurahByName(name) {
  if (!name) return null;
  const clean = String(name).replace(/^سورة\s+/u, '').trim();
  return SURAHS_DB.find((s) => s.name === clean) || null;
}

function getJuzSurahs(juzNum) {
  const j = JUZ_DB.find((x) => x.num === Number(juzNum));
  if (!j) return [];
  return SURAHS_DB.filter((s) => s.startPage <= j.endPage && s.endPage >= j.startPage);
}

// خريطة معايرة دقيقة لنصيب كل سورة داخل كل جزء بحيث يساوي مجموع سور كل جزء totalPages بالضبط (إجمالي ٦٠٤ وجهاً)
const _JUZ_SURAH_EXACT_PAGES = {};
(function buildExactJuzPageMap() {
  JUZ_DB.forEach((j) => {
    const surahs = getJuzSurahs(j.num);
    const rawWeights = surahs.map((s) => {
      if (s.startPage >= j.startPage && s.endPage <= j.endPage) return s.pages;
      const overlapStart = Math.max(s.startPage, j.startPage);
      const overlapEnd = Math.min(s.endPage, j.endPage);
      return Math.min(s.pages, overlapEnd - overlapStart + 1);
    });
    const rawSum = rawWeights.reduce((a, b) => a + b, 0) || 1;
    const map = {};
    let running = 0;
    surahs.forEach((s, idx) => {
      if (idx === surahs.length - 1) {
        map[s.num] = Number(Math.max(0.05, j.totalPages - running).toFixed(2));
      } else {
        const scaled = Number(((rawWeights[idx] / rawSum) * j.totalPages).toFixed(2));
        map[s.num] = scaled;
        running = Number((running + scaled).toFixed(2));
      }
    });
    _JUZ_SURAH_EXACT_PAGES[j.num] = map;
  });
})();

function getSurahPagesInJuz(surah, juz) {
  if (!surah || !juz) return 0;
  const map = _JUZ_SURAH_EXACT_PAGES[juz.num];
  return (map && typeof map[surah.num] === 'number') ? map[surah.num] : 0;
}

// حساب عدد الأوجه التلقائي من نطاق الآيات (من آية ← إلى آية) مع التقريب لأقرب ربع وجه
function estimatePagesFromAyahs(surahNum, fromAyah, toAyah) {
  const s = getSurahByNum(surahNum);
  if (!s) return 1;
  const a1 = Math.max(1, Math.min(s.ayahs, parseInt(fromAyah, 10) || 1));
  const a2 = Math.max(a1, Math.min(s.ayahs, parseInt(toAyah, 10) || s.ayahs));
  const ratio = (a2 - a1 + 1) / s.ayahs;
  const raw = ratio * s.pages;
  const rounded = Math.round(raw * 4) / 4;
  return Math.max(0.25, Math.min(s.pages, Number(rounded.toFixed(2))));
}

// تحديد الجزء الفعلي الذي يقع فيه الحفظ الحالي للسور متعددة الأجزاء (مثل البقرة وآل عمران)
function getSurahJuzForLoggedPages(surahNum, loggedPages) {
  const s = getSurahByNum(surahNum);
  if (!s) return 1;
  const spannedJuzs = JUZ_DB.filter((j) => s.startPage <= j.endPage && s.endPage >= j.startPage);
  if (spannedJuzs.length <= 1) return s.juz;
  let acc = 0;
  const cur = Number(loggedPages || 0);
  for (const j of spannedJuzs) {
    acc += getSurahPagesInJuz(s, j);
    if (cur < acc - 0.05) return j.num;
  }
  return spannedJuzs[spannedJuzs.length - 1].num;
}
