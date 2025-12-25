import type { DesignCustomization } from "@/types/design";
import type { Ayah } from "@/types/quran";
import { formatAyahWithSymbol, needsBismillah } from "@/lib/quran/api";
import { BISMILLAH } from "@/types/quran";

interface ExportParams {
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  verses: Ayah[];
  customization: DesignCustomization;
  format?: "png" | "jpg" | "svg";
  scale?: number;
}

export async function exportDesign(params: ExportParams): Promise<Blob> {
  const {
    surahNumber,
    surahName,
    verses,
    customization,
    format = "png",
    scale = 2,
  } = params;

  // Construct verse text with ayah end symbols
  const verseText = verses
    .map((verse) =>
      formatAyahWithSymbol(verse.text, verse.numberInSurah, customization.ayahEndSymbol)
    )
    .join(" ");

  // Check if we should show bismillah
  const showBismillah =
    customization.showBismillah && needsBismillah(surahNumber);

  try {
    // Call our API route to generate SVG
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        verseText,
        surahName,
        customization,
        showBismillah,
        bismillahText: BISMILLAH,
      }),
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    // For SVG format, return directly
    if (format === "svg") {
      const svgText = await response.text();
      return new Blob([svgText], { type: "image/svg+xml" });
    }

    // For PNG/JPG, we'll use canvas to convert
    const svgText = await response.text();
    const blob = await svgToImageBlob(svgText, format, scale);
    return blob;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

async function svgToImageBlob(
  svgText: string,
  format: "png" | "jpg",
  scale: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        format === "jpg" ? "image/jpeg" : "image/png",
        0.95
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load SVG"));
    };

    // Convert SVG to data URL
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    img.src = URL.createObjectURL(svgBlob);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

