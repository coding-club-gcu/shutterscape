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
  __shutterSpotlightStore?: typeof defaultSpotlightStore;
};

if (!globalForSpotlight.__shutterSpotlightStore) {
  globalForSpotlight.__shutterSpotlightStore = defaultSpotlightStore;
}

export async function GET() {
  try {
    const conn = await connectDB();
    if (conn) {
      const doc = await Spotlight.findOne().sort({ updatedAt: -1 });
      if (doc) {
        return NextResponse.json({
          success: true,
          data: {
            upcoming: doc.upcoming,
            live: doc.live,
          },
          source: "database",
        });
      }
    }
  } catch (err) {
    console.warn("MongoDB spotlight fetch error, using in-memory store:", err);
  }

  return NextResponse.json({
    success: true,
    data: globalForSpotlight.__shutterSpotlightStore || defaultSpotlightStore,
    source: "memory",
  });
}

export async function PUT(req: Request) {
  try {
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
