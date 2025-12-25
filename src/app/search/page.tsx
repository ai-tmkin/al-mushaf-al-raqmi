"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Search as SearchIcon, 
  Heart, 
  Smile, 
  Frown, 
  Sparkles, 
  ArrowLeft,
  Loader2,
  BookOpen,
  Sun,
  Moon,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

const emotionalQueries = [
  { id: "patience", label: "الصبر", arabicLabel: "أحتاج للصبر", icon: Shield, color: "emerald" },
  { id: "gratitude", label: "الشكر", arabicLabel: "أريد الشكر", icon: Sun, color: "gold" },
  { id: "hope", label: "الأمل", arabicLabel: "أبحث عن الأمل", icon: Sparkles, color: "emerald" },
  { id: "comfort", label: "الراحة", arabicLabel: "أشعر بالضيق", icon: Heart, color: "gold" },
  { id: "repentance", label: "التوبة", arabicLabel: "أريد التوبة", icon: Moon, color: "emerald" },
  { id: "provision", label: "الرزق", arabicLabel: "أسأل عن الرزق", icon: BookOpen, color: "gold" },
];

interface SearchResult {
  surah: number;
  surahName: string;
  surahEnglishName?: string;
  ayah: number;
  text: string;
}

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (showResults && resultsRef.current && results.length > 0) {
      const ctx = gsap.context(() => {
        const items = resultsRef.current?.querySelectorAll(".result-item");
        if (items) {
          gsap.from(items, {
            duration: 0.4,
            y: 20,
            opacity: 0,
            stagger: 0.1,
            ease: "power3.out",
          });
        }
      }, resultsRef);

      return () => ctx.revert();
    }
  }, [showResults, results]);

  // Text search using API
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchQuery(query);
    
    try {
      console.log("🔍 Searching for:", query);
      
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=text`
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        setResults(result.data);
        console.log("✅ Found", result.data.length, "results");
      } else {
        setResults([]);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Emotional search using API
  const handleEmotionalSearch = useCallback(async (emotion: string) => {
    setIsLoading(true);
    setSearchQuery(emotion);
    
    try {
      console.log("💭 Emotional search for:", emotion);
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion }),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setResults(result.data);
        console.log("✅ Found", result.data.length, "emotional results");
      } else {
        setResults([]);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error("Error in emotional search:", error);
      setResults([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = () => {
    setShowResults(false);
    setSearchQuery("");
    setResults([]);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="mr-[72px] w-[calc(100%-72px)] bg-sand-50 p-12">
        <div ref={mainRef} className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-in">
            <h1 className="text-4xl font-light text-sand-900 mb-3">البحث في القرآن</h1>
            <p className="text-sand-600">ابحث عن آية أو موضوع أو حالة نفسية</p>
          </div>

          {/* Search Tabs */}
          <div className="flex gap-2 mb-8 animate-in">
            <button
              onClick={() => { setActiveTab("text"); clearResults(); }}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "text"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-sand-100 text-sand-600 hover:bg-sand-200"
              }`}
            >
              بحث نصي
            </button>
            <button
              onClick={() => { setActiveTab("emotional"); clearResults(); }}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "emotional"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-sand-100 text-sand-600 hover:bg-sand-200"
              }`}
            >
              بحث عاطفي
            </button>
            <button
              onClick={() => { setActiveTab("surah"); clearResults(); }}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "surah"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-sand-100 text-sand-600 hover:bg-sand-200"
              }`}
            >
              بحث بالسورة
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-12 animate-in">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  if (activeTab === "surah") {
                    // Search by surah number
                    handleSearch(searchQuery);
                  } else {
                    handleSearch(searchQuery);
                  }
                }
              }}
              placeholder={
                activeTab === "text" 
                  ? "ابحث عن كلمة أو جملة في القرآن..." 
                  : activeTab === "surah"
                  ? "أدخل رقم السورة (1-114)..."
                  : "اختر حالتك من الأسفل..."
              }
              className="w-full px-6 py-5 pr-14 rounded-2xl border-2 border-sand-200 bg-white text-sand-900 text-lg focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
            />
            {isLoading ? (
              <Loader2
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600 animate-spin"
              />
            ) : (
              <SearchIcon
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-sand-400"
                strokeWidth={1.5}
              />
            )}
          </div>

          {/* Emotional Search Section */}
          {!showResults && activeTab === "emotional" && (
            <div className="animate-in">
              <h2 className="text-lg font-normal text-sand-800 mb-6">كيف تشعر اليوم؟</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {emotionalQueries.map((query) => {
                  const Icon = query.icon;
                  const isEmerald = query.color === "emerald";
                  return (
                    <button
                      key={query.id}
                      onClick={() => handleEmotionalSearch(query.label)}
                      className={`p-6 rounded-2xl border-2 transition-all text-right group ${
                        isEmerald 
                          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                          : "border-gold-200 bg-gold-50 hover:bg-gold-100 hover:border-gold-300"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 mb-3 ${
                          isEmerald ? "text-emerald-600" : "text-gold-600"
                        }`}
                        strokeWidth={1.5}
                      />
                      <p className={`text-lg font-normal ${
                        isEmerald ? "text-emerald-900" : "text-gold-900"
                      }`}>
                        {query.arabicLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Surah Links */}
          {!showResults && activeTab === "surah" && (
            <div className="animate-in">
              <h2 className="text-lg font-normal text-sand-800 mb-6">السور الشائعة</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { num: 1, name: "الفاتحة" },
                  { num: 2, name: "البقرة" },
                  { num: 18, name: "الكهف" },
                  { num: 36, name: "يس" },
                  { num: 55, name: "الرحمن" },
                  { num: 67, name: "الملك" },
                  { num: 112, name: "الإخلاص" },
                  { num: 114, name: "الناس" },
                ].map((surah) => (
                  <Link
                    key={surah.num}
                    href={`/create?surah=${surah.num}`}
                    className="p-4 bg-white rounded-xl border border-sand-200 hover:border-emerald-300 hover:shadow-md transition-all text-center"
                  >
                    <span className="block text-2xl font-quran text-emerald-600 mb-1">
                      {surah.num}
                    </span>
                    <span className="text-sm text-sand-700">{surah.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <div ref={resultsRef}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-normal text-sand-800">
                  نتائج البحث 
                  {results.length > 0 && (
                    <span className="text-sand-500 mr-2">({results.length})</span>
                  )}
                </h2>
                <button
                  onClick={clearResults}
                  className="text-sm text-sand-500 hover:text-sand-700"
                >
                  مسح
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-16 h-16 text-sand-300 mx-auto mb-4" />
                  <p className="text-sand-600">لم يتم العثور على نتائج</p>
                  <p className="text-sand-400 text-sm mt-2">جرب كلمات بحث مختلفة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, i) => (
                    <Link
                      key={`${result.surah}-${result.ayah}-${i}`}
                      href={`/create?surah=${result.surah}&ayah=${result.ayah}`}
                      className="result-item block p-6 bg-white rounded-xl border border-sand-200 hover:border-emerald-300 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                            {result.surahName}
                          </span>
                          <span className="text-xs text-sand-500">آية {result.ayah}</span>
                        </div>
                        <ArrowLeft
                          className="w-5 h-5 text-sand-400 group-hover:text-emerald-600 transition-colors"
                          strokeWidth={2}
                        />
                      </div>
                      <p className="font-quran text-xl text-sand-800 text-center leading-loose">
                        {result.text}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
