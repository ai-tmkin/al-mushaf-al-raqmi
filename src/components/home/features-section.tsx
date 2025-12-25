"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Palette, Share2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".feature-card");
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="w-full bg-emerald-950 border-t border-emerald-800">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="feature-card group relative overflow-hidden rounded-2xl bg-emerald-900/50 border border-emerald-700/30 p-8 backdrop-blur-md hover:bg-emerald-900/80 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800/50 flex items-center justify-center border border-emerald-700/50 text-emerald-300 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl text-white font-normal">114 سورة كاملة</h3>
            <p className="text-sm text-emerald-200/70 font-light leading-relaxed">
              جميع سور القرآن الكريم بالرسم العثماني الأصلي من مصحف المدينة المنورة.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="feature-card group relative overflow-hidden rounded-2xl bg-emerald-900/50 border border-emerald-700/30 p-8 backdrop-blur-md hover:bg-emerald-900/80 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/20 flex items-center justify-center border border-gold-500/30 text-gold-400 group-hover:scale-110 transition-transform duration-500">
              <Palette className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl text-white font-normal">تخصيص كامل</h3>
            <p className="text-sm text-emerald-200/70 font-light leading-relaxed">
              خطوط، ألوان، خلفيات، وتأثيرات متعددة لتصميم فريد يناسب ذوقك.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="feature-card group relative overflow-hidden rounded-2xl bg-white/10 border border-white/20 p-8 backdrop-blur-md hover:bg-white/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Share2 className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl text-white font-normal">مشاركة سهلة</h3>
            <p className="text-sm text-emerald-200/70 font-light leading-relaxed">
              صدّر بجودة عالية أو شارك مباشرة على وسائل التواصل الاجتماعي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

