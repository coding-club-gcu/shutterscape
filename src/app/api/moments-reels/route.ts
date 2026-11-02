// src/app/api/moments-reels/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { MomentsReel } from "@/models/MomentsReel";
import { INITIAL_REELS } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_REELS = INITIAL_REELS;

const globalForMomentsReels = globalThis as unknown as {
  __shutterMomentsReelsStore?: any[];
};

if (!globalForMomentsReels.__shutterMomentsReelsStore) {
  globalForMomentsReels.__shutterMomentsReelsStore = [...DEFAULT_REELS];
}

export async function GET() {
  try {
    try {
      const conn = await connectDB();
      if (conn) {
        const items = await MomentsReel.find().sort({ order: 1 });
        if (items && items.length > 0) {
          return NextResponse.json({ success: true, data: items, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB moments reels fetch error, falling back to memory store:", dbErr);
    }

    return NextResponse.json({
      success: true,
      data: globalForMomentsReels.__shutterMomentsReelsStore || DEFAULT_REELS,
      source: "memory",
    });
  } catch (error) {
    console.error("GET /api/moments-reels error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_REELS, source: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newId = body.id || `reel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newReel = {
      ...body,
      id: newId,
      _id: body._id || newId,
      order: body.order || (globalForMomentsReels.__shutterMomentsReelsStore?.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!globalForMomentsReels.__shutterMomentsReelsStore) {
      globalForMomentsReels.__shutterMomentsReelsStore = [...DEFAULT_REELS];
    }
    globalForMomentsReels.__shutterMomentsReelsStore.push(newReel);

    // Attempt to persist to MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        const doc = await MomentsReel.create(newReel);
        return NextResponse.json({ success: true, data: doc, source: "database" }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn("MongoDB moments reels create error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: newReel, source: "memory" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/moments-reels error:", error);
    return NextResponse.json({ error: "Failed to create moments reel" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, _id, ...updates } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 });
    }

    if (!globalForMomentsReels.__shutterMomentsReelsStore) {
      globalForMomentsReels.__shutterMomentsReelsStore = [...DEFAULT_REELS];
    }

    let updatedInMemoryItem: any = null;
    const store = globalForMomentsReels.__shutterMomentsReelsStore;
    const itemIndex = store.findIndex((it: any) => it._id === targetId || it.id === targetId || it.id === id || it._id === _id);

    if (itemIndex >= 0) {
      store[itemIndex] = { ...store[itemIndex], ...updates, updatedAt: new Date().toISOString() };
      updatedInMemoryItem = store[itemIndex];
    } else {
      updatedInMemoryItem = { id: targetId, _id: targetId, ...updates, updatedAt: new Date().toISOString() };
      store.push(updatedInMemoryItem);
    }

    // Attempt to persist to MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        let filter: Record<string, unknown>;
        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          filter = { _id };
        } else if (id && mongoose.Types.ObjectId.isValid(id)) {
          filter = { _id: id };
        } else if (id) {
          filter = { id };
        } else {
          filter = { id: _id };
        }

        const updated = await MomentsReel.findOneAndUpdate(filter, updates, {
          returnDocument: "after",
          new: true,
        });

        if (updated) {
          return NextResponse.json({ success: true, data: updated, source: "database" });
        } else {
          const created = await MomentsReel.create({ ...(id ? { id } : {}), ...updates });
          return NextResponse.json({ success: true, data: created, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB moments reels update error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: updatedInMemoryItem, source: "memory" });
  } catch (error) {
    console.error("PUT /api/moments-reels error:", error);
    return NextResponse.json({ error: "Failed to update reel" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 });
    }

    if (!globalForMomentsReels.__shutterMomentsReelsStore) {
      globalForMomentsReels.__shutterMomentsReelsStore = [...DEFAULT_REELS];
    }

    globalForMomentsReels.__shutterMomentsReelsStore = globalForMomentsReels.__shutterMomentsReelsStore.filter(
      (it: any) => it.id !== id && it._id !== id
    );

    // Attempt to delete from MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        let filter: Record<string, unknown>;
        if (mongoose.Types.ObjectId.isValid(id)) {
          filter = { $or: [{ _id: id }, { id }] };
        } else {
          filter = { id };
        }
        await MomentsReel.findOneAndDelete(filter);
        return NextResponse.json({ success: true, message: "Reel deleted successfully", source: "database" });
      }
    } catch (dbErr) {
      console.warn("MongoDB moments reels delete error, deleted from in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Reel deleted successfully", source: "memory" });
  } catch (error) {
    console.error("DELETE /api/moments-reels error:", error);
    return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 });
  }
}
