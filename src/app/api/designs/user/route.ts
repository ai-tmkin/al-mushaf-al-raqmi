import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List designs for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from("designs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("❌ API: User designs load error:", error);
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

// DELETE - Delete a design
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id");
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: "Design ID and User ID are required" },
        { status: 400 }
      );
    }
    
    // Delete from collection_items first
    await supabaseAdmin
      .from("collection_items")
      .delete()
      .eq("design_id", id);
    
    // Delete likes
    await supabaseAdmin
      .from("likes")
      .delete()
      .eq("design_id", id);
    
    // Delete the design
    const { error } = await supabaseAdmin
      .from("designs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) {
      console.error("❌ API: Design delete error:", error);
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

