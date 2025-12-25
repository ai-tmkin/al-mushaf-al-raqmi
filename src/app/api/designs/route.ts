import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Load design by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Design ID is required" },
        { status: 400 }
      );
    }
    
    console.log("📥 API: Loading design:", id);
    
    const { data, error } = await supabaseAdmin
      .from("designs")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("❌ API: Load error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    console.log("✅ API: Design loaded:", data.id);
    
    return NextResponse.json({ 
      success: true, 
      data 
    });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("📥 API: Received design save request");
    console.log("📦 API: Data:", JSON.stringify(body, null, 2));
    
    const { user_id, surah_number, ayah_start, ayah_end, verse_text, customization, is_public } = body;
    
    // Validate required fields
    if (!user_id || !surah_number || !ayah_start || !ayah_end || !verse_text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    console.log("📝 API: Inserting design...");
    const startTime = Date.now();
    
    const { data, error } = await supabaseAdmin
      .from("designs")
      .insert({
        user_id,
        surah_number,
        ayah_start,
        ayah_end,
        verse_text,
        customization,
        is_public: is_public || false,
      })
      .select()
      .single();
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ API: Insert took ${duration}ms`);
    
    if (error) {
      console.error("❌ API: Insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log("✅ API: Design created:", data.id);
    
    return NextResponse.json({ 
      success: true, 
      data,
      duration 
    });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

