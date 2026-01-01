/**
 * API Route لخدمة بيانات صفحات القرآن المحلية
 * يقرأ من ملفات JSON المحفوظة من QUL
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// مسار البيانات
const DATA_DIR = path.join(process.cwd(), '..', 'data', 'qul-pages');

// أسماء السور
const SURAH_NAMES: { [key: number]: string } = {
  1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
  6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
  11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
  16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
  21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
  26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
  31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
  36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
  41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
  46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
  51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
  56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
  61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
  66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
  71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
  76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
  81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
  86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
  91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
  96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
  101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
  106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
  111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageNumber = parseInt(searchParams.get('page') || '1');
  
  // التحقق من رقم الصفحة
  if (pageNumber < 1 || pageNumber > 604) {
    return NextResponse.json(
      { error: 'رقم الصفحة يجب أن يكون بين 1 و 604' },
      { status: 400 }
    );
  }
  
  try {
    // قراءة ملف الصفحة
    const pageFile = path.join(DATA_DIR, `page-${pageNumber.toString().padStart(3, '0')}.json`);
    
    if (!fs.existsSync(pageFile)) {
      return NextResponse.json(
        { 
          error: 'الصفحة غير موجودة',
          message: 'يرجى تشغيل سكريبت جلب البيانات أولاً',
          hint: 'node scripts/scrape-qul-pages.js ' + pageNumber
        },
        { status: 404 }
      );
    }
    
    const pageData = JSON.parse(fs.readFileSync(pageFile, 'utf8'));
    
    // تحويل البيانات إلى تنسيق متوافق مع Quran.com API
    const verses = convertToQuranComFormat(pageData);
    
    return NextResponse.json({
      source: 'QUL-KFGQPC',
      page_number: pageNumber,
      first_verse: pageData.first_verse,
      last_verse: pageData.last_verse,
      surah_starts: pageData.surah_starts || [],
      has_bismillah: pageData.has_bismillah,
      word_count: pageData.word_count,
      verses: verses,
      raw_words: pageData.words
    });
    
  } catch (error) {
    console.error('Error reading page data:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في قراءة البيانات' },
      { status: 500 }
    );
  }
}

/**
 * تحويل بيانات QUL إلى تنسيق متوافق مع Quran.com API
 */
function convertToQuranComFormat(pageData: any) {
  const verses: any[] = [];
  const words = pageData.words || [];
  
  // تجميع الكلمات في آيات
  let currentVerse: any = null;
  let currentSurah = 0;
  let currentAyah = 0;
  
  // استخراج السورة والآية من first_verse
  if (pageData.first_verse) {
    const [surah, ayah] = pageData.first_verse.split(':').map(Number);
    currentSurah = surah;
    currentAyah = ayah;
  }
  
  for (const word of words) {
    // التحقق من رقم الآية (الكلمات التي هي أرقام عربية)
    const isAyahNumber = /^[٠-٩]+$/.test(word.text) || /^\d+$/.test(word.text);
    
    if (isAyahNumber) {
      // إنهاء الآية الحالية
      if (currentVerse && currentVerse.words.length > 0) {
        currentVerse.words.push({
          text_uthmani: word.text,
          char_type_name: 'end',
          position: currentVerse.words.length + 1
        });
        verses.push(currentVerse);
      }
      
      // بدء آية جديدة
      currentAyah++;
      
      // التحقق من بداية سورة جديدة
      if (pageData.surah_starts && pageData.surah_starts.includes(currentSurah + 1)) {
        // هذا تقريبي - يحتاج تحسين
      }
      
      currentVerse = {
        verse_key: `${currentSurah}:${currentAyah}`,
        text_uthmani: '',
        words: []
      };
      
    } else {
      // إضافة الكلمة للآية الحالية
      if (!currentVerse) {
        currentVerse = {
          verse_key: `${currentSurah}:${currentAyah}`,
          text_uthmani: '',
          words: []
        };
      }
      
      currentVerse.words.push({
        text_uthmani: word.text,
        char_type_name: 'word',
        position: currentVerse.words.length + 1,
        line_number: Math.ceil((currentVerse.words.length + 1) / 8) // تقريبي
      });
      
      currentVerse.text_uthmani += (currentVerse.text_uthmani ? ' ' : '') + word.text;
    }
  }
  
  // إضافة الآية الأخيرة إذا لم تُضف
  if (currentVerse && currentVerse.words.length > 0) {
    verses.push(currentVerse);
  }
  
  return verses;
}

/**
 * الحصول على معلومات الفهرس
 */
export async function HEAD(request: NextRequest) {
  const indexFile = path.join(DATA_DIR, 'index.json');
  
  if (!fs.existsSync(indexFile)) {
    return new NextResponse(null, { status: 404 });
  }
  
  const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Total-Pages': index.total_pages.toString(),
      'X-Mushaf-Name': index.mushaf_name,
      'X-Scraped-At': index.scraped_at
    }
  });
}

