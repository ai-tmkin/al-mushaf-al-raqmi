"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Copy, Share2, Check, X } from "lucide-react";
import { SURAH_NAMES_AR } from "@/lib/quran/quran-com-api";
import { MushafPage, MushafLine, MushafWord } from "@/lib/quran/qul-api";
import { PageLayoutAnalysis } from "@/lib/quran/page-layout-analyzer";
import { 
  type ViewMode, 
  FIXED_SETTINGS, 
  LINES_PER_PAGE,
  getFixedSettings 
} from "@/lib/quran/font-calculator";

interface LineBasedPageViewerProps {
  pageNumber: number;
  pageLayout: MushafPage;
  layoutAnalysis: PageLayoutAnalysis;
  viewMode: ViewMode;
  juzNumber: number;
  hizbNumber: number;
  onVerseClick?: (surah: number, ayah: number) => void;
  highlightedVerse?: string | null;
}

/**
 * تحويل رقم عربي
 */
function toArabicNumber(num: number): string {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumbers[parseInt(digit)])
    .join("");
}

/**
 * أسماء السور بالتنسيق المصحفي
 */
const SURAH_NAMES_MUSHAF: Record<number, string> = {
  1: "الفَاتِحَة", 2: "البَقَرَة", 3: "آلِ عِمۡرَان", 4: "النِّسَاء", 5: "المَائِدَة",
  6: "الأَنۡعَام", 7: "الأَعۡرَاف", 8: "الأَنفَال", 9: "التَّوۡبَة", 10: "يُونُس",
  11: "هُود", 12: "يُوسُف", 13: "الرَّعۡد", 14: "إِبۡرَاهِيم", 15: "الحِجۡر",
  16: "النَّحۡل", 17: "الإِسۡرَاء", 18: "الكَهۡف", 19: "مَرۡيَم", 20: "طه",
  21: "الأَنبِيَاء", 22: "الحَجّ", 23: "المُؤۡمِنُون", 24: "النُّور", 25: "الفُرۡقَان",
  26: "الشُّعَرَاء", 27: "النَّمۡل", 28: "القَصَص", 29: "العَنكَبُوت", 30: "الرُّوم",
  31: "لُقۡمَان", 32: "السَّجۡدَة", 33: "الأَحۡزَاب", 34: "سَبَأ", 35: "فَاطِر",
  36: "يس", 37: "الصَّافَّات", 38: "ص", 39: "الزُّمَر", 40: "غَافِر",
  41: "فُصِّلَت", 42: "الشُّورَىٰ", 43: "الزُّخۡرُف", 44: "الدُّخَان", 45: "الجَاثِيَة",
  46: "الأَحۡقَاف", 47: "مُحَمَّد", 48: "الفَتۡح", 49: "الحُجُرَات", 50: "ق",
  51: "الذَّارِيَات", 52: "الطُّور", 53: "النَّجۡم", 54: "القَمَر", 55: "الرَّحۡمَٰن",
  56: "الوَاقِعَة", 57: "الحَدِيد", 58: "المُجَادَلَة", 59: "الحَشۡر", 60: "المُمۡتَحَنَة",
  61: "الصَّفّ", 62: "الجُمُعَة", 63: "المُنَافِقُون", 64: "التَّغَابُن", 65: "الطَّلَاق",
  66: "التَّحۡرِيم", 67: "المُلۡك", 68: "القَلَم", 69: "الحَاقَّة", 70: "المَعَارِج",
  71: "نُوح", 72: "الجِنّ", 73: "المُزَّمِّل", 74: "المُدَّثِّر", 75: "القِيَامَة",
  76: "الإِنسَان", 77: "المُرۡسَلَات", 78: "النَّبَأ", 79: "النَّازِعَات", 80: "عَبَسَ",
  81: "التَّكۡوِير", 82: "الِانفِطَار", 83: "المُطَفِّفِين", 84: "الِانشِقَاق", 85: "البُرُوج",
  86: "الطَّارِق", 87: "الأَعۡلَىٰ", 88: "الغَاشِيَة", 89: "الفَجۡر", 90: "البَلَد",
  91: "الشَّمۡس", 92: "اللَّيۡل", 93: "الضُّحَىٰ", 94: "الشَّرۡح", 95: "التِّين",
  96: "العَلَق", 97: "القَدۡر", 98: "البَيِّنَة", 99: "الزَّلۡزَلَة", 100: "العَادِيَات",
  101: "القَارِعَة", 102: "التَّكَاثُر", 103: "العَصۡر", 104: "الهُمَزَة", 105: "الفِيل",
  106: "قُرَيۡش", 107: "المَاعُون", 108: "الكَوۡثَر", 109: "الكَافِرُون", 110: "النَّصۡر",
  111: "المَسَد", 112: "الإِخۡلَاص", 113: "الفَلَق", 114: "النَّاس"
};

/**
 * مكون لعرض صفحة المصحف سطراً بسطر مع 15 سطر بالضبط
 * يستخدم الإعدادات الثابتة المعتمدة من font-test.html
 */
export function LineBasedPageViewer({
  pageNumber,
  pageLayout,
  layoutAnalysis,
  viewMode,
  juzNumber,
  hizbNumber,
  onVerseClick,
  highlightedVerse,
}: LineBasedPageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // حالة قائمة الخيارات
  const [selectedText, setSelectedText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  
  // استخدام الإعدادات الثابتة المعتمدة بناءً على نمط العرض
  const settings = FIXED_SETTINGS[viewMode];
  const containerSize = { width: settings.width, height: settings.height };

  // الحصول على إعدادات الخط الثابتة
  const fontMetrics = useMemo(() => {
    return getFixedSettings(viewMode);
  }, [viewMode]);
  
  // مراقبة تحديد النص
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      
      // الحصول على موقع التحديد
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setMenuPosition({
          x: Math.min(
            Math.max(rect.left - containerRect.left + rect.width / 2, 60),
            containerRect.width - 60
          ),
          y: rect.top - containerRect.top - 45
        });
        setShowMenu(true);
        setCopied(false);
      }
    }
  }, []);
  
  // نسخ النص
  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        setCopied(true);
        setTimeout(() => {
          setShowMenu(false);
          setCopied(false);
          window.getSelection()?.removeAllRanges();
        }, 1000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
  
  // مشاركة النص
  const handleShare = async () => {
    if (selectedText && navigator.share) {
      try {
        await navigator.share({
          title: 'آية من القرآن الكريم',
          text: selectedText,
        });
        setShowMenu(false);
        window.getSelection()?.removeAllRanges();
      } catch (err) {
        // المستخدم ألغى المشاركة
        console.log('Share cancelled');
      }
    } else {
      // إذا لم تكن المشاركة متاحة، انسخ النص
      handleCopy();
    }
  };
  
  // إغلاق القائمة
  const closeMenu = () => {
    setShowMenu(false);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };
  
  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showMenu && !target.closest('.selection-menu')) {
        // تأخير صغير للسماح بالتحديد الجديد
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection?.toString().trim()) {
            closeMenu();
          }
        }, 100);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // تجميع الأسطر حسب رقم السطر مع استخدام line_type من البيانات
  const processedLines = useMemo(() => {
    const lineInfo = new Map<number, { type: 'text' | 'surah_name' | 'bismillah', surahNum?: number, line?: MushafLine }>();
    
    for (let i = 1; i <= LINES_PER_PAGE; i++) {
      const line = pageLayout.lines.find(l => l.line_number === i);
      
      if (line) {
        // استخدام line_type من البيانات مباشرة
        if (line.line_type === 'surah_name') {
          lineInfo.set(i, { type: 'surah_name', surahNum: line.surah_number });
        } else if (line.line_type === 'bismillah' || line.line_type === 'basmala') {
          lineInfo.set(i, { type: 'bismillah', surahNum: line.surah_number });
        } else if (line.words && line.words.length > 0) {
          lineInfo.set(i, { type: 'text', line });
        } else {
          lineInfo.set(i, { type: 'text' }); // سطر فارغ
        }
      } else {
        lineInfo.set(i, { type: 'text' }); // سطر فارغ
      }
    }
    
    return lineInfo;
  }, [pageLayout.lines]);

  // عرض سطر واحد
  const renderLine = (lineNumber: number) => {
    const info = processedLines.get(lineNumber);
    
    // سطر اسم السورة
    if (info?.type === 'surah_name' && info.surahNum) {
      return (
        <div
          key={lineNumber}
          className="flex items-center justify-center w-full"
          style={{
            height: `${fontMetrics.lineHeight}px`,
            lineHeight: `${fontMetrics.lineHeight}px`,
            direction: "rtl",
          }}
        >
          {/* إطار اسم السورة المزخرف */}
          <div
            className="relative flex items-center justify-center"
            style={{
              minWidth: '200px',
              padding: '8px 28px',
            }}
          >
            {/* الخلفية والحدود الرئيسية */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #F9F6F0 0%, #F5F0E6 50%, #EDE6D6 100%)",
                border: "2.5px solid #C9A86C",
                borderRadius: "14px",
                boxShadow: "0 3px 10px rgba(139, 119, 74, 0.2), inset 0 1px 3px rgba(255,255,255,0.9)",
              }}
            />
            
            {/* الإطار الداخلي المزخرف */}
            <div
              className="absolute"
              style={{
                inset: '4px',
                border: "1.5px solid #D4C5A9",
                borderRadius: "10px",
              }}
            />
            
            {/* زخارف الأركان */}
            <div className="absolute top-[6px] right-[6px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#B8A070] rounded-tr" />
            <div className="absolute top-[6px] left-[6px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#B8A070] rounded-tl" />
            <div className="absolute bottom-[6px] right-[6px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#B8A070] rounded-br" />
            <div className="absolute bottom-[6px] left-[6px] w-2.5 h-2.5 border-b-2 border-l-2 border-[#B8A070] rounded-bl" />
            
            {/* نص اسم السورة */}
            <span
              className="relative z-10 font-bold"
              style={{
                fontSize: `${fontMetrics.fontSize * 0.95}px`,
                fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', 'Amiri', serif",
                color: "#3D3425",
                textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                letterSpacing: '1px',
              }}
            >
              سُورَةُ {SURAH_NAMES_MUSHAF[info.surahNum] || SURAH_NAMES_AR[info.surahNum]}
            </span>
          </div>
        </div>
      );
    }
    
    // سطر البسملة
    if (info?.type === 'bismillah') {
      return (
        <div
          key={lineNumber}
          className="flex items-center justify-center w-full"
          style={{
            height: `${fontMetrics.lineHeight}px`,
            lineHeight: `${fontMetrics.lineHeight}px`,
            direction: "rtl",
          }}
        >
          <span
            style={{
              fontSize: `${fontMetrics.fontSize * 0.95}px`,
              fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', 'Amiri', serif",
              color: "#8B6914",
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
          </span>
        </div>
      );
    }
    
    // سطر فارغ
    if (!info?.line || info.line.words.length === 0) {
      return (
        <div
          key={lineNumber}
          className="flex items-center justify-center"
          style={{
            height: `${fontMetrics.lineHeight}px`,
            lineHeight: `${fontMetrics.lineHeight}px`,
          }}
        />
      );
    }

    const line = info.line;
    
    // التحقق إذا كان هذا السطر الأخير من السورة
    // السطر الأخير من السورة يكون قبل سطر اسم سورة جديدة أو في نهاية الصفحة
    const isLastLineOfSurah = (() => {
      // فحص السطر التالي
      const nextLineInfo = processedLines.get(lineNumber + 1);
      if (!nextLineInfo) return true; // آخر سطر في الصفحة
      if (nextLineInfo.type === 'surah_name') return true; // السطر التالي اسم سورة جديدة
      
      // فحص إذا كان السطر الحالي يحتوي على آخر آية في السورة
      const lastWord = line.words[line.words.length - 1];
      if (lastWord && lastWord.char_type === 'end') {
        const [surah, ayah] = lastWord.verse_key.split(':').map(Number);
        // فحص إذا كانت الآية التالية من سورة مختلفة
        if (nextLineInfo.line && nextLineInfo.line.words.length > 0) {
          const nextFirstWord = nextLineInfo.line.words[0];
          const [nextSurah] = nextFirstWord.verse_key.split(':').map(Number);
          if (nextSurah !== surah) return true;
        }
      }
      return false;
    })();
    
    // بناء نص السطر - رمز نهاية الآية يلتصق بالكلمة السابقة ومسافة قبل الكلمة التالية
    const lineText = line.words.map((word, i) => {
      const isEndMark = word.char_type === "end";
      const prevWord = line.words[i - 1];
      const nextWord = line.words[i + 1];
      const prevIsEndMark = prevWord?.char_type === "end";
      const nextIsEndMark = nextWord?.char_type === "end";
      
      if (isEndMark) {
        // رمز نهاية الآية - يلتصق بالكلمة السابقة، مسافة بعده فقط إذا هناك كلمة تالية
        const endText = word.text_uthmani;
        const formattedEnd = /^[٠-٩]+$/.test(endText) ? `﴿${endText}﴾` : endText;
        // مسافة بعد الرمز فقط إذا هناك كلمة تالية (ليست رمز نهاية آية)
        return nextWord && !nextIsEndMark ? formattedEnd + ' ' : formattedEnd;
      } else {
        // كلمة عادية
        // مسافة قبلها إذا الكلمة السابقة كانت رمز نهاية آية (تمت إضافتها هناك)
        // مسافة بعدها فقط إذا الكلمة التالية ليست رمز نهاية آية
        if (nextIsEndMark) {
          return word.text_uthmani; // بدون مسافة بعدها لأن الرمز سيلتصق
        } else if (nextWord) {
          return word.text_uthmani + ' '; // مسافة بعدها
        } else {
          return word.text_uthmani; // آخر كلمة
        }
      }
    }).join('');

    // حساب عدد الأحرف في السطر لتحديد حجم الخط المناسب
    const lineChars = lineText.length;
    // زيادة حجم الخط قليلاً، وتقليله فقط إذا كان السطر طويلاً جداً
    const adjustedFontSize = lineChars > 80 
      ? fontMetrics.fontSize * (80 / lineChars) 
      : fontMetrics.fontSize * 1.02; // زيادة 2%
    
    // عرض النص القرآني - محاذاة للوسط مع إمكانية التحديد والنسخ
    return (
      <div
        key={lineNumber}
        className="w-full cursor-text select-text"
        style={{
          height: `${fontMetrics.lineHeight}px`,
          lineHeight: `${fontMetrics.lineHeight}px`,
          fontSize: `${adjustedFontSize}px`,
          fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', 'Amiri', serif",
          color: "#1C1510",
          textAlign: "center",
          wordSpacing: `${fontMetrics.wordSpacing * (adjustedFontSize / fontMetrics.fontSize)}px`,
          letterSpacing: `${fontMetrics.letterSpacing * (adjustedFontSize / fontMetrics.fontSize)}px`,
          direction: "rtl",
        }}
      >
        {lineText}
      </div>
    );
  };

  // الحصول على أسماء السور في الصفحة
  const surahsOnPage = pageLayout.surahs.map((s) => s.surah_number);

  return (
    <div
      ref={containerRef}
      className="mushaf-page relative mx-auto bg-[#FFFDF5] shadow-2xl overflow-hidden"
      style={{
        width: `${containerSize.width}px`,
        height: `${containerSize.height}px`,
        border: "1px solid #E5DCC8",
        borderRadius: "4px",
      }}
      onMouseUp={handleTextSelection}
      onTouchEnd={handleTextSelection}
    >
      {/* قائمة خيارات النص المحدد */}
      {showMenu && (
        <div
          className="selection-menu absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-xl px-1 py-1"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* زر النسخ */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-700 rounded-md transition-colors text-sm"
            title="نسخ"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>تم</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ</span>
              </>
            )}
          </button>
          
          {/* فاصل */}
          <div className="w-px h-5 bg-gray-600" />
          
          {/* زر المشاركة */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-700 rounded-md transition-colors text-sm"
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>
          
          {/* فاصل */}
          <div className="w-px h-5 bg-gray-600" />
          
          {/* زر الإغلاق */}
          <button
            onClick={closeMenu}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* السهم السفلي */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #111827',
            }}
          />
        </div>
      )}
      
      {/* الإطار الخارجي */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "6px",
          border: "2px solid #C9A86C",
          borderRadius: "2px",
        }}
      />

      {/* الإطار الداخلي */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "10px",
          border: "1px solid #E5DCC8",
        }}
      />

      {/* الزخارف في الأركان */}
      <div className="absolute top-[4px] right-[4px] w-3 h-3 border-t-2 border-r-2 border-[#C9A86C] rounded-tr-sm" />
      <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t-2 border-l-2 border-[#C9A86C] rounded-tl-sm" />
      <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b-2 border-r-2 border-[#C9A86C] rounded-br-sm" />
      <div className="absolute bottom-[4px] left-[4px] w-3 h-3 border-b-2 border-l-2 border-[#C9A86C] rounded-bl-sm" />

      {/* رأس الصفحة - الجزء واسم السورة والحزب */}
      <div
        className="absolute left-[5%] right-[5%] flex justify-between items-center text-[#5D4E37]"
        style={{
          top: "2%",
          height: "4%",
          fontSize: `${Math.max(12, fontMetrics.fontSize * 0.7)}px`,
          fontFamily: "'Scheherazade New', serif",
        }}
      >
        <span className="font-medium">الجزء {toArabicNumber(juzNumber)}</span>
        <span
          className="font-bold"
          style={{ fontSize: `${Math.max(14, fontMetrics.fontSize * 0.8)}px` }}
        >
          {surahsOnPage.length === 1
            ? `سُورَةُ ${SURAH_NAMES_AR[surahsOnPage[0]]}`
            : `${SURAH_NAMES_AR[surahsOnPage[0]]} - ${SURAH_NAMES_AR[surahsOnPage[surahsOnPage.length - 1]]}`}
        </span>
        <span className="font-medium">الحزب {toArabicNumber(hizbNumber)}</span>
      </div>

      {/* خط فاصل تحت الرأس */}
      <div
        className="absolute left-[5%] right-[5%] border-b border-[#D4C5A9]"
        style={{ top: "7%" }}
      />

      {/* منطقة النص - 15 سطر بالضبط */}
      {/* الصفحتين الأولى والثانية (الفاتحة وبداية البقرة) تبدأ من الأعلى مع مسافة */}
      <div
        className="absolute left-[5%] right-[5%] overflow-visible"
        style={{
          top: pageNumber <= 2 ? "10%" : "8%", // مسافة أكبر للصفحتين الأولى والثانية
          bottom: "6%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: pageNumber <= 2 ? `${fontMetrics.lineHeight * 0.1}px` : "0",
        }}
      >
        {/* عرض الأسطر الـ 15 */}
        {Array.from({ length: LINES_PER_PAGE }, (_, i) => i + 1).map((lineNumber) => {
          const lineElement = renderLine(lineNumber);
          // للصفحتين الأولى والثانية، جعل كل سطر في المنتصف أفقياً
          if (pageNumber <= 2) {
            return (
              <div key={`centered-${lineNumber}`} className="flex justify-center w-full">
                {lineElement}
              </div>
            );
          }
          return lineElement;
        })}
      </div>

      {/* خط فاصل فوق رقم الصفحة */}
      <div
        className="absolute left-[5%] right-[5%] border-t border-[#D4C5A9]"
        style={{ bottom: "5%" }}
      />

      {/* رقم الصفحة */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[#5D4E37] font-medium"
        style={{
          bottom: "1.5%",
          fontSize: `${Math.max(12, fontMetrics.fontSize * 0.7)}px`,
          fontFamily: "'Scheherazade New', serif",
        }}
      >
        {toArabicNumber(pageNumber)}
      </div>

      {/* مؤشر التصحيح */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-1 left-1 text-[8px] text-gray-400 bg-white/80 px-1 rounded">
          {viewMode} | {containerSize.width}x{containerSize.height} | FS:{fontMetrics.fontSize.toFixed(1)} | LH:{fontMetrics.lineHeight.toFixed(1)}
        </div>
      )}
    </div>
  );
}
