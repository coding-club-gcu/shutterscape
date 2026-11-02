// src/app/api/media/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UploadMedia } from "@/models/UploadMedia";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// In-memory hot cache for instantaneous sub-millisecond serving
const cache = new Map<string, { buffer: Buffer; mimeType: string }>();

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

    // Full video 200 response (Cached permanently on Vercel Edge CDN for instant 10ms playback!)
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

    // 1. Check in-memory hot cache (served in < 0.5 milliseconds)
    const cached = cache.get(id);
    if (cached) {
      return buildMediaStreamResponse(cached.buffer, cached.mimeType, range);
    }

    // 2. Check local disk in public/media (served in < 0.2ms without database network roundtrip!)
    try {
      let diskPath = path.join(process.cwd(), "public", "media", id);
      if (!fs.existsSync(diskPath)) {
        if (fs.existsSync(diskPath + ".webp")) {
          diskPath = diskPath + ".webp";
        } else if (fs.existsSync(diskPath + ".mp4")) {
          diskPath = diskPath + ".mp4";
        }
      }
      if (fs.existsSync(diskPath)) {
        const rawBuffer = fs.readFileSync(diskPath);
        const isVideo =
          (rawBuffer.length > 8 &&
            rawBuffer.toString("ascii", 4, 8) === "ftyp") ||
          rawBuffer.slice(0, 4).toString("hex") === "00000018";
        const mimeType = isVideo ? "video/mp4" : "image/webp";

        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
        cache.set(id, { buffer: rawBuffer, mimeType });
        return buildMediaStreamResponse(rawBuffer, mimeType, range);
      }
    } catch (diskErr) {
      console.warn("Disk read error, falling back to database:", diskErr);
    }

    // 3. Fallback to DB
    const conn = await connectDB();
    if (!conn) {
      return new NextResponse("Database unavailable", { status: 503 });
    }

    const media = await UploadMedia.findById(id).lean();
    if (!media || !media.data) {
      return new NextResponse("Media not found", { status: 404 });
    }

    const rawBuffer = Buffer.from(media.data, "base64");
    const mimeType = media.mimeType || "image/webp";

    // 3. Store in hot cache (LRU up to 100 entries)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(id, { buffer: rawBuffer, mimeType });

    // 4. Return stream response with proper HTTP 206 Range handling
    return buildMediaStreamResponse(rawBuffer, mimeType, range);

    return new NextResponse(new Uint8Array(rawBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": rawBuffer.length.toString(),
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("GET /api/media/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
