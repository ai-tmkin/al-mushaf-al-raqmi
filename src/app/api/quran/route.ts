import { NextRequest, NextResponse } from "next/server";
import {
  fetchChapters,
  fetchChapter,
  fetchVersesByChapter,
  fetchVersesByPage,
  fetchVersesByJuz,
  fetchJuzs,
  getPageImageUrl,
  SURAH_NAMES_AR,
} from "@/lib/quran/quran-com-api";

// GET - Fetch Quran data (chapters, verses, pages)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "chapters";
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "50");

    console.log("📖 Quran API request:", { type, id, page, perPage });

    switch (type) {
      case "chapters": {
        // Get all chapters
        const chapters = await fetchChapters();
        return NextResponse.json({
          success: true,
          data: chapters,
        });
      }

      case "chapter": {
        // Get single chapter info
        if (!id) {
          return NextResponse.json(
            { error: "Chapter ID is required" },
            { status: 400 }
          );
        }
        const chapter = await fetchChapter(parseInt(id));
        return NextResponse.json({
          success: true,
          data: chapter,
        });
      }

      case "verses_by_chapter": {
        // Get verses by chapter
        if (!id) {
          return NextResponse.json(
            { error: "Chapter ID is required" },
            { status: 400 }
          );
        }
        const result = await fetchVersesByChapter(parseInt(id), page, perPage);
        return NextResponse.json({
          success: true,
          data: result.verses,
          pagination: result.pagination,
          chapter: {
            id: parseInt(id),
            name: SURAH_NAMES_AR[parseInt(id)] || `سورة ${id}`,
          },
        });
      }

      case "verses_by_page": {
        // Get verses by page number
        if (!id) {
          return NextResponse.json(
            { error: "Page number is required" },
            { status: 400 }
          );
        }
        const pageNumber = parseInt(id);
        if (pageNumber < 1 || pageNumber > 604) {
          return NextResponse.json(
            { error: "Page number must be between 1 and 604" },
            { status: 400 }
          );
        }
        const verses = await fetchVersesByPage(pageNumber);
        return NextResponse.json({
          success: true,
          data: verses,
          page: pageNumber,
          imageUrl: getPageImageUrl(pageNumber),
        });
      }

      case "verses_by_juz": {
        // Get verses by juz number
        if (!id) {
          return NextResponse.json(
            { error: "Juz number is required" },
            { status: 400 }
          );
        }
        const juzNumber = parseInt(id);
        if (juzNumber < 1 || juzNumber > 30) {
          return NextResponse.json(
            { error: "Juz number must be between 1 and 30" },
            { status: 400 }
          );
        }
        const result = await fetchVersesByJuz(juzNumber, page, perPage);
        return NextResponse.json({
          success: true,
          data: result.verses,
          pagination: result.pagination,
          juz: juzNumber,
        });
      }

      case "juzs": {
        // Get all juz information
        const juzs = await fetchJuzs();
        return NextResponse.json({
          success: true,
          data: juzs,
        });
      }

      case "page_image": {
        // Get page image URL
        if (!id) {
          return NextResponse.json(
            { error: "Page number is required" },
            { status: 400 }
          );
        }
        const style = (searchParams.get("style") as "v1" | "v2" | "warch" | "indopak") || "v2";
        const imageUrl = getPageImageUrl(parseInt(id), style);
        return NextResponse.json({
          success: true,
          data: { imageUrl, page: parseInt(id), style },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("❌ Quran API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

