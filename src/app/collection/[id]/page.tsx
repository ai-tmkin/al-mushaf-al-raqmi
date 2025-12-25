"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  FolderHeart,
  ArrowRight,
  Loader2,
  Edit3,
  Trash2,
  Plus,
  Image as ImageIcon,
  Lock,
  Globe,
  MoreVertical,
  Download,
  Heart,
} from "lucide-react";
import html2canvas from "html2canvas";

export const dynamic = "force-dynamic";

export default function CollectionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const collectionId = params.id as string;
  const mainRef = useRef<HTMLDivElement>(null);

  const [collection, setCollection] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load collection
  const loadCollection = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch collection details
      const response = await fetch(`/api/collections/${collectionId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCollection(result.data);
        setEditName(result.data.name || "");
        setEditDescription(result.data.description || "");
        setDesigns(result.data.designs || []);
      } else {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error loading collection:", error);
      router.push("/collections");
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, router]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      router.push("/auth/login?redirect=/collection/" + collectionId);
      return;
    }

    loadCollection();
  }, [authLoading, isAuthenticated, user, router, loadCollection, collectionId]);

  // GSAP animations
  useEffect(() => {
    if (isLoading || !collection) return;

    const ctx = gsap.context(() => {
      gsap.from(".collection-header", {
        duration: 0.6,
        y: -20,
        opacity: 0,
        ease: "power3.out",
      });
      gsap.from(".design-card", {
        duration: 0.5,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        delay: 0.3,
        ease: "power3.out",
      });
    }, mainRef);

    return () => ctx.revert();
  }, [isLoading, collection]);

  // Save collection
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: editName,
          description: editDescription,
        }),
      });

      if (response.ok) {
        setCollection((prev: any) => ({
          ...prev,
          name: editName,
          description: editDescription,
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving collection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete collection
  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف جميع التصاميم فيها.")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/collections?id=${collectionId}&user_id=${user.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    } finally {
      setIsDeleting(false);
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
          justify-content: center;
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
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!))
      );

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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل المجموعة...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  const isOwner = user?.id === collection.user_id;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 p-8 md:p-12">
        <div ref={mainRef} className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 mb-8 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للمجموعات
          </Link>

          {/* Collection Header */}
          <div className="collection-header bg-white rounded-2xl border border-sand-200 p-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <FolderHeart className="w-8 h-8 text-white" />
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-medium text-sand-900 bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-medium text-sand-900">{collection.name}</h1>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm text-sand-500">
                    <span>{designs.length} تصميم</span>
                    <span>•</span>
                    {collection.is_public ? (
                      <span className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        عامة
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        خاصة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl border border-sand-200 text-sand-600 hover:bg-sand-50"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        حفظ
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-xl border border-sand-200 text-sand-600 hover:bg-sand-50"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="وصف المجموعة..."
                rows={2}
                className="w-full mt-4 px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            ) : collection.description ? (
              <p className="mt-4 text-sand-600">{collection.description}</p>
            ) : null}
          </div>

          {/* Designs Grid */}
          {designs.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 text-sand-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-sand-700 mb-2">لا توجد تصاميم</h3>
              <p className="text-sand-500 mb-6">ابدأ بإضافة تصاميم لهذه المجموعة</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                إنشاء تصميم جديد
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map((design) => {
                const customization = design.customization || {};
                return (
                  <div
                    key={design.id}
                    className="design-card group bg-white rounded-2xl border border-sand-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Preview */}
                    <Link href={`/design/${design.id}`}>
                      <div
                        className="aspect-square flex items-center justify-center p-6"
                        style={{
                          backgroundColor: customization.bgColor || "#ffffff",
                          backgroundImage: customization.bgImage
                            ? `url(${customization.bgImage})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <p
                          className="text-center font-quran line-clamp-4"
                          style={{
                            color: customization.textColor || "#1c1917",
                            fontSize: `${Math.min(customization.fontSize || 24, 24)}px`,
                          }}
                        >
                          {design.verse_text?.substring(0, 150) || ""}
                        </p>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4 border-t border-sand-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-sand-500">
                          سورة {design.surah_number} • آية {design.ayah_start}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(design)}
                            className="p-2 rounded-lg text-sand-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/create?id=${design.id}`}
                            className="p-2 rounded-lg text-sand-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-sand-400">
                        <Heart className="w-3 h-3" />
                        <span>{design.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Card */}
              {isOwner && (
                <Link
                  href="/create"
                  className="design-card flex flex-col items-center justify-center aspect-square bg-sand-50 rounded-2xl border-2 border-dashed border-sand-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  <Plus className="w-12 h-12 text-sand-300 group-hover:text-emerald-500 transition-colors" />
                  <span className="mt-2 text-sand-500 group-hover:text-emerald-600 transition-colors">
                    إضافة تصميم
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

