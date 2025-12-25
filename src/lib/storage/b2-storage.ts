/**
 * Backblaze B2 Storage Integration
 * Using S3-compatible API
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// B2 Configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID || "";
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY || "";
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || "";
const B2_ENDPOINT = process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com";
const B2_REGION = "us-west-004"; // Backblaze B2 region

// Initialize S3 Client for B2
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!B2_KEY_ID || !B2_APPLICATION_KEY) {
    console.warn("B2 credentials not configured");
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: B2_ENDPOINT,
      region: B2_REGION,
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APPLICATION_KEY,
      },
    });
  }

  return s3Client;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload file to B2
 */
export async function uploadToB2(
  file: Blob,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<UploadResult> {
  const client = getS3Client();
  
  if (!client) {
    return {
      success: false,
      error: "B2 client not initialized",
    };
  }

  try {
    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to B2
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      // Make file publicly accessible
      ACL: "public-read",
    });

    await client.send(command);

    // Construct public URL
    // Format: https://f{bucket_id}.backblazeb2.com/file/{bucket_name}/{file_name}
    const publicUrl = `${B2_ENDPOINT}/${B2_BUCKET_NAME}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error("B2 upload error:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

/**
 * Delete file from B2
 */
export async function deleteFromB2(fileName: string): Promise<boolean> {
  const client = getS3Client();
  
  if (!client) {
    console.warn("B2 client not initialized");
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    console.error("B2 delete error:", error);
    return false;
  }
}

/**
 * Get signed URL for private files (if needed in future)
 */
export async function getSignedUrlFromB2(
  fileName: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getS3Client();
  
  if (!client) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (error: any) {
    console.error("B2 signed URL error:", error);
    return null;
  }
}

/**
 * Check if B2 is configured
 */
export function isB2Configured(): boolean {
  return !!(B2_KEY_ID && B2_APPLICATION_KEY && B2_BUCKET_NAME);
}

