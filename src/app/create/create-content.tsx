"use client";

import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  BookOpen,
  Type,
  Palette,
  Image as ImageIcon,
  CircleDot,
  Download,
  Save,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Upload,
  X,
  Search,
  Loader2,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { useAllSurahs, useAyahs } from "@/hooks/use-quran";
import { getBismillah } from "@/lib/quran/api";
import html2canvas from "html2canvas";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadFile, generateThumbnailPath, getStorageProvider } from "@/lib/storage/storage-manager";

const FONT_OPTIONS = [
  { id: "amiri", name: "Amiri", className: "font-quran" },
  { id: "scheherazade", name: "Scheherazade", className: "font-quran" },
  { id: "noto", name: "Noto Naskh", className: "font-quran" },
  { id: "system", name: "النظام", className: "" },
];

const COLOR_PRESETS = [
  { text: "#1c1917", bg: "#ffffff", label: "كلاسيكي" },
  { text: "#ffffff", bg: "#065f46", label: "أخضر داكن" },
  { text: "#92400e", bg: "#fffbeb", label: "ذهبي فاتح" },
  { text: "#1c1917", bg: "#f5f5f4", label: "رملي" },
  { text: "#d6d3d1", bg: "#1c1917", label: "ليلي" },
  { text: "#064e3b", bg: "#ecfdf5", label: "أخضر فاتح" },
];

const THEME_PALETTES = [
  {
    name: "كلاسيكي",
    colors: { text: "#1c1917", bg: "#ffffff" },
    icon: "📄"
  },
  {
    name: "أخضر إسلامي",
    colors: { text: "#ffffff", bg: "#065f46" },
    icon: "🕌"
  },
  {
    name: "ذهبي فاخر",
    colors: { text: "#92400e", bg: "#fffbeb" },
    icon: "✨"
  },
  {
    name: "رملي دافئ",
    colors: { text: "#1c1917", bg: "#f5f5f4" },
    icon: "🏜️"
  },
  {
    name: "ليلي هادئ",
    colors: { text: "#d6d3d1", bg: "#1c1917" },
    icon: "🌙"
  },
  {
    name: "نعناعي منعش",
    colors: { text: "#064e3b", bg: "#ecfdf5" },
    icon: "🍃"
  },
];

const AYAH_SYMBOLS = ["۝", "۞", "⁕", "✺", ""];

const PREVIEW_SIZES = {
  square: { width: 500, height: 500, label: "مربع" },
  story: { width: 360, height: 640, label: "قصة" },
  post: { width: 500, height: 500, label: "منشور" },
};

export function CreateContent() {
  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthContext();
  const supabase = useMemo(() => createClient(), []);
  const designId = searchParams.get("id");
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(7);
  const [showBismillah, setShowBismillah] = useState(true);
  
  // Auto-hide Bismillah when starting from ayah 1
  const shouldShowBismillah = ayahStart !== 1 && showBismillah;
  const [selectedFont, setSelectedFont] = useState("amiri");
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textColor, setTextColor] = useState("#1c1917");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState("");
  const [bgBlur, setBgBlur] = useState(0);
  const [bgBrightness, setBgBrightness] = useState(100);
  const [bgOpacity, setBgOpacity] = useState(30);
  const [ayahSymbol, setAyahSymbol] = useState("۝");
  const [showContext, setShowContext] = useState(false);
  const [showSurahName, setShowSurahName] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [previewSize, setPreviewSize] = useState<"square" | "story" | "post">("square");
  const [isPublic, setIsPublic] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch data
  const { data: surahs, isLoading: surahsLoading } = useAllSurahs();
  const { data: ayahs, isLoading: ayahsLoading } = useAyahs(selectedSurah, ayahStart, ayahEnd);

  // Get selected surah data
  const selectedSurahData = useMemo(() => {
    return surahs?.find((s) => s.number === selectedSurah);
  }, [surahs, selectedSurah]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState = {
      selectedSurah,
      ayahStart,
      ayahEnd,
      showBismillah,
      selectedFont,
      fontSize,
      lineHeight,
      letterSpacing,
      textColor,
      bgColor,
      bgImage,
      bgBlur,
      bgBrightness,
      bgOpacity,
      ayahSymbol,
      showSurahName,
    };

    setHistory((prev) => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add current state
      newHistory.push(currentState);
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [
    selectedSurah, ayahStart, ayahEnd, showBismillah, selectedFont,
    fontSize, lineHeight, letterSpacing, textColor, bgColor, bgImage,
    bgBlur, bgBrightness, bgOpacity, ayahSymbol, showSurahName, historyIndex
  ]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setSelectedSurah(prevState.selectedSurah);
      setAyahStart(prevState.ayahStart);
      setAyahEnd(prevState.ayahEnd);
      setShowBismillah(prevState.showBismillah);
      setSelectedFont(prevState.selectedFont);
      setFontSize(prevState.fontSize);
      setLineHeight(prevState.lineHeight);
      setLetterSpacing(prevState.letterSpacing);
      setTextColor(prevState.textColor);
      setBgColor(prevState.bgColor);
      setBgImage(prevState.bgImage);
      setBgBlur(prevState.bgBlur);
      setBgBrightness(prevState.bgBrightness);
      setBgOpacity(prevState.bgOpacity);
      setAyahSymbol(prevState.ayahSymbol);
      setShowSurahName(prevState.showSurahName);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setSelectedSurah(nextState.selectedSurah);
      setAyahStart(nextState.ayahStart);
      setAyahEnd(nextState.ayahEnd);
      setShowBismillah(nextState.showBismillah);
      setSelectedFont(nextState.selectedFont);
      setFontSize(nextState.fontSize);
      setLineHeight(nextState.lineHeight);
      setLetterSpacing(nextState.letterSpacing);
      setTextColor(nextState.textColor);
      setBgColor(nextState.bgColor);
      setBgImage(nextState.bgImage);
      setBgBlur(nextState.bgBlur);
      setBgBrightness(nextState.bgBrightness);
      setBgOpacity(nextState.bgOpacity);
      setAyahSymbol(nextState.ayahSymbol);
      setShowSurahName(nextState.showSurahName);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y or Cmd+Y for Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Save initial state to history
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to history on changes (debounced)
  useEffect(() => {
    if (history.length > 0) {
      const timeout = setTimeout(() => {
        saveToHistory();
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeout);
    }
  }, [
    selectedSurah, ayahStart, ayahEnd, showBismillah, selectedFont,
    fontSize, lineHeight, letterSpacing, textColor, bgColor, bgImage,
    bgBlur, bgBrightness, bgOpacity, ayahSymbol, showSurahName
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format verse text
  const verseText = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return "";
    
    // Helper function to convert to Arabic numerals
    const toArabicNumerals = (num: number): string => {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('');
    };
    
    return ayahs
      .map((ayah) => {
        const text = ayah.text;
        if (ayahSymbol) {
          const arabicNum = toArabicNumerals(ayah.numberInSurah);
          // First symbol (۝) is traditional - used once with number
          // Wrap in span with Amiri font for better appearance
          // Other symbols are decorative - used on both sides
          if (ayahSymbol === "۝") {
            return `${text} <span class="font-quran">${ayahSymbol}${arabicNum}</span>`;
          } else {
            return `${text} ${ayahSymbol}${arabicNum}${ayahSymbol}`;
          }
        }
        return text;
      })
      .join(" ");
  }, [ayahs, ayahSymbol]);

  // Export function
  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `quran-${selectedSurahData?.englishName || "verse"}-${ayahStart}-${ayahEnd}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (error) {
      console.error("Export failed:", error);
      alert("فشل التصدير. حاول مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  };

  // Save to database function
  const handleSave = async () => {
    if (!isAuthenticated) {
      alert("يجب تسجيل الدخول أولاً");
      router.push("/auth/login");
      return;
    }

    if (!canvasRef.current || !user) {
      alert("خطأ: لا يمكن الوصول إلى العناصر المطلوبة");
      return;
    }

    if (!supabase) {
      alert("خطأ: لا يمكن الاتصال بقاعدة البيانات");
      return;
    }

    setIsSaving(true);
    let publicUrl: string | null = null;
    
    try {
      console.log("بدء حفظ التصميم...");
      
      // SKIP THUMBNAIL GENERATION FOR NOW - it's too slow
      // We'll add it back when B2 is properly configured
      console.log("⏭️ تخطي الصورة المصغرة للحفظ السريع...");
      publicUrl = null;

      console.log("جاري حفظ بيانات التصميم...");

      // Prepare customization object (keep it small)
      const customization: any = {
        font: selectedFont,
        fontSize,
        textColor,
        bgColor,
        ayahSymbol,
      };
      
      // Add optional fields only if they differ from defaults
      if (lineHeight !== 1.8) customization.lineHeight = lineHeight;
      if (letterSpacing !== 0) customization.letterSpacing = letterSpacing;
      if (bgImage) customization.bgImage = bgImage;
      if (bgBlur !== 0) customization.bgBlur = bgBlur;
      if (bgBrightness !== 100) customization.bgBrightness = bgBrightness;
      if (bgOpacity !== 100) customization.bgOpacity = bgOpacity;
      if (showBismillah) customization.showBismillah = true;
      if (showSurahName) customization.showSurahName = true;
      
      console.log("📦 Customization object:", customization);

      // Update existing design or insert new one
      if (designId) {
        // Update existing design
        console.log("جاري تحديث التصميم...");
        
        // Clean verse_text - remove HTML tags for database storage
        const cleanVerseText = (verseText || "بسم الله الرحمن الرحيم")
          .replace(/<[^>]*>/g, '') // Remove all HTML tags
          .replace(/\s+/g, ' ')    // Normalize whitespace
          .trim()
          .substring(0, 2000);     // Limit to 2000 chars
        
        const updateData: any = {
          surah_number: selectedSurah,
          ayah_start: ayahStart,
          ayah_end: ayahEnd,
          verse_text: cleanVerseText,
          customization,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        };
        
        // Only update thumbnail_url if we have one
        if (publicUrl) {
          updateData.thumbnail_url = publicUrl;
        }

        console.log("📝 Updating design data...", updateData);
        const updateStartTime = Date.now();
        
        const { error: updateError } = await withTimeout(
          supabase
            .from("designs")
            .update(updateData)
            .eq("id", designId)
            .eq("user_id", user.id),
          20000, // 20 seconds should be enough for a simple update
          "انتهت مهلة تحديث التصميم"
        );
        
        console.log(`⏱️ Update took ${Date.now() - updateStartTime}ms`);

        if (updateError) {
          console.error("خطأ في تحديث التصميم:", updateError);
          throw new Error(`فشل تحديث التصميم: ${updateError.message}`);
        }

        console.log("تم تحديث التصميم");

        // Update collection if selected (non-blocking)
        if (selectedCollection) {
          supabase
            .from("collection_designs")
            .upsert({
              collection_id: selectedCollection,
              design_id: designId,
            }, {
              onConflict: "collection_id,design_id"
            })
            .then(({ error: collectionError }) => {
              if (collectionError) {
                console.error("خطأ في تحديث المجموعة:", collectionError);
              }
            })
            .catch((err) => {
              console.error("خطأ في تحديث المجموعة:", err);
            });
        }

        console.log("تم الحفظ بنجاح!");
        alert("تم التحديث بنجاح! ✅");
      } else {
        // Insert new design
        console.log("جاري إنشاء تصميم جديد...");
        
        // Clean verse_text - remove HTML tags for database storage
        const cleanVerseText = (verseText || "بسم الله الرحمن الرحيم")
          .replace(/<[^>]*>/g, '') // Remove all HTML tags
          .replace(/\s+/g, ' ')    // Normalize whitespace
          .trim()
          .substring(0, 2000);     // Limit to 2000 chars
        
        const insertData: any = {
          user_id: user.id,
          surah_number: selectedSurah,
          ayah_start: ayahStart,
          ayah_end: ayahEnd,
          verse_text: cleanVerseText,
          customization,
          is_public: isPublic,
        };
        
        // Only add thumbnail_url if we have one
        if (publicUrl) {
          insertData.thumbnail_url = publicUrl;
        }

        console.log("📝 Inserting design data...", insertData);
        console.log("📏 verse_text length:", insertData.verse_text?.length || 0);
        const insertStartTime = Date.now();
        
        try {
          console.log("📤 Sending insert request via API...");
          
          // Use server API instead of client-side Supabase
          const response = await fetch("/api/designs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(insertData),
          });
          
          const result = await response.json();
          
          console.log(`⏱️ Insert took ${Date.now() - insertStartTime}ms`);
          
          if (!response.ok || !result.success) {
            console.error("خطأ في إنشاء التصميم:", result.error);
            throw new Error(`فشل إنشاء التصميم: ${result.error}`);
          }

          const designData = result.data;
          console.log("تم إنشاء التصميم:", designData?.id);

          // Add to collection if selected (non-blocking)
          if (selectedCollection && designData && supabase) {
            supabase
              .from("collection_designs")
              .insert({
                collection_id: selectedCollection,
                design_id: designData.id,
              })
              .then(({ error: collectionError }) => {
                if (collectionError) {
                  console.error("خطأ في إضافة التصميم إلى المجموعة:", collectionError);
                }
              })
              .catch((err) => {
                console.error("خطأ في إضافة التصميم إلى المجموعة:", err);
              });
          }

          console.log("تم الحفظ بنجاح!");
          alert("تم الحفظ بنجاح! ✅");
          
          // Clear draft after successful save
          clearDraft();
          
          // Update URL with new design ID
          if (designData) {
            router.push(`/create?id=${designData.id}`);
          }
        } catch (insertError: any) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      const errorMessage = error?.message || error?.toString() || "حدث خطأ غير معروف";
      alert(`فشل الحفظ: ${errorMessage}\n\nتحقق من Console للمزيد من التفاصيل.`);
    } finally {
      setIsSaving(false);
      console.log("انتهى حفظ التصميم");
    }
  };

  // Share function
  const handleShare = async () => {
    if (!canvasRef.current) return;

    setIsSharing(true);
    try {
      // Generate image for sharing
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      // Create file from blob
      const file = new File([blob], `quran-verse-${selectedSurah}-${ayahStart}-${ayahEnd}.png`, {
        type: "image/png",
      });

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `سورة ${selectedSurahData?.name || ""} - آية ${ayahStart}`,
          text: verseText.substring(0, 100) + "...",
          files: [file],
        });
      } else {
        // Fallback: Copy link to clipboard (or show share modal)
        const shareText = `سورة ${selectedSurahData?.name || ""} - آية ${ayahStart} إلى ${ayahEnd}\n\n${verseText}`;
        await navigator.clipboard.writeText(shareText);
        alert("تم نسخ النص إلى الحافظة! 📋");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        alert("فشلت المشاركة. حاول مرة أخرى.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Upload custom background image
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setIsUploadingBg(true);
    try {
      // Create object URL for immediate preview
      const objectUrl = URL.createObjectURL(file);
      setBgImage(objectUrl);

      // If user is authenticated, upload to Supabase
      if (isAuthenticated && user) {
        const fileName = `backgrounds/${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase
          .storage
          .from("designs")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from("designs")
          .getPublicUrl(fileName);

        // Replace object URL with public URL
        URL.revokeObjectURL(objectUrl);
        setBgImage(publicUrl);
      }
      // If not authenticated, keep using object URL (temporary)
    } catch (error) {
      console.error("Upload failed:", error);
      alert("فشل رفع الصورة. حاول مرة أخرى.");
      setBgImage("");
    } finally {
      setIsUploadingBg(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Load from localStorage on mount (draft mode)
  useEffect(() => {
    if (designId) return; // Don't load draft if editing existing design
    
    try {
      const draft = localStorage.getItem('design_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        const draftAge = Date.now() - new Date(parsed.timestamp).getTime();
        
        // Only load if draft is less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setSelectedSurah(parsed.selectedSurah || 1);
          setAyahStart(parsed.ayahStart || 1);
          setAyahEnd(parsed.ayahEnd || 7);
          setShowBismillah(parsed.showBismillah !== false);
          setSelectedFont(parsed.selectedFont || "amiri");
          setFontSize(parsed.fontSize || 32);
          setLineHeight(parsed.lineHeight || 1.8);
          setLetterSpacing(parsed.letterSpacing || 0);
          setTextColor(parsed.textColor || "#1c1917");
          setBgColor(parsed.bgColor || "#ffffff");
          setBgImage(parsed.bgImage || "");
          setBgBlur(parsed.bgBlur || 0);
          setBgBrightness(parsed.bgBrightness || 100);
          setBgOpacity(parsed.bgOpacity || 30);
          setAyahSymbol(parsed.ayahSymbol || "۝");
          setShowSurahName(parsed.showSurahName !== false);
          setLastSaved(new Date(parsed.timestamp));
        } else {
          // Clear old draft
          localStorage.removeItem('design_draft');
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to localStorage
  useEffect(() => {
    if (designId) return; // Don't auto-save if editing existing design
    
    const timeout = setTimeout(() => {
      try {
        const draft = {
          selectedSurah,
          ayahStart,
          ayahEnd,
          showBismillah,
          selectedFont,
          fontSize,
          lineHeight,
          letterSpacing,
          textColor,
          bgColor,
          bgImage,
          bgBlur,
          bgBrightness,
          bgOpacity,
          ayahSymbol,
          showSurahName,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('design_draft', JSON.stringify(draft));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    }, 2000); // Save after 2 seconds of inactivity

    setHasUnsavedChanges(true);
    return () => clearTimeout(timeout);
  }, [
    selectedSurah, ayahStart, ayahEnd, showBismillah, selectedFont,
    fontSize, lineHeight, letterSpacing, textColor, bgColor, bgImage,
    bgBlur, bgBrightness, bgOpacity, ayahSymbol, showSurahName, designId
  ]);

  // Clear draft after successful save
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem('design_draft');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, []);

  // Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    if (confirm("هل أنت متأكد من إعادة تعيين جميع الإعدادات للقيم الافتراضية؟")) {
      setSelectedSurah(1);
      setAyahStart(1);
      setAyahEnd(7);
      setShowBismillah(true);
      setSelectedFont("amiri");
      setFontSize(32);
      setLineHeight(1.8);
      setLetterSpacing(0);
      setTextColor("#1c1917");
      setBgColor("#ffffff");
      setBgImage("");
      setBgBlur(0);
      setBgBrightness(100);
      setBgOpacity(30);
      setAyahSymbol("۝");
      setShowSurahName(true);
      setIsPublic(false);
      setSelectedCollection("");
      clearDraft();
    }
  }, [clearDraft]);

  // Copy design settings to clipboard
  const handleCopySettings = useCallback(async () => {
    try {
      const settings = {
        selectedFont,
        fontSize,
        lineHeight,
        letterSpacing,
        textColor,
        bgColor,
        bgImage,
        bgBlur,
        bgBrightness,
        bgOpacity,
        ayahSymbol,
        showBismillah,
        showSurahName,
      };
      
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy settings:", error);
      alert("فشل نسخ الإعدادات");
    }
  }, [
    selectedFont, fontSize, lineHeight, letterSpacing, textColor,
    bgColor, bgImage, bgBlur, bgBrightness, bgOpacity, ayahSymbol,
    showBismillah, showSurahName
  ]);

  // Load existing design if editing
  useEffect(() => {
    if (!designId || !isAuthenticated) return;

    const loadDesign = async () => {
      setIsLoadingDesign(true);
      console.log("📥 Loading design:", designId);
      
      try {
        // Use API instead of client-side Supabase
        const response = await fetch(`/api/designs?id=${designId}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load design");
        }

        const data = result.data;
        console.log("✅ Design loaded:", data);

        if (data) {
          // Load design data into state
          setSelectedSurah(data.surah_number);
          setAyahStart(data.ayah_start);
          setAyahEnd(data.ayah_end);
          setIsPublic(data.is_public || false);
          
          // Load customization
          const custom = data.customization as any;
          if (custom) {
            setSelectedFont(custom.font || "amiri");
            setFontSize(custom.fontSize || 32);
            setLineHeight(custom.lineHeight || 1.8);
            setLetterSpacing(custom.letterSpacing || 0);
            setTextColor(custom.textColor || "#1c1917");
            setBgColor(custom.bgColor || "#ffffff");
            setBgImage(custom.bgImage || "");
            setBgBlur(custom.bgBlur || 0);
            setBgBrightness(custom.bgBrightness || 100);
            setBgOpacity(custom.bgOpacity || 30);
            setAyahSymbol(custom.ayahSymbol || "۝");
            setShowBismillah(custom.showBismillah !== false);
            setShowSurahName(custom.showSurahName !== false);
          }
        }
      } catch (error) {
        console.error("Failed to load design:", error);
        alert("فشل تحميل التصميم");
      } finally {
        setIsLoadingDesign(false);
      }
    };

    loadDesign();
  }, [designId, isAuthenticated]);

  // Load user collections
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadCollections = async () => {
      try {
        const { data, error } = await supabase
          .from("collections")
          .select("id, name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setUserCollections(data);
        }
      } catch (error) {
        console.error("Failed to load collections:", error);
      }
    };

    loadCollections();
  }, [isAuthenticated, user, supabase]);

  // Show loading overlay when loading design
  if (isLoadingDesign) {
    return (
      <div className="flex min-h-screen bg-sand-100">
        <Sidebar />
        <main className="mr-[72px] w-[calc(100%-72px)] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sand-600">جاري تحميل التصميم...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar />

      {/* Main Content */}
      <main className="mr-[72px] w-[calc(100%-72px)] flex">
        {/* Left Panel - Controls */}
        <aside className="w-[380px] bg-white border-l border-sand-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-sand-100">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-normal text-sand-900">
                {designId ? "تحرير التصميم" : "تصميم جديد"}
              </h1>
              {!designId && (
                <span className="text-xs text-sand-400 flex items-center gap-1">
                  {hasUnsavedChanges ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      جاري الحفظ...
                    </>
                  ) : lastSaved ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      تم الحفظ {new Date(lastSaved).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : null}
                </span>
              )}
            </div>
            <p className="text-sm text-sand-500">خصص الآية بأسلوبك الخاص</p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Verse Selection */}
            <section>
              <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                اختيار الآية
              </h3>

              <div className="space-y-3">
                {/* Surah Select */}
                <div>
                  <label className="text-xs text-sand-500 block mb-1.5">السورة</label>
                  <select
                    value={selectedSurah}
                    onChange={(e) => {
                      const newSurah = Number(e.target.value);
                      setSelectedSurah(newSurah);
                      setAyahStart(1);
                      setAyahEnd(1);
                    }}
                    disabled={surahsLoading}
                    className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-50 text-sand-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                  >
                    {surahsLoading ? (
                      <option>جاري التحميل...</option>
                    ) : (
                      surahs?.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {surah.number}. {surah.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Ayah Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-sand-500 block mb-1.5">من آية</label>
                    <input
                      type="number"
                      value={ayahStart}
                      onChange={(e) => setAyahStart(Number(e.target.value))}
                      min={1}
                      max={selectedSurahData?.numberOfAyahs || 1}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-50 text-sand-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-sand-500 block mb-1.5">إلى آية</label>
                    <input
                      type="number"
                      value={ayahEnd}
                      onChange={(e) => setAyahEnd(Number(e.target.value))}
                      min={ayahStart}
                      max={selectedSurahData?.numberOfAyahs || 1}
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-50 text-sand-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث عن آية..."
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-sand-200 bg-sand-50 text-sand-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" strokeWidth={1.5} />
                </div>

                <p className="text-xs text-sand-400">
                  السورة {selectedSurah} تحتوي على {selectedSurahData?.ayahs} آية
                </p>
              </div>
            </section>

            {/* Bismillah Toggle - Hidden when ayahStart = 1 */}
            {ayahStart !== 1 && (
              <section>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                    <span className="text-sm text-sand-700">إظهار البسملة</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBismillah}
                      onChange={(e) => setShowBismillah(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </section>
            )}

            {/* Font Selection */}
            <section>
              <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                الخط
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`p-3 rounded-xl border-2 text-center group transition-all ${
                      selectedFont === font.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-sand-200 hover:border-emerald-300"
                    }`}
                  >
                    <span className={`${font.className} text-lg block mb-1`}>بسم الله</span>
                    <span className="text-[10px] text-sand-500">{font.name}</span>
                  </button>
                ))}
              </div>

              {/* Font Size */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-sand-500">حجم الخط</label>
                  <span className="text-xs text-emerald-600 font-medium">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-[6px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-800 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>

              {/* Line Height */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-sand-500">المسافة بين الأسطر</label>
                  <span className="text-xs text-emerald-600 font-medium">{lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full h-[6px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-800 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>

              {/* Letter Spacing */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-sand-500">المسافة بين الأحرف</label>
                  <span className="text-xs text-emerald-600 font-medium">{letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min={-2}
                  max={10}
                  step={0.5}
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  className="w-full h-[6px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-800 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
            </section>

            {/* Colors */}
            <section>
              <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                الألوان
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-sand-600">لون النص</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none shadow-sm"
                    />
                    <span className="text-xs text-sand-400 font-mono">{textColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-sand-600">لون الخلفية</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none shadow-sm"
                    />
                    <span className="text-xs text-sand-400 font-mono">{bgColor}</span>
                  </div>
                </div>
              </div>

              {/* Theme Palettes - Quick Switcher */}
              <div className="mt-4">
                <label className="text-xs text-sand-500 block mb-2">مجموعات ألوان جاهزة</label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PALETTES.map((theme, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setTextColor(theme.colors.text);
                        setBgColor(theme.colors.bg);
                      }}
                      className={`p-3 rounded-xl border-2 text-right group transition-all hover:scale-[1.02] ${
                        textColor === theme.colors.text && bgColor === theme.colors.bg
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-sand-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{theme.icon}</span>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-sand-700">{theme.name}</div>
                          <div className="flex gap-1 mt-1">
                            <div 
                              className="w-4 h-4 rounded border border-sand-200"
                              style={{ backgroundColor: theme.colors.bg }}
                            />
                            <div 
                              className="w-4 h-4 rounded border border-sand-200"
                              style={{ backgroundColor: theme.colors.text }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Background Image */}
            <section>
              <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                صورة الخلفية
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBgImage("")}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center group transition-all ${
                    bgImage === "" ? "border-emerald-500 bg-white" : "border-sand-200 bg-white hover:border-emerald-400"
                  }`}
                >
                  <X className="w-6 h-6 text-sand-400" strokeWidth={1.5} />
                </button>
                {[
                  "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&q=80", // مسجد ذهبي
                  "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&q=80", // قبة خضراء
                  "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&q=80", // أنماط إسلامية
                  "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=400&q=80", // مسجد أزرق
                  "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80", // زخارف عربية
                ].map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setBgImage(img)}
                    className={`aspect-square rounded-xl border overflow-hidden transition-all ${
                      bgImage === img ? "border-emerald-500 ring-2 ring-emerald-200" : "border-sand-200 hover:border-emerald-400"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadBackground}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBg}
                className="mt-3 w-full py-3 px-4 rounded-xl border border-dashed border-sand-300 text-sand-500 text-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingBg ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    <span>جاري الرفع...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" strokeWidth={2} />
                    <span>رفع صورة</span>
                  </>
                )}
              </button>

              {/* Image Filters (only show when background image is selected) */}
              {bgImage && (
                <div className="mt-4 space-y-3 p-4 bg-sand-50 rounded-xl">
                  <p className="text-xs font-medium text-sand-600 mb-2">فلاتر الصورة</p>
                  
                  {/* Blur */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-sand-500">ضبابية</label>
                      <span className="text-xs text-emerald-600 font-medium">{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={bgBlur}
                      onChange={(e) => setBgBlur(Number(e.target.value))}
                      className="w-full h-[4px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-700 [&::-webkit-slider-thumb]:border-[2px] [&::-webkit-slider-thumb]:border-white"
                    />
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-sand-500">السطوع</label>
                      <span className="text-xs text-emerald-600 font-medium">{bgBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={bgBrightness}
                      onChange={(e) => setBgBrightness(Number(e.target.value))}
                      className="w-full h-[4px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-700 [&::-webkit-slider-thumb]:border-[2px] [&::-webkit-slider-thumb]:border-white"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-sand-500">الشفافية</label>
                      <span className="text-xs text-emerald-600 font-medium">{bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(Number(e.target.value))}
                      className="w-full h-[4px] rounded-full bg-sand-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-700 [&::-webkit-slider-thumb]:border-[2px] [&::-webkit-slider-thumb]:border-white"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Ayah End Symbol */}
            <section>
              <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                رمز نهاية الآية
              </h3>

              <div className="grid grid-cols-5 gap-2">
                {AYAH_SYMBOLS.map((symbol, i) => (
                  <button
                    key={i}
                    onClick={() => setAyahSymbol(symbol)}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl font-quran text-gold-600 transition-all ${
                      ayahSymbol === symbol
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-sand-200 hover:border-emerald-400"
                    }`}
                  >
                    {symbol || <span className="text-xs text-sand-400">بدون</span>}
                  </button>
                ))}
              </div>
            </section>

            {/* Surah Name Display */}
            <section>
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                  <span className="text-sm text-sand-700">إظهار اسم السورة</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSurahName}
                    onChange={(e) => setShowSurahName(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </section>

            {/* Collection Selection */}
            {isAuthenticated && userCollections.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-sand-700 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                  إضافة إلى مجموعة
                </h3>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-50 text-sand-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">بدون مجموعة</option>
                  {userCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {/* Public/Private Toggle */}
            {isAuthenticated && (
              <section>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-sand-700">
                        {isPublic ? "تصميم عام" : "تصميم خاص"}
                      </span>
                    </div>
                    <span className="text-xs text-sand-500 mr-8">
                      {isPublic 
                        ? "سيظهر في المعرض العام للجميع" 
                        : "مرئي لك فقط"
                      }
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </section>
            )}
          </div>

          {/* Storage Provider Info */}
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-sand-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>
                التخزين: {getStorageProvider() === "b2" ? "Backblaze B2" : "Supabase"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-sand-100 bg-sand-50 space-y-3">
            <button 
              onClick={handleExport}
              disabled={isExporting || ayahsLoading}
              className="w-full py-4 px-6 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" strokeWidth={2} />
                  <span>تصدير الصورة</span>
                </>
              )}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleSave}
                disabled={isSaving || ayahsLoading}
                className="py-3 px-4 bg-white border border-sand-200 text-sand-700 rounded-xl text-sm hover:bg-sand-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="w-4 h-4" strokeWidth={2} />
                )}
                <span>
                  {isSaving 
                    ? (designId ? "جاري التحديث..." : "جاري الحفظ...") 
                    : (designId ? "تحديث" : "حفظ")
                  }
                </span>
              </button>
              <button 
                onClick={handleShare}
                disabled={isSharing || ayahsLoading}
                className="py-3 px-4 bg-white border border-sand-200 text-sand-700 rounded-xl text-sm hover:bg-sand-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Share2 className="w-4 h-4" strokeWidth={2} />
                )}
                <span>{isSharing ? "جاري المشاركة..." : "مشاركة"}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Panel - Preview */}
        <div className="flex-1 h-screen bg-sand-100 flex flex-col sticky top-0 overflow-hidden">
          {/* Preview Header */}
          <div className="p-4 border-b border-sand-200 bg-white/80 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-sand-500">المعاينة</span>
              <div className="flex gap-1 bg-sand-100 rounded-lg p-1">
                <button 
                  onClick={() => setPreviewSize("square")}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    previewSize === "square" 
                      ? "bg-white shadow-sm text-sand-700" 
                      : "text-sand-500 hover:text-sand-700"
                  }`}
                >
                  مربع
                </button>
                <button 
                  onClick={() => setPreviewSize("story")}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    previewSize === "story" 
                      ? "bg-white shadow-sm text-sand-700" 
                      : "text-sand-500 hover:text-sand-700"
                  }`}
                >
                  قصة
                </button>
                <button 
                  onClick={() => setPreviewSize("post")}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    previewSize === "post" 
                      ? "bg-white shadow-sm text-sand-700" 
                      : "text-sand-500 hover:text-sand-700"
                  }`}
                >
                  منشور
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="تراجع (Ctrl+Z)"
              >
                <Undo2 className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
              <button 
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="إعادة (Ctrl+Y)"
              >
                <Redo2 className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
              <div className="w-px h-6 bg-sand-200"></div>
              <button 
                onClick={handleResetToDefaults}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
                title="إعادة تعيين للإعدادات الافتراضية"
              >
                <RotateCcw className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
              <button 
                onClick={handleCopySettings}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors relative"
                title="نسخ إعدادات التصميم"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                ) : (
                  <Copy className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
                )}
              </button>
              <div className="w-px h-6 bg-sand-200"></div>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
                disabled={zoomLevel >= 200}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="تكبير"
              >
                <ZoomIn className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
              <span className="text-xs text-sand-500 px-2 flex items-center min-w-[50px] justify-center">
                {zoomLevel}%
              </span>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 10, 50))}
                disabled={zoomLevel <= 50}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="تصغير"
              >
                <ZoomOut className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setZoomLevel(100)}
                className="p-2 hover:bg-sand-100 rounded-lg transition-colors"
                title="حجم طبيعي"
              >
                <Maximize2 className="w-5 h-5 text-sand-500" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 p-8 flex items-center justify-center preview-canvas overflow-auto">
            <div
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                ref={canvasRef}
                className={`rounded-2xl shadow-2xl flex flex-col p-8 transition-all duration-300 relative overflow-hidden ${
                  selectedFont === "amiri"
                    ? "font-quran"
                    : selectedFont === "scheherazade"
                    ? "font-quran-scheherazade"
                    : selectedFont === "noto"
                    ? "font-quran-noto"
                    : ""
                }`}
                style={{
                  width: `${PREVIEW_SIZES[previewSize].width}px`,
                  height: `${PREVIEW_SIZES[previewSize].height}px`,
                  backgroundColor: bgColor,
                }}
              >
                {/* Background Image with Overlay and Filters */}
                {bgImage && (
                  <>
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: `blur(${bgBlur}px) brightness(${bgBrightness}%)`,
                        opacity: bgOpacity / 100,
                        zIndex: 0,
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        backgroundColor: bgColor,
                        opacity: 0.7,
                        zIndex: 1,
                      }}
                    />
                  </>
                )}

                {/* Bismillah at top */}
                {shouldShowBismillah && (
                  <div className="text-center mb-4 relative z-10">
                    <p
                      className={`text-xl ${
                        selectedFont === "amiri"
                          ? "font-quran"
                          : selectedFont === "scheherazade"
                          ? "font-quran-scheherazade"
                          : selectedFont === "noto"
                          ? "font-quran-noto"
                          : ""
                      }`}
                      style={{ color: textColor }}
                    >
                      {getBismillah()}
                    </p>
                  </div>
                )}

                {/* Main verse text - centered and scrollable */}
                <div className="flex-1 overflow-auto px-4 py-4 relative z-10">
                  <div className="min-h-full flex items-center justify-center">
                    {ayahsLoading ? (
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    ) : (
                      <p
                        className={`text-center ${
                          selectedFont === "amiri"
                            ? "font-quran"
                            : selectedFont === "scheherazade"
                            ? "font-quran-scheherazade"
                            : selectedFont === "noto"
                            ? "font-quran-noto"
                            : ""
                        }`}
                        style={{ 
                          color: textColor, 
                          fontSize: `${fontSize}px`,
                          lineHeight: lineHeight,
                          letterSpacing: `${letterSpacing}px`,
                          wordBreak: "break-word"
                        }}
                        dangerouslySetInnerHTML={{
                          __html: verseText || "اختر الآيات لعرضها هنا"
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Surah name at bottom */}
                {showSurahName && selectedSurahData && (
                  <div className="text-center mt-4 relative z-10">
                    <span
                      className="text-xs px-3 py-1.5 rounded-full inline-block"
                      style={{
                        backgroundColor: `${textColor}15`,
                        color: textColor,
                      }}
                    >
                      سورة {selectedSurahData.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

