"use client";

import { Type, Palette, Download, Sparkles, WifiOff } from "lucide-react";

export function FeaturesTicker() {
  return (
    <div className="w-full border-t border-sand-200 bg-white/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex gap-4 md:gap-8 text-[11px] font-body text-sand-500 overflow-x-auto no-scrollbar">
          <span className="whitespace-nowrap flex items-center gap-2">
            <Type className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            20+ خط عربي
          </span>
          <span className="text-sand-300">•</span>
          <span className="whitespace-nowrap flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            ألوان غير محدودة
          </span>
          <span className="text-sand-300">•</span>
          <span className="whitespace-nowrap flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            تصدير بجودة عالية
          </span>
          <span className="text-sand-300">•</span>
          <span className="whitespace-nowrap flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            تصاميم مخصصة
          </span>
          <span className="text-sand-300">•</span>
          <span className="whitespace-nowrap flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            يعمل بدون إنترنت
          </span>
        </div>
      </div>
    </div>
  );
}

