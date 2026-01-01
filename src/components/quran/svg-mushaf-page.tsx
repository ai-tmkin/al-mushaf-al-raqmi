"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Palette,
  Loader2,
  Bookmark,
  BookmarkCheck,
  Volume2,
} from "lucide-react";
import {
  fetchPageLayout,
  preloadPageFont,
  preloadAdjacentFonts,
  isPageFontLoaded,
  getPageFontUrl,
  toArabicNumber,
  SURAH_NAMES,
  TOTAL_PAGES,
  LINES_PER_PAGE,
  type MushafPage,
  type MushafWord,
  type MushafLine,
} from "@/lib/quran/qul-api";

interface SVGMushafPageProps {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onWordClick?: (word: MushafWord) => void;
  onCreateDesign?: (surah: number, ayah: number) => void;
  highlightedVerse?: string | null;
  highlightedWord?: string | null;
}

// SVG Dimensions (based on standard Mushaf proportions)
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 1600;
const MARGIN_X = 50;
const MARGIN_TOP = 100;
const MARGIN_BOTTOM = 80;
const LINE_HEIGHT = (SVG_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) / LINES_PER_PAGE;
const TEXT_WIDTH = SVG_WIDTH - (MARGIN_X * 2);

export function SVGMushafPage({
  pageNumber,
  onPageChange,
  onWordClick,
  onCreateDesign,
  highlightedVerse,
  highlightedWord,
}: SVGMushafPageProps) {
  const [pageData, setPageData] = useState<MushafPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load page data and font
  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      
      try {
        // Load font first
        const fontSuccess = await preloadPageFont(pageNumber);
        setFontLoaded(fontSuccess);
        
        // Preload adjacent pages fonts in background
        preloadAdjacentFonts(pageNumber, 2);
        
        // Load page layout data
        const data = await fetchPageLayout(pageNumber);
        setPageData(data);
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPage();
  }, [pageNumber]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quran-bookmarks");
    if (saved) {
      setBookmarkedVerses(new Set(JSON.parse(saved)));
    }
  }, []);

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

  // Copy verse
  const copyVerse = useCallback(async (verseKey: string, text: string) => {
    const [surah, ayah] = verseKey.split(':').map(Number);
    const fullText = `${text}\n\n[${SURAH_NAMES[surah]}: ${ayah}]`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedVerse(verseKey);
      setTimeout(() => setCopiedVerse(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback((verseKey: string) => {
    const newBookmarks = new Set(bookmarkedVerses);
    if (newBookmarks.has(verseKey)) {
      newBookmarks.delete(verseKey);
    } else {
      newBookmarks.add(verseKey);
    }
    setBookmarkedVerses(newBookmarks);
    localStorage.setItem("quran-bookmarks", JSON.stringify([...newBookmarks]));
  }, [bookmarkedVerses]);

  // Get font family for current page
  const fontFamily = useMemo(() => {
    if (fontLoaded) {
      return `qpc-page-${pageNumber}, 'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', serif`;
    }
    return `'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', 'Amiri', serif`;
  }, [fontLoaded, pageNumber]);

  // Render a single line as SVG text
  const renderLine = useCallback((line: MushafLine, yPosition: number) => {
    if (line.words.length === 0) return null;

    // Combine all words in the line
    const lineText = line.words
      .map(w => w.code_v2 || w.text_uthmani)
      .join(' ');

    // Check if any word in this line is highlighted
    const hasHighlightedWord = line.words.some(
      w => w.verse_key === highlightedVerse || w.word_id === highlightedWord
    );

    return (
      <g key={`line-${line.line_number}`}>
        {/* Main text with justification */}
        <text
          x={SVG_WIDTH - MARGIN_X}
          y={yPosition}
          fontFamily={fontFamily}
          fontSize="55"
          textAnchor="end"
          direction="rtl"
          fill={hasHighlightedWord ? "#065F46" : "#1C1510"}
          textLength={TEXT_WIDTH}
          lengthAdjust="spacingAndGlyphs"
          className="mushaf-line-text"
          style={{ cursor: 'pointer' }}
        >
          {/* Render each word as tspan for interactivity */}
          {line.words.map((word, idx) => {
            const isHighlighted = word.verse_key === highlightedVerse;
            const isSelected = word.word_id === selectedWord;
            const isWordHighlighted = word.word_id === highlightedWord;
            
            return (
              <tspan
                key={word.word_id}
                data-word-id={word.word_id}
                data-verse-key={word.verse_key}
                className={`mushaf-word ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                fill={isWordHighlighted ? "#D97706" : isHighlighted ? "#065F46" : isSelected ? "#047857" : "inherit"}
                onClick={() => {
                  setSelectedWord(isSelected ? null : word.word_id);
                  onWordClick?.(word);
                }}
              >
                {word.code_v2 || word.text_uthmani}
                {idx < line.words.length - 1 ? ' ' : ''}
              </tspan>
            );
          })}
        </text>

        {/* Highlight background for selected words */}
        {hasHighlightedWord && (
          <rect
            x={MARGIN_X}
            y={yPosition - 45}
            width={TEXT_WIDTH}
            height={LINE_HEIGHT * 0.8}
            fill="#FEF3C7"
            opacity="0.3"
            rx="4"
          />
        )}
      </g>
    );
  }, [fontFamily, highlightedVerse, highlightedWord, selectedWord, onWordClick]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sand-600">جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sand-600">تعذر تحميل الصفحة</p>
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
      {/* SVG Mushaf Page */}
      <div 
        className="flex-1 flex items-center justify-center p-2"
        style={{ minHeight: 0 }}
      >
        <div 
          className="relative bg-[#FFFEF8] shadow-2xl rounded"
          style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: `${SVG_WIDTH} / ${SVG_HEIGHT}`,
            border: '1px solid #E5DCC8',
          }}
        >
          {/* Decorative border */}
          <div className="absolute inset-[6px] border-2 border-[#D4C5A9] rounded-sm pointer-events-none" />
          <div className="absolute inset-[10px] border border-[#E8DCC8] pointer-events-none" />

          {/* SVG Content */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            style={{ direction: 'rtl' }}
          >
            {/* Page Header */}
            <g className="page-header">
              {/* Juz number - right */}
              <text
                x={SVG_WIDTH - MARGIN_X}
                y={50}
                fontFamily="'Scheherazade New', serif"
                fontSize="28"
                fill="#5D4E37"
                textAnchor="end"
              >
                الجزء {toArabicNumber(pageData.juz_number)}
              </text>

              {/* Surah name - center */}
              <text
                x={SVG_WIDTH / 2}
                y={50}
                fontFamily="'Scheherazade New', serif"
                fontSize="32"
                fill="#3D3425"
                textAnchor="middle"
                fontWeight="bold"
              >
                سُورَةُ {pageData.surahs[0]?.surah_name || ''}
              </text>

              {/* Hizb number - left */}
              <text
                x={MARGIN_X}
                y={50}
                fontFamily="'Scheherazade New', serif"
                fontSize="28"
                fill="#5D4E37"
                textAnchor="start"
              >
                الحزب {toArabicNumber(pageData.hizb_number)}
              </text>
            </g>

            {/* Decorative line under header */}
            <line
              x1={MARGIN_X}
              y1={70}
              x2={SVG_WIDTH - MARGIN_X}
              y2={70}
              stroke="#D4C5A9"
              strokeWidth="1"
            />

            {/* Lines of Quran text */}
            <g className="quran-lines">
              {pageData.lines.map((line, index) => {
                const yPosition = MARGIN_TOP + (index * LINE_HEIGHT) + (LINE_HEIGHT * 0.7);
                return renderLine(line, yPosition);
              })}
            </g>

            {/* Page number at bottom */}
            <text
              x={SVG_WIDTH / 2}
              y={SVG_HEIGHT - 30}
              fontFamily="'Scheherazade New', serif"
              fontSize="32"
              fill="#5D4E37"
              textAnchor="middle"
            >
              {toArabicNumber(pageNumber)}
            </text>

            {/* Decorative line above page number */}
            <line
              x1={MARGIN_X}
              y1={SVG_HEIGHT - 60}
              x2={SVG_WIDTH - MARGIN_X}
              y2={SVG_HEIGHT - 60}
              stroke="#D4C5A9"
              strokeWidth="1"
            />
          </svg>

          {/* Ghost Layer for text selection (invisible but selectable) */}
          <div 
            className="absolute inset-0 opacity-0 pointer-events-none select-text"
            style={{ 
              padding: '6%',
              paddingTop: '8%',
              fontSize: '14px',
              lineHeight: '2',
              direction: 'rtl',
              textAlign: 'justify',
            }}
          >
            {pageData.lines.map(line => (
              <div key={line.line_number}>
                {line.words.map(w => w.text_uthmani).join(' ')}
              </div>
            ))}
          </div>

          {/* Word action popup */}
          {selectedWord && (
            <div 
              className="absolute top-4 right-4 flex items-center gap-1 bg-white shadow-xl rounded-lg px-2 py-1 z-30 border border-sand-200"
            >
              <button
                onClick={() => {
                  const word = pageData.lines
                    .flatMap(l => l.words)
                    .find(w => w.word_id === selectedWord);
                  if (word) {
                    const verseText = pageData.lines
                      .flatMap(l => l.words)
                      .filter(w => w.verse_key === word.verse_key)
                      .map(w => w.text_uthmani)
                      .join(' ');
                    copyVerse(word.verse_key, verseText);
                  }
                }}
                className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                title="نسخ الآية"
              >
                {copiedVerse ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-sand-500" />
                )}
              </button>
              <button
                onClick={() => {
                  const word = pageData.lines
                    .flatMap(l => l.words)
                    .find(w => w.word_id === selectedWord);
                  if (word) toggleBookmark(word.verse_key);
                }}
                className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                title="علامة مرجعية"
              >
                {(() => {
                  const word = pageData.lines
                    .flatMap(l => l.words)
                    .find(w => w.word_id === selectedWord);
                  return word && bookmarkedVerses.has(word.verse_key) ? (
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-sand-500" />
                  );
                })()}
              </button>
              {onCreateDesign && (
                <button
                  onClick={() => {
                    const word = pageData.lines
                      .flatMap(l => l.words)
                      .find(w => w.word_id === selectedWord);
                    if (word) {
                      const [surah, ayah] = word.verse_key.split(':').map(Number);
                      onCreateDesign(surah, ayah);
                    }
                  }}
                  className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                  title="تصميم"
                >
                  <Palette className="w-4 h-4 text-sand-500" />
                </button>
              )}
              <button
                onClick={() => setSelectedWord(null)}
                className="p-1.5 rounded hover:bg-sand-100 transition-colors text-xs text-sand-400"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur border-t border-sand-200">
        <button
          onClick={() => pageNumber < TOTAL_PAGES && onPageChange(pageNumber + 1)}
          disabled={pageNumber >= TOTAL_PAGES}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
            pageNumber >= TOTAL_PAGES
              ? "text-gray-300 cursor-not-allowed"
              : "bg-white hover:bg-emerald-50 text-emerald-700 shadow-sm border border-gray-200"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
          <span className="hidden sm:inline">التالية</span>
        </button>

        <div className="flex-1 mx-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">٦٠٤</span>
          <input
            type="range"
            min={1}
            max={TOTAL_PAGES}
            value={pageNumber}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
            style={{ direction: "rtl" }}
          />
          <span className="text-xs text-gray-400">١</span>
        </div>

        <button
          onClick={() => pageNumber > 1 && onPageChange(pageNumber - 1)}
          disabled={pageNumber <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
            pageNumber <= 1
              ? "text-gray-300 cursor-not-allowed"
              : "bg-white hover:bg-emerald-50 text-emerald-700 shadow-sm border border-gray-200"
          }`}
        >
          <span className="hidden sm:inline">السابقة</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

