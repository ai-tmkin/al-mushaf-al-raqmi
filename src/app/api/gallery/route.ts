import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List public designs for gallery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "recent";
    const search = searchParams.get("search") || "";
    
    const offset = (page - 1) * limit;
    
    let query = supabaseAdmin
      .from("designs")
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("is_public", true);
    
    // Apply filters
    if (filter === "featured") {
      query = query.eq("is_featured", true);
    } else if (filter === "trending") {
      query = query.order("likes_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    
    // Apply search
    if (search) {
      query = query.or(`verse_text.ilike.%${search}%,title.ilike.%${search}%`);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error("❌ API: Gallery load error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

