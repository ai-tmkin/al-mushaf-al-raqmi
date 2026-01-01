"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { VerseDisplay } from "@/components/quran/verse-display";
import { QuranSearchBar } from "@/components/quran/search-bar";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Palette,
} from "lucide-react";
import { SURAH_NAMES_AR, TOTAL_CHAPTERS } from "@/lib/quran/quran-com-api";

export const dynamic = "force-dynamic";

interface Chapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
  revelation_place: string;
  pages: number[];
}

export default function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const resolvedParams = use(params);
  const surahNumber = parseInt(resolvedParams.surah);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);

  // Load chapter info
  useEffect(() => {
    const loadChapter = async () => {
      if (surahNumber < 1 || surahNumber > TOTAL_CHAPTERS) {
        router.push("/read");
        return;
      }

      try {
        const response = await fetch(`/api/quran?type=chapter&id=${surahNumber}`);
        const result = await response.json();
        if (result.success) {
          setChapter(result.data);
        }
      } catch (error) {
        console.error("Error loading chapter:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChapter();
  }, [surahNumber, router]);

  // Handle verse highlight from URL
  useEffect(() => {
    const verse = searchParams.get("verse");
    if (verse) {
      setHighlightedVerse(verse);
    }
  }, [searchParams]);

  // Navigation handlers
  const goToPreviousSurah = () => {
    if (surahNumber > 1) {
      router.push(`/read/${surahNumber - 1}`);
    }
  };

  const goToNextSurah = () => {
    if (surahNumber < TOTAL_CHAPTERS) {
      router.push(`/read/${surahNumber + 1}`);
    }
  };

  const handleSearchSelect = (surah: number, ayah: number) => {
    if (surah === surahNumber) {
      setHighlightedVerse(`${surah}:${ayah}`);
      // Scroll to verse
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${surah}-${ayah}`);
        verseElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      router.push(`/read/${surah}?verse=${surah}:${ayah}`);
    }
  };

  const handleCreateDesign = (surah: number, ayah: number) => {
    router.push(`/create?surah=${surah}&ayah=${ayah}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل السورة...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sand-600">السورة غير موجودة</p>
            <button
              onClick={() => router.push("/read")}
              className="mt-4 text-emerald-600 hover:underline"
            >
              العودة للمقرأة
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-sand-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/read")}
                className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-sand-600" />
              </button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <div>
                  <h1 className="text-lg font-medium text-sand-900">
                    سورة {chapter.name_arabic}
                  </h1>
                  <p className="text-xs text-sand-500">
                    {chapter.verses_count} آية •{" "}
                    {chapter.revelation_place === "makkah" ? "مكية" : "مدنية"}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:block">
              <QuranSearchBar
                onSelect={handleSearchSelect}
                onCreateDesign={handleCreateDesign}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToNextSurah}
                disabled={surahNumber >= TOTAL_CHAPTERS}
                className={`p-2 rounded-lg transition-colors ${
                  surahNumber >= TOTAL_CHAPTERS
                    ? "text-sand-300 cursor-not-allowed"
                    : "hover:bg-sand-100 text-sand-600"
                }`}
                title={surahNumber < TOTAL_CHAPTERS ? SURAH_NAMES_AR[surahNumber + 1] : ""}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="px-3 py-1.5 bg-sand-100 rounded-lg text-sm font-medium text-sand-700">
                {surahNumber} / {TOTAL_CHAPTERS}
              </span>
              <button
                onClick={goToPreviousSurah}
                disabled={surahNumber <= 1}
                className={`p-2 rounded-lg transition-colors ${
                  surahNumber <= 1
                    ? "text-sand-300 cursor-not-allowed"
                    : "hover:bg-sand-100 text-sand-600"
                }`}
                title={surahNumber > 1 ? SURAH_NAMES_AR[surahNumber - 1] : ""}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Surah Info Card */}
        <div className="px-4 md:px-6 py-4 bg-gradient-to-b from-emerald-50 to-transparent">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-3">
              <span className="text-emerald-600 font-medium">
                سورة {chapter.name_arabic}
              </span>
              <span className="w-1 h-1 bg-sand-300 rounded-full" />
              <span className="text-sand-500 text-sm">
                {chapter.revelation_place === "makkah" ? "مكية" : "مدنية"}
              </span>
            </div>
            <p className="text-sand-600 text-sm">
              عدد آياتها {chapter.verses_count} آية • الصفحات{" "}
              {chapter.pages?.[0]} - {chapter.pages?.[chapter.pages?.length - 1]}
            </p>
          </div>
        </div>

        {/* Verses Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
          <VerseDisplay
            mode="surah"
            surahNumber={surahNumber}
            highlightedVerse={highlightedVerse}
            onVerseClick={(surah, ayah) => setHighlightedVerse(`${surah}:${ayah}`)}
            onCreateDesign={handleCreateDesign}
            showSurahHeader={false}
          />
        </div>

        {/* Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg border border-sand-200 p-3 flex items-center justify-between">
          <button
            onClick={goToNextSurah}
            disabled={surahNumber >= TOTAL_CHAPTERS}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              surahNumber >= TOTAL_CHAPTERS
                ? "text-sand-300"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm">
              {surahNumber < TOTAL_CHAPTERS ? SURAH_NAMES_AR[surahNumber + 1] : ""}
            </span>
          </button>
          
          <button
            onClick={() => handleCreateDesign(surahNumber, 1)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg"
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm">تصميم</span>
          </button>

          <button
            onClick={goToPreviousSurah}
            disabled={surahNumber <= 1}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              surahNumber <= 1
                ? "text-sand-300"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <span className="text-sm">
              {surahNumber > 1 ? SURAH_NAMES_AR[surahNumber - 1] : ""}
            </span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

