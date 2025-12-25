import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List collections for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        *,
        collection_items (
          design_id,
          designs (
            id,
            thumbnail_url,
            surah_number,
            ayah_start,
            ayah_end
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("❌ API: Collections load error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, description, is_public } = body;
    
    if (!user_id || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert({
        user_id,
        name,
        description: description || null,
        is_public: is_public || false,
      })
      .select()
      .single();
    
    if (error) {
      console.error("❌ API: Collection create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a collection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id");
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: "Collection ID and User ID are required" },
        { status: 400 }
      );
    }
    
    // First delete collection items
    await supabaseAdmin
      .from("collection_items")
      .delete()
      .eq("collection_id", id);
    
    // Then delete collection
    const { error } = await supabaseAdmin
      .from("collections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) {
      console.error("❌ API: Collection delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

