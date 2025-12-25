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
    
    const { 
      designId, // If provided, update existing design
      user_id, 
      surah_number, 
      ayah_start, 
      ayah_end, 
      verse_text, 
      customization, 
      is_public,
      collection_id,
      thumbnail_url
    } = body;
    
    // Validate required fields
    if (!user_id || !surah_number || !ayah_start || !ayah_end || !verse_text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const startTime = Date.now();
    let data, error;
    
    if (designId) {
      // Update existing design
      console.log("📝 API: Updating design:", designId);
      
      const updateData: any = {
        surah_number,
        ayah_start,
        ayah_end,
        verse_text,
        customization,
        is_public: is_public || false,
        updated_at: new Date().toISOString(),
      };
      
      if (thumbnail_url) {
        updateData.thumbnail_url = thumbnail_url;
      }
      
      const result = await supabaseAdmin
        .from("designs")
        .update(updateData)
        .eq("id", designId)
        .eq("user_id", user_id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      
    } else {
      // Insert new design
      console.log("📝 API: Inserting new design...");
      
      const insertData: any = {
        user_id,
        surah_number,
        ayah_start,
        ayah_end,
        verse_text,
        customization,
        is_public: is_public || false,
      };
      
      if (thumbnail_url) {
        insertData.thumbnail_url = thumbnail_url;
      }
      
      const result = await supabaseAdmin
        .from("designs")
        .insert(insertData)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ API: Operation took ${duration}ms`);
    
    if (error) {
      console.error("❌ API: Database error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Handle collection assignment (non-blocking)
    if (collection_id && data) {
      supabaseAdmin
        .from("collection_designs")
        .upsert({
          collection_id,
          design_id: data.id,
        }, {
          onConflict: "collection_id,design_id"
        })
        .then(({ error: collectionError }) => {
          if (collectionError) {
            console.error("⚠️ API: Collection assignment error:", collectionError);
          }
        });
    }
    
    console.log("✅ API: Design saved:", data.id);
    
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

