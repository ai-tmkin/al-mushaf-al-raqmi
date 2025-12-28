import { NextRequest, NextResponse } from "next/server";

// Quran API for searching verses
const QURAN_API_BASE = "https://api.alquran.cloud/v1";

// GET - Search Quran verses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "text"; // text, surah, ayah
    const limit = parseInt(searchParams.get("limit") || "0") || 0; // 0 = no limit
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }
    
    console.log("🔍 Searching Quran for:", query, "type:", type, "limit:", limit);
    
    let results: any[] = [];
    
    if (type === "text") {
      // Search by text in Arabic
      const response = await fetch(
        `${QURAN_API_BASE}/search/${encodeURIComponent(query)}/all/ar`
      );
      const data = await response.json();
      
      if (data.code === 200 && data.data?.matches) {
        let matches = data.data.matches;
        
        // Apply limit if specified
        if (limit > 0) {
          matches = matches.slice(0, limit);
        }
        
        results = matches.map((match: any) => ({
          surah: match.surah.number,
          surahName: match.surah.name,
          surahEnglishName: match.surah.englishName,
          ayah: match.numberInSurah,
          text: match.text,
          edition: match.edition?.name || "Arabic",
        }));
      }
    } else if (type === "surah") {
      // Get surah by number or name
      const surahNumber = parseInt(query);
      if (!isNaN(surahNumber) && surahNumber >= 1 && surahNumber <= 114) {
        const response = await fetch(
          `${QURAN_API_BASE}/surah/${surahNumber}/ar.alafasy`
        );
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
          results = [{
            surah: data.data.number,
            surahName: data.data.name,
            surahEnglishName: data.data.englishName,
            ayahCount: data.data.numberOfAyahs,
            revelationType: data.data.revelationType,
            ayahs: data.data.ayahs?.slice(0, 10).map((a: any) => ({
              number: a.numberInSurah,
              text: a.text,
            })),
          }];
        }
      }
    } else if (type === "ayah") {
      // Get specific ayah (format: surah:ayah)
      const [surah, ayah] = query.split(":").map(Number);
      if (surah && ayah) {
        const response = await fetch(
          `${QURAN_API_BASE}/ayah/${surah}:${ayah}/ar.alafasy`
        );
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
          results = [{
            surah: data.data.surah.number,
            surahName: data.data.surah.name,
            surahEnglishName: data.data.surah.englishName,
            ayah: data.data.numberInSurah,
            text: data.data.text,
          }];
        }
      }
    }
    
    console.log("✅ Found", results.length, "results");
    
    return NextResponse.json({ 
      success: true, 
      data: results,
      query,
      type,
    });
    
  } catch (error: any) {
    console.error("❌ API: Search error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Emotional search - map emotions to relevant verses
const EMOTIONAL_VERSES: Record<string, { surah: number; ayah: number; text: string }[]> = {
  "الصبر": [
    { surah: 2, ayah: 153, text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ" },
    { surah: 3, ayah: 200, text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا" },
  ],
  "الرزق": [
    { surah: 65, ayah: 3, text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ" },
    { surah: 11, ayah: 6, text: "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا" },
  ],
  "الراحة": [
    { surah: 94, ayah: 5, text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا" },
    { surah: 13, ayah: 28, text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" },
  ],
  "الشكر": [
    { surah: 14, ayah: 7, text: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ" },
    { surah: 2, ayah: 152, text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ" },
  ],
  "التوبة": [
    { surah: 39, ayah: 53, text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ" },
    { surah: 4, ayah: 110, text: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا" },
  ],
  "الأمل": [
    { surah: 12, ayah: 87, text: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ" },
    { surah: 39, ayah: 53, text: "إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا" },
  ],
};

// POST - Emotional search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emotion } = body;
    
    if (!emotion) {
      return NextResponse.json(
        { error: "Emotion is required" },
        { status: 400 }
      );
    }
    
    console.log("💭 Emotional search for:", emotion);
    
    // Find matching verses
    const verses = EMOTIONAL_VERSES[emotion] || [];
    
    // If no direct match, search in Quran API
    if (verses.length === 0) {
      const response = await fetch(
        `${QURAN_API_BASE}/search/${encodeURIComponent(emotion)}/all/ar`
      );
      const data = await response.json();
      
      if (data.code === 200 && data.data?.matches) {
        return NextResponse.json({
          success: true,
          data: data.data.matches.slice(0, 5).map((match: any) => ({
            surah: match.surah.number,
            surahName: match.surah.name,
            ayah: match.numberInSurah,
            text: match.text,
          })),
          emotion,
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: verses,
      emotion,
    });
    
  } catch (error: any) {
    console.error("❌ API: Emotional search error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

