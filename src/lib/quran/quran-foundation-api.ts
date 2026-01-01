/**
 * Quran Foundation API Integration
 * يستخدم OAuth2 للمصادقة ويوفر بيانات دقيقة للمصحف
 * 
 * Documentation: https://api-docs.quran.foundation/
 * OAuth2 Endpoint: https://oauth2.quran.foundation
 */

// OAuth2 Credentials
const OAUTH2_CONFIG = {
  clientId: process.env.QURAN_FOUNDATION_CLIENT_ID || 'd5e849c5-3de2-41fd-bca4-dfab00283a70',
  clientSecret: process.env.QURAN_FOUNDATION_CLIENT_SECRET || 'SSSJiGS0MjMtjnN4u0yRIv_Qc-',
  tokenEndpoint: 'https://oauth2.quran.foundation/oauth2/token',
  apiBaseUrl: 'https://api.quran.com/api/v4',
};

// Cache للـ Access Token
let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

/**
 * الحصول على Access Token باستخدام Client Credentials Flow
 */
export async function getAccessToken(): Promise<string> {
  // التحقق من صلاحية الـ token المخزن
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  const credentials = Buffer.from(
    `${OAUTH2_CONFIG.clientId}:${OAUTH2_CONFIG.clientSecret}`
  ).toString('base64');

  const response = await fetch(OAUTH2_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`فشل في الحصول على Access Token: ${response.status}`);
  }

  const data = await response.json();
  
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.access_token;
}

// Interfaces
export interface QFWord {
  id: number;
  position: number;
  text_uthmani: string;
  text_indopak?: string;
  line_number: number;
  char_type_name: 'word' | 'end' | 'pause';
  code_v1?: string;
  code_v2?: string;
  v1_page?: number;
  v2_page?: number;
  page_number: number;
  audio_url?: string;
  translation?: {
    text: string;
    language_name: string;
  };
  transliteration?: {
    text: string;
    language_name: string;
  };
}

export interface QFVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  chapter_id: number;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  text_uthmani?: string;
  text_indopak?: string;
  words?: QFWord[];
}

export interface QFPageResponse {
  verses: QFVerse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

export interface QFLine {
  line_number: number;
  words: QFWord[];
  is_surah_header?: boolean;
  is_bismillah?: boolean;
  surah_number?: number;
}

export interface QFPageLayout {
  page_number: number;
  juz_number: number;
  hizb_number: number;
  total_lines: number;
  lines: QFLine[];
  surah_starts: number[];
  first_verse: string;
  last_verse: string;
}

/**
 * جلب بيانات صفحة مع الكلمات وأرقام الأسطر
 */
export async function fetchPageWithLayout(
  pageNumber: number,
  useAuth: boolean = false
): Promise<QFPageLayout> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // استخدام OAuth2 إذا كان مطلوباً
  if (useAuth) {
    const token = await getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  // جلب جميع الآيات في الصفحة
  const url = new URL(`${OAUTH2_CONFIG.apiBaseUrl}/verses/by_page/${pageNumber}`);
  url.searchParams.set('words', 'true');
  url.searchParams.set('word_fields', 'text_uthmani,line_number,position,code_v2,v2_page,char_type_name');
  url.searchParams.set('per_page', '50'); // الحصول على جميع الآيات

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`فشل في جلب الصفحة ${pageNumber}: ${response.status}`);
  }

  const data: QFPageResponse = await response.json();
  
  return processPageData(data, pageNumber);
}

/**
 * معالجة بيانات الصفحة وتنظيمها حسب الأسطر
 */
function processPageData(data: QFPageResponse, pageNumber: number): QFPageLayout {
  const lines = new Map<number, QFWord[]>();
  const surahStarts: number[] = [];
  let juzNumber = 1;
  let hizbNumber = 1;
  let firstVerse = '';
  let lastVerse = '';
  let lastSurah = 0;

  for (const verse of data.verses) {
    const [surahNum, ayahNum] = verse.verse_key.split(':').map(Number);
    
    // تحديد الجزء والحزب
    juzNumber = verse.juz_number;
    hizbNumber = verse.hizb_number;
    
    // تحديد أول وآخر آية
    if (!firstVerse) firstVerse = verse.verse_key;
    lastVerse = verse.verse_key;
    
    // تحديد بداية سورة جديدة
    if (surahNum !== lastSurah && ayahNum === 1) {
      surahStarts.push(surahNum);
      lastSurah = surahNum;
    }

    // تنظيم الكلمات حسب السطر
    for (const word of verse.words || []) {
      const lineNum = word.line_number || 1;
      
      if (!lines.has(lineNum)) {
        lines.set(lineNum, []);
      }
      
      lines.get(lineNum)!.push(word);
    }
  }

  // تحويل إلى مصفوفة مرتبة
  const sortedLineNumbers = Array.from(lines.keys()).sort((a, b) => a - b);
  const processedLines: QFLine[] = sortedLineNumbers.map(lineNum => ({
    line_number: lineNum,
    words: lines.get(lineNum)!.sort((a, b) => a.position - b.position),
  }));

  return {
    page_number: pageNumber,
    juz_number: juzNumber,
    hizb_number: hizbNumber,
    total_lines: processedLines.length,
    lines: processedLines,
    surah_starts: surahStarts,
    first_verse: firstVerse,
    last_verse: lastVerse,
  };
}

/**
 * جلب معلومات السورة
 */
export async function fetchChapterInfo(chapterNumber: number): Promise<{
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
}> {
  const response = await fetch(
    `${OAUTH2_CONFIG.apiBaseUrl}/chapters/${chapterNumber}`,
    { headers: { 'Accept': 'application/json' } }
  );

  if (!response.ok) {
    throw new Error(`فشل في جلب معلومات السورة ${chapterNumber}`);
  }

  const data = await response.json();
  return data.chapter;
}

/**
 * جلب قائمة السور
 */
export async function fetchChaptersList(): Promise<Array<{
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  pages: number[];
}>> {
  const response = await fetch(
    `${OAUTH2_CONFIG.apiBaseUrl}/chapters`,
    { headers: { 'Accept': 'application/json' } }
  );

  if (!response.ok) {
    throw new Error('فشل في جلب قائمة السور');
  }

  const data = await response.json();
  return data.chapters;
}

/**
 * Constants
 */
export const TOTAL_PAGES = 604;
export const LINES_PER_PAGE = 15;

/**
 * الحصول على رابط صورة الصفحة
 */
export function getPageImageUrl(pageNumber: number, version: 'v1' | 'v2' = 'v2'): string {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `https://static.qurancdn.com/images/pages/v${version === 'v1' ? '1' : '2'}/${paddedPage}.png`;
}

/**
 * الحصول على رابط خط الصفحة (QCF)
 */
export function getPageFontUrl(pageNumber: number, version: 'v1' | 'v2' = 'v2'): string {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `https://fonts.qurancdn.com/v${version === 'v1' ? '1' : '2'}/woff2/p${paddedPage}.woff2`;
}


