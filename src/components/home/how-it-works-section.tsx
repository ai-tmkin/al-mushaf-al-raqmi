"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = sectionRef.current?.querySelectorAll(".step-card, h2, .section-subtitle");
      if (elements) {
        gsap.fromTo(
          elements,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
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
    <section ref={sectionRef} className="py-32 px-6 md:px-12 bg-white border-b border-sand-200">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <span className="section-subtitle text-xs font-body uppercase tracking-widest text-emerald-600 block mb-3">
            كيف يعمل
          </span>
          <h2 className="text-[40px] tracking-tight font-light text-sand-900">
            ثلاث خطوات بسيطة
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="step-card relative text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <span className="text-3xl font-quran">١</span>
            </div>
            <h3 className="text-xl font-normal mb-3 text-sand-900">اختر الآية</h3>
            <p className="text-sm text-sand-500 leading-relaxed">
              ابحث عن الآية أو السورة التي تريد تصميمها من القرآن الكريم كاملاً.
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-card relative text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gold-50 flex items-center justify-center text-gold-700 group-hover:bg-gold-100 transition-colors">
              <span className="text-3xl font-quran">٢</span>
            </div>
            <h3 className="text-xl font-normal mb-3 text-sand-900">خصّص العرض</h3>
            <p className="text-sm text-sand-500 leading-relaxed">
              اختر الخط والألوان والخلفية وجميع عناصر العرض بحرية كاملة.
            </p>
          </div>

          {/* Step 3 */}
          <div className="step-card relative text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
              <span className="text-3xl font-quran">٣</span>
            </div>
            <h3 className="text-xl font-normal mb-3 text-sand-900">صدّر وشارك</h3>
            <p className="text-sm text-sand-500 leading-relaxed">
              احفظ التصميم بجودة عالية أو شاركه مباشرة مع أصدقائك وعائلتك.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-8 py-4 rounded-2xl font-medium text-sm hover:bg-emerald-100 transition-colors"
          >
            <span>ابدأ الآن مجاناً</span>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
