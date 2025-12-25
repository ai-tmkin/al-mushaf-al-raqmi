import { useQuery } from "@tanstack/react-query";
import {
  fetchAllSurahs,
  fetchSurah,
  fetchAyahs,
  type Surah,
  type SurahData,
  type Ayah,
} from "@/lib/quran/api";

/**
 * Hook to fetch all Surahs
 */
export function useAllSurahs() {
  return useQuery({
    queryKey: ["surahs"],
    queryFn: fetchAllSurahs,
    staleTime: Infinity, // Surahs never change
    gcTime: Infinity, // Keep in cache forever
  });
}

/**
 * Hook to fetch a specific Surah
 */
export function useSurah(surahNumber: number) {
  return useQuery({
    queryKey: ["surah", surahNumber],
    queryFn: () => fetchSurah(surahNumber),
    enabled: surahNumber > 0 && surahNumber <= 114,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch specific Ayahs
 */
export function useAyahs(surahNumber: number, startAyah: number, endAyah: number) {
  return useQuery({
    queryKey: ["ayahs", surahNumber, startAyah, endAyah],
    queryFn: () => fetchAyahs(surahNumber, startAyah, endAyah),
    enabled: surahNumber > 0 && surahNumber <= 114 && startAyah > 0 && endAyah >= startAyah,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

