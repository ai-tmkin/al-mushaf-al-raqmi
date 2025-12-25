"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Palette, FolderHeart, LayoutGrid, Search, Settings, User } from "lucide-react";
import gsap from "gsap";

const navItems = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/create", icon: Palette, label: "تصميم جديد" },
  { href: "/collections", icon: FolderHeart, label: "مجموعاتي" },
  { href: "/gallery", icon: LayoutGrid, label: "المعرض" },
  { href: "/search", icon: Search, label: "البحث" },
  { href: "/profile", icon: User, label: "الملف الشخصي" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

export function Sidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const navItems = navRef.current?.querySelectorAll("a");
    if (!navItems) return;

    navItems.forEach((item) => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(item, { x: x * 0.15, y: y * 0.15, duration: 0.3 });
      };

      const handleMouseLeave = () => {
        gsap.to(item, { x: 0, y: 0, duration: 0.3 });
      };

      item.addEventListener("mousemove", handleMouseMove);
      item.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        item.removeEventListener("mousemove", handleMouseMove);
        item.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, []);

  return (
    <aside className="fixed z-50 flex flex-col glass-panel w-[72px] h-screen border-sand-200 border-l pt-8 pb-8 top-0 right-0 items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center gap-2 cursor-pointer group">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl flex items-center justify-center text-white font-quran font-bold text-lg shadow-lg glow-emerald">
          مر
        </div>
        <span className="text-[9px] tracking-wide font-body text-sand-500 opacity-0 group-hover:opacity-100 transition-opacity">
          المصحف الرقمي
        </span>
      </Link>

      {/* Nav Items */}
      <nav ref={navRef} className="flex flex-col gap-6 w-full items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative p-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-emerald-50"
                  : "hover:bg-emerald-50"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? "text-emerald-700"
                    : "text-sand-500 group-hover:text-emerald-700"
                }`}
                strokeWidth={1.5}
              />
              <span className="tooltip absolute bg-emerald-900 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="vertical-text text-[9px] font-body text-sand-400 tracking-widest">
          متصل
        </span>
      </div>
    </aside>
  );
}
