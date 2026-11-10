// src/app/api/pullin-exhibits/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { PullInExhibit } from "@/models/PullInExhibit";
import { INITIAL_PULLIN } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_EXHIBITS = INITIAL_PULLIN;

const globalForPullIn = globalThis as unknown as {
  __shutterPullInCache?: { data: any[]; timestamp: number };
};

export async function GET() {
  try {
    if (
      globalForPullIn.__shutterPullInCache &&
      Date.now() - globalForPullIn.__shutterPullInCache.timestamp < 60000
    ) {
      return NextResponse.json(
        { success: true, data: globalForPullIn.__shutterPullInCache.data, source: "cache" },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
      );
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ success: true, data: DEFAULT_EXHIBITS, source: "fallback" });
    }

    const items = await PullInExhibit.find().sort({ order: 1 }).lean();
    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_EXHIBITS, source: "default" });
    }

    globalForPullIn.__shutterPullInCache = { data: items, timestamp: Date.now() };
    return NextResponse.json(
      { success: true, data: items, source: "database" },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("GET /api/pullin-exhibits error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_EXHIBITS, source: "fallback" });
  }
}

export async function PUT(request: Request) {
  try {
    globalForPullIn.__shutterPullInCache = undefined;
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
        await PullInExhibit.findOneAndUpdate(
          { code: it.code },
          {
            code: it.code,
            title: it.title,
            subTitle: it.subTitle || "",
            src: it.src,
            exif: it.exif || "",
            focusDistance: it.focusDistance || "",
            headline: it.headline,
            subhead: it.subhead || "",
            order: i + 1,
          },
          { upsert: true, new: true }
        );
      }
      const updated = await PullInExhibit.find().sort({ order: 1 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Case 2: Direct array [...]
    if (Array.isArray(body)) {
      for (let i = 0; i < body.length; i++) {
        const it = body[i];
        await PullInExhibit.findOneAndUpdate(
          { code: it.code },
          {
            code: it.code,
            title: it.title,
            subTitle: it.subTitle || "",
            src: it.src,
            exif: it.exif || "",
            focusDistance: it.focusDistance || "",
            headline: it.headline,
            subhead: it.subhead || "",
            order: i + 1,
          },
          { upsert: true, new: true }
        );
      }
      const updated = await PullInExhibit.find().sort({ order: 1 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Case 3: Single item update from dashboard modal
    const { _id, id, code, ...fields } = body;
    const targetQuery =
      _id && mongoose.Types.ObjectId.isValid(_id)
        ? { _id }
        : id && mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : code
        ? { code }
        : id
        ? { code: id }
        : null;

    if (!targetQuery) {
      return NextResponse.json(
        { error: "Exhibit code or ID is required" },
        { status: 400 }
      );
    }

    const updated = await PullInExhibit.findOneAndUpdate(
      targetQuery,
      {
        ...(code ? { code } : {}),
        ...fields,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/pullin-exhibits error:", error);
    return NextResponse.json({ error: "Failed to update corridor exhibits" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
