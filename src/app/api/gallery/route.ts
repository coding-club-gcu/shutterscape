// src/app/api/gallery/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { GalleryFrame } from "@/models/GalleryFrame";
import { INITIAL_GALLERY } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_GALLERY = INITIAL_GALLERY;

const globalForGallery = globalThis as unknown as {
  __shutterGalleryStore?: any[];
};

if (!globalForGallery.__shutterGalleryStore) {
  globalForGallery.__shutterGalleryStore = [...DEFAULT_GALLERY];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    try {
      const conn = await connectDB();
      if (conn) {
        const query: Record<string, unknown> = {};
        if (category && category !== "ALL") {
          query.category = category;
        }

        const items = await GalleryFrame.find(query).sort({ order: 1 });
        if (items && items.length > 0) {
          return NextResponse.json({ success: true, data: items, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB gallery fetch error, falling back to memory store:", dbErr);
    }

    let filtered = globalForGallery.__shutterGalleryStore || DEFAULT_GALLERY;
    if (category && category !== "ALL") {
      filtered = filtered.filter((it: any) => it.category === category);
    }

    return NextResponse.json({ success: true, data: filtered, source: "memory" });
  } catch (error) {
    console.error("GET /api/gallery error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_GALLERY, source: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newId = body.id || `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newFrame = {
      ...body,
      id: newId,
      _id: body._id || newId,
      order: body.order || (globalForGallery.__shutterGalleryStore?.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!globalForGallery.__shutterGalleryStore) {
      globalForGallery.__shutterGalleryStore = [...DEFAULT_GALLERY];
    }
    globalForGallery.__shutterGalleryStore.push(newFrame);

    // Attempt to persist to MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        const doc = await GalleryFrame.create(newFrame);
        return NextResponse.json({ success: true, data: doc, source: "database" }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn("MongoDB gallery create error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: newFrame, source: "memory" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/gallery error:", error);
    return NextResponse.json({ error: "Failed to create gallery frame" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, _id, ...updates } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json({ error: "Frame ID is required" }, { status: 400 });
    }

    if (!globalForGallery.__shutterGalleryStore) {
      globalForGallery.__shutterGalleryStore = [...DEFAULT_GALLERY];
    }

    let updatedInMemoryItem: any = null;
    const store = globalForGallery.__shutterGalleryStore;
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

        const updated = await GalleryFrame.findOneAndUpdate(filter, updates, {
          returnDocument: "after",
          new: true,
        });

        if (updated) {
          return NextResponse.json({ success: true, data: updated, source: "database" });
        } else {
          const created = await GalleryFrame.create({ ...(id ? { id } : {}), ...updates });
          return NextResponse.json({ success: true, data: created, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB gallery update error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: updatedInMemoryItem, source: "memory" });
  } catch (error) {
    console.error("PUT /api/gallery error:", error);
    return NextResponse.json({ error: "Failed to update gallery frame" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Frame ID is required" }, { status: 400 });
    }

    if (!globalForGallery.__shutterGalleryStore) {
      globalForGallery.__shutterGalleryStore = [...DEFAULT_GALLERY];
    }

    globalForGallery.__shutterGalleryStore = globalForGallery.__shutterGalleryStore.filter(
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
        await GalleryFrame.findOneAndDelete(filter);
        return NextResponse.json({ success: true, message: "Frame deleted successfully", source: "database" });
      }
    } catch (dbErr) {
      console.warn("MongoDB gallery delete error, deleted from in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Frame deleted successfully", source: "memory" });
  } catch (error) {
    console.error("DELETE /api/gallery error:", error);
    return NextResponse.json({ error: "Failed to delete gallery frame" }, { status: 500 });
  }
}
