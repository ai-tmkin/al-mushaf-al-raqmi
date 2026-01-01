import { NextRequest, NextResponse } from 'next/server';

// أسماء السور بالعربية
const SURAH_NAMES: Record<number, string> = {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      success: false,
      error: 'يجب إدخال كلمة بحث مكونة من حرفين على الأقل'
    }, { status: 400 });
  }

  try {
    // البحث عبر Quran.com API مع طلب رقم الصفحة
    // ملاحظة: إزالة language=ar لأنه يسبب 204 No Content
    const response = await fetch(
      `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=20&fields=text_uthmani,page_number`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 } // cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`);
    }

    const data = await response.json();
    
    // تحويل النتائج للتنسيق المطلوب
    const searchResults = data.search?.results || [];
    
    // جلب أرقام الصفحات لكل آية من API الآيات
    const resultsWithPages = await Promise.all(
      searchResults.slice(0, 20).map(async (result: {
        verse_key: string;
        text: string;
        highlighted?: string;
      }) => {
        const [surah, ayah] = result.verse_key.split(':').map(Number);
        
        // جلب معلومات الآية للحصول على رقم الصفحة
        let page = 1;
        try {
          const verseResponse = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${result.verse_key}?fields=page_number`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (verseResponse.ok) {
            const verseData = await verseResponse.json();
            page = verseData.verse?.page_number || 1;
          }
        } catch {
          // استخدام الصفحة الافتراضية في حالة الخطأ
        }
        
        return {
          verse_key: result.verse_key,
          text: result.highlighted || result.text,
          text_plain: result.text,
          page: page,
          surah: surah,
          surah_name: SURAH_NAMES[surah] || `سورة ${surah}`,
          ayah: ayah
        };
      })
    );
    
    const results = resultsWithPages;

    return NextResponse.json({
      success: true,
      data: results,
      total: data.search?.total_results || 0,
      query: query
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء البحث'
    }, { status: 500 });
  }
}
