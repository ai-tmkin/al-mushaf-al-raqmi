import { memo } from "react";
import { Loader2 } from "lucide-react";

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  selectedFont: string;
  bgColor: string;
  bgImage: string;
  bgBlur: number;
  bgBrightness: number;
  bgOpacity: number;
  showBismillah: boolean;
  bismillahText: string;
  textColor: string;
  ayahsLoading: boolean;
  verseText: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  showSurahName: boolean;
  surahName: string | undefined;
}

export const PreviewCanvas = memo(function PreviewCanvas({
  canvasRef,
  width,
  height,
  selectedFont,
  bgColor,
  bgImage,
  bgBlur,
  bgBrightness,
  bgOpacity,
  showBismillah,
  bismillahText,
  textColor,
  ayahsLoading,
  verseText,
  fontSize,
  lineHeight,
  letterSpacing,
  showSurahName,
  surahName,
}: PreviewCanvasProps) {
  return (
    <div
      ref={canvasRef}
      className={`rounded-2xl shadow-2xl flex flex-col p-8 transition-all duration-300 relative overflow-hidden ${
        selectedFont === "amiri"
          ? "font-quran"
          : selectedFont === "scheherazade"
          ? "font-quran-scheherazade"
          : selectedFont === "noto"
          ? "font-quran-noto"
          : ""
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
      }}
    >
      {/* Background Image with Overlay and Filters */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)`,
              opacity: bgOpacity / 100,
              zIndex: 0,
            }}
          />
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundColor: bgColor,
              opacity: 0.7,
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Bismillah at top */}
      {showBismillah && (
        <div className="text-center mb-4 relative z-10">
          <p className="quran-text text-xl" style={{ color: textColor }}>
            {bismillahText}
          </p>
        </div>
      )}

      {/* Main verse text - centered and scrollable */}
      <div className="flex-1 overflow-auto px-4 py-4 relative z-10">
        <div className="min-h-full flex items-center justify-center">
          {ayahsLoading ? (
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          ) : (
            <p
              className="quran-text text-center"
              style={{
                color: textColor,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                letterSpacing: `${letterSpacing}px`,
                wordBreak: "break-word",
              }}
            >
              {verseText || "اختر الآيات لعرضها هنا"}
            </p>
          )}
        </div>
      </div>

      {/* Surah name at bottom */}
      {showSurahName && surahName && (
        <div className="text-center mt-4 relative z-10">
          <span
            className="text-xs px-3 py-1.5 rounded-full inline-block"
            style={{
              backgroundColor: `${textColor}15`,
              color: textColor,
            }}
          >
            سورة {surahName}
          </span>
        </div>
      )}
    </div>
  );
});

