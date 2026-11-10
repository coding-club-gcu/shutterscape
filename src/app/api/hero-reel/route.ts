// src/app/api/hero-reel/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { HeroReel } from "@/models/HeroReel";
import { INITIAL_HERO_REEL } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_HERO_REEL = INITIAL_HERO_REEL;

const globalForHero = globalThis as unknown as {
  __shutterHeroCache?: { data: any[]; timestamp: number };
};

export async function GET() {
  try {
    if (
      globalForHero.__shutterHeroCache &&
      Date.now() - globalForHero.__shutterHeroCache.timestamp < 60000
    ) {
      return NextResponse.json(
        { success: true, data: globalForHero.__shutterHeroCache.data, source: "cache" },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
      );
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, data: DEFAULT_HERO_REEL, source: "fallback" });
    }

    const items = await HeroReel.find().sort({ order: 1 }).lean();
    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_HERO_REEL, source: "default" });
    }

    globalForHero.__shutterHeroCache = { data: items, timestamp: Date.now() };
    return NextResponse.json(
      { success: true, data: items, source: "database" },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("GET /api/hero-reel error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_HERO_REEL, source: "fallback" });
  }
}

export async function PUT(request: Request) {
  try {
    globalForHero.__shutterHeroCache = undefined;
    let conn = await connectDB();
    if (!conn) {
      await new Promise((r) => setTimeout(r, 800));
      conn = await connectDB();
    }
    if (!conn) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const body = await request.json();

    // Case 1: Bulk array of items { items: [...] }
    if (Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        const it = body.items[i];
        await HeroReel.findOneAndUpdate(
          { frameCode: it.frameCode },
          {
            frameCode: it.frameCode,
            title: it.title,
            src: it.src,
            exif: it.exif,
            order: i + 1,
          },
          { upsert: true, new: true }
        );
      }
      const updated = await HeroReel.find().sort({ order: 1 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Case 2: Direct array [...]
    if (Array.isArray(body)) {
      for (let i = 0; i < body.length; i++) {
        const it = body[i];
        await HeroReel.findOneAndUpdate(
          { frameCode: it.frameCode },
          {
            frameCode: it.frameCode,
            title: it.title,
            src: it.src,
            exif: it.exif,
            order: i + 1,
          },
          { upsert: true, new: true }
        );
      }
      const updated = await HeroReel.find().sort({ order: 1 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Case 3: Single item update from dashboard modal
    const { _id, id, frameCode, title, src, exif, order } = body;
    const targetQuery =
      _id && mongoose.Types.ObjectId.isValid(_id)
        ? { _id }
        : id && mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : frameCode
        ? { frameCode }
        : id
        ? { frameCode: id }
        : null;

    if (!targetQuery) {
      return NextResponse.json(
        { error: "Frame Code or ID is required" },
        { status: 400 }
      );
    }

    const updated = await HeroReel.findOneAndUpdate(
      targetQuery,
      {
        ...(frameCode ? { frameCode } : {}),
        ...(title ? { title } : {}),
        ...(src ? { src } : {}),
        ...(exif !== undefined ? { exif } : {}),
        ...(order ? { order } : {}),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/hero-reel error:", error);
    return NextResponse.json({ error: "Failed to update hero reel" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
