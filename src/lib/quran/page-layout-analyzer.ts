/**
 * Page Layout Analyzer
 * محلل تخطيط الصفحة لتحديد بدايات السور والبسملة وعدد السطور المتاحة
 */

import { MushafPage, MushafLine, MushafWord } from './qul-api';

export interface SurahStart {
  surahNumber: number;
  verseKey: string;
  lineNumber: number; // السطر الذي يبدأ فيه اسم السورة
  hasBismillah: boolean; // هل تحتوي على بسملة
}

export interface PageLayoutAnalysis {
  surahStarts: SurahStart[];
  bismillahLines: number[]; // أرقام الأسطر التي تحتوي على البسملة
  availableTextLines: number; // عدد السطور المتاحة للنص
  textLines: MushafLine[]; // الأسطر التي تحتوي على النص فقط
  surahNameLines: number[]; // أرقام الأسطر التي تحتوي على أسماء السور
}

/**
 * تحليل تخطيط الصفحة وتحديد بدايات السور والبسملة
 */
export function analyzePageLayout(
  pageNumber: number,
  pageLayout: MushafPage
): PageLayoutAnalysis {
  const surahStarts: SurahStart[] = [];
  const bismillahLines: number[] = [];
  const surahNameLines: number[] = [];
  
  // استثناء الصفحات 1 و 2 - تخطيط مختلف
  if (pageNumber <= 2) {
    return {
      surahStarts: [],
      bismillahLines: [],
      availableTextLines: 15,
      textLines: pageLayout.lines,
      surahNameLines: [],
    };
  }
  
  // تحليل كل سطر لتحديد بدايات السور
  const verseMap = new Map<string, { surah: number; ayah: number; lineNumber: number }>();
  
  // تجميع الآيات حسب السطر
  for (const line of pageLayout.lines) {
    for (const word of line.words) {
      const [surah, ayah] = word.verse_key.split(':').map(Number);
      const key = word.verse_key;
      
      if (!verseMap.has(key)) {
        verseMap.set(key, { surah, ayah, lineNumber: line.line_number });
      }
    }
  }
  
  // تحديد بدايات السور (ayah === 1)
  const firstVerses = new Set<string>();
  for (const [verseKey, data] of verseMap.entries()) {
    if (data.ayah === 1) {
      firstVerses.add(verseKey);
    }
  }
  
  // تحديد السطور التي تحتوي على بدايات السور
  for (const line of pageLayout.lines) {
    for (const word of line.words) {
      if (firstVerses.has(word.verse_key)) {
        const [surah] = word.verse_key.split(':').map(Number);
        const surahInfo = pageLayout.surahs.find(s => s.surah_number === surah);
        
        // التحقق من عدم إضافة نفس السورة مرتين
        if (!surahStarts.some(s => s.surahNumber === surah && s.lineNumber === line.line_number)) {
          surahStarts.push({
            surahNumber: surah,
            verseKey: word.verse_key,
            lineNumber: line.line_number,
            hasBismillah: surahInfo?.bismillah_pre || false,
          });
          
          // اسم السورة يأخذ سطر كامل
          surahNameLines.push(line.line_number);
          
          // البسملة تأخذ سطر كامل (إذا كانت موجودة)
          if (surahInfo?.bismillah_pre && surah !== 1 && surah !== 9) {
            // البسملة عادة في السطر التالي لاسم السورة
            // لكن قد تكون في نفس السطر، نحتاج للتحقق من البيانات الفعلية
            const bismillahLine = line.line_number + 1;
            if (bismillahLine <= 15) {
              bismillahLines.push(bismillahLine);
            }
          }
        }
      }
    }
  }
  
  // استثناء صفحة 187 (سورة التوبة)
  // اسم السورة في السطر الأول، ثم 14 سطر نص
  if (pageNumber === 187) {
    return {
      surahStarts: surahStarts.filter(s => s.surahNumber === 9),
      bismillahLines: [], // سورة التوبة لا تحتوي على بسملة
      availableTextLines: 14,
      textLines: pageLayout.lines.filter(l => l.line_number > 1),
      surahNameLines: [1],
    };
  }
  
  // حساب عدد السطور المتاحة للنص
  // كل بداية سورة تأخذ سطرين: اسم السورة + البسملة
  const linesUsedForSurahHeaders = surahStarts.length * 2;
  const availableTextLines = 15 - linesUsedForSurahHeaders;
  
  // تحديد الأسطر التي تحتوي على النص فقط (ليست أسماء سور أو بسملة)
  const headerLines = new Set([
    ...surahNameLines,
    ...bismillahLines,
  ]);
  
  const textLines = pageLayout.lines.filter(
    line => !headerLines.has(line.line_number)
  );
  
  return {
    surahStarts,
    bismillahLines,
    availableTextLines,
    textLines,
    surahNameLines,
  };
}

/**
 * حساب عدد السطور المتاحة بناءً على رقم الصفحة وعدد بدايات السور
 */
export function calculateAvailableLines(
  pageNumber: number,
  surahStartsCount: number
): number {
  // استثناء الصفحات 1 و 2
  if (pageNumber <= 2) {
    return 15;
  }
  
  // استثناء صفحة 187 (سورة التوبة)
  if (pageNumber === 187) {
    return 14; // اسم السورة في السطر الأول، ثم 14 سطر نص
  }
  
  // الحالة العامة: 15 - (2 × عدد بدايات السور)
  return 15 - (2 * surahStartsCount);
}

/**
 * التحقق من وجود بسملة في السطر
 */
export function hasBismillahInLine(
  line: MushafLine,
  surahNumber: number
): boolean {
  if (surahNumber === 1 || surahNumber === 9) {
    return false;
  }
  
  // البحث عن كلمات البسملة في السطر
  const bismillahWords = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'];
  const lineText = line.words.map(w => w.text_uthmani).join(' ');
  
  // التحقق من وجود كلمات البسملة
  return bismillahWords.every(word => lineText.includes(word));
}

