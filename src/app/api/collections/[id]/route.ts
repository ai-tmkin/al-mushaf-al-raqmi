import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get single collection with designs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;

    // Fetch collection
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (collectionError) {
      console.error("❌ API: Collection load error:", collectionError);
      return NextResponse.json({ error: collectionError.message }, { status: 404 });
    }

    // Fetch designs in collection
    const { data: collectionItems } = await supabaseAdmin
      .from("collection_items")
      .select("design_id")
      .eq("collection_id", collectionId);

    let designs: any[] = [];
    if (collectionItems && collectionItems.length > 0) {
      const designIds = collectionItems.map((item) => item.design_id);
      const { data: designsData } = await supabaseAdmin
        .from("designs")
        .select("*")
        .in("id", designIds)
        .order("created_at", { ascending: false });

      designs = designsData || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...collection,
        designs,
      },
    });
  } catch (error: any) {
    console.error("❌ API: Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const body = await request.json();
    const { user_id, name, description, is_public } = body;

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data, error } = await supabaseAdmin
      .from("collections")
      .update(updateData)
      .eq("id", collectionId)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      console.error("❌ API: Collection update error:", error);
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

// DELETE - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete collection items first
    await supabaseAdmin
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId);

    // Delete collection
    const { error } = await supabaseAdmin
      .from("collections")
      .delete()
      .eq("id", collectionId)
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

