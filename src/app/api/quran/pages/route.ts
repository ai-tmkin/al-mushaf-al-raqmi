import { NextRequest, NextResponse } from "next/server";
import { 
  fetchPage,
  getSurahNameAr,
  hasSajda,
  type Ayah,
} from "@/lib/quran/api";
import { 
  getPageImageUrl,
  TOTAL_PAGES,
} from "@/lib/quran/quran-com-api";
import {
  fetchPageLayout,
  type MushafPage,
} from "@/lib/quran/qul-api";
import {
  analyzePageLayout,
  type PageLayoutAnalysis,
} from "@/lib/quran/page-layout-analyzer";

// GET - Get page information with verses and image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageNumber = parseInt(searchParams.get("page") || "1");
    const style = (searchParams.get("style") as "v1" | "v2" | "warch" | "indopak") || "v2";
    const includeVerses = searchParams.get("verses") !== "false";
    const includeLayout = searchParams.get("layout") !== "false"; // New parameter for layout data

    // Validate page number
    if (pageNumber < 1 || pageNumber > TOTAL_PAGES) {
      return NextResponse.json(
        { error: `Page number must be between 1 and ${TOTAL_PAGES}` },
        { status: 400 }
      );
    }

    console.log("📄 Fetching page:", pageNumber);

    // Get page image URL
    const imageUrl = getPageImageUrl(pageNumber, style);

    // Get verses if requested
    let verses: any[] = [];
    let chaptersOnPage: { id: number; name: string }[] = [];
    let pageLayout: MushafPage | null = null;
    let layoutAnalysis: PageLayoutAnalysis | null = null;

    if (includeVerses || includeLayout) {
      // Fetch page layout with line_number data from Quran.com API
      if (includeLayout) {
        pageLayout = await fetchPageLayout(pageNumber);
        
        if (pageLayout) {
          // Analyze page layout to determine surah starts, bismillah, etc.
          layoutAnalysis = analyzePageLayout(pageNumber, pageLayout);
        }
      }

      // Use AlQuran Cloud API to fetch page data for verses
      const pageData = await fetchPage(pageNumber, "quran-uthmani");
      const ayahs = pageData.data.ayahs;
      
      // AlQuran Cloud API returns surahs as an object (keyed by surah number)
      const surahsData = pageData.data.surahs || {};
      const surahsArray = Object.values(surahsData);
      
      // Transform AlQuran Cloud format to match existing interface
      // Each ayah has a surah object with number property
      verses = ayahs.map((ayah: any) => {
        const surahNumber = ayah.surah?.number || 1;
        
        return {
          id: ayah.number,
          verse_number: ayah.numberInSurah,
          verse_key: `${surahNumber}:${ayah.numberInSurah}`,
          text_uthmani: ayah.text,
          page_number: ayah.page,
          juz_number: ayah.juz,
          hizb_number: Math.ceil(ayah.hizbQuarter / 4),
          sajdah_number: hasSajda(ayah) ? 1 : null,
        };
      });
      
      // Get unique chapters on this page from surahs object
      chaptersOnPage = surahsArray.map((surah: any) => ({
        id: surah.number,
        name: surah.name || getSurahNameAr(surah.number),
      }));
    }

    // Calculate juz number (approximate)
    const juzNumber = Math.ceil(pageNumber / 20.13);

    return NextResponse.json({
      success: true,
      data: {
        page_number: pageNumber,
        image_url: imageUrl,
        style,
        juz_number: Math.min(juzNumber, 30),
        chapters: chaptersOnPage,
        verses: includeVerses ? verses : undefined,
        layout: includeLayout && pageLayout ? {
          lines: pageLayout.lines,
          juz_number: pageLayout.juz_number,
          hizb_number: pageLayout.hizb_number,
          surahs: pageLayout.surahs,
        } : undefined,
        layout_analysis: includeLayout && layoutAnalysis ? {
          surah_starts: layoutAnalysis.surahStarts,
          bismillah_lines: layoutAnalysis.bismillahLines,
          surah_name_lines: layoutAnalysis.surahNameLines,
          available_text_lines: layoutAnalysis.availableTextLines,
        } : undefined,
        navigation: {
          has_previous: pageNumber > 1,
          has_next: pageNumber < TOTAL_PAGES,
          previous_page: pageNumber > 1 ? pageNumber - 1 : null,
          next_page: pageNumber < TOTAL_PAGES ? pageNumber + 1 : null,
          total_pages: TOTAL_PAGES,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Page API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch page" },
      { status: 500 }
    );
  }
}

