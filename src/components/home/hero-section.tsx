"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  Images,
  ArrowLeft,
} from "lucide-react";
import { FeaturesTicker } from "./features-ticker";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations - matching MVP exactly
      gsap.from(".reveal-heading", {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: "power3.out",
        delay: 0.2,
      });

      gsap.from(".reveal-sub", {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: "power3.out",
        delay: 0.5,
      });

      gsap.from(".reveal-cta", {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: "power3.out",
        delay: 0.7,
      });

      gsap.from(".reveal-verse", {
        duration: 1.2,
        y: 60,
        opacity: 0,
        ease: "power3.out",
        delay: 0.9,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col min-h-screen w-full overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 md:left-20 w-32 md:w-64 h-32 md:h-64 bg-emerald-200/30 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-40 right-10 md:right-40 w-48 md:w-96 h-48 md:h-96 bg-gold-200/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-3s" }}
      ></div>

      {/* Main Hero Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-12 pt-8 md:pt-40 pb-12 md:pb-24 flex flex-col justify-center flex-grow">
        {/* Badge */}
        <div className="mb-4 md:mb-8 flex flex-wrap items-center gap-2 md:gap-3 reveal-heading">
          <span className="text-[9px] md:text-[10px] uppercase text-emerald-700 tracking-widest font-body border border-emerald-200 bg-emerald-50 rounded-full px-3 md:px-4 py-1 md:py-1.5">
            الإصدار التجريبي
          </span>
          <span className="hidden md:block h-[1px] w-12 bg-emerald-200"></span>
          <span className="text-[9px] md:text-[10px] font-body text-sand-500">
            ✦ مجاني بالكامل ✦
          </span>
        </div>

        {/* Main Title */}
        <h1
          ref={titleRef}
          className="text-[clamp(1.75rem,5vw,5rem)] leading-[1.2] text-sand-900 tracking-tight mb-4 md:mb-8 font-heading font-light"
        >
          <span className="block">المصحف الرقمي</span>
          <span className="block text-gradient">شارك آيات القرآن</span>
          <span className="block text-sand-400">بإتقان وجمال</span>
        </h1>

        {/* Description */}
        <p
          ref={descRef}
          className="text-base md:text-xl text-sand-600 font-light max-w-xl mb-8 md:mb-12 leading-relaxed reveal-sub"
        >
          أداة مجانية لعرض ومشاركة الآيات القرآنية بخطوط عربية أصيلة وخلفيات
          جمالية، مع الحفاظ الكامل على قدسية النص القرآني.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center reveal-cta">
          <Link
            href="/create"
            className="group relative inline-flex items-center justify-center gap-2 md:gap-3 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 glow-emerald"
          >
            <Sparkles className="w-4 md:w-5 h-4 md:h-5" strokeWidth={2} />
            <span>ابدأ الآن</span>
            <ArrowLeft
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              strokeWidth={2}
            />
          </Link>

          <Link
            href="/gallery"
            className="group flex items-center justify-center gap-2 text-sand-600 hover:text-emerald-700 transition-colors text-sm font-medium border border-sand-200 px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <Images className="w-4 md:w-5 h-4 md:h-5" strokeWidth={1.5} />
            <span>تصفح المعرض</span>
          </Link>
        </div>

        {/* Sample Verse Preview */}
        <div ref={verseRef} className="mt-8 md:mt-16 relative reveal-verse">
          <div className="glass-panel rounded-2xl md:rounded-3xl p-5 md:p-12 max-w-3xl glow-emerald">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] md:text-xs text-sand-500 font-body">معاينة مباشرة</span>
            </div>
            <p className="quran-text text-xl md:text-4xl text-sand-800 text-center leading-loose">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="quran-text text-lg md:text-3xl text-sand-700 text-center mt-4 md:mt-6 leading-loose">
              ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ <span className="ayah-end">۝٢</span>
            </p>
            <div className="flex justify-center mt-4 md:mt-6">
              <span className="text-[10px] md:text-xs text-sand-400 font-body bg-sand-100 px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                سورة الفاتحة
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Ticker */}
      <FeaturesTicker />
    </section>
  );
}

