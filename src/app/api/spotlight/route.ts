// src/app/api/spotlight/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Spotlight } from "@/models/Spotlight";
import { INITIAL_SPOTLIGHT } from "@/data/initialClubData";

// In-memory fallback store
const defaultSpotlightStore = {
  upcoming: INITIAL_SPOTLIGHT.upcoming,
  live: INITIAL_SPOTLIGHT.live,
};

const globalForSpotlight = globalThis as unknown as {
  __shutterSpotlightStore?: any;
  __shutterSpotlightCache?: { data: any; timestamp: number };
};

if (!globalForSpotlight.__shutterSpotlightStore) {
  globalForSpotlight.__shutterSpotlightStore = defaultSpotlightStore;
}

export async function GET() {
  try {
    // Fast-path: serve in-memory cached DB results (< 60s old) in 0.05ms
    if (
      globalForSpotlight.__shutterSpotlightCache &&
      Date.now() - globalForSpotlight.__shutterSpotlightCache.timestamp < 60000
    ) {
      return NextResponse.json(
        { success: true, data: globalForSpotlight.__shutterSpotlightCache.data, source: "cache" },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
      );
    }

    try {
      const conn = await connectDB();
      if (conn) {
        const doc = await Spotlight.findOne().sort({ updatedAt: -1 }).lean();
        if (doc) {
          const data = { upcoming: doc.upcoming, live: doc.live };
          globalForSpotlight.__shutterSpotlightCache = { data, timestamp: Date.now() };
          globalForSpotlight.__shutterSpotlightStore = data;
          return NextResponse.json(
            { success: true, data, source: "database" },
            { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
          );
        }
      }
    } catch (err) {
      console.warn("MongoDB spotlight fetch error, using in-memory store:", err);
    }

    return NextResponse.json(
      {
        success: true,
        data: globalForSpotlight.__shutterSpotlightStore || defaultSpotlightStore,
        source: "memory",
      },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("GET /api/spotlight error:", error);
    return NextResponse.json({
      success: true,
      data: defaultSpotlightStore,
      source: "fallback",
    });
  }
}

export async function PUT(req: Request) {
  try {
    globalForSpotlight.__shutterSpotlightCache = undefined;
    const body = await req.json();
    const current =
      globalForSpotlight.__shutterSpotlightStore || defaultSpotlightStore;

    const updated = {
      upcoming: body.upcoming
        ? { ...current.upcoming, ...body.upcoming }
        : current.upcoming,
      live: body.live ? { ...current.live, ...body.live } : current.live,
    };

    globalForSpotlight.__shutterSpotlightStore = updated;

    try {
      const conn = await connectDB();
      if (conn) {
        await Spotlight.findOneAndUpdate(
          {},
          { upcoming: updated.upcoming, live: updated.live },
          { upsert: true, new: true }
        );
      }
    } catch (dbErr) {
      console.warn("Could not persist spotlight to MongoDB, saved to memory:", dbErr);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update spotlight" },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  return PUT(req);
}
