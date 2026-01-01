/**
 * QUL (Quranic Universal Library) API Client
 * مكتبة للتعامل مع بيانات تخطيط المصحف من Tarteel.ai
 * 
 * المصدر: https://qul.tarteel.ai
 * يوفر: Layout Mapping, Word IDs, Glyph Codes, Line positions
 */

// أنواع البيانات
export interface MushafWord {
  id: number;
  word_id: string; // format: "surah:ayah:word" e.g., "1:1:1"
  text_uthmani: string;
  text_imlaei?: string;
  char_type: 'word' | 'end' | 'pause';
  line_number: number;
  page_number: number;
  position: number; // position within line
  verse_key: string;
  verse_id: number;
  // QCF V2 glyph code (if available)
  code_v2?: string;
}

export interface MushafLine {
  line_number: number;
  page_number: number;
  line_type: 'ayah' | 'surah_name' | 'bismillah' | 'basmala';
  words: MushafWord[];
  // For surah_name lines
  surah_number?: number;
  surah_name?: string;
}

export interface MushafPage {
  page_number: number;
  lines: MushafLine[];
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  // Surahs that appear on this page
  surahs: {
    surah_number: number;
    surah_name: string;
    bismillah_pre: boolean;
  }[];
}

export interface PageLayoutResponse {
  success: boolean;
  data: MushafPage;
}

// Constants
export const TOTAL_PAGES = 604;
export const LINES_PER_PAGE = 15;
export const TOTAL_SURAHS = 114;

// QCF V2 Font URL pattern
export const QCF_FONT_URL_PATTERN = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p{page}.woff2';

/**
 * Get QCF V2 font URL for a specific page
 */
export function getPageFontUrl(pageNumber: number): string {
  const paddedPage = pageNumber.toString().padStart(3, '0');
  return `https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${paddedPage}.woff2`;
}

/**
 * عنوان API المحلي لبيانات QUL
 * يجب تشغيل: node scripts/serve-local-api.js
 */
const LOCAL_QUL_API = 'http://localhost:3001';

/**
 * Fetch page layout from Local QUL API (الأولوية) or Quran.com API (fallback)
 * يستخدم بيانات QUL المحلية التي تتطابق مع المصحف المطبوع
 */
export async function fetchPageLayout(pageNumber: number): Promise<MushafPage | null> {
  // محاولة جلب البيانات من API المحلي أولاً
  try {
    const localResponse = await fetch(
      `${LOCAL_QUL_API}/api/v4/verses/by_page/${pageNumber}`,
      { signal: AbortSignal.timeout(3000) } // timeout 3 ثواني
    );
    
    if (localResponse.ok) {
      const data = await localResponse.json();
      console.log(`✅ Using local QUL API for page ${pageNumber}`);
      return transformApiResponse(pageNumber, data);
    }
  } catch (error) {
    console.log(`⚠️ Local QUL API not available, falling back to Quran.com`);
  }
  
  // Fallback to Quran.com API
  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?` +
      `words=true&word_fields=text_uthmani,code_v2,line_number,position&` +
      `fields=text_uthmani,verse_key`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page ${pageNumber}`);
    }
    
    const data = await response.json();
    console.log(`📡 Using Quran.com API for page ${pageNumber}`);
    return transformApiResponse(pageNumber, data);
  } catch (error) {
    console.error(`Error fetching page layout for page ${pageNumber}:`, error);
    return null;
  }
}

/**
 * تحويل استجابة API إلى تنسيق MushafPage
 * النسخة 2.0 - تستخدم line_number الدقيق من Quran.com API
 */
function transformApiResponse(pageNumber: number, data: any): MushafPage {
  const lines: MushafLine[] = [];
  const lineMap = new Map<number, MushafWord[]>();
  const surahsOnPage = new Set<number>();
  
  // استخدام meta من API
  const meta = data.meta || {};
  const surahStarts = meta.surah_starts || [];
  
  // تحديد أرقام أسطر بدايات السور (اسم السورة والبسملة)
  const surahNameLines = new Map<number, number>(); // lineNum -> surahNum
  const bismillahLines = new Map<number, number>(); // lineNum -> surahNum
  
  // Process each verse
  for (const verse of data.verses || []) {
    const [surahNum, ayahNum] = verse.verse_key.split(':').map(Number);
    surahsOnPage.add(surahNum);
    
    // Process each word in the verse
    for (const word of verse.words || []) {
      const lineNum = word.line_number || 1;
      
      if (!lineMap.has(lineNum)) {
        lineMap.set(lineNum, []);
      }
      
      const mushafWord: MushafWord = {
        id: word.id || 0,
        word_id: `${verse.verse_key}:${word.position}`,
        text_uthmani: word.text_uthmani || word.text || '',
        char_type: word.char_type_name === 'end' ? 'end' : 
                   word.char_type_name === 'pause' ? 'pause' : 'word',
        line_number: lineNum,
        page_number: pageNumber,
        position: word.position || 0,
        verse_key: verse.verse_key,
        verse_id: verse.id || 0,
        code_v2: word.code_v2,
      };
      
      lineMap.get(lineNum)!.push(mushafWord);
    }
  }
  
  // تحديد أسطر اسم السورة والبسملة بناءً على surah_starts
  // surah_starts قد تكون مصفوفة أرقام [78] أو كائنات [{surah: 78, line: 3}]
  for (const start of surahStarts) {
    let surahNum: number;
    let firstTextLine: number | undefined;
    
    if (typeof start === 'number') {
      // مصفوفة أرقام - نحتاج إيجاد أول سطر يحتوي على آيات من هذه السورة
      surahNum = start;
      // البحث عن أول سطر يحتوي على آيات من هذه السورة
      for (const [lineNum, words] of lineMap.entries()) {
        const hasVerseFromSurah = words.some(w => {
          const [s] = w.verse_key.split(':').map(Number);
          return s === surahNum;
        });
        if (hasVerseFromSurah) {
          firstTextLine = lineNum;
          break;
        }
      }
    } else {
      // كائن
      surahNum = start.surah;
      firstTextLine = start.line;
    }
    
    if (firstTextLine && firstTextLine > 0) {
      // سورة التوبة ليس لها بسملة
      if (surahNum === 9) {
        // فقط سطر اسم السورة
        surahNameLines.set(firstTextLine - 1, surahNum);
      } else {
        // سطر اسم السورة + سطر البسملة
        surahNameLines.set(firstTextLine - 2, surahNum);
        bismillahLines.set(firstTextLine - 1, surahNum);
      }
    }
  }
  
  // Convert map to array of lines
  // نحتاج للتعامل مع الأسطر من 1 إلى 15
  for (let i = 1; i <= LINES_PER_PAGE; i++) {
    const words = lineMap.get(i) || [];
    
    // Sort words by verse_key first, then by position within verse
    words.sort((a, b) => {
      const [surahA, ayahA] = a.verse_key.split(':').map(Number);
      const [surahB, ayahB] = b.verse_key.split(':').map(Number);
      
      if (surahA !== surahB) return surahA - surahB;
      if (ayahA !== ayahB) return ayahA - ayahB;
      return a.position - b.position;
    });
    
    // تحديد نوع السطر
    let lineType: 'ayah' | 'surah_name' | 'bismillah' | 'basmala' = 'ayah';
    let surahNumber: number | undefined;
    
    if (surahNameLines.has(i)) {
      lineType = 'surah_name';
      surahNumber = surahNameLines.get(i);
    } else if (bismillahLines.has(i)) {
      lineType = 'bismillah';
      surahNumber = bismillahLines.get(i);
    }
    
    lines.push({
      line_number: i,
      page_number: pageNumber,
      line_type: lineType,
      words,
      surah_number: surahNumber,
    });
  }
  
  // استخدام metadata من API
  const juzNumber = meta.juz_number || data.verses?.[0]?.juz_number || Math.ceil(pageNumber / 20);
  const hizbNumber = meta.hizb_number || Math.ceil(pageNumber / 10);
  
  // تحديد السور التي تبدأ في هذه الصفحة
  const startingSurahs = new Set(surahStarts.map((s: any) => typeof s === 'number' ? s : s.surah));
  
  return {
    page_number: pageNumber,
    lines,
    juz_number: juzNumber,
    hizb_number: hizbNumber,
    rub_el_hizb_number: 1,
    surahs: Array.from(surahsOnPage).map(num => ({
      surah_number: num,
      surah_name: SURAH_NAMES[num] || `سورة ${num}`,
      bismillah_pre: startingSurahs.has(num) && num !== 1 && num !== 9,
    })),
  };
}

/**
 * Preload font for a specific page
 */
export async function preloadPageFont(pageNumber: number): Promise<boolean> {
  try {
    const fontUrl = getPageFontUrl(pageNumber);
    const fontFace = new FontFace(
      `qpc-page-${pageNumber}`,
      `url(${fontUrl})`,
      { display: 'swap' }
    );
    
    await fontFace.load();
    document.fonts.add(fontFace);
    return true;
  } catch (error) {
    console.error(`Failed to load font for page ${pageNumber}:`, error);
    return false;
  }
}

/**
 * Preload fonts for adjacent pages (current ± range)
 */
export async function preloadAdjacentFonts(
  currentPage: number, 
  range: number = 2
): Promise<void> {
  const pagesToLoad: number[] = [];
  
  for (let i = -range; i <= range; i++) {
    const page = currentPage + i;
    if (page >= 1 && page <= TOTAL_PAGES) {
      pagesToLoad.push(page);
    }
  }
  
  // Load fonts in parallel
  await Promise.all(pagesToLoad.map(preloadPageFont));
}

/**
 * Check if a page font is loaded
 */
export function isPageFontLoaded(pageNumber: number): boolean {
  return document.fonts.check(`12px qpc-page-${pageNumber}`);
}

// Surah names in Arabic
export const SURAH_NAMES: Record<number, string> = {
  1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
  6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
  11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
  21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
  26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
  31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
  36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
  41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
  46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
  51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
  56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
  61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
  66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
  71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
  76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
  81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
  86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
  91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
  96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
  101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
  106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
  111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس",
};

/**
 * Convert number to Arabic numerals
 */
export function toArabicNumber(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
}

