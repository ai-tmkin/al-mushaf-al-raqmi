"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = sectionRef.current?.querySelectorAll("h2, p, a");
      if (elements) {
        gsap.fromTo(
          elements,
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
    <section
      ref={sectionRef}
      className="py-32 px-6 md:px-12 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-islamic-pattern opacity-10"></div>
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl text-white font-light mb-6">
          ابدأ رحلتك مع القرآن
        </h2>
        <p className="text-lg text-emerald-200/80 mb-10 leading-relaxed">
          انضم إلى آلاف المستخدمين الذين يشاركون جمال القرآن الكريم بتصاميم فريدة ومميزة.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-3 bg-white text-emerald-900 px-10 py-5 rounded-2xl font-medium text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
        >
          <Sparkles className="w-5 h-5" strokeWidth={2} />
          <span>ابدأ الآن</span>
        </Link>
      </div>
    </section>
  );
}
