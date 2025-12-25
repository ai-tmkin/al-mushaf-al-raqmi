"use client";

import Link from "next/link";
import { Twitter, Instagram, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sand-900 text-sand-400 py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center text-white font-quran text-lg">
                مر
              </div>
              <span className="text-white font-heading">المصحف الرقمي</span>
            </div>
            <p className="text-sm text-sand-500 leading-relaxed">
              أداة مجانية لتصميم ومشاركة الآيات القرآنية بطريقة جمالية.
            </p>
          </div>

          {/* App Links */}
          <div>
            <h5 className="text-white text-xs uppercase tracking-widest mb-6">
              التطبيق
            </h5>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/create" className="hover:text-white transition-colors">
                  تصميم جديد
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white transition-colors">
                  المعرض
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  مجموعاتي
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h5 className="text-white text-xs uppercase tracking-widest mb-6">
              الدعم
            </h5>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  الإبلاغ عن خطأ
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h5 className="text-white text-xs uppercase tracking-widest mb-6">
              تابعنا
            </h5>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-10 h-10 rounded-xl bg-sand-800 flex items-center justify-center hover:bg-emerald-800 transition-colors"
              >
                <Twitter className="w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-xl bg-sand-800 flex items-center justify-center hover:bg-emerald-800 transition-colors"
              >
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-xl bg-sand-800 flex items-center justify-center hover:bg-emerald-800 transition-colors"
              >
                <Github className="w-5 h-5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-sand-800 pt-8 text-center text-xs text-sand-600">
          <p>© 2025 المصحف الرقمي. جميع الحقوق محفوظة.</p>
          <p className="mt-2 text-sand-700">
            ﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾
          </p>
        </div>
      </div>
    </footer>
  );
}
