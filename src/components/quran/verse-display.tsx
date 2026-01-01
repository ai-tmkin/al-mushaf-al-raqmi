"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Copy,
  Check,
  Palette,
  Bookmark,
  BookmarkCheck,
  Share2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { SURAH_NAMES_AR } from "@/lib/quran/quran-com-api";

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

interface VerseDisplayProps {
  mode: "surah" | "page" | "juz";
  surahNumber?: number;
  pageNumber?: number;
  juzNumber?: number;
  highlightedVerse?: string | null;
  onVerseClick?: (surah: number, ayah: number) => void;
  onCreateDesign?: (surah: number, ayah: number) => void;
  showSurahHeader?: boolean;
}

export function VerseDisplay({
  mode,
  surahNumber = 1,
  pageNumber = 1,
  juzNumber = 1,
  highlightedVerse,
  onVerseClick,
  onCreateDesign,
  showSurahHeader = true,
}: VerseDisplayProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<{
    current_page: number;
    total_pages: number;
    has_more: boolean;
  } | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Load verses
  const loadVerses = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      let endpoint = "";
      switch (mode) {
        case "surah":
          endpoint = `/api/quran?type=verses_by_chapter&id=${surahNumber}&page=${page}&per_page=50`;
          break;
        case "page":
          endpoint = `/api/quran?type=verses_by_page&id=${pageNumber}`;
          break;
        case "juz":
          endpoint = `/api/quran?type=verses_by_juz&id=${juzNumber}&page=${page}&per_page=50`;
          break;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success) {
        if (page === 1) {
          setVerses(result.data);
        } else {
          setVerses((prev) => [...prev, ...result.data]);
        }
        
        if (result.pagination) {
          setPagination({
            current_page: result.pagination.current_page,
            total_pages: result.pagination.total_pages,
            has_more: result.pagination.current_page < result.pagination.total_pages,
          });
        } else {
          setPagination(null);
        }
      }
    } catch (error) {
      console.error("Error loading verses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mode, surahNumber, pageNumber, juzNumber]);

  // Initial load
  useEffect(() => {
    loadVerses(1);
  }, [loadVerses]);

  // Scroll to highlighted verse
  useEffect(() => {
    if (highlightedVerse && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightedVerse, verses]);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quran-bookmarks");
    if (saved) {
      setBookmarkedVerses(new Set(JSON.parse(saved)));
    }
  }, []);

  // Copy verse to clipboard
  const copyVerse = async (verse: Verse) => {
    const [surah, ayah] = verse.verse_key.split(":").map(Number);
    const text = `${verse.text_uthmani}\n\n[${SURAH_NAMES_AR[surah]}: ${ayah}]`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerse(verse.verse_key);
      setTimeout(() => setCopiedVerse(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Copy multiple selected verses
  const copySelectedVerses = async () => {
    const selectedList = verses.filter((v) => selectedVerses.has(v.verse_key));
    if (selectedList.length === 0) return;

    const text = selectedList
      .map((v) => {
        const [surah, ayah] = v.verse_key.split(":").map(Number);
        return `${v.text_uthmani} ﴿${ayah}﴾`;
      })
      .join(" ");

    const firstVerse = selectedList[0];
    const lastVerse = selectedList[selectedList.length - 1];
    const [surah] = firstVerse.verse_key.split(":").map(Number);
    const [, firstAyah] = firstVerse.verse_key.split(":").map(Number);
    const [, lastAyah] = lastVerse.verse_key.split(":").map(Number);

    const reference = firstAyah === lastAyah
      ? `[${SURAH_NAMES_AR[surah]}: ${firstAyah}]`
      : `[${SURAH_NAMES_AR[surah]}: ${firstAyah}-${lastAyah}]`;

    try {
      await navigator.clipboard.writeText(`${text}\n\n${reference}`);
      setSelectedVerses(new Set());
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (verseKey: string) => {
    const newBookmarks = new Set(bookmarkedVerses);
    if (newBookmarks.has(verseKey)) {
      newBookmarks.delete(verseKey);
    } else {
      newBookmarks.add(verseKey);
    }
    setBookmarkedVerses(newBookmarks);
    localStorage.setItem("quran-bookmarks", JSON.stringify([...newBookmarks]));
  };

  // Toggle verse selection
  const toggleSelection = (verseKey: string) => {
    const newSelection = new Set(selectedVerses);
    if (newSelection.has(verseKey)) {
      newSelection.delete(verseKey);
    } else {
      newSelection.add(verseKey);
    }
    setSelectedVerses(newSelection);
  };

  // Share verse
  const shareVerse = async (verse: Verse) => {
    const [surah, ayah] = verse.verse_key.split(":").map(Number);
    const text = `${verse.text_uthmani}\n\n[${SURAH_NAMES_AR[surah]}: ${ayah}]`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${SURAH_NAMES_AR[surah]} - الآية ${ayah}`,
          text,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      copyVerse(verse);
    }
  };

  // Get verse number display
  const getVerseNumber = (number: number) => {
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return number
      .toString()
      .split("")
      .map((d) => arabicNumerals[parseInt(d)])
      .join("");
  };

  if (isLoading && verses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sand-600">جاري تحميل الآيات...</p>
        </div>
      </div>
    );
  }

  // Group verses by surah for page/juz mode
  const groupedVerses: Record<number, Verse[]> = {};
  verses.forEach((verse) => {
    const [surah] = verse.verse_key.split(":").map(Number);
    if (!groupedVerses[surah]) {
      groupedVerses[surah] = [];
    }
    groupedVerses[surah].push(verse);
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Selection Actions Bar */}
      {selectedVerses.size > 0 && (
        <div className="sticky top-0 z-10 bg-emerald-600 text-white px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-sm">
            تم تحديد {selectedVerses.size} آية
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={copySelectedVerses}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ</span>
            </button>
            <button
              onClick={() => setSelectedVerses(new Set())}
              className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Verses Display */}
      {mode === "surah" || Object.keys(groupedVerses).length === 1 ? (
        // Single surah display
        <div className="space-y-1">
          {/* Surah Header */}
          {showSurahHeader && mode === "surah" && (
            <div className="text-center py-8 mb-6">
              <div className="inline-block px-8 py-4 bg-gradient-to-b from-emerald-50 to-transparent rounded-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-2">
                  سورة {SURAH_NAMES_AR[surahNumber]}
                </h2>
                {/* Bismillah (except for Surah 1 and 9) */}
                {surahNumber !== 1 && surahNumber !== 9 && (
                  <p className="text-lg md:text-xl font-quran text-sand-700 mt-4">
                    بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verses */}
          <div className="bg-white rounded-2xl shadow-sm border border-sand-100 p-4 md:p-8">
            <div className="font-quran text-xl md:text-2xl leading-[2.5] md:leading-[3] text-sand-900 text-justify">
              {verses.map((verse) => {
                const [surah, ayah] = verse.verse_key.split(":").map(Number);
                const isHighlighted = highlightedVerse === verse.verse_key;
                const isSelected = selectedVerses.has(verse.verse_key);
                const isBookmarked = bookmarkedVerses.has(verse.verse_key);
                const isSajda = verse.sajdah_number !== null;

                return (
                  <span
                    key={verse.verse_key}
                    id={`verse-${surah}-${ayah}`}
                    ref={isHighlighted ? highlightedRef : null}
                    onClick={() => toggleSelection(verse.verse_key)}
                    className={`relative inline cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-yellow-100 rounded px-1"
                        : isSelected
                        ? "bg-emerald-50 rounded px-1"
                        : "hover:bg-sand-50 rounded px-1"
                    } ${isSajda ? "text-red-700" : ""}`}
                  >
                    {verse.text_uthmani}
                    <span className="inline-flex items-center mx-1 text-emerald-600 text-base md:text-lg">
                      ﴿{getVerseNumber(ayah)}﴾
                    </span>
                    
                    {/* Verse Actions (shown on hover/selection) */}
                    {(isHighlighted || isSelected) && (
                      <span className="absolute -top-10 right-0 flex items-center gap-1 bg-white shadow-lg rounded-lg px-2 py-1 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyVerse(verse);
                          }}
                          className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                          title="نسخ"
                        >
                          {copiedVerse === verse.verse_key ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-sand-500" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(verse.verse_key);
                          }}
                          className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                          title={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Bookmark className="w-4 h-4 text-sand-500" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareVerse(verse);
                          }}
                          className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                          title="مشاركة"
                        >
                          <Share2 className="w-4 h-4 text-sand-500" />
                        </button>
                        {onCreateDesign && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateDesign(surah, ayah);
                            }}
                            className="p-1.5 rounded hover:bg-sand-100 transition-colors"
                            title="تصميم"
                          >
                            <Palette className="w-4 h-4 text-sand-500" />
                          </button>
                        )}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Multiple surahs display (for page/juz mode)
        <div className="space-y-8">
          {Object.entries(groupedVerses).map(([surahId, surahVerses]) => {
            const surah = parseInt(surahId);
            return (
              <div key={surah}>
                {/* Surah Header */}
                <div className="text-center py-6 mb-4">
                  <div className="inline-block px-6 py-3 bg-gradient-to-b from-emerald-50 to-transparent rounded-xl">
                    <h3 className="text-xl font-bold text-emerald-800">
                      سورة {SURAH_NAMES_AR[surah]}
                    </h3>
                  </div>
                </div>

                {/* Verses */}
                <div className="bg-white rounded-2xl shadow-sm border border-sand-100 p-4 md:p-6">
                  <div className="font-quran text-lg md:text-xl leading-[2.5] md:leading-[3] text-sand-900 text-justify">
                    {surahVerses.map((verse) => {
                      const [, ayah] = verse.verse_key.split(":").map(Number);
                      const isHighlighted = highlightedVerse === verse.verse_key;
                      const isSajda = verse.sajdah_number !== null;

                      return (
                        <span
                          key={verse.verse_key}
                          id={`verse-${surah}-${ayah}`}
                          ref={isHighlighted ? highlightedRef : null}
                          onClick={() => onVerseClick?.(surah, ayah)}
                          className={`inline cursor-pointer transition-colors ${
                            isHighlighted
                              ? "bg-yellow-100 rounded px-1"
                              : "hover:bg-sand-50 rounded px-1"
                          } ${isSajda ? "text-red-700" : ""}`}
                        >
                          {verse.text_uthmani}
                          <span className="inline-flex items-center mx-1 text-emerald-600 text-sm md:text-base">
                            ﴿{getVerseNumber(ayah)}﴾
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {pagination?.has_more && (
        <div className="text-center mt-6">
          <button
            onClick={() => loadVerses(pagination.current_page + 1)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>تحميل المزيد</span>
          </button>
        </div>
      )}
    </div>
  );
}

