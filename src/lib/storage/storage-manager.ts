/**
 * Unified Storage Manager
 * Handles both Supabase and Backblaze B2 storage
 */

import { createClient } from "@/lib/supabase/client";
import { uploadToB2, deleteFromB2, isB2Configured } from "./b2-storage";

export type StorageProvider = "supabase" | "b2";

// Get storage provider from environment
export function getStorageProvider(): StorageProvider {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "b2";
  return provider as StorageProvider;
}

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload file to configured storage provider
 */
export async function uploadFile(
  file: Blob,
  path: string,
  userId: string,
  contentType: string = "image/jpeg"
): Promise<StorageUploadResult> {
  const provider = getStorageProvider();

  // Try B2 first if configured
  if (provider === "b2" && isB2Configured()) {
    console.log("📦 Uploading to Backblaze B2...");
    const result = await uploadToB2(file, path, contentType);
    
    if (result.success) {
      return {
        success: true,
        url: result.url,
        path: path,
      };
    }
    
    // If B2 fails, fallback to Supabase
    console.warn("B2 upload failed, falling back to Supabase");
  }

  // Use Supabase storage
  console.log("📦 Uploading to Supabase Storage...");
  return await uploadToSupabase(file, path, userId, contentType);
}

/**
 * Upload to Supabase Storage with retry
 */
async function uploadToSupabase(
  file: Blob,
  path: string,
  userId: string,
  contentType: string,
  retries: number = 3
): Promise<StorageUploadResult> {
  const supabase = createClient();

  if (!supabase) {
    return {
      success: false,
      error: "Supabase client not initialized",
    };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Supabase upload attempt ${attempt}/${retries}...`);
      
      const { data, error } = await supabase.storage
        .from("designs")
        .upload(path, file, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`Supabase upload error (attempt ${attempt}):`, error);
        
        // If last attempt, return error
        if (attempt === retries) {
          return {
            success: false,
            error: error.message,
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Success! Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("designs").getPublicUrl(data.path);

      console.log(`✅ Supabase upload successful on attempt ${attempt}`);
      return {
        success: true,
        url: publicUrl,
        path: data.path,
      };
    } catch (error: any) {
      console.error(`Supabase upload error (attempt ${attempt}):`, error);
      
      // If last attempt, return error
      if (attempt === retries) {
        return {
          success: false,
          error: error.message || "Upload failed",
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return {
    success: false,
    error: "Upload failed after all retries",
  };
}

/**
 * Delete file from configured storage provider
 */
export async function deleteFile(
  path: string,
  userId: string
): Promise<boolean> {
  const provider = getStorageProvider();

  // Try B2 first if configured
  if (provider === "b2" && isB2Configured()) {
    console.log("🗑️ Deleting from Backblaze B2...");
    const success = await deleteFromB2(path);
    
    if (success) {
      return true;
    }
    
    // If B2 fails, fallback to Supabase
    console.warn("B2 delete failed, falling back to Supabase");
  }

  // Use Supabase storage
  console.log("🗑️ Deleting from Supabase Storage...");
  return await deleteFromSupabase(path, userId);
}

/**
 * Delete from Supabase Storage
 */
async function deleteFromSupabase(
  path: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();

  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.storage.from("designs").remove([path]);

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Supabase delete error:", error);
    return false;
  }
}

/**
 * Generate storage path for thumbnail
 */
export function generateThumbnailPath(userId: string, designId: string): string {
  const timestamp = Date.now();
  return `${userId}/thumbnails/${designId}_${timestamp}.jpg`;
}

