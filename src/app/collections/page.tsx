"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { Plus, Edit3, Download, Trash2, FolderHeart, ArrowLeft, Loader2, Heart } from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";
import html2canvas from "html2canvas";

export const dynamic = "force-dynamic";

export default function CollectionsPage() {
  const mainRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  
  const [collections, setCollections] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  // Fetch collections and designs using API
  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("📥 Fetching collections for user:", user.id);

      // Use Promise.race with timeout
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

      // Fetch collections via API with timeout
      try {
        const collectionsRes = await Promise.race([
          fetch(`/api/collections?user_id=${user.id}`),
          timeout(10000)
        ]) as Response;
        const collectionsResult = await collectionsRes.json();
        
        if (collectionsResult.success) {
          setCollections(collectionsResult.data || []);
        }
      } catch (e) {
        console.warn("Collections fetch failed or timed out");
        setCollections([]);
      }

      // Fetch designs via API with timeout
      try {
        const designsRes = await Promise.race([
          fetch(`/api/designs/user?user_id=${user.id}&limit=20`),
          timeout(10000)
        ]) as Response;
        const designsResult = await designsRes.json();
        
        if (designsResult.success) {
          setDesigns(designsResult.data || []);
          // Calculate total likes
          const total = (designsResult.data || []).reduce(
            (sum: number, design: any) => sum + (design.likes_count || 0), 
            0
          );
          setTotalLikes(total);
        }
      } catch (e) {
        console.warn("Designs fetch failed or timed out");
        setDesigns([]);
      }
      
      console.log("✅ Data loaded");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Set a maximum wait time for auth
    const authTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth timeout - showing empty state");
        setIsLoading(false);
      }
    }, 5000);

    if (authLoading) return;
    
    clearTimeout(authTimeout);
    
    if (!isAuthenticated || !user) {
      router.push("/auth/login?redirect=/collections");
      return;
    }

    fetchData();
    
    return () => clearTimeout(authTimeout);
  }, [user, isAuthenticated, authLoading, router, fetchData]);

  // GSAP animations
  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      const elements = mainRef.current?.querySelectorAll(".animate-in");
      if (elements) {
        gsap.from(elements, {
          duration: 0.6,
          y: 20,
          opacity: 0,
          stagger: 0.1,
          ease: "power3.out",
        });
      }
    }, mainRef);

    return () => ctx.revert();
  }, [isLoading]);

  // Delete design using API
  const handleDelete = async (designId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التصميم؟")) return;
    if (!user) return;

    try {
      setDeletingId(designId);
      
      const response = await fetch(
        `/api/designs/user?id=${designId}&user_id=${user.id}`,
        { method: "DELETE" }
      );
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete");
      }

      // Remove from local state
      setDesigns(designs.filter((d) => d.id !== designId));
    } catch (error) {
      console.error("Error deleting design:", error);
      alert("حدث خطأ أثناء حذف التصميم");
    } finally {
      setDeletingId(null);
    }
  };

  // Create new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !user) return;

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: newCollectionName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCollections([result.data, ...collections]);
        setNewCollectionName("");
        setShowNewCollectionModal(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      alert("حدث خطأ أثناء إنشاء المجموعة");
    }
  };

  // Download design
  const handleDownload = async (design: any) => {
    try {
      // Create a temporary div to render the design
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
      alert("حدث خطأ أثناء تحميل التصميم");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل المجموعات...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main ref={mainRef} className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-in">
            <div className="flex items-center gap-3 mb-3">
              <FolderHeart className="w-8 h-8 text-emerald-700" strokeWidth={1.5} />
              <h1 className="text-4xl font-light text-sand-900">مجموعاتي</h1>
            </div>
            <p className="text-sand-600">جميع تصاميمك المحفوظة في مكان واحد</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12 animate-in">
            <div className="bg-white rounded-2xl p-6 border border-sand-200">
              <p className="text-3xl font-light text-sand-900 mb-1">
                {designs.length}
              </p>
              <p className="text-sm text-sand-500">تصميم محفوظ</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-sand-200">
              <p className="text-3xl font-light text-sand-900 mb-1">{collections.length}</p>
              <p className="text-sm text-sand-500">مجموعة</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-sand-200">
              <div className="flex items-center gap-2 justify-center">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" strokeWidth={1.5} />
                <p className="text-3xl font-light text-sand-900">{totalLikes}</p>
              </div>
              <p className="text-sm text-sand-500">إعجاب</p>
            </div>
          </div>

          {/* Collections Groups */}
          {collections.length > 0 && (
            <div className="mb-12 animate-in">
              <h2 className="text-lg font-normal text-sand-800 mb-4">المجموعات</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collections.map((collection, idx) => {
                  const gradients = [
                    { bg: "from-emerald-100 to-emerald-50", text: "text-emerald-800" },
                    { bg: "from-gold-100 to-gold-50", text: "text-gold-800" },
                    { bg: "from-sand-800 to-sand-900", text: "text-sand-100" },
                  ];
                  const style = gradients[idx % gradients.length];
                  
                  return (
                    <div
                      key={collection.id}
                      className="group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer"
                    >
                      <div className={`aspect-video bg-gradient-to-br ${style.bg} p-6 flex items-center justify-center`}>
                        <p className={`font-quran text-xl ${style.text} text-center`}>
                          {collection.name}
                        </p>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-sand-900 mb-1">{collection.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-sand-500">
                            {collection.designs?.[0]?.count || 0} تصاميم
                          </span>
                          <ArrowLeft className="w-4 h-4 text-sand-400 group-hover:text-emerald-600 transition-colors" strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Designs */}
          <div className="animate-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-normal text-sand-800">التصاميم الأخيرة</h2>
            </div>

            {designs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-sand-200">
                <FolderHeart className="w-16 h-16 text-sand-300 mx-auto mb-4" strokeWidth={1} />
                <p className="text-sand-600 mb-4">لا توجد تصاميم محفوظة بعد</p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                  <span>إنشاء تصميم جديد</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {designs.map((design) => {
                  const customization = design.customization || {};
                  return (
                    <div
                      key={design.id}
                      className="group relative aspect-square bg-white rounded-xl border border-sand-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div
                        className="absolute inset-0 p-4 flex items-center justify-center"
                        style={{
                          backgroundColor: customization.bgColor || "#ffffff",
                          backgroundImage: customization.bgImage ? `url(${customization.bgImage})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <p
                          className="font-quran text-sm text-center line-clamp-4"
                          style={{ 
                            color: customization.textColor || "#1c1917",
                            fontSize: `${(customization.fontSize || 32) * 0.4}px`,
                          }}
                        >
                          {design.verse_text || ""}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/create?id=${design.id}`)}
                          className="p-2 bg-white rounded-lg hover:bg-sand-100 transition-colors"
                          title="تحرير"
                        >
                          <Edit3 className="w-4 h-4 text-sand-700" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDownload(design)}
                          className="p-2 bg-white rounded-lg hover:bg-sand-100 transition-colors"
                          title="تحميل"
                        >
                          <Download className="w-4 h-4 text-sand-700" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(design.id)}
                          disabled={deletingId === design.id}
                          className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          {deletingId === design.id ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New */}
                <Link
                  href="/create"
                  className="aspect-square rounded-xl border-2 border-dashed border-sand-300 flex flex-col items-center justify-center gap-2 text-sand-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                >
                  <Plus className="w-8 h-8" strokeWidth={1.5} />
                  <span className="text-xs">تصميم جديد</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
