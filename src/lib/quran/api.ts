/**
 * AlQuran Cloud API Service
 * Base URL: https://api.alquran.cloud/v1
 * Documentation: https://alquran.cloud/api
 */

const API_BASE_URL = "https://api.alquran.cloud/v1";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

/**
 * Fetch all Surahs (114 total)
 */
export async function fetchAllSurahs(): Promise<Surah[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/surah`);
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data as Surah[];
  } catch (error) {
    console.error("Error fetching surahs:", error);
    throw error;
  }
}

/**
 * Fetch a specific Surah with all its Ayahs
 */
export async function fetchSurah(surahNumber: number): Promise<SurahData> {
  try {
    const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch surah: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data as SurahData;
  } catch (error) {
    console.error(`Error fetching surah ${surahNumber}:`, error);
    throw error;
  }
}

/**
 * Fetch specific Ayahs from a Surah
 */
export async function fetchAyahs(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<Ayah[]> {
  try {
    const surahData = await fetchSurah(surahNumber);
    
    // Filter ayahs within the range
    const ayahs = surahData.ayahs.filter(
      (ayah) => ayah.numberInSurah >= startAyah && ayah.numberInSurah <= endAyah
    );
    
    return ayahs;
  } catch (error) {
    console.error(`Error fetching ayahs ${surahNumber}:${startAyah}-${endAyah}:`, error);
    throw error;
  }
}

/**
 * Fetch a single Ayah
 */
export async function fetchAyah(surahNumber: number, ayahNumber: number): Promise<Ayah> {
  try {
    // Calculate global ayah number (reference)
    // This is a simplified calculation - for production, use a lookup table
    const response = await fetch(`${API_BASE_URL}/ayah/${surahNumber}:${ayahNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ayah: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data as Ayah;
  } catch (error) {
    console.error(`Error fetching ayah ${surahNumber}:${ayahNumber}:`, error);
    throw error;
  }
}

/**
 * Get Bismillah text
 */
export function getBismillah(): string {
  return "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
}

/**
 * Format Ayah text with symbol
 * The number should appear INSIDE the decorative symbol
 */
export function formatAyahWithSymbol(text: string, ayahNumber: number, symbol: string): string {
  if (!symbol) return text;
  
  // Convert number to Arabic-Indic numerals
  const arabicNumber = convertToArabicNumerals(ayahNumber);
  
  // Format: text + space + ﴿number﴾ (using Arabic decorative brackets)
  return `${text} ﴿${arabicNumber}﴾`;
}

/**
 * Convert number to Arabic-Indic numerals
 */
function convertToArabicNumerals(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('');
}

/**
 * Check if Ayah has Sajda
 */
export function hasSajda(ayah: Ayah): boolean {
  if (typeof ayah.sajda === "boolean") {
    return ayah.sajda;
  }
  // If it's an object, it means there is a sajda
  return !!ayah.sajda;
}

/**
 * Check if Surah needs Bismillah at the beginning
 * All surahs start with Bismillah except:
 * - Surah 1 (Al-Fatiha): Bismillah is part of the first ayah
 * - Surah 9 (At-Tawbah): No Bismillah at all
 */
export function needsBismillah(surahNumber: number, startAyah: number): boolean {
  // If not starting from the beginning, no Bismillah needed
  if (startAyah !== 1) return false;
  
  // Surah 1 (Al-Fatiha) - Bismillah is the first ayah
  if (surahNumber === 1) return false;
  
  // Surah 9 (At-Tawbah) - No Bismillah
  if (surahNumber === 9) return false;
  
  // All other surahs starting from ayah 1 need Bismillah
  return true;
}

/**
 * Get Arabic name of Surah
 */
export function getSurahNameAr(surahNumber: number): string {
  const names: Record<number, string> = {
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
    81: "التكوير", 82: "الإنفطار", 83: "المطففين", 84: "الإنشقاق", 85: "البروج",
    86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
    91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
    96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
    101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
    106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
    111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
  };
  return names[surahNumber] || `سورة ${surahNumber}`;
}
