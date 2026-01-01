"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, X, Palette, BookOpen } from "lucide-react";
import { SURAH_NAMES_AR } from "@/lib/quran/quran-com-api";

interface SearchResult {
  verse_key: string;
  verse_id: number;
  text: string;
  text_clean: string;
  surah_number: number;
  ayah_number: number;
  surah_name: string;
  highlighted?: string;
}

interface QuranSearchBarProps {
  onSelect: (surah: number, ayah: number) => void;
  onCreateDesign?: (surah: number, ayah: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function QuranSearchBar({
  onSelect,
  onCreateDesign,
  placeholder = "ابحث في القرآن الكريم...",
  autoFocus = false,
}: QuranSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/quran/search?q=${encodeURIComponent(searchQuery)}&per_page=8`
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        setResults(data.data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    onSelect(result.surah_number, result.ayah_number);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle create design
  const handleCreateDesignClick = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateDesign) {
      onCreateDesign(result.surah_number, result.ayah_number);
    }
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Highlight matching text
  const highlightText = (text: string | undefined, query: string) => {
    if (!text) return "";
    if (!query) return text;
    
    try {
      const parts = text.split(new RegExp(`(${query})`, "gi"));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-emerald-100 text-emerald-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-10 pl-10 pr-10 bg-sand-50 border border-sand-200 rounded-lg text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          dir="rtl"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-sand-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-sand-400" />
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-sand-200 transition-colors"
          >
            <X className="w-3 h-3 text-sand-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-sand-200 max-h-[400px] overflow-y-auto z-50"
        >
          <div className="p-2">
            <p className="text-xs text-sand-500 px-3 py-2">
              نتائج البحث ({results.length})
            </p>
            
            {results.map((result, index) => (
              <div
                key={result.verse_id}
                onClick={() => handleSelect(result)}
                className={`group px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? "bg-emerald-50"
                    : "hover:bg-sand-50"
                }`}
              >
                {/* Verse Reference */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      <BookOpen className="w-3 h-3" />
                      {result.surah_name}
                    </span>
                    <span className="text-xs text-sand-500">
                      الآية {result.ayah_number}
                    </span>
                  </div>
                  
                  {/* Create Design Button */}
                  {onCreateDesign && (
                    <button
                      onClick={(e) => handleCreateDesignClick(result, e)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs transition-opacity"
                    >
                      <Palette className="w-3 h-3" />
                      <span>تصميم</span>
                    </button>
                  )}
                </div>
                
                {/* Verse Text */}
                <p className="text-sm text-sand-800 font-quran leading-loose line-clamp-2">
                  {highlightText(result.text_clean || result.text, query)}
                </p>
              </div>
            ))}
          </div>
          
          {/* Search Tips */}
          <div className="px-4 py-3 bg-sand-50 border-t border-sand-100 text-xs text-sand-500">
            <span>اضغط Enter للانتقال للآية</span>
            <span className="mx-2">•</span>
            <span>↑↓ للتنقل</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-sand-200 p-6 text-center z-50">
          <Search className="w-8 h-8 text-sand-300 mx-auto mb-2" />
          <p className="text-sand-600 text-sm">لم يتم العثور على نتائج</p>
          <p className="text-sand-400 text-xs mt-1">جرب كلمات مختلفة</p>
        </div>
      )}
    </div>
  );
}

