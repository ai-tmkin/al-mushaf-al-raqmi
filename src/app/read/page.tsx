"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { QuranSearchBar } from "@/components/quran/search-bar";
import { PageTextViewer } from "@/components/quran/page-text-viewer";
import { MushafImageViewer } from "@/components/quran/mushaf-image-viewer";
import { VerseDisplay } from "@/components/quran/verse-display";
import {
  BookOpen,
  FileText,
  Layers,
  Image,
  Loader2,
} from "lucide-react";
import { SURAH_NAMES_AR, TOTAL_PAGES } from "@/lib/quran/quran-com-api";

// أوضاع العرض المختلفة - كل وضع مستقل تماماً
type ViewMode = "image" | "pages" | "surah";

interface Chapter {
  id: number;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  pages: number[];
}

// المكون الرئيسي الذي يستخدم useSearchParams
function ReadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State - كل وضع له state خاص به
  const [viewMode, setViewMode] = useState<ViewMode>("image");
  
  // State لوضع الصور
  const [imagePage, setImagePage] = useState(1);
  
  // State لوضع النص
  const [textPage, setTextPage] = useState(1);
  
  // State لوضع السورة
  const [currentSurah, setCurrentSurah] = useState(1);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);

  // Load chapters on mount
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const response = await fetch("/api/quran?type=chapters");
        const result = await response.json();
        if (result.success) {
          setChapters(result.data);
        }
      } catch (error) {
        console.error("Error loading chapters:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChapters();
  }, []);

  // Handle URL params
  useEffect(() => {
    const surah = searchParams.get("surah");
    const page = searchParams.get("page");
    const verse = searchParams.get("verse");
    const mode = searchParams.get("mode");

    if (mode === "image" || mode === "pages" || mode === "surah") {
      setViewMode(mode);
    }
    if (surah) {
      setCurrentSurah(parseInt(surah));
      if (!mode) setViewMode("surah");
    }
    if (page) {
      const pageNum = parseInt(page);
      if (mode === "image") {
        setImagePage(pageNum);
      } else if (mode === "pages") {
        setTextPage(pageNum);
      }
      if (!mode) setViewMode("pages");
    }
    if (verse) {
      setHighlightedVerse(verse);
    }
  }, [searchParams]);

  // Navigation handlers - كل وضع له handler خاص
  const handleImagePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= TOTAL_PAGES) {
      setImagePage(newPage);
      router.push(`/read?page=${newPage}&mode=image`, { scroll: false });
    }
  }, [router]);

  const handleTextPageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= TOTAL_PAGES) {
      setTextPage(newPage);
      router.push(`/read?page=${newPage}&mode=pages`, { scroll: false });
    }
  }, [router]);

  const handleSurahChange = useCallback((surahNumber: number) => {
    setCurrentSurah(surahNumber);
    router.push(`/read?surah=${surahNumber}&mode=surah`, { scroll: false });
  }, [router]);

  // View mode change - بدون مزامنة بين الأوضاع
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    
    if (mode === "image") {
      router.push(`/read?page=${imagePage}&mode=image`, { scroll: false });
    } else if (mode === "pages") {
      router.push(`/read?page=${textPage}&mode=pages`, { scroll: false });
    } else {
      router.push(`/read?surah=${currentSurah}&mode=surah`, { scroll: false });
    }
  }, [router, imagePage, textPage, currentSurah]);

  // Search result handler
  const handleSearchSelect = useCallback((surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setHighlightedVerse(`${surah}:${ayah}`);
    setViewMode("surah");
    router.push(`/read?surah=${surah}&verse=${surah}:${ayah}&mode=surah`, { scroll: false });
  }, [router]);

  // Go to create page with selected verse
  const handleCreateDesign = useCallback((surah: number, ayah: number) => {
    router.push(`/create?surah=${surah}&ayah=${ayah}`);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل المصحف...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex flex-col h-screen">
        {/* Header - مشترك بين جميع الأوضاع */}
        <header className="bg-white border-b border-sand-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h1 className="text-lg font-medium text-sand-900 hidden sm:block">المقرأة</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <QuranSearchBar 
                onSelect={handleSearchSelect}
                onCreateDesign={handleCreateDesign}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-sand-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange("image")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "image"
                    ? "bg-white shadow-sm text-emerald-600"
                    : "text-sand-500 hover:text-sand-700"
                }`}
                title="صور المصحف الرسمية"
              >
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">مصحف</span>
              </button>
              <button
                onClick={() => handleViewModeChange("pages")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "pages"
                    ? "bg-white shadow-sm text-emerald-600"
                    : "text-sand-500 hover:text-sand-700"
                }`}
                title="عرض صفحات نصية"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">نص</span>
              </button>
              <button
                onClick={() => handleViewModeChange("surah")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "surah"
                    ? "bg-white shadow-sm text-emerald-600"
                    : "text-sand-500 hover:text-sand-700"
                }`}
                title="عرض السورة كاملة"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">سورة</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area - كل وضع له محتوى مستقل */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "image" ? (
            // وضع صور المصحف - بدون sidebar، التنقل داخل المكون
            <div className="h-full overflow-y-auto">
              <MushafImageViewer
                pageNumber={imagePage}
                onPageChange={handleImagePageChange}
                onVerseClick={(surah, ayah) => setHighlightedVerse(`${surah}:${ayah}`)}
              />
            </div>
          ) : viewMode === "pages" ? (
            // وضع النص - بدون sidebar، التنقل داخل المكون
            <div className="h-full overflow-y-auto p-4">
              <PageTextViewer
                pageNumber={textPage}
                onPageChange={handleTextPageChange}
                onVerseClick={(surah, ayah) => setHighlightedVerse(`${surah}:${ayah}`)}
                onCreateDesign={handleCreateDesign}
                highlightedVerse={highlightedVerse}
              />
            </div>
          ) : (
            // وضع السورة - مع sidebar للسور
            <div className="h-full flex">
              {/* Sidebar للسور */}
              <aside className="hidden md:block w-72 bg-white border-l border-sand-200 overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-sand-700 mb-3">السور</h3>
                  <div className="space-y-1">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleSurahChange(chapter.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentSurah === chapter.id
                            ? "bg-emerald-50 text-emerald-700"
                            : "hover:bg-sand-50 text-sand-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-sand-100 rounded-lg text-xs font-medium">
                            {chapter.id}
                          </span>
                          <div className="text-right">
                            <span className="block">{chapter.name_arabic}</span>
                            <span className="text-[10px] text-sand-400">
                              {chapter.revelation_place === "makkah" ? "مكية" : "مدنية"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-sand-400">
                          {chapter.verses_count} آية
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* محتوى السورة */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <VerseDisplay
                  mode="surah"
                  surahNumber={currentSurah}
                  highlightedVerse={highlightedVerse}
                  onVerseClick={(surah, ayah) => setHighlightedVerse(`${surah}:${ayah}`)}
                  onCreateDesign={handleCreateDesign}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// صفحة التحميل
function LoadingFallback() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sand-600">جاري تحميل المصحف...</p>
        </div>
      </main>
    </div>
  );
}

// الصفحة الرئيسية مع Suspense
export default function ReadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReadPageContent />
    </Suspense>
  );
}
