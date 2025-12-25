"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import {
  LayoutGrid,
  Heart,
  Download,
  Share2,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";
import html2canvas from "html2canvas";

export const dynamic = "force-dynamic";

const filters = [
  { id: "all", label: "الكل", icon: LayoutGrid },
  { id: "featured", label: "المميز", icon: Sparkles },
  { id: "trending", label: "الأكثر تفاعلاً", icon: TrendingUp },
  { id: "recent", label: "الأحدث", icon: Clock },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedDesigns, setLikedDesigns] = useState<string[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();

  // Fetch designs using API
  const fetchDesigns = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("📥 Fetching gallery designs...");
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        filter: activeFilter === "all" ? "recent" : activeFilter,
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/gallery?${params}`);
      const result = await response.json();

      if (result.success) {
        if (page === 1) {
          setDesigns(result.data || []);
        } else {
          setDesigns((prev) => [...prev, ...(result.data || [])]);
        }
        setHasMore(result.pagination?.hasMore || false);
      }
      
      console.log("✅ Gallery loaded:", result.data?.length || 0, "designs");
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, page]);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  // Fetch user's liked designs using API
  useEffect(() => {
    if (!user) return;

    const fetchLikes = async () => {
      try {
        const response = await fetch(`/api/likes/user?user_id=${user.id}`);
        const result = await response.json();

        if (result.success && result.data) {
          setLikedDesigns(result.data.map((like: any) => like.design_id));
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [user]);

  // GSAP animations
  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      const items = gridRef.current?.querySelectorAll(".masonry-item");
      if (items) {
        gsap.from(items, {
          duration: 0.6,
          y: 30,
          opacity: 0,
          stagger: 0.08,
          ease: "power3.out",
        });
      }
    }, gridRef);

    return () => ctx.revert();
  }, [isLoading, designs]);

  // Toggle like using API
  const toggleLike = async (designId: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول للإعجاب بالتصاميم");
      return;
    }

    const isLiked = likedDesigns.includes(designId);

    try {
      if (isLiked) {
        // Unlike via API
        const response = await fetch(
          `/api/likes?user_id=${user.id}&design_id=${designId}`,
          { method: "DELETE" }
        );
        
        if (response.ok) {
          setLikedDesigns((prev) => prev.filter((id) => id !== designId));
          // Update local likes count
          setDesigns((prev) =>
            prev.map((d) =>
              d.id === designId
                ? { ...d, likes_count: Math.max((d.likes_count || 0) - 1, 0) }
                : d
            )
          );
        }
      } else {
        // Like via API
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, design_id: designId }),
        });
        
        if (response.ok) {
          setLikedDesigns((prev) => [...prev, designId]);
          // Update local likes count
          setDesigns((prev) =>
            prev.map((d) =>
              d.id === designId
                ? { ...d, likes_count: (d.likes_count || 0) + 1 }
                : d
            )
          );
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Download design
  const handleDownload = async (design: any) => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "500px";
      tempDiv.style.height = "500px";
      
      const customization = design.customization || {};
      
      tempDiv.innerHTML = `
        <div style="
          width: 500px;
          height: 500px;
          background-color: ${customization.bgColor || "#ffffff"};
          ${customization.bgImage ? `background-image: url(${customization.bgImage});` : ""}
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-center;
          padding: 40px;
          font-family: 'Amiri', serif;
          font-size: ${customization.fontSize || 32}px;
          color: ${customization.textColor || "#1c1917"};
          text-align: center;
          line-height: ${customization.lineHeight || 1.8};
        ">
          ${design.verse_text || ""}
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${design.id}.png`;
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error downloading design:", error);
    }
  };

  // Load more
  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50">
        {/* Header */}
        <header className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white py-16 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-islamic-pattern opacity-5"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <h1 className="text-4xl font-light mb-4">معرض التصاميم</h1>
            <p className="text-emerald-200 text-lg mb-8 max-w-xl">
              اكتشف تصاميم إبداعية من المجتمع، واستلهم أفكاراً جديدة لآياتك.
            </p>
            <div className="relative max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن تصاميم..."
                className="w-full px-5 py-4 pr-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={1.5} />
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="sticky top-0 bg-white border-b border-sand-200 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors ${
                      activeFilter === filter.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-sand-600 hover:bg-sand-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <button className="flex items-center gap-2 text-sand-600 text-sm hover:text-sand-800">
              <Filter className="w-4 h-4" strokeWidth={1.5} />
              تصفية متقدمة
            </button>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {isLoading && page === 1 ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-sand-600">جاري تحميل التصاميم...</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-20">
              <LayoutGrid className="w-16 h-16 text-sand-300 mx-auto mb-4" strokeWidth={1} />
              <p className="text-sand-600 mb-2">لا توجد تصاميم</p>
              <p className="text-sm text-sand-500">جرب تغيير الفلتر أو البحث</p>
            </div>
          ) : (
            <div ref={gridRef} className="masonry-grid">
              {designs.map((design) => {
                const customization = design.customization || {};
                const profile = design.profiles || {};
                return (
                <div key={design.id} className="masonry-item group">
                  <div className="relative bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer">
                    <div
                      className="p-8 flex items-center justify-center relative"
                      style={{
                        backgroundColor: customization.bgColor || "#ffffff",
                        backgroundImage: customization.bgImage ? `url(${customization.bgImage})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        minHeight: "250px",
                      }}
                    >
                      {customization.bgImage && <div className="absolute inset-0 bg-black/40"></div>}
                      <p
                        className="font-quran text-xl text-center leading-loose relative z-10"
                        style={{ 
                          color: customization.textColor || "#1c1917",
                          fontSize: `${(customization.fontSize || 32) * 0.6}px`,
                        }}
                      >
                        {design.verse_text?.substring(0, 100) || ""}
                        {design.verse_text?.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Top Actions */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => toggleLike(design.id)}
                        className={`p-2 rounded-full backdrop-blur transition-colors ${
                          likedDesigns.includes(design.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/90 text-sand-700 hover:bg-white"
                        }`}
                      >
                        <Heart
                          className="w-4 h-4"
                          strokeWidth={1.5}
                          fill={likedDesigns.includes(design.id) ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {design.surah_name ? `سورة ${design.surah_name}` : ""}
                        </span>
                        <span className="text-xs opacity-80">
                          {design.ayah_start ? `آية ${design.ayah_start}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            {profile.display_name?.[0] || "م"}
                          </div>
                          <span className="text-xs opacity-70">
                            {profile.display_name || "مستخدم"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs">
                            <Heart className="w-3 h-3" fill="currentColor" />
                            {(design.likes_count || 0) + (likedDesigns.includes(design.id) ? 1 : 0)}
                          </span>
                          <button 
                            onClick={() => handleDownload(design)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Download className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <button className="hover:scale-110 transition-transform">
                            <Share2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && designs.length > 0 && (
            <div className="text-center mt-12">
              <button 
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8 py-3 bg-white border border-sand-200 text-sand-700 rounded-xl text-sm hover:bg-sand-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحميل...
                  </span>
                ) : (
                  "تحميل المزيد"
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
