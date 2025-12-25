"use client";

import { useDesignStore } from "@/stores/design-store";
import { FONT_OPTIONS, COLOR_PRESETS } from "@/types/design";
import { AYAH_END_SYMBOLS } from "@/types/quran";
import { Type, Palette, Image, CircleDot, Layers, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

// Sample background images
const BACKGROUND_IMAGES = [
  "",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800",
];

export function CustomizationPanel() {
  const { customization, setCustomization, pushHistory } = useDesignStore();

  const updateWithHistory = (updates: Partial<typeof customization>) => {
    pushHistory();
    setCustomization(updates);
  };

  return (
    <div className="space-y-8">
      {/* Bismillah Toggle */}
      <section>
        <div className="flex items-center justify-between p-4 bg-[var(--emerald-50)] rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkle className="w-5 h-5 text-[var(--emerald-600)]" strokeWidth={1.5} />
            <span className="text-sm text-[var(--sand-700)]">إظهار البسملة</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={customization.showBismillah}
              onChange={(e) => updateWithHistory({ showBismillah: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--sand-200)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[var(--sand-300)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--emerald-600)]"></div>
          </label>
        </div>
      </section>

      {/* Font Selection */}
      <section>
        <h3 className="text-sm font-medium text-[var(--sand-700)] mb-4 flex items-center gap-2">
          <Type className="w-4 h-4 text-[var(--emerald-600)]" strokeWidth={2} />
          الخط
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((fontOption) => (
            <button
              key={fontOption.id}
              onClick={() => updateWithHistory({ font: fontOption.id as typeof customization.font })}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all",
                customization.font === fontOption.id
                  ? "border-[var(--emerald-500)] bg-[var(--emerald-50)]"
                  : "border-[var(--sand-200)] hover:border-[var(--emerald-300)]"
              )}
            >
              <span className={cn("text-lg block mb-1", fontOption.className)}>
                {fontOption.preview}
              </span>
              <span className="text-[10px] text-[var(--sand-500)]">{fontOption.name}</span>
            </button>
          ))}
        </div>

        {/* Font Size */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-[var(--sand-500)]">حجم الخط</label>
            <span className="text-xs text-[var(--emerald-600)] font-medium">
              {customization.fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="18"
            max="72"
            value={customization.fontSize}
            onChange={(e) => updateWithHistory({ fontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </section>

      {/* Colors */}
      <section>
        <h3 className="text-sm font-medium text-[var(--sand-700)] mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--emerald-600)]" strokeWidth={2} />
          الألوان
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--sand-600)]">لون النص</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customization.fontColor}
                onChange={(e) => updateWithHistory({ fontColor: e.target.value })}
                className="w-10 h-10 rounded-xl border-0 cursor-pointer shadow-sm"
              />
              <span className="text-xs text-[var(--sand-400)] font-mono">
                {customization.fontColor}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--sand-600)]">لون الخلفية</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customization.backgroundColor}
                onChange={(e) =>
                  updateWithHistory({
                    backgroundColor: e.target.value,
                    backgroundType: "color",
                  })
                }
                className="w-10 h-10 rounded-xl border-0 cursor-pointer shadow-sm"
              />
              <span className="text-xs text-[var(--sand-400)] font-mono">
                {customization.backgroundColor}
              </span>
            </div>
          </div>
        </div>

        {/* Color Presets */}
        <div className="mt-4">
          <label className="text-xs text-[var(--sand-500)] block mb-2">ألوان سريعة</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() =>
                  updateWithHistory({
                    fontColor: preset.textColor,
                    backgroundColor: preset.backgroundColor,
                    backgroundType: "color",
                  })
                }
                className="w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform border border-[var(--sand-200)]"
                style={{ backgroundColor: preset.backgroundColor }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Background Image */}
      <section>
        <h3 className="text-sm font-medium text-[var(--sand-700)] mb-4 flex items-center gap-2">
          <Image className="w-4 h-4 text-[var(--emerald-600)]" strokeWidth={2} />
          صورة الخلفية
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_IMAGES.map((url, index) => (
            <button
              key={index}
              onClick={() =>
                updateWithHistory({
                  backgroundImage: url,
                  backgroundType: url ? "image" : "color",
                })
              }
              className={cn(
                "aspect-square rounded-xl border-2 overflow-hidden transition-all",
                (customization.backgroundType === "image" && customization.backgroundImage === url) ||
                  (customization.backgroundType === "color" && !url)
                  ? "border-[var(--emerald-500)]"
                  : "border-[var(--sand-200)] hover:border-[var(--emerald-400)]"
              )}
            >
              {url ? (
                <img src={url.replace("w=800", "w=200")} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <span className="text-[var(--sand-400)] text-xs">بدون</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Ayah End Symbol */}
      <section>
        <h3 className="text-sm font-medium text-[var(--sand-700)] mb-4 flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-[var(--emerald-600)]" strokeWidth={2} />
          رمز نهاية الآية
        </h3>

        <div className="grid grid-cols-5 gap-2">
          {AYAH_END_SYMBOLS.map((symbol) => (
            <button
              key={symbol.id}
              onClick={() => updateWithHistory({ ayahEndSymbol: symbol.unicode })}
              className={cn(
                "aspect-square rounded-xl border-2 flex items-center justify-center text-2xl quran-text text-[var(--gold-600)] transition-all",
                customization.ayahEndSymbol === symbol.unicode
                  ? "border-[var(--emerald-500)] bg-[var(--emerald-50)]"
                  : "border-[var(--sand-200)] hover:border-[var(--emerald-400)]"
              )}
              title={symbol.name}
            >
              {symbol.unicode || <span className="text-xs text-[var(--sand-400)]">بدون</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Context Display */}
      <section>
        <div className="flex items-center justify-between p-4 bg-[var(--sand-50)] rounded-xl">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[var(--sand-500)]" strokeWidth={1.5} />
            <span className="text-sm text-[var(--sand-700)]">علامة السجدة</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={customization.showSajdaMarker}
              onChange={(e) => updateWithHistory({ showSajdaMarker: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--sand-200)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[var(--sand-300)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--emerald-600)]"></div>
          </label>
        </div>
      </section>
    </div>
  );
}

