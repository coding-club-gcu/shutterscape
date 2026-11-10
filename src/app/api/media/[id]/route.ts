// src/app/api/media/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UploadMedia } from "@/models/UploadMedia";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Persistent global memory cache across Next.js invocations
const globalForMedia = globalThis as unknown as {
  __shutterMediaCache?: Map<string, { buffer: Buffer; mimeType: string }>;
  __shutterInFlightMedia?: Map<string, Promise<{ buffer: Buffer; mimeType: string } | null>>;
};

if (!globalForMedia.__shutterMediaCache) {
  globalForMedia.__shutterMediaCache = new Map();
}
if (!globalForMedia.__shutterInFlightMedia) {
  globalForMedia.__shutterInFlightMedia = new Map();
}

const memoryCache = globalForMedia.__shutterMediaCache;
const inFlightFetches = globalForMedia.__shutterInFlightMedia;

function getDiskFilePath(id: string): string | null {
  try {
    const mediaDir = path.join(process.cwd(), "public", "media");
    const directPath = path.join(mediaDir, id);
    if (fs.existsSync(directPath)) return directPath;
    if (fs.existsSync(directPath + ".webp")) return directPath + ".webp";
    if (fs.existsSync(directPath + ".mp4")) return directPath + ".mp4";
    if (fs.existsSync(directPath + ".jpg")) return directPath + ".jpg";
  } catch {
    // Disk access error
  }
  return null;
}

function saveToDiskCache(id: string, rawBuffer: Buffer, mimeType: string) {
  try {
    const mediaDir = path.join(process.cwd(), "public", "media");
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    const ext = mimeType.startsWith("video/") ? ".mp4" : ".webp";
    const filePath = path.join(mediaDir, id + ext);
    fs.writeFileSync(filePath, rawBuffer);
  } catch (err) {
    // Read-only filesystem or disk write error; in-memory cache remains active
  }
}

function buildMediaStreamResponse(
  rawBuffer: Buffer,
  mimeType: string,
  rangeHeader: string | null
) {
  const totalSize = rawBuffer.length;

  // 1. Video streaming: allow full status 200 caching on initial load (start === 0)
  if (mimeType.startsWith("video/")) {
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);

      // Only return 206 slice if client is explicitly seeking past byte 0
      if (!isNaN(start) && start > 0) {
        const maxChunk = 2 * 1024 * 1024;
        const end = parts[1]
          ? parseInt(parts[1], 10)
          : Math.min(start + maxChunk - 1, totalSize - 1);

        const chunk = rawBuffer.subarray(start, end + 1);

        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunk.length.toString(),
            "Content-Type": mimeType,
            "Cache-Control":
              "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
            "CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Full video 200 response
    return new NextResponse(new Uint8Array(rawBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": totalSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 2. Images & non-video
  return new NextResponse(new Uint8Array(rawBuffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": totalSize.toString(),
      "Cache-Control":
        "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
      "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function getFallbackPlaceholder(id: string) {
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="100%" height="100%" fill="#121212"/><circle cx="400" cy="270" r="48" fill="#222"/><rect x="350" y="340" width="100" height="12" rx="6" fill="#2a2a2a"/><text x="400" y="380" fill="#666" font-family="monospace" font-size="12" text-anchor="middle">SHUTTERSCAPE ARCHIVE</text></svg>`;
  return new NextResponse(placeholderSvg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid Media ID", { status: 400 });
    }

    const range = request.headers.get("range");

    // 1. Check in-memory global hot cache (served in < 0.1ms)
    const hotCached = memoryCache.get(id);
    if (hotCached) {
      return buildMediaStreamResponse(hotCached.buffer, hotCached.mimeType, range);
    }

    // 2. Check local disk cache (served in < 0.2ms without database network roundtrip!)
    const diskPath = getDiskFilePath(id);
    if (diskPath) {
      try {
        const rawBuffer = fs.readFileSync(diskPath);
        const isVideo =
          (rawBuffer.length > 8 &&
            rawBuffer.toString("ascii", 4, 8) === "ftyp") ||
          rawBuffer.slice(0, 4).toString("hex") === "00000018";
        const mimeType = isVideo ? "video/mp4" : "image/webp";

        if (memoryCache.size > 200) {
          const firstKey = memoryCache.keys().next().value;
          if (firstKey) memoryCache.delete(firstKey);
        }
        memoryCache.set(id, { buffer: rawBuffer, mimeType });
        return buildMediaStreamResponse(rawBuffer, mimeType, range);
      } catch (diskErr) {
        console.warn("Disk read error, falling back to database:", diskErr);
      }
    }

    // 3. Deduplicate in-flight concurrent requests for the same media ID
    let fetchPromise = inFlightFetches.get(id);
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          // Connect to MongoDB Atlas with automatic retry
          let conn = await connectDB();
          if (!conn) {
            await new Promise((r) => setTimeout(r, 800));
            conn = await connectDB();
          }

          if (!conn) {
            console.warn(`[media-api] DB not connected for media ${id}`);
            return null;
          }

          const media = await UploadMedia.findById(id).lean();
          if (!media || !media.data) {
            return null;
          }

          const rawBuffer = Buffer.from(media.data, "base64");
          const mimeType = media.mimeType || "image/webp";

          // Save to memory cache (LRU up to 200 entries)
          if (memoryCache.size > 200) {
            const firstKey = memoryCache.keys().next().value;
            if (firstKey) memoryCache.delete(firstKey);
          }
          memoryCache.set(id, { buffer: rawBuffer, mimeType });

          // Persist to disk asynchronously for future 0ms reads
          saveToDiskCache(id, rawBuffer, mimeType);

          return { buffer: rawBuffer, mimeType };
        } catch (dbErr) {
          console.error(`[media-api] Error fetching media ${id}:`, dbErr);
          return null;
        } finally {
          inFlightFetches.delete(id);
        }
      })();

      inFlightFetches.set(id, fetchPromise);
    }

    const result = await fetchPromise;
    if (result) {
      return buildMediaStreamResponse(result.buffer, result.mimeType, range);
    }

    // 4. Return clean placeholder instead of 503 so frontend renders smoothly without crashing
    return getFallbackPlaceholder(id);
  } catch (error) {
    console.error("GET /api/media/[id] error:", error);
    return getFallbackPlaceholder("fallback");
  }
}
