"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
} from "lucide-react";
import { getPageImageUrl, TOTAL_PAGES, SURAH_NAMES_AR } from "@/lib/quran/quran-com-api";

interface PageData {
  page_number: number;
  image_url: string;
  juz_number: number;
  chapters: { id: number; name: string }[];
  verses: any[];
}

interface MushafViewerProps {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onVerseClick?: (surah: number, ayah: number) => void;
  style?: "v1" | "v2" | "warch" | "indopak";
}

export function MushafViewer({
  pageNumber,
  onPageChange,
  onVerseClick,
  style = "v2",
}: MushafViewerProps) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load page data
  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setImageError(false);
      
      try {
        const response = await fetch(
          `/api/quran/pages?page=${pageNumber}&style=${style}`
        );
        const result = await response.json();
        
        if (result.success) {
          setPageData(result.data);
        }
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPage();
  }, [pageNumber, style]);

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
          e.preventDefault();
          setZoom((z) => Math.min(z + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
        case "0":
          e.preventDefault();
          setZoom(1);
          break;
        case "f":
        case "F":
          e.preventDefault();
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
        // Swipe left - next page (RTL)
        onPageChange(pageNumber + 1);
      } else if (diff < 0 && pageNumber > 1) {
        // Swipe right - previous page (RTL)
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Download page image
  const downloadPage = () => {
    if (!pageData) return;
    const link = document.createElement("a");
    link.href = pageData.image_url;
    link.download = `quran-page-${pageNumber}.png`;
    link.click();
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center ${
        isFullscreen ? "bg-black" : ""
      }`}
    >
      {/* Controls Bar */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between gap-4 px-4">
        {/* Page Info */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-sand-600">
            صفحة {pageNumber} من {TOTAL_PAGES}
          </span>
          {pageData?.chapters && pageData.chapters.length > 0 && (
            <span className="text-xs text-sand-400">
              {pageData.chapters.map((c) => c.name).join(" • ")}
            </span>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-sand-500 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
            title="إعادة تعيين"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-sand-200 mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
            title={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={downloadPage}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-600 transition-colors"
            title="تحميل الصفحة"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Display */}
      <div
        className="relative flex items-center justify-center w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Page Button */}
        <button
          onClick={() => pageNumber > 1 && onPageChange(pageNumber - 1)}
          disabled={pageNumber <= 1}
          className={`absolute right-2 md:right-4 z-10 p-3 rounded-full bg-white/90 shadow-lg transition-all ${
            pageNumber <= 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white hover:shadow-xl"
          }`}
        >
          <ChevronRight className="w-5 h-5 text-sand-700" />
        </button>

        {/* Page Image Container */}
        <div
          className="relative overflow-auto max-w-full"
          style={{
            maxHeight: isFullscreen ? "100vh" : "calc(100vh - 200px)",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-[300px] md:w-[500px] h-[450px] md:h-[700px] bg-sand-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sand-500 text-sm">جاري تحميل الصفحة...</p>
              </div>
            </div>
          ) : imageError ? (
            <div className="flex items-center justify-center w-[300px] md:w-[500px] h-[450px] md:h-[700px] bg-sand-100 rounded-lg">
              <div className="text-center">
                <p className="text-sand-600 mb-2">تعذر تحميل الصفحة</p>
                <button
                  onClick={() => setImageError(false)}
                  className="text-emerald-600 hover:underline text-sm"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={pageData?.image_url || getPageImageUrl(pageNumber, style)}
              alt={`صفحة ${pageNumber} من المصحف`}
              className="max-w-full h-auto rounded-lg shadow-xl transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center top",
              }}
              onError={handleImageError}
              draggable={false}
            />
          )}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => pageNumber < TOTAL_PAGES && onPageChange(pageNumber + 1)}
          disabled={pageNumber >= TOTAL_PAGES}
          className={`absolute left-2 md:left-4 z-10 p-3 rounded-full bg-white/90 shadow-lg transition-all ${
            pageNumber >= TOTAL_PAGES
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white hover:shadow-xl"
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-sand-700" />
        </button>
      </div>

      {/* Page Navigation Slider */}
      <div className="w-full max-w-4xl mt-4 px-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-sand-400">{TOTAL_PAGES}</span>
          <input
            type="range"
            min={1}
            max={TOTAL_PAGES}
            value={pageNumber}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            style={{ direction: "rtl" }}
          />
          <span className="text-xs text-sand-400">1</span>
        </div>
      </div>

      {/* Juz Info */}
      {pageData && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
            الجزء {pageData.juz_number}
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="hidden md:block mt-4 text-center text-xs text-sand-400">
        <span>← → للتنقل</span>
        <span className="mx-2">•</span>
        <span>+ - للتكبير</span>
        <span className="mx-2">•</span>
        <span>0 لإعادة التعيين</span>
        <span className="mx-2">•</span>
        <span>F لملء الشاشة</span>
      </div>
    </div>
  );
}

