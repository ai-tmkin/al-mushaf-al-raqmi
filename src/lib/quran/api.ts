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
  return ayah.sajda !== false;
}
