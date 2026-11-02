// src/app/api/activities/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ActivityEvent } from "@/models/ActivityEvent";
import { INITIAL_ACTIVITIES } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_ACTIVITIES = INITIAL_ACTIVITIES;

const globalForActivities = globalThis as unknown as {
  __shutterActivitiesStore?: any[];
};

if (!globalForActivities.__shutterActivitiesStore) {
  globalForActivities.__shutterActivitiesStore = [...DEFAULT_ACTIVITIES];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const upcoming = searchParams.get("upcoming");

    try {
      const conn = await connectDB();
      if (conn) {
        const query: Record<string, unknown> = {};
        if (year) query.year = year;
        if (category && category !== "ALL") query.category = category;
        if (upcoming === "true") query.isUpcoming = true;

        const items = await ActivityEvent.find(query).sort({ order: 1 });
        if (items && items.length > 0) {
          return NextResponse.json({ success: true, data: items, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB activities fetch error, falling back to memory store:", dbErr);
    }

    let filtered = globalForActivities.__shutterActivitiesStore || DEFAULT_ACTIVITIES;
    if (year) filtered = filtered.filter((ev: any) => ev.year === year);
    if (category && category !== "ALL") filtered = filtered.filter((ev: any) => ev.category === category);
    if (upcoming === "true") filtered = filtered.filter((ev: any) => ev.isUpcoming);

    return NextResponse.json({ success: true, data: filtered, source: "memory" });
  } catch (error) {
    console.error("GET /api/activities error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_ACTIVITIES, source: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newId = body.id || `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newEvent = {
      ...body,
      id: newId,
      _id: body._id || newId,
      order: body.order || (globalForActivities.__shutterActivitiesStore?.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!globalForActivities.__shutterActivitiesStore) {
      globalForActivities.__shutterActivitiesStore = [...DEFAULT_ACTIVITIES];
    }
    globalForActivities.__shutterActivitiesStore.push(newEvent);

    // Attempt to persist to MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        const doc = await ActivityEvent.create(newEvent);
        return NextResponse.json({ success: true, data: doc, source: "database" }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn("MongoDB activities create error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: newEvent, source: "memory" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/activities error:", error);
    return NextResponse.json({ error: "Failed to create activity event" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, _id, ...updates } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    if (!globalForActivities.__shutterActivitiesStore) {
      globalForActivities.__shutterActivitiesStore = [...DEFAULT_ACTIVITIES];
    }

    let updatedInMemoryItem: any = null;
    const store = globalForActivities.__shutterActivitiesStore;
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

        const updated = await ActivityEvent.findOneAndUpdate(filter, updates, {
          returnDocument: "after",
          new: true,
        });

        if (updated) {
          return NextResponse.json({ success: true, data: updated, source: "database" });
        } else {
          const created = await ActivityEvent.create({ ...(id ? { id } : {}), ...updates });
          return NextResponse.json({ success: true, data: created, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB activities update error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: updatedInMemoryItem, source: "memory" });
  } catch (error) {
    console.error("PUT /api/activities error:", error);
    return NextResponse.json({ error: "Failed to update activity event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    if (!globalForActivities.__shutterActivitiesStore) {
      globalForActivities.__shutterActivitiesStore = [...DEFAULT_ACTIVITIES];
    }

    globalForActivities.__shutterActivitiesStore = globalForActivities.__shutterActivitiesStore.filter(
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
        await ActivityEvent.findOneAndDelete(filter);
        return NextResponse.json({ success: true, message: "Event deleted successfully", source: "database" });
      }
    } catch (dbErr) {
      console.warn("MongoDB activities delete error, deleted from in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully", source: "memory" });
  } catch (error) {
    console.error("DELETE /api/activities error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
