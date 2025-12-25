import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user settings (from profile)
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
      .from("profiles")
      .select("locale, theme, default_settings, notification_preferences")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("❌ API: Settings load error:", error);
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

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, locale, theme, default_settings, notification_preferences } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (locale !== undefined) updateData.locale = locale;
    if (theme !== undefined) updateData.theme = theme;
    if (default_settings !== undefined) updateData.default_settings = default_settings;
    if (notification_preferences !== undefined) updateData.notification_preferences = notification_preferences;
    
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user_id)
      .select()
      .single();
    
    if (error) {
      console.error("❌ API: Settings update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log("✅ Settings updated for user:", user_id);
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

