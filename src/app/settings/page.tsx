"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  Sun,
  Moon,
  Laptop,
  Type,
  LogOut,
  Save,
  Loader2,
  Check,
  Download,
  Trash2,
  AlertTriangle,
  Camera,
  Mail,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();
  
  // Settings state
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("ar");
  const [defaultFont, setDefaultFont] = useState("amiri");
  const [showBismillah, setShowBismillah] = useState(true);
  const [showSajda, setShowSajda] = useState(true);
  const [ayahSymbol, setAyahSymbol] = useState("۝");
  const [exportQuality, setExportQuality] = useState("high");
  const [storageProvider, setStorageProvider] = useState("b2");
  const [dailyVerse, setDailyVerse] = useState(true);
  const [galleryUpdates, setGalleryUpdates] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingDesigns, setIsDeletingDesigns] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<"designs" | "account" | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const mainRef = useRef<HTMLDivElement>(null);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log("📥 Loading settings for user:", user.id);
      
      const response = await fetch(`/api/settings?user_id=${user.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const { locale, theme: savedTheme, default_settings, notification_preferences } = result.data;
        
        // Apply loaded settings
        if (locale) setLanguage(locale);
        if (savedTheme) setTheme(savedTheme);
        
        if (default_settings) {
          if (default_settings.font) setDefaultFont(default_settings.font);
          if (default_settings.showBismillah !== undefined) setShowBismillah(default_settings.showBismillah);
          if (default_settings.showSajda !== undefined) setShowSajda(default_settings.showSajda);
          if (default_settings.ayahSymbol) setAyahSymbol(default_settings.ayahSymbol);
          if (default_settings.exportQuality) setExportQuality(default_settings.exportQuality);
          if (default_settings.storageProvider) setStorageProvider(default_settings.storageProvider);
        }
        
        if (notification_preferences) {
          if (notification_preferences.dailyVerse !== undefined) setDailyVerse(notification_preferences.dailyVerse);
          if (notification_preferences.galleryUpdates !== undefined) setGalleryUpdates(notification_preferences.galleryUpdates);
        }
        
        console.log("✅ Settings loaded");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }
    
    loadSettings();
  }, [user, isAuthenticated, authLoading, router, loadSettings]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
    setSaveSuccess(false);
  }, [theme, language, defaultFont, showBismillah, showSajda, ayahSymbol, exportQuality, storageProvider, dailyVerse, galleryUpdates]);

  // Save settings
  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      console.log("💾 Saving settings...");
      
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          locale: language,
          theme,
          default_settings: {
            font: defaultFont,
            showBismillah,
            showSajda,
            ayahSymbol,
            exportQuality,
            storageProvider,
          },
          notification_preferences: {
            dailyVerse,
            galleryUpdates,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log("✅ Settings saved");
        setHasChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      await signOut();
      router.push("/");
    }
  };

  // Export user data
  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [designsRes, collectionsRes] = await Promise.all([
        fetch(`/api/designs/user?user_id=${user.id}`),
        fetch(`/api/collections?user_id=${user.id}`),
      ]);
      
      const designsData = await designsRes.json();
      const collectionsData = await collectionsRes.json();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          displayName: profile?.display_name,
        },
        settings: {
          locale: language,
          theme,
          defaultSettings: {
            font: defaultFont,
            showBismillah,
            showSajda,
            ayahSymbol,
            exportQuality,
            storageProvider,
          },
          notifications: {
            dailyVerse,
            galleryUpdates,
          },
        },
        designs: designsData.success ? designsData.data : [],
        collections: collectionsData.success ? collectionsData.data : [],
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mushaf-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log("✅ Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("حدث خطأ أثناء تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  // Delete all designs
  const handleDeleteAllDesigns = async () => {
    if (!user || deleteConfirmText !== "حذف التصاميم") return;
    
    setIsDeletingDesigns(true);
    try {
      const response = await fetch(`/api/designs/user?user_id=${user.id}&delete_all=true`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        alert("تم حذف جميع التصاميم بنجاح");
        setShowDeleteConfirm(null);
        setDeleteConfirmText("");
      } else {
        throw new Error("Failed to delete designs");
      }
    } catch (error) {
      console.error("Error deleting designs:", error);
      alert("حدث خطأ أثناء حذف التصاميم");
    } finally {
      setIsDeletingDesigns(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "حذف الحساب") return;
    
    setIsDeletingAccount(true);
    try {
      // Note: This would need a server-side implementation
      // For now, we'll just sign out
      alert("تم إرسال طلب حذف الحساب. سيتم التواصل معك عبر البريد الإلكتروني.");
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("حدث خطأ أثناء حذف الحساب");
    } finally {
      setIsDeletingAccount(false);
    }
  };

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

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
    </label>
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="md:mr-[72px] md:w-[calc(100%-72px)] w-full pt-14 md:pt-0 pb-20 md:pb-0 bg-sand-50 p-4 md:p-12">
        <div ref={mainRef} className="max-w-4xl mx-auto">
          {/* Header with Save Button */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8 md:mb-12 animate-in">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <SettingsIcon className="w-6 md:w-8 h-6 md:h-8 text-emerald-700" strokeWidth={1.5} />
                <h1 className="text-2xl md:text-4xl font-light text-sand-900">الإعدادات</h1>
              </div>
              <p className="text-sm md:text-base text-sand-600">تخصيص تجربتك في المصحف الرقمي</p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all ${
                saveSuccess
                  ? "bg-emerald-100 text-emerald-700"
                  : hasChanges
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-sand-200 text-sand-400 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 md:w-5 h-4 md:h-5" />
              ) : (
                <Save className="w-4 md:w-5 h-4 md:h-5" />
              )}
              {isSaving ? "جاري الحفظ..." : saveSuccess ? "تم الحفظ!" : "حفظ التغييرات"}
            </button>
          </div>

          {/* Profile Section */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-4 md:p-6 border-b border-sand-100">
              <h2 className="text-base md:text-lg font-normal text-sand-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                الملف الشخصي
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {profile?.display_name?.[0] || user?.email?.[0] || "م"}
                  </div>
                  <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-lg font-medium text-sand-900 mb-1">
                    {profile?.display_name || "مستخدم"}
                  </h3>
                  <p className="text-sm text-sand-500 mb-3">{user?.email}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <button 
                      onClick={() => router.push("/profile")}
                      className="text-sm text-emerald-600 hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-lg"
                    >
                      عرض الملف الشخصي
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Security */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-4 md:p-6 border-b border-sand-100">
              <h2 className="text-base md:text-lg font-normal text-sand-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                أمان الحساب
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">البريد الإلكتروني</h3>
                    <p className="text-xs text-sand-500 mt-1" dir="ltr">{user?.email}</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                    مُفعّل
                  </span>
                </div>
              </div>
              <button 
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full p-4 md:p-6 text-right hover:bg-sand-50 transition-colors"
              >
                <h3 className="text-sm font-medium text-sand-900">تغيير كلمة المرور</h3>
                <p className="text-xs text-sand-500 mt-1">تحديث كلمة المرور الخاصة بك</p>
              </button>
            </div>
          </section>

          {/* Appearance Settings */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-lg font-normal text-sand-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                المظهر
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              {/* Theme */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">المظهر</h3>
                    <p className="text-xs text-sand-500">اختر المظهر المناسب</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 ${
                      theme === "light"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sand-100 text-sand-600"
                    }`}
                  >
                    <Sun className="w-4 h-4" strokeWidth={2} />
                    فاتح
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sand-100 text-sand-600"
                    }`}
                  >
                    <Moon className="w-4 h-4" strokeWidth={2} />
                    داكن
                  </button>
                  <button
                    onClick={() => setTheme("auto")}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 ${
                      theme === "auto"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sand-100 text-sand-600"
                    }`}
                  >
                    <Laptop className="w-4 h-4" strokeWidth={2} />
                    تلقائي
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">اللغة</h3>
                    <p className="text-xs text-sand-500">لغة واجهة التطبيق</p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-sand-200 bg-sand-50 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                    <option value="ur">اردو</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Default Design Settings */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-lg font-normal text-sand-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                إعدادات التصميم الافتراضية
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              {/* Default Font */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">الخط الافتراضي</h3>
                    <p className="text-xs text-sand-500">الخط المستخدم للآيات</p>
                  </div>
                  <select
                    value={defaultFont}
                    onChange={(e) => setDefaultFont(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-sand-200 bg-sand-50 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="amiri">Amiri</option>
                    <option value="scheherazade">Scheherazade New</option>
                    <option value="noto">Noto Naskh Arabic</option>
                  </select>
                </div>
              </div>

              {/* Show Bismillah */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">إظهار البسملة تلقائياً</h3>
                    <p className="text-xs text-sand-500">إضافة البسملة عند بداية التصميم</p>
                  </div>
                  <ToggleSwitch checked={showBismillah} onChange={setShowBismillah} />
                </div>
              </div>

              {/* Show Sajda Marker */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">علامة السجدة</h3>
                    <p className="text-xs text-sand-500">إظهار علامة السجدة في آيات السجدة</p>
                  </div>
                  <ToggleSwitch checked={showSajda} onChange={setShowSajda} />
                </div>
              </div>

              {/* Ayah End Symbol */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">رمز نهاية الآية</h3>
                    <p className="text-xs text-sand-500">الشكل الافتراضي لرمز نهاية الآية</p>
                  </div>
                  <div className="flex gap-2">
                    {["۝", "۞", "⁕"].map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => setAyahSymbol(symbol)}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl font-quran text-gold-600 ${
                          ayahSymbol === symbol
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-sand-200 hover:border-emerald-400"
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Quality */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">جودة التصدير</h3>
                    <p className="text-xs text-sand-500">دقة الصور المصدرة</p>
                  </div>
                  <select
                    value={exportQuality}
                    onChange={(e) => setExportQuality(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-sand-200 bg-sand-50 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="standard">قياسي (1080px)</option>
                    <option value="high">عالي (1920px)</option>
                    <option value="print">طباعة (3000px)</option>
                  </select>
                </div>
              </div>

              {/* Storage Provider */}
              <div className="p-6 border-t border-sand-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">مزود التخزين</h3>
                    <p className="text-xs text-sand-500">اختر مكان حفظ الصور</p>
                  </div>
                  <select
                    value={storageProvider}
                    onChange={(e) => setStorageProvider(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-sand-200 bg-sand-50 text-sm focus:outline-none focus:border-emerald-400"
                  >
                    <option value="b2">Backblaze B2 (موصى به)</option>
                    <option value="supabase">Supabase Storage</option>
                  </select>
                </div>
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xs text-emerald-700">
                    💡 {storageProvider === "b2" 
                      ? "Backblaze B2 يوفر تخزين سريع وموثوق مع تكلفة منخفضة"
                      : "Supabase Storage مدمج مع قاعدة البيانات لسهولة الإدارة"
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-lg font-normal text-sand-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                الإشعارات
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              {/* Daily Verse */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">الآية اليومية</h3>
                    <p className="text-xs text-sand-500">استلم آية يومية للتأمل</p>
                  </div>
                  <ToggleSwitch checked={dailyVerse} onChange={setDailyVerse} />
                </div>
              </div>

              {/* Gallery Updates */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-sand-900">تحديثات المعرض</h3>
                    <p className="text-xs text-sand-500">إشعارات بالتصاميم الجديدة المميزة</p>
                  </div>
                  <ToggleSwitch checked={galleryUpdates} onChange={setGalleryUpdates} />
                </div>
              </div>
            </div>
          </section>

          {/* About & Help */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-6 border-b border-sand-100">
              <h2 className="text-lg font-normal text-sand-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                المساعدة والدعم
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              <button className="w-full p-6 text-right hover:bg-sand-50 transition-colors">
                <h3 className="text-sm font-medium text-sand-900">مركز المساعدة</h3>
                <p className="text-xs text-sand-500 mt-1">الأسئلة الشائعة والإرشادات</p>
              </button>
              <button className="w-full p-6 text-right hover:bg-sand-50 transition-colors">
                <h3 className="text-sm font-medium text-sand-900">تواصل معنا</h3>
                <p className="text-xs text-sand-500 mt-1">راسلنا للدعم الفني</p>
              </button>
              <button className="w-full p-6 text-right hover:bg-sand-50 transition-colors">
                <h3 className="text-sm font-medium text-sand-900">سياسة الخصوصية</h3>
                <p className="text-xs text-sand-500 mt-1">كيف نحمي بياناتك</p>
              </button>
              <button className="w-full p-6 text-right hover:bg-sand-50 transition-colors">
                <h3 className="text-sm font-medium text-sand-900">شروط الاستخدام</h3>
                <p className="text-xs text-sand-500 mt-1">قواعد استخدام التطبيق</p>
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white rounded-2xl border border-sand-200 overflow-hidden mb-6 animate-in">
            <div className="p-4 md:p-6 border-b border-sand-100">
              <h2 className="text-base md:text-lg font-normal text-sand-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                إدارة البيانات
              </h2>
            </div>
            <div className="divide-y divide-sand-100">
              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full p-4 md:p-6 text-right hover:bg-sand-50 transition-colors disabled:opacity-50 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-medium text-sand-900">تصدير البيانات</h3>
                  <p className="text-xs text-sand-500 mt-1">تحميل نسخة من جميع بياناتك</p>
                </div>
                {isExporting ? (
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-sand-400" />
                )}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-white rounded-2xl border border-red-200 overflow-hidden mb-6 animate-in">
            <div className="p-4 md:p-6 border-b border-red-100">
              <h2 className="text-base md:text-lg font-normal text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                منطقة الخطر
              </h2>
            </div>
            <div className="divide-y divide-red-100">
              <button 
                onClick={() => setShowDeleteConfirm("designs")}
                className="w-full p-4 md:p-6 text-right hover:bg-red-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-medium text-red-900">حذف جميع التصاميم</h3>
                  <p className="text-xs text-red-500 mt-1">حذف نهائي لجميع تصاميمك المحفوظة</p>
                </div>
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm("account")}
                className="w-full p-4 md:p-6 text-right hover:bg-red-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-medium text-red-900">حذف الحساب</h3>
                  <p className="text-xs text-red-500 mt-1">حذف نهائي لحسابك وجميع بياناتك</p>
                </div>
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </section>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-sand-900">
                      {showDeleteConfirm === "designs" ? "حذف جميع التصاميم" : "حذف الحساب"}
                    </h3>
                    <p className="text-sm text-sand-500">هذا الإجراء لا يمكن التراجع عنه</p>
                  </div>
                </div>
                
                <p className="text-sm text-sand-700 mb-4">
                  {showDeleteConfirm === "designs" 
                    ? "سيتم حذف جميع تصاميمك المحفوظة نهائياً. اكتب \"حذف التصاميم\" للتأكيد."
                    : "سيتم حذف حسابك وجميع بياناتك نهائياً. اكتب \"حذف الحساب\" للتأكيد."
                  }
                </p>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={showDeleteConfirm === "designs" ? "حذف التصاميم" : "حذف الحساب"}
                  className="w-full px-4 py-3 rounded-xl border-2 border-sand-200 focus:border-red-400 focus:outline-none mb-4 text-sm"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setDeleteConfirmText("");
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-sand-200 text-sand-700 hover:bg-sand-50 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={showDeleteConfirm === "designs" ? handleDeleteAllDesigns : handleDeleteAccount}
                    disabled={
                      (showDeleteConfirm === "designs" && deleteConfirmText !== "حذف التصاميم") ||
                      (showDeleteConfirm === "account" && deleteConfirmText !== "حذف الحساب") ||
                      isDeletingDesigns ||
                      isDeletingAccount
                    }
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                  >
                    {(isDeletingDesigns || isDeletingAccount) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    حذف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="animate-in">
            <button 
              onClick={handleLogout}
              className="w-full py-4 px-6 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-2xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              تسجيل الخروج
            </button>
          </div>

          {/* App Version */}
          <div className="text-center mt-8 text-xs text-sand-400 animate-in">
            المصحف الرقمي v1.0.0 Beta
          </div>
        </div>
      </main>
    </div>
  );
}
