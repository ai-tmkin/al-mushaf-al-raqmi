"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  Heart,
  Download,
  Share2,
  Edit3,
  Trash2,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import html2canvas from "html2canvas";

export const dynamic = "force-dynamic";

export default function DesignViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const designId = params.id as string;
  const mainRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [design, setDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load design
  const loadDesign = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/designs?id=${designId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setDesign(result.data);
        setLikesCount(result.data.likes_count || 0);
      } else {
        router.push("/gallery");
      }
    } catch (error) {
      console.error("Error loading design:", error);
      router.push("/gallery");
    } finally {
      setIsLoading(false);
    }
  }, [designId, router]);

  // Check if user liked
  const checkLiked = useCallback(async () => {
    if (!user || !designId) return;

    try {
      const response = await fetch(`/api/likes?user_id=${user.id}&design_id=${designId}`);
      const result = await response.json();
      setIsLiked(result.success && result.liked);
    } catch (error) {
      console.error("Error checking like:", error);
    }
  }, [user, designId]);

  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  useEffect(() => {
    if (user) {
      checkLiked();
    }
  }, [user, checkLiked]);

  // GSAP animations
  useEffect(() => {
    if (isLoading || !design) return;

    const ctx = gsap.context(() => {
      gsap.from(".design-preview", {
        duration: 0.8,
        scale: 0.95,
        opacity: 0,
        ease: "power3.out",
      });
      gsap.from(".design-info", {
        duration: 0.6,
        x: 30,
        opacity: 0,
        delay: 0.2,
        ease: "power3.out",
      });
    }, mainRef);

    return () => ctx.revert();
  }, [isLoading, design]);

  // Toggle like
  const handleLike = async () => {
    if (!user) {
      router.push("/auth/login?redirect=/design/" + designId);
      return;
    }

    try {
      if (isLiked) {
        await fetch(`/api/likes?user_id=${user.id}&design_id=${designId}`, {
          method: "DELETE",
        });
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, design_id: designId }),
        });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Download
  const handleDownload = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${designId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
    }
  };

  // Share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "تصميم من المصحف الرقمي",
          text: design?.verse_text?.substring(0, 100) || "",
          url,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!user || user.id !== design?.user_id) return;
    if (!confirm("هل أنت متأكد من حذف هذا التصميم؟")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/designs/user?id=${designId}&user_id=${user.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل التصميم...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!design) {
    return null;
  }

  const customization = design.customization || {};
  const isOwner = user?.id === design.user_id;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 p-8 md:p-12">
        <div ref={mainRef} className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 mb-8 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للمعرض
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Design Preview */}
            <div className="design-preview">
              <div
                ref={canvasRef}
                className="rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: customization.bgColor || "#ffffff",
                  backgroundImage: customization.bgImage
                    ? `url(${customization.bgImage})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  aspectRatio: "1",
                }}
              >
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{
                    backgroundColor: customization.bgImage
                      ? `rgba(0,0,0,${(customization.bgOpacity || 30) / 100})`
                      : "transparent",
                  }}
                >
                  <p
                    className="text-center font-quran"
                    style={{
                      color: customization.textColor || "#1c1917",
                      fontSize: `${customization.fontSize || 32}px`,
                      lineHeight: customization.lineHeight || 1.8,
                      letterSpacing: `${customization.letterSpacing || 0}px`,
                    }}
                  >
                    {design.verse_text || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Design Info */}
            <div className="design-info space-y-6">
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isLiked
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-white text-sand-600 border border-sand-200 hover:border-red-300"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-sand-600 border border-sand-200 hover:border-emerald-300 transition-all"
                >
                  <Download className="w-5 h-5" />
                  تحميل
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-sand-600 border border-sand-200 hover:border-emerald-300 transition-all"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Share2 className="w-5 h-5" />
                  )}
                  {copied ? "تم النسخ!" : "مشاركة"}
                </button>

                {isOwner && (
                  <>
                    <Link
                      href={`/create?id=${designId}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                      تعديل
                    </Link>

                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                      حذف
                    </button>
                  </>
                )}
              </div>

              {/* Verse Info */}
              <div className="bg-white rounded-2xl border border-sand-200 p-6">
                <h2 className="text-lg font-medium text-sand-900 mb-4">معلومات الآية</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sand-500">السورة</span>
                    <span className="text-sand-900">سورة رقم {design.surah_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sand-500">الآيات</span>
                    <span className="text-sand-900">
                      {design.ayah_start === design.ayah_end
                        ? `آية ${design.ayah_start}`
                        : `من ${design.ayah_start} إلى ${design.ayah_end}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Design Settings */}
              <div className="bg-white rounded-2xl border border-sand-200 p-6">
                <h2 className="text-lg font-medium text-sand-900 mb-4">إعدادات التصميم</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sand-500">الخط</span>
                    <span className="text-sand-900 capitalize">{customization.font || "Amiri"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sand-500">حجم الخط</span>
                    <span className="text-sand-900">{customization.fontSize || 32}px</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sand-500">لون النص</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-sand-200"
                        style={{ backgroundColor: customization.textColor || "#1c1917" }}
                      />
                      <span className="text-sand-900 font-mono text-xs">
                        {customization.textColor || "#1c1917"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sand-500">لون الخلفية</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-sand-200"
                        style={{ backgroundColor: customization.bgColor || "#ffffff" }}
                      />
                      <span className="text-sand-900 font-mono text-xs">
                        {customization.bgColor || "#ffffff"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="bg-white rounded-2xl border border-sand-200 p-6">
                <div className="flex items-center gap-4 text-sm text-sand-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(design.created_at).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {design.is_public && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                      عام
                    </span>
                  )}
                </div>
              </div>

              {/* Copy Settings */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(customization, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sand-100 text-sand-700 hover:bg-sand-200 transition-all"
              >
                <Copy className="w-5 h-5" />
                نسخ إعدادات التصميم
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

