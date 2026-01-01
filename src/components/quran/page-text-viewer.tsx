"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  BookOpen,
  Layers,
  FileText,
  Search,
  X,
} from "lucide-react";
import { SURAH_NAMES_AR, TOTAL_PAGES } from "@/lib/quran/quran-com-api";
import { MushafPage } from "@/lib/quran/qul-api";
import { PageLayoutAnalysis } from "@/lib/quran/page-layout-analyzer";
import { getViewModeFromWidth, type ViewMode } from "@/lib/quran/font-calculator";
import { LineBasedPageViewer } from "./line-based-page-viewer";

interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  sajdah_number: number | null;
}

interface PageTextViewerProps {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onVerseClick?: (surah: number, ayah: number) => void;
  onCreateDesign?: (surah: number, ayah: number) => void;
  highlightedVerse?: string | null;
}

// بيانات الأجزاء - رقم الجزء وأول صفحة فيه
const JUZ_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342,
  19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502,
  27: 522, 28: 542, 29: 562, 30: 582
};

// بيانات السور - رقم السورة وأول صفحة فيها
const SURAH_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293,
  19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367,
  27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418, 34: 428,
  35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477, 42: 483,
  43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542,
  59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560,
  67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574, 74: 575,
  75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586, 82: 587,
  83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
  91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598,
  99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601, 105: 601,
  106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603, 112: 604,
  113: 604, 114: 604
};

// الحصول على رقم الجزء من رقم الصفحة
function getJuzFromPage(page: number): number {
  for (let juz = 30; juz >= 1; juz--) {
    if (page >= JUZ_PAGES[juz]) return juz;
  }
  return 1;
}

// الحصول على رقم السورة من رقم الصفحة
function getSurahFromPage(page: number): number {
  for (let surah = 114; surah >= 1; surah--) {
    if (page >= SURAH_PAGES[surah]) return surah;
  }
  return 1;
}

// تحويل الأرقام إلى عربية
function toArabicNumber(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
}

export function PageTextViewer({
  pageNumber,
  onPageChange,
  onVerseClick,
  onCreateDesign,
  highlightedVerse,
}: PageTextViewerProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [juzNumber, setJuzNumber] = useState(1);
  const [hizbNumber, setHizbNumber] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [pageLayout, setPageLayout] = useState<MushafPage | null>(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState<PageLayoutAnalysis | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // حالة القوائم المنسدلة
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showJuzDropdown, setShowJuzDropdown] = useState(false);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  
  // حالة البحث
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    page: number;
    verse_key: string;
    text: string;
    surah: number;
    ayah: number;
    surah_name?: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // تحديد نمط العرض بناءً على حجم الشاشة
  useEffect(() => {
    const updateViewMode = () => {
      setViewMode(getViewModeFromWidth(window.innerWidth));
    };

    updateViewMode();
    window.addEventListener("resize", updateViewMode);
    return () => window.removeEventListener("resize", updateViewMode);
  }, []);

  // Load verses and layout for current page
  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/quran/pages?page=${pageNumber}&layout=true&verses=true`
        );
        const result = await response.json();
        
        if (result.success) {
          setVerses(result.data.verses || []);
          setJuzNumber(result.data.juz_number || getJuzFromPage(pageNumber));
          if (result.data.verses?.[0]) {
            setHizbNumber(result.data.verses[0].hizb_number || 1);
          }
          
          // تحميل بيانات التخطيط
          if (result.data.layout) {
            const layoutData = {
              page_number: result.data.layout.page_number || pageNumber,
              lines: result.data.layout.lines || [],
              juz_number: result.data.layout.juz_number || result.data.juz_number || 1,
              hizb_number: result.data.layout.hizb_number || result.data.hizb_number || 1,
              rub_el_hizb_number: result.data.layout.rub_el_hizb_number || 1,
              surahs: result.data.layout.surahs || [],
            };
            setPageLayout(layoutData);
            
            const { analyzePageLayout } = await import("@/lib/quran/page-layout-analyzer");
            const analysis = analyzePageLayout(pageNumber, layoutData);
            setLayoutAnalysis(analysis);
          }
        }
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPage();
  }, [pageNumber]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          if (pageNumber < TOTAL_PAGES) onPageChange(pageNumber + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (pageNumber > 1) onPageChange(pageNumber - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, onPageChange]);

  // Touch/swipe navigation
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && pageNumber < TOTAL_PAGES) {
        onPageChange(pageNumber + 1);
      } else if (diff < 0 && pageNumber > 1) {
        onPageChange(pageNumber - 1);
      }
    }
  };

  // مرجع للقوائم المنسدلة
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPageDropdown(false);
        setShowJuzDropdown(false);
        setShowSurahDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // الانتقال إلى جزء
  const goToJuz = (juz: number) => {
    const targetPage = JUZ_PAGES[juz];
    setShowJuzDropdown(false);
    setTimeout(() => onPageChange(targetPage), 0);
  };

  // الانتقال إلى سورة
  const goToSurah = (surah: number) => {
    const targetPage = SURAH_PAGES[surah];
    setShowSurahDropdown(false);
    setTimeout(() => onPageChange(targetPage), 0);
  };

  // الانتقال إلى صفحة
  const goToPage = (page: number) => {
    setShowPageDropdown(false);
    setTimeout(() => onPageChange(page), 0);
  };

  const currentJuz = getJuzFromPage(pageNumber);
  const currentSurah = getSurahFromPage(pageNumber);

  // البحث في القرآن
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/quran/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setSearchResults(result.data.slice(0, 20)); // أول 20 نتيجة
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // الانتقال لنتيجة بحث
  const goToSearchResult = (page: number) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    onPageChange(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sand-600">جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* شريط التنقل العلوي */}
      <div className="bg-white border-b border-sand-200 px-4 py-2 flex-shrink-0">
        <div ref={dropdownRef} className="flex items-center justify-between gap-2 flex-wrap">
          {/* التنقل بين الصفحات - السهم الأيمن للصفحة السابقة (اتجاه القراءة العربية) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => pageNumber > 1 && onPageChange(pageNumber - 1)}
              disabled={pageNumber <= 1}
              title="الصفحة السابقة"
              className={`p-1.5 rounded-lg transition-colors ${
                pageNumber <= 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "hover:bg-sand-100 text-sand-600"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* اختيار الصفحة */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPageDropdown(!showPageDropdown);
                  setShowJuzDropdown(false);
                  setShowSurahDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-sand-50 hover:bg-sand-100 rounded-lg text-sm transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-sand-500" />
                <span className="text-sand-700 font-medium">{toArabicNumber(pageNumber)}</span>
                <ChevronDown className="w-3 h-3 text-sand-400" />
              </button>
              
              {showPageDropdown && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-sand-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-20">
                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPage(page);
                      }}
                      className={`w-full px-3 py-1.5 text-sm text-right hover:bg-sand-50 ${
                        page === pageNumber ? "bg-emerald-50 text-emerald-700" : "text-sand-700"
                      }`}
                    >
                      {toArabicNumber(page)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => pageNumber < TOTAL_PAGES && onPageChange(pageNumber + 1)}
              disabled={pageNumber >= TOTAL_PAGES}
              title="الصفحة التالية"
              className={`p-1.5 rounded-lg transition-colors ${
                pageNumber >= TOTAL_PAGES
                  ? "text-gray-300 cursor-not-allowed"
                  : "hover:bg-sand-100 text-sand-600"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* اختيار الجزء */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJuzDropdown(!showJuzDropdown);
                setShowPageDropdown(false);
                setShowSurahDropdown(false);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-sand-50 hover:bg-sand-100 rounded-lg text-sm transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-sand-500" />
              <span className="text-sand-700">الجزء</span>
              <span className="text-emerald-600 font-medium">{toArabicNumber(currentJuz)}</span>
              <ChevronDown className="w-3 h-3 text-sand-400" />
            </button>
            
            {showJuzDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-sand-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-32">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <button
                    key={juz}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToJuz(juz);
                    }}
                    className={`w-full px-3 py-1.5 text-sm text-right hover:bg-sand-50 ${
                      juz === currentJuz ? "bg-emerald-50 text-emerald-700" : "text-sand-700"
                    }`}
                  >
                    الجزء {toArabicNumber(juz)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* اختيار السورة */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSurahDropdown(!showSurahDropdown);
                setShowPageDropdown(false);
                setShowJuzDropdown(false);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-sand-50 hover:bg-sand-100 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-sand-500" />
              <span className="text-emerald-600 font-medium truncate max-w-24">{SURAH_NAMES_AR[currentSurah]}</span>
              <ChevronDown className="w-3 h-3 text-sand-400" />
            </button>
            
            {showSurahDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-sand-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-48">
                {Array.from({ length: 114 }, (_, i) => i + 1).map((surah) => (
                  <button
                    key={surah}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSurah(surah);
                    }}
                    className={`w-full px-3 py-1.5 text-sm text-right hover:bg-sand-50 flex items-center justify-between ${
                      surah === currentSurah ? "bg-emerald-50 text-emerald-700" : "text-sand-700"
                    }`}
                  >
                    <span>{SURAH_NAMES_AR[surah]}</span>
                    <span className="text-sand-400 text-xs">{toArabicNumber(surah)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* أدوات إضافية: البحث */}
          <div className="flex items-center gap-1">
            {/* زر البحث */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
              title="البحث في القرآن"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* شريط البحث */}
        {showSearch && (
          <div className="mt-2 border-t border-sand-200 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ابحث في القرآن..."
                  className="w-full px-3 py-1.5 pr-8 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-right"
                  dir="rtl"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
              </button>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1.5 text-sand-400 hover:text-sand-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* نتائج البحث */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto border border-sand-200 rounded-lg bg-white">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSearchResult(result.page)}
                    className="w-full px-3 py-3 text-right hover:bg-emerald-50 border-b border-sand-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs bg-sand-100 text-sand-600 px-2 py-0.5 rounded">
                        صفحة {toArabicNumber(result.page)}
                      </span>
                      <span className="text-xs font-medium text-emerald-700">
                        {SURAH_NAMES_AR[result.surah] || `سورة ${result.surah}`} - آية {toArabicNumber(result.ayah)}
                      </span>
                    </div>
                    <p 
                      className="text-sm text-sand-800 leading-relaxed line-clamp-2" 
                      style={{ fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', serif" }}
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: result.text }}
                    />
                  </button>
                ))}
              </div>
            )}
            
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="mt-2 text-sm text-sand-500 text-center">لا توجد نتائج</p>
            )}
          </div>
        )}
      </div>

      {/* محتوى الصفحة */}
      <div className="flex-1 overflow-auto">
        {pageLayout && layoutAnalysis ? (
          <div className="flex items-center justify-center p-4 min-h-full">
            <LineBasedPageViewer
              pageNumber={pageNumber}
              pageLayout={pageLayout}
              layoutAnalysis={layoutAnalysis}
              viewMode={viewMode}
              juzNumber={juzNumber}
              hizbNumber={hizbNumber}
              onVerseClick={onVerseClick}
              highlightedVerse={highlightedVerse}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <p className="text-sand-600 mb-2">جاري تحميل بيانات التخطيط...</p>
              <p className="text-sand-400 text-sm">إذا استمرت المشكلة، يرجى تحديث الصفحة</p>
            </div>
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي - slider */}
      <div className="bg-white border-t border-sand-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-sand-400 w-8 text-center">{toArabicNumber(TOTAL_PAGES)}</span>
          <input
            type="range"
            min={1}
            max={TOTAL_PAGES}
            value={pageNumber}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-sand-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
            style={{ direction: "rtl" }}
          />
          <span className="text-xs text-sand-400 w-8 text-center">{toArabicNumber(1)}</span>
        </div>
        <p className="text-center text-[10px] text-sand-400 mt-1">
          ← → للتنقل بين الصفحات
        </p>
      </div>
    </div>
  );
}
