// src/app/api/committee/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { CommitteeMember } from "@/models/CommitteeMember";

// Default Committee Roster matching about/page.tsx
const DEFAULT_COMMITTEE = [
  // Chapter 02: Faculty Mentors
  { id: "com-01", _id: "com-01", name: "Dr. Sangeeta Das", role: "Coordinator", dept: "Dept. of Mechanical Engineering", tier: "MENTOR", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800", order: 1 },
  { id: "com-02", _id: "com-02", name: "Dr. Barsha Chhetri", role: "Co-Coordinator", dept: "Assistant Professor & Head (i/c) Dept. of Education", tier: "MENTOR", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800", order: 2 },
  // Chapter 03: Executive Leads
  { id: "com-03", _id: "com-03", name: "Uttama Purkayastha", role: "PRESIDENT", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800", order: 3 },
  { id: "com-04", _id: "com-04", name: "Ikhyt De Neog", role: "VICE-PRESIDENT", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800", order: 4 },
  { id: "com-05", _id: "com-05", name: "Richita Sarma", role: "SECRETARY", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800", order: 5 },
  // Chapter 04: Core Committee
  { id: "com-06", _id: "com-06", name: "Sohaib Hussain", role: "Core Committee", dept: "Photography Lead", tier: "CORE", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600", order: 6 },
  { id: "com-07", _id: "com-07", name: "Mahadananda Dutta", role: "Core Committee", dept: "Darkroom Specialist", tier: "CORE", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600", order: 7 },
  { id: "com-08", _id: "com-08", name: "Manash Pratim Sarma", role: "Core Committee", dept: "Logistics Lead", tier: "CORE", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600", order: 8 },
  { id: "com-09", _id: "com-09", name: "Mubina Ahmed", role: "Core Committee", dept: "Documentation", tier: "CORE", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600", order: 9 },
  { id: "com-10", _id: "com-10", name: "Pratyush B. Choudhury", role: "Core Committee", dept: "Archival Curator", tier: "CORE", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600", order: 10 },
  { id: "com-11", _id: "com-11", name: "Hiya Das", role: "Core Committee", dept: "Visual Design", tier: "CORE", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600", order: 11 },
  // Chapter 05: Founders
  { id: "com-12", _id: "com-12", name: "Dheemaan Deka", role: "Founding Visionary", dept: "Founders Council", tier: "FOUNDER", img: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=800", order: 12 },
  { id: "com-13", _id: "com-13", name: "Subhrajyoti Goswami", role: "Founding Visionary", dept: "Founders Council", tier: "FOUNDER", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800", order: 13 },
  // Chapter 06: Legacy Torchbearers
  { id: "com-14", _id: "com-14", name: "Riky", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800", order: 14 },
  { id: "com-15", _id: "com-15", name: "Pratyashi P. Das", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800", order: 15 },
  { id: "com-16", _id: "com-16", name: "Akash Boro", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800", order: 16 },
  { id: "com-17", _id: "com-17", name: "Aparna Mishra", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800", order: 17 },
];

const globalForCommittee = globalThis as unknown as {
  __shutterCommitteeStore?: any[];
};

if (!globalForCommittee.__shutterCommitteeStore) {
  globalForCommittee.__shutterCommitteeStore = [...DEFAULT_COMMITTEE];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");

    try {
      const conn = await connectDB();
      if (conn) {
        const query: Record<string, unknown> = {};
        if (tier) query.tier = tier;

        const items = await CommitteeMember.find(query).sort({ order: 1 });
        if (items && items.length > 0) {
          return NextResponse.json({ success: true, data: items, source: "database" });
        }
      }
    } catch (dbErr) {
      console.warn("MongoDB committee fetch error, falling back to memory store:", dbErr);
    }

    let filtered = globalForCommittee.__shutterCommitteeStore || DEFAULT_COMMITTEE;
    if (tier) {
      filtered = filtered.filter((m: any) => m.tier === tier);
    }

    return NextResponse.json({ success: true, data: filtered, source: "memory" });
  } catch (error) {
    console.error("GET /api/committee error:", error);
    return NextResponse.json({ success: true, data: DEFAULT_COMMITTEE, source: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
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
