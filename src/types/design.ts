export interface DesignCustomization {
  // Font settings
  font: "amiri" | "scheherazade" | "noto" | "system";
  fontSize: number;
  fontColor: string;
  textAlign: "center" | "right" | "left";
  lineHeight: number;

  // Background settings
  backgroundType: "color" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;

  // Display options
  showBismillah: boolean;
  showSajdaMarker: boolean;
  ayahEndSymbol: string;
  showContext: boolean;
  contextCount: number;

  // Layout
  padding: number;
  borderRadius: number;
  aspectRatio: "square" | "story" | "landscape" | "custom";
  customWidth?: number;
  customHeight?: number;
}

export const DEFAULT_CUSTOMIZATION: DesignCustomization = {
  font: "amiri",
  fontSize: 32,
  fontColor: "#1c1917",
  textAlign: "center",
  lineHeight: 2.2,

  backgroundType: "color",
  backgroundColor: "#ffffff",

  showBismillah: true,
  showSajdaMarker: true,
  ayahEndSymbol: "۝",
  showContext: false,
  contextCount: 1,

  padding: 48,
  borderRadius: 16,
  aspectRatio: "square",
};

export interface ColorPreset {
  id: string;
  name: string;
  textColor: string;
  backgroundColor: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "classic",
    name: "كلاسيكي",
    textColor: "#1c1917",
    backgroundColor: "#ffffff",
  },
  {
    id: "emerald-dark",
    name: "أخضر داكن",
    textColor: "#ffffff",
    backgroundColor: "#065f46",
  },
  {
    id: "gold-light",
    name: "ذهبي فاتح",
    textColor: "#92400e",
    backgroundColor: "#fffbeb",
  },
  {
    id: "sand",
    name: "رملي",
    textColor: "#1c1917",
    backgroundColor: "#f5f5f4",
  },
  {
    id: "night",
    name: "ليلي",
    textColor: "#d6d3d1",
    backgroundColor: "#1c1917",
  },
  {
    id: "emerald-light",
    name: "أخضر فاتح",
    textColor: "#064e3b",
    backgroundColor: "#ecfdf5",
  },
];

export interface FontOption {
  id: string;
  name: string;
  nameAr: string;
  className: string;
  preview: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "amiri",
    name: "Amiri",
    nameAr: "أميري",
    className: "quran-amiri",
    preview: "بسم الله",
  },
  {
    id: "scheherazade",
    name: "Scheherazade",
    nameAr: "شهرزاد",
    className: "quran-scheherazade",
    preview: "بسم الله",
  },
  {
    id: "noto",
    name: "Noto Naskh",
    nameAr: "نوتو نسخ",
    className: "quran-noto",
    preview: "بسم الله",
  },
  {
    id: "system",
    name: "System",
    nameAr: "النظام",
    className: "",
    preview: "بسم الله",
  },
];

export type ExportFormat = "png" | "jpg" | "webp";
export type ExportResolution = "1080" | "1920" | "3000" | "custom";

export interface ExportOptions {
  format: ExportFormat;
  resolution: ExportResolution;
  customWidth?: number;
  customHeight?: number;
  includeWatermark: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "png",
  resolution: "1920",
  includeWatermark: false,
};

