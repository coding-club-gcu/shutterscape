// src/app/api/committee/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CommitteeMember } from "@/models/CommitteeMember";
import { INITIAL_COMMITTEE } from "@/data/initialClubData";

// Synced with Live GCU Club Data (Instantaneous 0ms initial render)
const DEFAULT_COMMITTEE = INITIAL_COMMITTEE;

const globalForCommittee = globalThis as unknown as {
  __shutterCommitteeStore?: any[];
  __shutterCommitteeCache?: { data: any[]; timestamp: number };
};

if (!globalForCommittee.__shutterCommitteeStore) {
  globalForCommittee.__shutterCommitteeStore = [...DEFAULT_COMMITTEE];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const isUnfiltered = !tier;

    // Fast-path: serve in-memory cached DB results (< 60s old) in 0.05ms
    if (
      isUnfiltered &&
      globalForCommittee.__shutterCommitteeCache &&
      Date.now() - globalForCommittee.__shutterCommitteeCache.timestamp < 60000
    ) {
      return NextResponse.json(
        { success: true, data: globalForCommittee.__shutterCommitteeCache.data, source: "cache" },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
      );
    }

    try {
      const conn = await connectDB();
      if (conn) {
        const query: Record<string, unknown> = {};
        if (tier) query.tier = tier;

        const items = await CommitteeMember.find(query).sort({ order: 1 }).lean();
        if (items && items.length > 0) {
          if (isUnfiltered) {
            globalForCommittee.__shutterCommitteeCache = { data: items, timestamp: Date.now() };
            globalForCommittee.__shutterCommitteeStore = items;
          }
          return NextResponse.json(
            { success: true, data: items, source: "database" },
            { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
          );
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB committee fetch error, falling back to memory store:", dbErr);
    }

    let filtered = globalForCommittee.__shutterCommitteeStore || DEFAULT_COMMITTEE;
    if (tier) {
      filtered = filtered.filter((m: any) => m.tier === tier);
    }

    return NextResponse.json(
      { success: true, data: filtered, source: "memory" },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("GET /api/committee error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_COMMITTEE, source: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    globalForCommittee.__shutterCommitteeCache = undefined;
    const body = await request.json();
    const newId = body.id || `com-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newMember = {
      ...body,
      id: newId,
      _id: body._id || newId,
      order: body.order || (globalForCommittee.__shutterCommitteeStore?.length || 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!globalForCommittee.__shutterCommitteeStore) {
      globalForCommittee.__shutterCommitteeStore = [...DEFAULT_COMMITTEE];
    }
    globalForCommittee.__shutterCommitteeStore.push(newMember);

    // Attempt to persist to MongoDB if available
    try {
      const conn = await connectDB();
      if (conn) {
        const doc = await CommitteeMember.create(newMember);
        return NextResponse.json({ success: true, data: doc, source: "database" }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn("MongoDB committee create error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: newMember, source: "memory" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/committee error:", error);
    return NextResponse.json({ error: "Failed to add committee member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    globalForCommittee.__shutterCommitteeCache = undefined;
    const body = await request.json();
    const { id, _id, ...updates } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (!globalForCommittee.__shutterCommitteeStore) {
      globalForCommittee.__shutterCommitteeStore = [...DEFAULT_COMMITTEE];
    }

    let updatedInMemoryItem: any = null;
    const store = globalForCommittee.__shutterCommitteeStore;
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

        const updated = await CommitteeMember.findOneAndUpdate(filter, updates, {
          returnDocument: "after",
          new: true,
        });

        if (updated) {
          return NextResponse.json({ success: true, data: updated, source: "database" });
        } else {
          const created = await CommitteeMember.create({ ...(id ? { id } : {}), ...updates });
          return NextResponse.json({ success: true, data: created, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB committee update error, saved to in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, data: updatedInMemoryItem, source: "memory" });
  } catch (error) {
    console.error("PUT /api/committee error:", error);
    return NextResponse.json({ error: "Failed to update committee member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    globalForCommittee.__shutterCommitteeCache = undefined;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    if (!globalForCommittee.__shutterCommitteeStore) {
      globalForCommittee.__shutterCommitteeStore = [...DEFAULT_COMMITTEE];
    }

    globalForCommittee.__shutterCommitteeStore = globalForCommittee.__shutterCommitteeStore.filter(
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
        await CommitteeMember.findOneAndDelete(filter);
        return NextResponse.json({ success: true, message: "Member deleted successfully", source: "database" });
      }
    } catch (dbErr) {
      console.warn("MongoDB committee delete error, deleted from in-memory store:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Member deleted successfully", source: "memory" });
  } catch (error) {
    console.error("DELETE /api/committee error:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
