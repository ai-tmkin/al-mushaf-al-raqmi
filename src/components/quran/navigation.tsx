"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { SURAH_NAMES_AR, JUZ_NAMES_AR, TOTAL_PAGES, TOTAL_CHAPTERS, TOTAL_JUZS } from "@/lib/quran/quran-com-api";

interface QuranNavigationProps {
  mode: "surah" | "page" | "juz";
  currentPage: number;
  currentSurah: number;
  currentJuz: number;
  onPageChange: (page: number) => void;
  onSurahChange: (surah: number) => void;
  onJuzChange: (juz: number) => void;
}

export function QuranNavigation({
  mode,
  currentPage,
  currentSurah,
  currentJuz,
  onPageChange,
  onSurahChange,
  onJuzChange,
}: QuranNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current value display
  const getCurrentDisplay = () => {
    switch (mode) {
      case "surah":
        return SURAH_NAMES_AR[currentSurah] || `سورة ${currentSurah}`;
      case "page":
        return `صفحة ${currentPage}`;
      case "juz":
        return `الجزء ${currentJuz}`;
    }
  };

  // Get navigation limits
  const getNavLimits = () => {
    switch (mode) {
      case "surah":
        return { min: 1, max: TOTAL_CHAPTERS, current: currentSurah };
      case "page":
        return { min: 1, max: TOTAL_PAGES, current: currentPage };
      case "juz":
        return { min: 1, max: TOTAL_JUZS, current: currentJuz };
    }
  };

  const limits = getNavLimits();

  // Handle navigation
  const handlePrevious = () => {
    switch (mode) {
      case "surah":
        if (currentSurah > 1) onSurahChange(currentSurah - 1);
        break;
      case "page":
        if (currentPage > 1) onPageChange(currentPage - 1);
        break;
      case "juz":
        if (currentJuz > 1) onJuzChange(currentJuz - 1);
        break;
    }
  };

  const handleNext = () => {
    switch (mode) {
      case "surah":
        if (currentSurah < TOTAL_CHAPTERS) onSurahChange(currentSurah + 1);
        break;
      case "page":
        if (currentPage < TOTAL_PAGES) onPageChange(currentPage + 1);
        break;
      case "juz":
        if (currentJuz < TOTAL_JUZS) onJuzChange(currentJuz + 1);
        break;
    }
  };

  const handleSelect = (value: number) => {
    switch (mode) {
      case "surah":
        onSurahChange(value);
        break;
      case "page":
        onPageChange(value);
        break;
      case "juz":
        onJuzChange(value);
        break;
    }
    setIsDropdownOpen(false);
  };

  // Render dropdown items
  const renderDropdownItems = () => {
    switch (mode) {
      case "surah":
        return (
          <div className="grid grid-cols-2 gap-1 p-2 max-h-[400px] overflow-y-auto">
            {Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1).map((surah) => (
              <button
                key={surah}
                onClick={() => handleSelect(surah)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-right transition-colors ${
                  currentSurah === surah
                    ? "bg-emerald-100 text-emerald-700"
                    : "hover:bg-sand-100 text-sand-700"
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center bg-sand-100 rounded text-xs">
                  {surah}
                </span>
                <span className="truncate">{SURAH_NAMES_AR[surah]}</span>
              </button>
            ))}
          </div>
        );

      case "page":
        return (
          <div className="p-4">
            <div className="mb-4">
              <label className="text-xs text-sand-500 mb-2 block">انتقل إلى صفحة</label>
              <input
                type="number"
                min={1}
                max={TOTAL_PAGES}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= TOTAL_PAGES) {
                    handleSelect(val);
                  }
                }}
                className="w-full px-3 py-2 border border-sand-200 rounded-lg text-center"
              />
            </div>
            <div className="grid grid-cols-5 gap-1 max-h-[300px] overflow-y-auto">
              {Array.from({ length: 20 }, (_, i) => {
                const startPage = Math.floor((currentPage - 1) / 20) * 20 + 1;
                const page = startPage + i;
                if (page > TOTAL_PAGES) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handleSelect(page)}
                    className={`p-2 rounded text-sm transition-colors ${
                      currentPage === page
                        ? "bg-emerald-100 text-emerald-700"
                        : "hover:bg-sand-100 text-sand-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "juz":
        return (
          <div className="grid grid-cols-5 gap-2 p-3 max-h-[300px] overflow-y-auto">
            {Array.from({ length: TOTAL_JUZS }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                onClick={() => handleSelect(juz)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  currentJuz === juz
                    ? "bg-emerald-100 text-emerald-700"
                    : "hover:bg-sand-100 text-sand-600"
                }`}
              >
                <span className="text-lg font-medium">{juz}</span>
                <span className="text-[10px] text-sand-400 truncate w-full text-center">
                  {JUZ_NAMES_AR[juz]?.substring(0, 6)}
                </span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      <button
        onClick={handleNext}
        disabled={limits.current >= limits.max}
        className={`p-2 rounded-lg transition-colors ${
          limits.current >= limits.max
            ? "text-sand-300 cursor-not-allowed"
            : "hover:bg-sand-100 text-sand-600"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Current Selection Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-sand-200 rounded-lg text-sm text-sand-700 hover:border-emerald-300 transition-colors min-w-[120px] justify-between"
        >
          <span className="truncate">{getCurrentDisplay()}</span>
          <ChevronDown
            className={`w-4 h-4 text-sand-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-sand-200 z-50 min-w-[200px] md:min-w-[300px]">
            {renderDropdownItems()}
          </div>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={handlePrevious}
        disabled={limits.current <= limits.min}
        className={`p-2 rounded-lg transition-colors ${
          limits.current <= limits.min
            ? "text-sand-300 cursor-not-allowed"
            : "hover:bg-sand-100 text-sand-600"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Counter */}
      <span className="text-xs text-sand-400 hidden sm:inline">
        {limits.current} / {limits.max}
      </span>
    </div>
  );
}

