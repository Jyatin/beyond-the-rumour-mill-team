import "server-only";
import fs from "fs/promises";
import path from "path";

export interface StorageOptions {
  folder?: "cvs" | "evidence";
  contentType?: string;
}

// Local storage path resolver (used when BLOB_READ_WRITE_TOKEN is not configured)
function getLocalStoragePath(key: string, folder: string = "cvs"): string {
  const safeKey = path.basename(key);
  const safeFolder = folder === "evidence" ? "evidence" : "cvs";
  const baseDir = process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR, safeFolder === "cvs" ? "" : safeFolder)
    : path.join(process.cwd(), ".storage", safeFolder);
  return path.join(baseDir, safeKey);
}

async function ensureLocalStorageDir(folder: string = "cvs"): Promise<string> {
  const safeFolder = folder === "evidence" ? "evidence" : "cvs";
  const baseDir = process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR, safeFolder === "cvs" ? "" : safeFolder)
    : path.join(process.cwd(), ".storage", safeFolder);
  try {
    await fs.mkdir(baseDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
  return baseDir;
}

/**
 * Checks if Vercel Blob is configured with an active token.
 */
function isVercelBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Validates file buffer against magic bytes for supported document/image types.
 */
export function detectSafeEvidenceFileType(
  buffer: Buffer,
  fileName: string
): { mimeType: string; extension: string } | null {
  if (buffer.length < 8) return null;

  // PDF: %PDF-
  if (buffer.subarray(0, 5).toString("utf-8") === "%PDF-") {
    return { mimeType: "application/pdf", extension: "pdf" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  void fileName;
  return null;
}

/**
 * Saves a private file securely to persistent storage (Vercel Blob in production, Filesystem in development).
 */
export async function savePrivateFile(
  key: string,
  buffer: Buffer,
  options: StorageOptions = {}
): Promise<string> {
  const safeKey = path.basename(key);
  const folder = options.folder === "evidence" ? "evidence" : "cvs";
  const contentType = options.contentType || "application/pdf";

  if (isVercelBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${safeKey}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Fallback: Local Filesystem Storage
  await ensureLocalStorageDir(folder);
  const filePath = getLocalStoragePath(safeKey, folder);
  await fs.writeFile(/*turbopackIgnore: true*/ filePath, buffer);
  return safeKey;
}

/**
 * Reads a private file from storage.
 */
export async function readPrivateFile(
  key: string,
  options: StorageOptions = {}
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!key) return null;
  const folder = options.folder === "evidence" ? "evidence" : "cvs";
  const fallbackContentType = options.contentType || "application/pdf";

  try {
    // If stored on Vercel Blob
    if (key.startsWith("http://") || key.startsWith("https://")) {
      const headers: Record<string, string> = {};
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
      }

      const response = await fetch(key, { headers, cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers?.get("content-type") || fallbackContentType,
      };
    }

    // Local Filesystem Storage
    const safeKey = path.basename(key);
    const filePath = getLocalStoragePath(safeKey, folder);
    const buffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);
    return {
      buffer,
      contentType: fallbackContentType,
    };
  } catch {
    return null;
  }
}

/**
 * Deletes a private file from storage (Vercel Blob or Filesystem).
 */
export async function deletePrivateFile(
  key: string,
  options: StorageOptions = {}
): Promise<boolean> {
  if (!key) return false;
  const folder = options.folder === "evidence" ? "evidence" : "cvs";

  try {
    // If stored on Vercel Blob
    if (key.startsWith("http://") || key.startsWith("https://")) {
      const { del } = await import("@vercel/blob");
      await del(key, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return true;
    }

    // Local Filesystem Storage
    const safeKey = path.basename(key);
    const filePath = getLocalStoragePath(safeKey, folder);
    await fs.unlink(/*turbopackIgnore: true*/ filePath);
    return true;
  } catch {
    return false;
  }
}
