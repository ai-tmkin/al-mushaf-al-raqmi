"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Loader2,
  Maximize2,
  Moon,
  Sun,
} from "lucide-react";
import { toArabicNumber, SURAH_NAMES, TOTAL_PAGES } from "@/lib/quran/qul-api";

interface MushafImageViewerProps {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onVerseClick?: (surah: number, ayah: number) => void;
}

// Multiple image sources for fallback
const IMAGE_SOURCES = {
  // MP3Quran.net - Working and reliable ✅
  mp3quran: (page: number) =>
    `https://www.mp3quran.net/api/quran_pages_arabic/${page.toString().padStart(3, '0')}.png`,
  
  // Quran.com CDN - Color version (backup)
  qurancdn_color: (page: number) => 
    `https://static.qurancdn.com/images/w/rq-color/page${page.toString().padStart(3, '0')}.png`,
  
  // Quran.com CDN - Madinah Mushaf WebP (backup)
  qurancdn_webp: (page: number) =>
    `https://static.qurancdn.com/images/pages/madinah/webp/page${page.toString().padStart(3, '0')}.webp`,
};

// Primary and fallback URLs - MP3Quran first as it's verified working
const getImageUrls = (page: number): string[] => [
  IMAGE_SOURCES.mp3quran(page),
  IMAGE_SOURCES.qurancdn_color(page),
  IMAGE_SOURCES.qurancdn_webp(page),
];

export function MushafImageViewer({
  pageNumber,
  onPageChange,
  onVerseClick,
}: MushafImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Get current image URL
  const imageUrls = getImageUrls(pageNumber);
  const currentImageUrl = imageUrls[currentImageIndex];
  
  // Reset image index when page changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
    setIsLoading(true);
  }, [pageNumber]);

  // Preload adjacent pages
  useEffect(() => {
    const preloadImages = [pageNumber - 1, pageNumber + 1]
      .filter(p => p >= 1 && p <= TOTAL_PAGES);
    
    preloadImages.forEach(p => {
      const urls = getImageUrls(p);
      const img = new Image();
      img.src = urls[0]; // Preload primary source
    });
  }, [pageNumber]);
  
  // Handle image load error - try next source
  const handleImageError = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      // Try next image source
      setCurrentImageIndex(prev => prev + 1);
      setIsLoading(true);
    } else {
      // All sources failed
      setIsLoading(false);
      setImageError(true);
    }
  };

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
        case "+":
        case "=":
          setZoom(z => Math.min(z + 0.25, 3));
          break;
        case "-":
          setZoom(z => Math.max(z - 0.25, 0.5));
          break;
        case "0":
          setZoom(1);
          break;
        case "f":
          toggleFullscreen();
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

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Get page info
  const getPageInfo = (page: number) => {
    // This is approximate - ideally we'd fetch from API
    const juz = Math.ceil(page / 20);
    const hizb = Math.ceil(page / 10);
    return { juz, hizb };
  };

  const { juz, hizb } = getPageInfo(pageNumber);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sand-100'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sand-200'
      }`}>
        {/* Page Info */}
        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-sand-600'}`}>
          <span>الجزء {toArabicNumber(juz)}</span>
          <span className="mx-2">|</span>
          <span>الحزب {toArabicNumber(hizb)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-sand-100 text-sand-600'
            }`}
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-xs min-w-[40px] text-center ${
            isDarkMode ? 'text-gray-400' : 'text-sand-500'
          }`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-sand-100 text-sand-600'
            }`}
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-700' : 'bg-sand-200'}`} />

          {/* Dark mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-sand-100 text-sand-600'
            }`}
            title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-sand-100 text-sand-600'
            }`}
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Page Number */}
        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-sand-700'}`}>
          صفحة {toArabicNumber(pageNumber)}
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ minHeight: 0 }}
      >
        <div
          className={`relative transition-transform duration-200 ${
            isDarkMode ? 'filter invert hue-rotate-180' : ''
          }`}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          )}
          
          {imageError ? (
            <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-sand-500'}`}>
              <p>تعذر تحميل الصفحة</p>
              <button
                onClick={() => {
                  setCurrentImageIndex(0);
                  setImageError(false);
                  setIsLoading(true);
                }}
                className="mt-2 text-emerald-600 hover:underline"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt={`صفحة ${pageNumber} من المصحف`}
              className="max-h-[calc(100vh-200px)] w-auto shadow-2xl rounded-sm"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
              onLoad={() => setIsLoading(false)}
              onError={handleImageError}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className={`flex items-center justify-between px-4 py-3 border-t ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sand-200'
      }`}>
        <button
          onClick={() => pageNumber < TOTAL_PAGES && onPageChange(pageNumber + 1)}
          disabled={pageNumber >= TOTAL_PAGES}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pageNumber >= TOTAL_PAGES
              ? "opacity-30 cursor-not-allowed"
              : isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
          <span className="hidden sm:inline">الصفحة التالية</span>
        </button>

        {/* Page Slider */}
        <div className="flex-1 mx-4 flex items-center gap-3">
          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-sand-400'}`}>
            {toArabicNumber(TOTAL_PAGES)}
          </span>
          <input
            type="range"
            min={1}
            max={TOTAL_PAGES}
            value={pageNumber}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-emerald-600"
            style={{ 
              direction: "rtl",
              background: isDarkMode 
                ? 'linear-gradient(to left, #10b981, #374151)' 
                : 'linear-gradient(to left, #10b981, #e5e7eb)'
            }}
          />
          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-sand-400'}`}>
            {toArabicNumber(1)}
          </span>
        </div>

        <button
          onClick={() => pageNumber > 1 && onPageChange(pageNumber - 1)}
          disabled={pageNumber <= 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pageNumber <= 1
              ? "opacity-30 cursor-not-allowed"
              : isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
          }`}
        >
          <span className="hidden sm:inline">الصفحة السابقة</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className={`text-center py-1 text-xs ${
        isDarkMode ? 'text-gray-600' : 'text-sand-400'
      }`}>
        استخدم الأسهم ← → للتنقل | +/- للتكبير | F لملء الشاشة
      </div>
    </div>
  );
}

