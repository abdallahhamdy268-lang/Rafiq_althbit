// رفيق التثبيت v6 — قاعدة البيانات الكاملة (١١٤ سورة + ٣٠ جزءاً + باليتات الألوان)

const THEMES = [
  {
    id: 'royal',
    name: 'الكحلي الملكي والذهبي',
    desc: 'الهوية الافتراضية • تركيز عالٍ',
    mode: 'dark',
    meta: '#00112B',
    swatches: ['#00112B', '#071C3B', '#D0A151', '#EFC879']
  },
  {
    id: 'emerald',
    name: 'الزمردي والعاجي',
    desc: 'بطابع المصحف الكلاسيكي',
    mode: 'dark',
    meta: '#051D17',
    swatches: ['#051D17', '#0A2B23', '#CFA658', '#EED48E']
  },
  {
    id: 'amoled',
    name: 'الليلي الفحمي (AMOLED)',
    desc: 'هادئ للعين وموفّر للبطارية',
    mode: 'dark',
    meta: '#07080B',
    swatches: ['#07080B', '#111319', '#C89B62', '#E6BC84']
  },
  {
    id: 'olive',
    name: 'الزيتوني الهادئ',
    desc: 'داكن دافئ ومريح للقراءة الطويلة',
    mode: 'dark',
    meta: '#121B17',
    swatches: ['#121B17', '#1B2822', '#C6A868', '#E5CE95']
  },
  {
    id: 'mushaf',
    name: 'الورق الدافئ (نهاري)',
    desc: 'فاتح مريح للعين في ضوء النهار',
    mode: 'light',
    meta: '#F5F0E4',
    swatches: ['#F5F0E4', '#FFFDF8', '#1F4D3A', '#B0863B']
  },
  {
    id: 'sky',
    name: 'النهاري الصافي',
    desc: 'فاتح نقي بتباين أزرق هادئ',
    mode: 'light',
    meta: '#F2F6FA',
    swatches: ['#F2F6FA', '#FFFFFF', '#1B4965', '#2D6A8E']
  },
  {
    id: 'sepia',
    name: 'المخطوط الكلاسيكي',
    desc: 'ورق عتيق دافئ بتباين عنّابي هادئ',
    mode: 'light',
    meta: '#F7EFE2',
    swatches: ['#F7EFE2', '#FFFBF4', '#6B3A2A', '#9A5B3E']
  }
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

// قاعدة بيانات الأجزاء الـ ٣٠ حسب مصحف المدينة النبوية (٦٠٤ صفحات)
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

// قاعدة بيانات الـ ١١٤ سورة كاملة حسب مصحف المدينة النبوية (٦٠٤ صفحات)
// num: رقم السورة | name: اسم السورة | pages: عدد أوجهها | juz: الجزء التابع لها | startPage / endPage: نطاق الصفحات
const SURAHS_DB = [
  { num: 1,   name: 'الفاتحة',   pages: 1,    juz: 1,  startPage: 1,   endPage: 1 },
  { num: 2,   name: 'البقرة',    pages: 48,   juz: 1,  startPage: 2,   endPage: 49 },
  { num: 3,   name: 'آل عمران',  pages: 27,   juz: 3,  startPage: 50,  endPage: 76 },
  { num: 4,   name: 'النساء',    pages: 29.5, juz: 4,  startPage: 77,  endPage: 106 },
  { num: 5,   name: 'المائدة',   pages: 21.5, juz: 6,  startPage: 106, endPage: 127 },
  { num: 6,   name: 'الأنعام',   pages: 23,   juz: 7,  startPage: 128, endPage: 150 },
  { num: 7,   name: 'الأعراف',   pages: 26,   juz: 8,  startPage: 151, endPage: 176 },
  { num: 8,   name: 'الأنفال',   pages: 10,   juz: 9,  startPage: 177, endPage: 186 },
  { num: 9,   name: 'التوبة',    pages: 21,   juz: 10, startPage: 187, endPage: 207 },
  { num: 10,  name: 'يونس',      pages: 13.5, juz: 11, startPage: 208, endPage: 221 },
  { num: 11,  name: 'هود',       pages: 14,   juz: 11, startPage: 221, endPage: 235 },
  { num: 12,  name: 'يوسف',      pages: 13.5, juz: 12, startPage: 235, endPage: 248 },
  { num: 13,  name: 'الرعد',     pages: 6.5,  juz: 13, startPage: 249, endPage: 255 },
  { num: 14,  name: 'إبراهيم',   pages: 6.5,  juz: 13, startPage: 255, endPage: 261 },
  { num: 15,  name: 'الحجر',     pages: 5.5,  juz: 14, startPage: 262, endPage: 267 },
  { num: 16,  name: 'النحل',     pages: 14.5, juz: 14, startPage: 267, endPage: 281 },
  { num: 17,  name: 'الإسراء',   pages: 11.5, juz: 15, startPage: 282, endPage: 293 },
  { num: 18,  name: 'الكهف',     pages: 11.5, juz: 15, startPage: 293, endPage: 304 },
  { num: 19,  name: 'مريم',      pages: 7.5,  juz: 16, startPage: 305, endPage: 312 },
  { num: 20,  name: 'طه',        pages: 9.5,  juz: 16, startPage: 312, endPage: 321 },
  { num: 21,  name: 'الأنبياء',  pages: 10,   juz: 17, startPage: 322, endPage: 331 },
  { num: 22,  name: 'الحج',      pages: 10,   juz: 17, startPage: 332, endPage: 341 },
  { num: 23,  name: 'المؤمنون',  pages: 8,    juz: 18, startPage: 342, endPage: 349 },
  { num: 24,  name: 'النور',     pages: 9.5,  juz: 18, startPage: 350, endPage: 359 },
  { num: 25,  name: 'الفرقان',   pages: 7.5,  juz: 18, startPage: 359, endPage: 366 },
  { num: 26,  name: 'الشعراء',   pages: 10,   juz: 19, startPage: 367, endPage: 376 },
  { num: 27,  name: 'النمل',     pages: 8.5,  juz: 19, startPage: 377, endPage: 385 },
  { num: 28,  name: 'القصص',     pages: 11,   juz: 20, startPage: 385, endPage: 396 },
  { num: 29,  name: 'العنكبوت',  pages: 8,    juz: 20, startPage: 396, endPage: 404 },
  { num: 30,  name: 'الروم',     pages: 6.5,  juz: 21, startPage: 404, endPage: 410 },
  { num: 31,  name: 'لقمان',     pages: 4,    juz: 21, startPage: 411, endPage: 414 },
  { num: 32,  name: 'السجدة',    pages: 3,    juz: 21, startPage: 415, endPage: 417 },
  { num: 33,  name: 'الأحزاب',   pages: 10,   juz: 21, startPage: 418, endPage: 427 },
  { num: 34,  name: 'سبأ',       pages: 6.5,  juz: 22, startPage: 428, endPage: 434 },
  { num: 35,  name: 'فاطر',      pages: 6,    juz: 22, startPage: 434, endPage: 440 },
  { num: 36,  name: 'يس',        pages: 5.5,  juz: 22, startPage: 440, endPage: 445 },
  { num: 37,  name: 'الصافات',   pages: 7,    juz: 23, startPage: 446, endPage: 452 },
  { num: 38,  name: 'ص',         pages: 5.5,  juz: 23, startPage: 453, endPage: 458 },
  { num: 39,  name: 'الزمر',     pages: 9,    juz: 23, startPage: 458, endPage: 467 },
  { num: 40,  name: 'غافر',      pages: 9.5,  juz: 24, startPage: 467, endPage: 476 },
  { num: 41,  name: 'فصلت',      pages: 6,    juz: 24, startPage: 477, endPage: 482 },
  { num: 42,  name: 'الشورى',    pages: 6.5,  juz: 25, startPage: 483, endPage: 489 },
  { num: 43,  name: 'الزخرف',    pages: 6.5,  juz: 25, startPage: 489, endPage: 495 },
  { num: 44,  name: 'الدخان',    pages: 3,    juz: 25, startPage: 496, endPage: 498 },
  { num: 45,  name: 'الجاثية',   pages: 3.5,  juz: 25, startPage: 499, endPage: 502 },
  { num: 46,  name: 'الأحقاف',   pages: 4.5,  juz: 26, startPage: 502, endPage: 506 },
  { num: 47,  name: 'محمد',      pages: 4,    juz: 26, startPage: 507, endPage: 510 },
  { num: 48,  name: 'الفتح',     pages: 4.5,  juz: 26, startPage: 511, endPage: 515 },
  { num: 49,  name: 'الحجرات',   pages: 2.5,  juz: 26, startPage: 515, endPage: 517 },
  { num: 50,  name: 'ق',         pages: 2.5,  juz: 26, startPage: 518, endPage: 520 },
  { num: 51,  name: 'الذاريات',  pages: 3,    juz: 26, startPage: 520, endPage: 523 },
  { num: 52,  name: 'الطور',     pages: 2.5,  juz: 27, startPage: 523, endPage: 525 },
  { num: 53,  name: 'النجم',     pages: 2.5,  juz: 27, startPage: 526, endPage: 528 },
  { num: 54,  name: 'القمر',     pages: 3,    juz: 27, startPage: 528, endPage: 531 },
  { num: 55,  name: 'الرحمن',    pages: 3,    juz: 27, startPage: 531, endPage: 534 },
  { num: 56,  name: 'الواقعة',   pages: 3.5,  juz: 27, startPage: 534, endPage: 537 },
  { num: 57,  name: 'الحديد',    pages: 4.5,  juz: 27, startPage: 537, endPage: 541 },
  { num: 58,  name: 'المجادلة',  pages: 3.5,  juz: 28, startPage: 542, endPage: 545 },
  { num: 59,  name: 'الحشر',     pages: 3.5,  juz: 28, startPage: 545, endPage: 548 },
  { num: 60,  name: 'الممتحنة',  pages: 2.5,  juz: 28, startPage: 549, endPage: 551 },
  { num: 61,  name: 'الصف',      pages: 1.5,  juz: 28, startPage: 551, endPage: 552 },
  { num: 62,  name: 'الجمعة',    pages: 1.5,  juz: 28, startPage: 553, endPage: 554 },
  { num: 63,  name: 'المنافقون', pages: 1.5,  juz: 28, startPage: 554, endPage: 555 },
  { num: 64,  name: 'التغابن',   pages: 2,    juz: 28, startPage: 556, endPage: 557 },
  { num: 65,  name: 'الطلاق',    pages: 2,    juz: 28, startPage: 558, endPage: 559 },
  { num: 66,  name: 'التحريم',   pages: 2,    juz: 28, startPage: 560, endPage: 561 },
  { num: 67,  name: 'الملك',     pages: 2.5,  juz: 29, startPage: 562, endPage: 564 },
  { num: 68,  name: 'القلم',     pages: 2,    juz: 29, startPage: 564, endPage: 566 },
  { num: 69,  name: 'الحاقة',    pages: 2,    juz: 29, startPage: 566, endPage: 568 },
  { num: 70,  name: 'المعارج',   pages: 2,    juz: 29, startPage: 568, endPage: 570 },
  { num: 71,  name: 'نوح',       pages: 1.5,  juz: 29, startPage: 570, endPage: 571 },
  { num: 72,  name: 'الجن',      pages: 2,    juz: 29, startPage: 572, endPage: 573 },
  { num: 73,  name: 'المزمل',    pages: 1.5,  juz: 29, startPage: 574, endPage: 575 },
  { num: 74,  name: 'المدثر',    pages: 2,    juz: 29, startPage: 575, endPage: 577 },
  { num: 75,  name: 'القيامة',   pages: 1,    juz: 29, startPage: 577, endPage: 578 },
  { num: 76,  name: 'الإنسان',   pages: 2,    juz: 29, startPage: 578, endPage: 580 },
  { num: 77,  name: 'المرسلات',  pages: 1.5,  juz: 29, startPage: 580, endPage: 581 },
  { num: 78,  name: 'النبأ',     pages: 1.5,  juz: 30, startPage: 582, endPage: 583 },
  { num: 79,  name: 'النازعات',  pages: 1.5,  juz: 30, startPage: 583, endPage: 584 },
  { num: 80,  name: 'عبس',       pages: 1,    juz: 30, startPage: 585, endPage: 585 },
  { num: 81,  name: 'التكوير',   pages: 1,    juz: 30, startPage: 586, endPage: 586 },
  { num: 82,  name: 'الانفطار',  pages: 0.75, juz: 30, startPage: 587, endPage: 587 },
  { num: 83,  name: 'المطففين',  pages: 1.5,  juz: 30, startPage: 587, endPage: 589 },
  { num: 84,  name: 'الانشقاق',  pages: 1,    juz: 30, startPage: 589, endPage: 590 },
  { num: 85,  name: 'البروج',    pages: 1,    juz: 30, startPage: 590, endPage: 590 },
  { num: 86,  name: 'الطارق',    pages: 0.5,  juz: 30, startPage: 591, endPage: 591 },
  { num: 87,  name: 'الأعلى',    pages: 0.75, juz: 30, startPage: 591, endPage: 592 },
  { num: 88,  name: 'الغاشية',   pages: 0.75, juz: 30, startPage: 592, endPage: 592 },
  { num: 89,  name: 'الفجر',     pages: 1.25, juz: 30, startPage: 593, endPage: 594 },
  { num: 90,  name: 'البلد',     pages: 0.75, juz: 30, startPage: 594, endPage: 594 },
  { num: 91,  name: 'الشمس',     pages: 0.5,  juz: 30, startPage: 595, endPage: 595 },
  { num: 92,  name: 'الليل',     pages: 0.75, juz: 30, startPage: 595, endPage: 596 },
  { num: 93,  name: 'الضحى',     pages: 0.5,  juz: 30, startPage: 596, endPage: 596 },
  { num: 94,  name: 'الشرح',     pages: 0.25, juz: 30, startPage: 596, endPage: 596 },
  { num: 95,  name: 'التين',     pages: 0.25, juz: 30, startPage: 597, endPage: 597 },
  { num: 96,  name: 'العلق',     pages: 0.75, juz: 30, startPage: 597, endPage: 597 },
  { num: 97,  name: 'القدر',     pages: 0.25, juz: 30, startPage: 598, endPage: 598 },
  { num: 98,  name: 'البينة',    pages: 0.75, juz: 30, startPage: 598, endPage: 599 },
  { num: 99,  name: 'الزلزلة',   pages: 0.25, juz: 30, startPage: 599, endPage: 599 },
  { num: 100, name: 'العاديات',  pages: 0.5,  juz: 30, startPage: 599, endPage: 600 },
  { num: 101, name: 'القارعة',   pages: 0.25, juz: 30, startPage: 600, endPage: 600 },
  { num: 102, name: 'التكاثر',   pages: 0.25, juz: 30, startPage: 600, endPage: 600 },
  { num: 103, name: 'العصر',     pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 104, name: 'الهمزة',    pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 105, name: 'الفيل',     pages: 0.25, juz: 30, startPage: 601, endPage: 601 },
  { num: 106, name: 'قريش',      pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 107, name: 'الماعون',   pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 108, name: 'الكوثر',    pages: 0.25, juz: 30, startPage: 602, endPage: 602 },
  { num: 109, name: 'الكافرون',  pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 110, name: 'النصر',     pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 111, name: 'المسد',     pages: 0.25, juz: 30, startPage: 603, endPage: 603 },
  { num: 112, name: 'الإخلاص',   pages: 0.25, juz: 30, startPage: 604, endPage: 604 },
  { num: 113, name: 'الفلق',     pages: 0.25, juz: 30, startPage: 604, endPage: 604 },
  { num: 114, name: 'الناس',     pages: 0.25, juz: 30, startPage: 604, endPage: 604 }
];

// دوال مساعدة لقاعدة البيانات
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
  return SURAHS_DB.filter(
    (s) => s.startPage <= j.endPage && s.endPage >= j.startPage
  );
}

// حساب عدد الصفحات المتقاطعة بين سورة وجزء محدد
function getSurahPagesInJuz(surah, juz) {
  if (surah.endPage < juz.startPage || surah.startPage > juz.endPage) return 0;
  // إذا كانت السورة بالكامل داخل الجزء، نُرجع عدد صفحاتها الدقيق
  if (surah.startPage >= juz.startPage && surah.endPage <= juz.endPage) {
    return surah.pages;
  }
  const overlapStart = Math.max(surah.startPage, juz.startPage);
  const overlapEnd = Math.min(surah.endPage, juz.endPage);
  const rawSpan = overlapEnd - overlapStart + 1;
  return Math.min(surah.pages, rawSpan);
}
