import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check if user liked a design
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const designId = searchParams.get("design_id");
    
    if (!userId || !designId) {
      return NextResponse.json(
        { error: "User ID and Design ID are required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("design_id", designId)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("❌ API: Like check error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      liked: !!data 
    });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Like a design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, design_id } = body;
    
    if (!user_id || !design_id) {
      return NextResponse.json(
        { error: "User ID and Design ID are required" },
        { status: 400 }
      );
    }
    
    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("user_id", user_id)
      .eq("design_id", design_id)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: "Already liked" 
      });
    }
    
    // Add like
    const { error } = await supabaseAdmin
      .from("likes")
      .insert({ user_id, design_id });
    
    if (error) {
      console.error("❌ API: Like error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update likes count
    await supabaseAdmin.rpc("increment_likes", { design_id });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unlike a design
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const designId = searchParams.get("design_id");
    
    if (!userId || !designId) {
      return NextResponse.json(
        { error: "User ID and Design ID are required" },
        { status: 400 }
      );
    }
    
    const { error } = await supabaseAdmin
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("design_id", designId);
    
    if (error) {
      console.error("❌ API: Unlike error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update likes count
    await supabaseAdmin.rpc("decrement_likes", { design_id: designId });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

