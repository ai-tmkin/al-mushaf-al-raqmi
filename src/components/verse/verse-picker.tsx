"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Loader2 } from "lucide-react";
import { SURAH_NAMES_AR } from "@/types/quran";
import { fetchSurah, getSurahNameAr } from "@/lib/quran/api";
import { useDesignStore } from "@/stores/design-store";
import { cn } from "@/lib/utils";

// Total ayahs per surah
const SURAH_AYAH_COUNT: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
};

export function VersePicker() {
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { setSelection, setIsLoading: setStoreLoading } = useDesignStore();

  const maxAyah = SURAH_AYAH_COUNT[surahNumber] || 7;

  // Load verses when selection changes
  useEffect(() => {
    loadVerses();
  }, [surahNumber, ayahStart, ayahEnd]);

  const loadVerses = async () => {
    setIsLoading(true);
    setStoreLoading(true);

    try {
      const data = await fetchSurah(surahNumber);
      const filteredAyahs = data.ayahs.filter(
        (ayah) => ayah.numberInSurah >= ayahStart && ayah.numberInSurah <= ayahEnd
      );

      setSelection({
        surahNumber,
        ayahStart,
        ayahEnd,
        verses: filteredAyahs,
        surahName: getSurahNameAr(surahNumber),
      });
    } catch (error) {
      console.error("Error loading verses:", error);
    } finally {
      setIsLoading(false);
      setStoreLoading(false);
    }
  };

  const handleSurahChange = (value: string) => {
    const num = parseInt(value);
    setSurahNumber(num);
    setAyahStart(1);
    setAyahEnd(Math.min(7, SURAH_AYAH_COUNT[num] || 7));
  };

  const handleAyahStartChange = (value: string) => {
    const num = Math.max(1, Math.min(parseInt(value) || 1, maxAyah));
    setAyahStart(num);
    if (num > ayahEnd) {
      setAyahEnd(num);
    }
  };

  const handleAyahEndChange = (value: string) => {
    const num = Math.max(ayahStart, Math.min(parseInt(value) || ayahStart, maxAyah));
    setAyahEnd(num);
  };

  // Filter surahs by search
  const filteredSurahs = Object.entries(SURAH_NAMES_AR).filter(([num, name]) =>
    name.includes(searchQuery) || num.includes(searchQuery)
  );

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--sand-700)] flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[var(--emerald-600)]" strokeWidth={2} />
        اختيار الآية
      </h3>

      {/* Surah Select */}
      <div>
        <label className="text-xs text-[var(--sand-500)] block mb-1.5">السورة</label>
        <div className="relative">
          <select
            value={surahNumber}
            onChange={(e) => handleSurahChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--sand-200)] bg-[var(--sand-50)] text-[var(--sand-900)] text-sm focus:outline-none focus:border-[var(--emerald-400)] focus:ring-2 focus:ring-[var(--emerald-100)] appearance-none cursor-pointer"
          >
            {Object.entries(SURAH_NAMES_AR).map(([num, name]) => (
              <option key={num} value={num}>
                {num}. {name}
              </option>
            ))}
          </select>
          {isLoading && (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--emerald-600)] animate-spin" />
          )}
        </div>
      </div>

      {/* Ayah Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--sand-500)] block mb-1.5">من آية</label>
          <input
            type="number"
            value={ayahStart}
            onChange={(e) => handleAyahStartChange(e.target.value)}
            min={1}
            max={maxAyah}
            className="w-full px-4 py-3 rounded-xl border border-[var(--sand-200)] bg-[var(--sand-50)] text-[var(--sand-900)] text-sm focus:outline-none focus:border-[var(--emerald-400)] focus:ring-2 focus:ring-[var(--emerald-100)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--sand-500)] block mb-1.5">إلى آية</label>
          <input
            type="number"
            value={ayahEnd}
            onChange={(e) => handleAyahEndChange(e.target.value)}
            min={ayahStart}
            max={maxAyah}
            className="w-full px-4 py-3 rounded-xl border border-[var(--sand-200)] bg-[var(--sand-50)] text-[var(--sand-900)] text-sm focus:outline-none focus:border-[var(--emerald-400)] focus:ring-2 focus:ring-[var(--emerald-100)]"
          />
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن سورة..."
          className="w-full px-4 py-3 pr-10 rounded-xl border border-[var(--sand-200)] bg-[var(--sand-50)] text-[var(--sand-900)] text-sm focus:outline-none focus:border-[var(--emerald-400)] focus:ring-2 focus:ring-[var(--emerald-100)]"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--sand-400)]" strokeWidth={1.5} />
      </div>

      {/* Info */}
      <div className="text-xs text-[var(--sand-400)] bg-[var(--sand-100)] rounded-lg p-3">
        السورة {surahNumber} تحتوي على {maxAyah} آية
      </div>
    </section>
  );
}

