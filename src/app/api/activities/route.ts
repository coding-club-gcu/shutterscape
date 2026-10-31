// src/app/api/activities/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ActivityEvent } from "@/models/ActivityEvent";

// 24 Archival Events matching activities/page.tsx
const DEFAULT_ACTIVITIES = [
  // WORKS '26
  { id: "act-01", _id: "act-01", shortTitle: "BRAHMAPUTRA 4.0", title: "Brahmaputra Heritage Photowalk 4.0", category: "PHOTOWALK", year: "2026", date: "NOV 14, 2026", location: "Riverfront, Guwahati", description: "Golden-hour riverfront documentation exploring ferry silhouettes, twilight reflections, and colonial architecture. Open to all students.", exif: "35MM · F/2.0 · 1/1000S", filmStock: "KODAK PORTRA 400", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", isUpcoming: true, order: 1 },
  { id: "act-02", _id: "act-02", shortTitle: "XENON STROBE LAB", title: "Mastering Manual Optics & Xenon Strobe", category: "WORKSHOP", year: "2026", date: "OCT 04, 2026", location: "GCU Media Lab", description: "Hands-on technical clinic covering aperture control, high-speed sync flash, and Chiaroscuro portrait lighting setups.", exif: "85MM · F/1.4 · 1/250S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 2 },
  { id: "act-03", _id: "act-03", shortTitle: "FRAMES BEYOND TIME", title: "Frames Beyond Time — Annual Print Salon", category: "EXHIBITION", year: "2026", date: "AUG 22, 2026", location: "Auditorium Gallery Wing", description: "Curated 100-frame showcase celebrating student street, portrait, and brutalist architecture documentation across Northeast India.", exif: "24MM · F/8.0 · 1/125S", filmStock: "FUJIFILM VELVIA 50", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85", order: 3 },
  { id: "act-04", _id: "act-04", shortTitle: "CHIAROSCURO '26", title: "Chiaroscuro — National Street Championship", category: "COMPETITION", year: "2026", date: "APR 18, 2026", location: "Campus Main Quad", description: "High-stakes 6-hour live photo sprint tasking 120 photographers with capturing high-contrast light, architecture, and fleeting human gestures.", exif: "50MM · F/1.8 · 1/500S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", order: 4 },
  { id: "act-05", _id: "act-05", shortTitle: "MIST & OPTICS", title: "Mist, Avian Optics & Telephoto Study", category: "PHOTOWALK", year: "2026", date: "FEB 08, 2026", location: "Deepor Beel Ramsar Site", description: "Early dawn telephoto clinic documenting migratory avian fauna, water refractions, and wetland conservation ecosystems.", exif: "400MM · F/4.5 · 1/2000S", filmStock: "KODAK EKTAR 100", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=85", order: 5 },
  { id: "act-06", _id: "act-06", shortTitle: "EASTERN ALPENGLOW", title: "Eastern Himalayan Alpenglow Field Study", category: "PHOTOWALK", year: "2026", date: "NOV 28, 2026", location: "Kamrup Foothills", description: "Extreme low-temperature exposure expedition mastering gradated ND filters, long exposures, and morning mountain mist.", exif: "21MM · F/11 · 30S", filmStock: "FUJIFILM PROVIA 100F", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85", isUpcoming: true, order: 6 },
  { id: "act-07", _id: "act-07", shortTitle: "NOCTURNAL NEON", title: "Nocturnal Neon & Rain Reflections Clinic", category: "WORKSHOP", year: "2026", date: "JUL 12, 2026", location: "Paltan Bazaar By-Lanes", description: "Night-photography clinic focusing on high-ISO tungsten balance, handheld primes, and reflections across wet pavement.", exif: "50MM · F/1.4 · 1/160S", filmStock: "CINESTILL 800T", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=85", order: 7 },
  { id: "act-08", _id: "act-08", shortTitle: "MONSOON RIVERS", title: "Monsoon Over Brahmaputra Documentary", category: "EXHIBITION", year: "2026", date: "JUN 05, 2026", location: "State Art Gallery", description: "Documentary photo essay on the annual monsoon surge, river communities, and the wooden ferry transport network.", exif: "35MM · F/2.8 · 1/640S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=85", order: 8 },
  { id: "act-09", _id: "act-09", shortTitle: "VINTAGE OPTICS", title: "Vintage Uncoated Optics & Flare Lab", category: "WORKSHOP", year: "2026", date: "MAY 19, 2026", location: "Darkroom Studio 02", description: "Adapting manual Soviet and Japanese prime lenses to modern mirrorless digital sensors. Exploring spherical aberration and flare.", exif: "58MM · F/2.0 · 1/400S", filmStock: "ILFORD FP4 PLUS", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", order: 9 },
  { id: "act-10", _id: "act-10", shortTitle: "BRUTALIST SHADOWS", title: "Architectural Form & Concrete Shadows", category: "PHOTOWALK", year: "2026", date: "MAR 02, 2026", location: "GCU Campus Complex", description: "Midday high-sun architectural documentation. Framing cantilever louvers, stairwell spirals, and raw concrete textures.", exif: "16MM · F/8.0 · 1/250S", filmStock: "ILFORD PAN F 50", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85", order: 10 },
  { id: "act-11", _id: "act-11", shortTitle: "UMANANDA FERRIES", title: "Umananda Ghat Ferry Documentary Walk", category: "PHOTOWALK", year: "2026", date: "JAN 17, 2026", location: "Kachari Ghat", description: "Twilight environmental portraits of boatmen, river commuters, and pilgrims boarding wooden catamarans on the Brahmaputra.", exif: "35MM · F/2.0 · 1/320S", filmStock: "KODAK GOLD 200", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=85", order: 11 },
  { id: "act-12", _id: "act-12", shortTitle: "COLLEGIATE PRIX", title: "National Collegiate Portraiture Grand Prix", category: "COMPETITION", year: "2026", date: "DEC 06, 2026", location: "Central Amphitheatre", description: "All-India university photography challenge testing live studio portrait direction under Xenon strobes and continuous tungsten light.", exif: "85MM · F/1.8 · 1/200S", filmStock: "KODAK PORTRA 800", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=85", isUpcoming: true, order: 12 },
  // WORKS '25
  { id: "act-13", _id: "act-13", shortTitle: "CAMPUS NOCTURNES", title: "Campus Nocturnes — Night Exposure Study", category: "PHOTOWALK", year: "2025", date: "NOV 20, 2025", location: "Campus Library Perimeter", description: "Tripod-only night photography workshop exploring architectural long exposures, sodium-vapor lamp reflections, and star trails.", exif: "24MM · F/4.0 · 15S", filmStock: "CINESTILL 800T", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=85", order: 13 },
  { id: "act-14", _id: "act-14", shortTitle: "EMULSION LAB", title: "Monsoon Emulsion Lab & Darkroom Print", category: "WORKSHOP", year: "2025", date: "SEP 14, 2025", location: "GCU Darkroom Studio", description: "Traditional silver-halide chemistry workshop. Hand-developing 35mm Ilford black-and-white negative rolls and contact-sheet printing.", exif: "50MM · F/2.8 · 1/60S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 14 },
  { id: "act-15", _id: "act-15", shortTitle: "VALLEY ECHOES", title: "Echoes of the Valley — Monsoon Retrospective", category: "EXHIBITION", year: "2025", date: "AUG 08, 2025", location: "State Museum Gallery", description: "Retrospective exhibition showcasing 45 archival contact prints taken during Assam's severe monsoon season by student photojournalists.", exif: "35MM · F/3.5 · 1/500S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85", order: 15 },
  { id: "act-16", _id: "act-16", shortTitle: "CYANOTYPE LAB", title: "Cyanotype & Sun-Printing Explorations", category: "WORKSHOP", year: "2025", date: "JUL 18, 2025", location: "GCU Open Courtyard", description: "Alternative analog photographic process utilizing ferric ammonium citrate and potassium ferricyanide chemistry under sunlight.", exif: "35MM · F/5.6 · 1/250S", filmStock: "SUN EMBOSSED GELATIN", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", order: 16 },
  { id: "act-17", _id: "act-17", shortTitle: "GAZE OF ASSAM", title: "Gaze of Assam — Portraiture Invitational", category: "COMPETITION", year: "2025", date: "JUN 02, 2025", location: "Auditorium Hall", description: "Statewide portraiture championship focusing on indigenous handloom artisans, folk dancers, and rural community elders.", exif: "85MM · F/1.4 · 1/320S", filmStock: "KODAK PORTRA 400", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=85", order: 17 },
  { id: "act-18", _id: "act-18", shortTitle: "TEA GARDEN DAWN", title: "Upper Assam Tea Garden Dawn Walk", category: "PHOTOWALK", year: "2025", date: "APR 26, 2025", location: "Sonapur Tea Estate", description: "Capturing first morning sun breaking through dense mist over rolling emerald tea slopes and documenting early-morning pluckers.", exif: "24MM · F/4.0 · 1/800S", filmStock: "FUJIFILM VELVIA 50", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=85", order: 18 },
  { id: "act-19", _id: "act-19", shortTitle: "URBAN SOLITUDE", title: "Urban Solitude — Street Photo Contest", category: "COMPETITION", year: "2025", date: "MAR 15, 2025", location: "Panbazar Commercial Zone", description: "Challenging participants to capture evocative moments of personal reflection amidst the overwhelming chaos of city transit.", exif: "50MM · F/1.8 · 1/400S", filmStock: "ILFORD DELTA 3200", img: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&q=85", order: 19 },
  { id: "act-20", _id: "act-20", shortTitle: "GEOMETRY MOTION", title: "Geometry in Motion — Architecture Walk", category: "PHOTOWALK", year: "2025", date: "FEB 10, 2025", location: "Guwahati High Court Zone", description: "Dissecting modern and colonial civic architectural geometry, repetitive glass facades, and perspective vanishing lines.", exif: "18MM · F/8.0 · 1/250S", filmStock: "KODAK EKTAR 100", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85", order: 20 },
  { id: "act-21", _id: "act-21", shortTitle: "COLOR & SPEED", title: "High-Speed Shutter & Color Story Clinic", category: "WORKSHOP", year: "2025", date: "JAN 25, 2025", location: "GCU Sports Complex", description: "Mastering action freeze techniques at 1/4000s shutter speeds and panning motion blur with high frame-rate digital cameras.", exif: "70MM · F/2.8 · 1/4000S", filmStock: "FUJIFILM PROVIA 100F", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85", order: 21 },
  { id: "act-22", _id: "act-22", shortTitle: "FOUNDERS SHEET", title: "Founders' Archival Contact Sheet Exhibition", category: "EXHIBITION", year: "2025", date: "DEC 12, 2025", location: "Academic Block Concourse", description: "Commemorative exhibition highlighting the original darkroom prints and vintage cameras that established the ShutterScape club.", exif: "35MM · F/2.0 · 1/125S", filmStock: "KODAK PLUS-X 125", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 22 },
  { id: "act-23", _id: "act-23", shortTitle: "SUALKUCHI WEAVE", title: "Sualkuchi Handloom Documentary Walk", category: "PHOTOWALK", year: "2025", date: "OCT 19, 2025", location: "Sualkuchi Silk Village", description: "Intimate environmental portraits of master silk weavers working traditional wooden looms and weaving golden Muga silk.", exif: "50MM · F/1.4 · 1/200S", filmStock: "KODAK PORTRA 160", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&q=85", order: 23 },
  { id: "act-24", _id: "act-24", shortTitle: "24HR MONOCHROME", title: "24-Hour Monochrome Street Championship", category: "COMPETITION", year: "2025", date: "MAY 04, 2025", location: "Citywide Guwahati", description: "Day-and-night endurance photography contest where competitors submit 5 curated monochrome frames shot over 24 continuous hours.", exif: "28MM · F/2.8 · 1/500S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", order: 24 },
];

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
