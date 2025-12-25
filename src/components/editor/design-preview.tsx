"use client";

import { useDesignStore } from "@/stores/design-store";
import { formatAyahWithSymbol, hasSajda, needsBismillah } from "@/lib/quran/api";
import { BISMILLAH } from "@/types/quran";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function DesignPreview() {
  const { selection, customization, isLoading } = useDesignStore();

  const {
    font,
    fontSize,
    fontColor,
    textAlign,
    lineHeight,
    backgroundType,
    backgroundColor,
    backgroundImage,
    showBismillah,
    showSajdaMarker,
    ayahEndSymbol,
    padding,
    borderRadius,
  } = customization;

  const getFontClass = () => {
    switch (font) {
      case "amiri":
        return "quran-amiri";
      case "scheherazade":
        return "quran-scheherazade";
      case "noto":
        return "quran-noto";
      default:
        return "";
    }
  };

  const getBackgroundStyle = () => {
    if (backgroundType === "image" && backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {
      backgroundColor,
    };
  };

  const shouldShowBismillah = () => {
    if (!showBismillah || !selection) return false;
    // Don't show if it's the first ayah of Al-Fatiha (bismillah is part of it)
    if (selection.surahNumber === 1 && selection.ayahStart === 1) return false;
    // Show bismillah for surahs that need it
    return needsBismillah(selection.surahNumber);
  };

  const renderVerseText = () => {
    if (!selection?.verses) return null;

    return selection.verses.map((verse) => {
      const hasSajdaMark =
        showSajdaMarker && hasSajda(selection.surahNumber, verse.numberInSurah);

      return (
        <span key={verse.numberInSurah}>
          {verse.text}{" "}
          {hasSajdaMark && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[var(--gold-100)] to-[var(--gold-200)] text-[var(--gold-800)] px-2 py-0.5 rounded text-[0.6em] mx-1">
              ۩ سجدة
            </span>
          )}
          <span className="ayah-end mx-1">
            {formatAyahWithSymbol("", verse.numberInSurah, ayahEndSymbol)}
          </span>
        </span>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[var(--emerald-600)] animate-spin" />
          <span className="text-sm text-[var(--sand-500)]">جاري تحميل الآيات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 flex items-center justify-center preview-canvas overflow-auto">
      <div
        id="design-canvas"
        className={cn(
          "w-[500px] h-[500px] flex flex-col items-center justify-center shadow-2xl transition-all duration-300"
        )}
        style={{
          ...getBackgroundStyle(),
          padding: `${padding}px`,
          borderRadius: `${borderRadius}px`,
        }}
      >
        {/* Bismillah */}
        {shouldShowBismillah() && (
          <p
            className={cn("quran-text mb-6", getFontClass())}
            style={{
              color: fontColor,
              fontSize: `${fontSize * 0.75}px`,
              opacity: 0.8,
            }}
          >
            {BISMILLAH}
          </p>
        )}

        {/* Main Verse */}
        <div
          className={cn("quran-text", getFontClass())}
          style={{
            color: fontColor,
            fontSize: `${fontSize}px`,
            lineHeight,
            textAlign,
          }}
        >
          {selection?.verses ? (
            renderVerseText()
          ) : (
            <span className="text-[var(--sand-400)]">اختر آية للمعاينة</span>
          )}
        </div>

        {/* Surah Name */}
        {selection && (
          <div className="mt-8">
            <span
              className="text-sm px-4 py-2 rounded-full"
              style={{
                backgroundColor: `${fontColor}10`,
                color: fontColor,
                opacity: 0.7,
              }}
            >
              سورة {selection.surahName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

