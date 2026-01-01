/**
 * Quran.com API v4 Service
 * Base URL: https://api.quran.com/api/v4
 * Documentation: https://quran.api-docs.io/
 */

const API_BASE_URL = "https://api.quran.com/api/v4";

// Types
export interface Chapter {
  id: number;
  revelation_place: "makkah" | "madinah";
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  text_indopak?: string;
  words?: Word[];
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  text_indopak?: string;
  char_type_name: string;
  page_number: number;
  line_number: number;
}

export interface SearchResult {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results: SearchVerse[];
  };
}

export interface SearchVerse {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted?: string;
  words?: {
    char_type: string;
    text: string;
  }[];
}

export interface PageInfo {
  page_number: number;
  verses: Verse[];
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface Pagination {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

// API Response types
interface ChaptersResponse {
  chapters: Chapter[];
}

interface VersesResponse {
  verses: Verse[];
  pagination: Pagination;
}

interface ChapterResponse {
  chapter: Chapter;
}

// Cache for chapters (they don't change)
let chaptersCache: Chapter[] | null = null;

/**
 * Fetch all chapters (surahs)
 */
export async function fetchChapters(): Promise<Chapter[]> {
  if (chaptersCache) {
    return chaptersCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chapters?language=ar`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.statusText}`);
    }
    const data: ChaptersResponse = await response.json();
    chaptersCache = data.chapters;
    return data.chapters;
  } catch (error) {
    console.error("Error fetching chapters:", error);
    throw error;
  }
}

/**
 * Fetch a single chapter
 */
export async function fetchChapter(chapterId: number): Promise<Chapter> {
  try {
    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}?language=ar`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.statusText}`);
    }
    const data: ChapterResponse = await response.json();
    return data.chapter;
  } catch (error) {
    console.error(`Error fetching chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Fetch verses by chapter
 */
export async function fetchVersesByChapter(
  chapterId: number,
  page: number = 1,
  perPage: number = 50,
  textType: "text_uthmani" | "text_imlaei" = "text_uthmani"
): Promise<{ verses: Verse[]; pagination: Pagination }> {
  try {
    const params = new URLSearchParams({
      language: "ar",
      words: "false",
      page: page.toString(),
      per_page: perPage.toString(),
      fields: `${textType},verse_key,verse_number,page_number,juz_number,hizb_number,sajdah_number`,
    });

    const response = await fetch(
      `${API_BASE_URL}/verses/by_chapter/${chapterId}?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch verses: ${response.statusText}`);
    }
    const data: VersesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching verses for chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Fetch verses by page number
 */
export async function fetchVersesByPage(
  pageNumber: number,
  textType: "text_uthmani" | "text_imlaei" = "text_uthmani"
): Promise<Verse[]> {
  try {
    const params = new URLSearchParams({
      language: "ar",
      words: "false",
      fields: `${textType},verse_key,verse_number,page_number,juz_number,hizb_number,sajdah_number`,
    });

    const response = await fetch(
      `${API_BASE_URL}/verses/by_page/${pageNumber}?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch verses by page: ${response.statusText}`);
    }
    const data: VersesResponse = await response.json();
    return data.verses;
  } catch (error) {
    console.error(`Error fetching verses for page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Fetch verses by juz number
 */
export async function fetchVersesByJuz(
  juzNumber: number,
  page: number = 1,
  perPage: number = 50
): Promise<{ verses: Verse[]; pagination: Pagination }> {
  try {
    const params = new URLSearchParams({
      language: "ar",
      words: "false",
      page: page.toString(),
      per_page: perPage.toString(),
      fields: "text_uthmani,verse_key,verse_number,page_number,juz_number,hizb_number,sajdah_number",
    });

    const response = await fetch(
      `${API_BASE_URL}/verses/by_juz/${juzNumber}?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch verses by juz: ${response.statusText}`);
    }
    const data: VersesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching verses for juz ${juzNumber}:`, error);
    throw error;
  }
}

/**
 * Search verses
 */
export async function searchVerses(
  query: string,
  page: number = 1,
  perPage: number = 20,
  language: string = "ar"
): Promise<SearchResult> {
  try {
    const params = new URLSearchParams({
      q: query,
      size: perPage.toString(),
      page: page.toString(),
      language,
    });

    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to search verses: ${response.statusText}`);
    }
    const data: SearchResult = await response.json();
    return data;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    throw error;
  }
}

/**
 * Fetch all juz information
 */
export async function fetchJuzs(): Promise<Juz[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/juzs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch juzs: ${response.statusText}`);
    }
    const data = await response.json();
    return data.juzs;
  } catch (error) {
    console.error("Error fetching juzs:", error);
    throw error;
  }
}

/**
 * Get page image URL from Quran.com CDN
 * Available styles: v1, v2, warch, indopak
 */
export function getPageImageUrl(
  pageNumber: number,
  style: "v1" | "v2" | "warch" | "indopak" = "v2"
): string {
  const paddedPage = pageNumber.toString().padStart(3, "0");
  
  // Quran.com uses different CDN paths for different styles
  switch (style) {
    case "v1":
      return `https://static.qurancdn.com/images/pages/v1/page${paddedPage}.png`;
    case "v2":
      return `https://static.qurancdn.com/images/pages/v2/page${paddedPage}.png`;
    case "warch":
      return `https://static.qurancdn.com/images/pages/warch/page${paddedPage}.png`;
    case "indopak":
      return `https://static.qurancdn.com/images/pages/indopak/page${paddedPage}.png`;
    default:
      return `https://static.qurancdn.com/images/pages/v2/page${paddedPage}.png`;
  }
}

/**
 * Parse verse key (e.g., "2:255" -> { surah: 2, ayah: 255 })
 */
export function parseVerseKey(verseKey: string): { surah: number; ayah: number } {
  const [surah, ayah] = verseKey.split(":").map(Number);
  return { surah, ayah };
}

/**
 * Get chapter info by page number
 */
export async function getChaptersByPage(pageNumber: number): Promise<number[]> {
  const chapters = await fetchChapters();
  return chapters
    .filter((ch) => ch.pages.includes(pageNumber))
    .map((ch) => ch.id);
}

/**
 * Constants
 */
export const TOTAL_PAGES = 604;
export const TOTAL_CHAPTERS = 114;
export const TOTAL_JUZS = 30;
export const TOTAL_VERSES = 6236;

/**
 * Surah names in Arabic (for quick access without API call)
 */
export const SURAH_NAMES_AR: Record<number, string> = {
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
 * Juz names in Arabic
 */
export const JUZ_NAMES_AR: Record<number, string> = {
  1: "ألم", 2: "سيقول", 3: "تلك الرسل", 4: "لن تنالوا", 5: "والمحصنات",
  6: "لا يحب الله", 7: "وإذا سمعوا", 8: "ولو أننا", 9: "قال الملأ",
  10: "واعلموا", 11: "يعتذرون", 12: "وما من دابة", 13: "وما أبرئ",
  14: "ربما", 15: "سبحان الذي", 16: "قال ألم", 17: "اقترب للناس",
  18: "قد أفلح", 19: "وقال الذين", 20: "أمن خلق", 21: "اتل ما أوحي",
  22: "ومن يقنت", 23: "وما لي", 24: "فمن أظلم", 25: "إليه يرد",
  26: "حم", 27: "قال فما خطبكم", 28: "قد سمع الله", 29: "تبارك الذي",
  30: "عم",
};

