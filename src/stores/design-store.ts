import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignCustomization, ExportOptions } from "@/types/design";
import { DEFAULT_CUSTOMIZATION, DEFAULT_EXPORT_OPTIONS } from "@/types/design";
import type { Ayah } from "@/types/quran";

interface VerseSelection {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  verses: Ayah[];
  surahName: string;
}

interface DesignState {
  // Verse selection
  selection: VerseSelection | null;
  setSelection: (selection: VerseSelection | null) => void;

  // Customization
  customization: DesignCustomization;
  setCustomization: (customization: Partial<DesignCustomization>) => void;
  resetCustomization: () => void;

  // Export options
  exportOptions: ExportOptions;
  setExportOptions: (options: Partial<ExportOptions>) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Design history for undo
  history: DesignCustomization[];
  pushHistory: () => void;
  undo: () => void;
  canUndo: boolean;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      // Verse selection
      selection: null,
      setSelection: (selection) => set({ selection }),

      // Customization
      customization: DEFAULT_CUSTOMIZATION,
      setCustomization: (updates) =>
        set((state) => ({
          customization: { ...state.customization, ...updates },
        })),
      resetCustomization: () => set({ customization: DEFAULT_CUSTOMIZATION }),

      // Export options
      exportOptions: DEFAULT_EXPORT_OPTIONS,
      setExportOptions: (updates) =>
        set((state) => ({
          exportOptions: { ...state.exportOptions, ...updates },
        })),

      // UI state
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // History
      history: [],
      pushHistory: () =>
        set((state) => ({
          history: [...state.history.slice(-9), state.customization],
        })),
      undo: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const previous = newHistory.pop();
          return {
            history: newHistory,
            customization: previous || DEFAULT_CUSTOMIZATION,
          };
        }),
      get canUndo() {
        return get().history.length > 0;
      },
    }),
    {
      name: "mushaf-design-store",
      partialize: (state) => ({
        customization: state.customization,
        exportOptions: state.exportOptions,
      }),
    }
  )
);

