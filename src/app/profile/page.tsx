"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Camera,
  Save,
  X,
  Loader2,
  Heart,
  Image as ImageIcon,
  FolderHeart,
  Award,
  Flame,
  Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const mainRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Stats
  const [stats, setStats] = useState({
    designs: 0,
    collections: 0,
    likes: 0,
    streak: 0,
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Set profile data
      if (profile) {
        setDisplayName(profile.display_name || "");
        setUsername(profile.username || "");
        setBio((profile as any).bio || "");
        setAvatarUrl(profile.avatar_url || "");
        setStats({
          designs: 0,
          collections: 0,
          likes: 0,
          streak: profile.streak_days || 0,
        });
      }

      // Fetch stats
      const [designsRes, collectionsRes] = await Promise.all([
        fetch(`/api/designs/user?user_id=${user.id}&limit=100`),
        fetch(`/api/collections?user_id=${user.id}`),
      ]);

      const designsData = await designsRes.json();
      const collectionsData = await collectionsRes.json();

      if (designsData.success) {
        const totalLikes = (designsData.data || []).reduce(
          (sum: number, d: any) => sum + (d.likes_count || 0),
          0
        );
        setStats((prev) => ({
          ...prev,
          designs: designsData.data?.length || 0,
          likes: totalLikes,
        }));
      }

      if (collectionsData.success) {
        setStats((prev) => ({
          ...prev,
          collections: collectionsData.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/auth/login?redirect=/profile");
      return;
    }

    loadProfile();
  }, [user, isAuthenticated, authLoading, router, loadProfile]);

  // GSAP animations
  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      gsap.from(".profile-card", {
        duration: 0.6,
        y: 30,
        opacity: 0,
        ease: "power3.out",
      });
      gsap.from(".stat-card", {
        duration: 0.5,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        delay: 0.3,
        ease: "power3.out",
      });
    }, mainRef);

    return () => ctx.revert();
  }, [isLoading]);

  // Save profile
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          display_name: displayName,
          username,
          bio,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل الملف الشخصي...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 p-4 md:p-8 lg:p-12">
        <div ref={mainRef} className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="profile-card bg-white rounded-2xl md:rounded-3xl border border-sand-200 overflow-hidden shadow-sm mb-6 md:mb-8">
            {/* Cover */}
            <div className="h-24 md:h-32 bg-gradient-to-br from-emerald-600 to-emerald-800 relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
            </div>

            {/* Avatar & Info */}
            <div className="px-4 md:px-8 pb-6 md:pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-12 md:-mt-16">
                {/* Avatar */}
                <div className="relative mx-auto md:mx-0">
                  <div className="w-24 md:w-32 h-24 md:h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-xl border-4 border-white">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      displayName?.[0] || user?.email?.[0] || "م"
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-sand-600 hover:text-emerald-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-right">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="الاسم المعروض"
                        className="w-full px-4 py-2 rounded-xl border border-sand-200 focus:outline-none focus:border-emerald-500 text-sm md:text-base"
                      />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="اسم المستخدم"
                        className="w-full px-4 py-2 rounded-xl border border-sand-200 focus:outline-none focus:border-emerald-500 text-sm md:text-base"
                        dir="ltr"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl md:text-2xl font-medium text-sand-900">
                        {displayName || "مستخدم جديد"}
                      </h1>
                      {username && (
                        <p className="text-sm md:text-base text-sand-500" dir="ltr">
                          @{username}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-center md:justify-start">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 md:px-4 py-2 rounded-xl border border-sand-200 text-sand-600 hover:bg-sand-50 transition-colors flex items-center gap-1.5 md:gap-2 text-sm md:text-base"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 md:px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 md:gap-2 disabled:opacity-50 text-sm md:text-base"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        حفظ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 md:px-4 py-2 rounded-xl border border-sand-200 text-sand-600 hover:bg-sand-50 transition-colors flex items-center gap-1.5 md:gap-2 text-sm md:text-base"
                    >
                      <Edit3 className="w-4 h-4" />
                      تعديل
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4 md:mt-6">
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="نبذة عنك..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:border-emerald-500 resize-none text-sm md:text-base"
                  />
                ) : bio ? (
                  <p className="text-sm md:text-base text-sand-600 text-center md:text-right">{bio}</p>
                ) : (
                  <p className="text-sm md:text-base text-sand-400 italic text-center md:text-right">لم تضف نبذة بعد</p>
                )}
              </div>

              {/* Meta */}
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-sand-500 justify-center md:justify-start">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4" />
                  <span dir="ltr" className="truncate max-w-[200px]">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Calendar className="w-4 h-4" />
                  <span>
                    انضم في{" "}
                    {new Date(user?.created_at || "").toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="stat-card bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 text-center">
              <ImageIcon className="w-6 md:w-8 h-6 md:h-8 text-emerald-600 mx-auto mb-1.5 md:mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-sand-900">{stats.designs}</p>
              <p className="text-xs md:text-sm text-sand-500">تصميم</p>
            </div>
            <div className="stat-card bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 text-center">
              <FolderHeart className="w-6 md:w-8 h-6 md:h-8 text-gold-600 mx-auto mb-1.5 md:mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-sand-900">{stats.collections}</p>
              <p className="text-xs md:text-sm text-sand-500">مجموعة</p>
            </div>
            <div className="stat-card bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 text-center">
              <Heart className="w-6 md:w-8 h-6 md:h-8 text-red-500 mx-auto mb-1.5 md:mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-sand-900">{stats.likes}</p>
              <p className="text-xs md:text-sm text-sand-500">إعجاب</p>
            </div>
            <div className="stat-card bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 text-center">
              <Flame className="w-6 md:w-8 h-6 md:h-8 text-orange-500 mx-auto mb-1.5 md:mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-sand-900">{stats.streak}</p>
              <p className="text-xs md:text-sm text-sand-500">يوم متتالي</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Link
              href="/collections"
              className="bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
            >
              <FolderHeart className="w-6 md:w-8 h-6 md:h-8 text-emerald-600 sm:mb-3" />
              <div>
                <h3 className="font-medium text-sand-900 text-sm md:text-base mb-0.5 md:mb-1">مجموعاتي</h3>
                <p className="text-xs md:text-sm text-sand-500">عرض وإدارة مجموعاتك</p>
              </div>
            </Link>
            <Link
              href="/create"
              className="bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
            >
              <Edit3 className="w-6 md:w-8 h-6 md:h-8 text-gold-600 sm:mb-3" />
              <div>
                <h3 className="font-medium text-sand-900 text-sm md:text-base mb-0.5 md:mb-1">إنشاء تصميم</h3>
                <p className="text-xs md:text-sm text-sand-500">ابدأ تصميماً جديداً</p>
              </div>
            </Link>
            <Link
              href="/settings"
              className="bg-white rounded-xl md:rounded-2xl border border-sand-200 p-4 md:p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
            >
              <Award className="w-6 md:w-8 h-6 md:h-8 text-purple-600 sm:mb-3" />
              <div>
                <h3 className="font-medium text-sand-900 text-sm md:text-base mb-0.5 md:mb-1">الإعدادات</h3>
                <p className="text-xs md:text-sm text-sand-500">تخصيص حسابك</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

