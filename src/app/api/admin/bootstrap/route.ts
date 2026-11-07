// src/app/api/admin/bootstrap/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GalleryFrame } from "@/models/GalleryFrame";
import { ActivityEvent } from "@/models/ActivityEvent";
import { CommitteeMember } from "@/models/CommitteeMember";
import { HeroReel } from "@/models/HeroReel";
import { PullInExhibit } from "@/models/PullInExhibit";
import { MomentsReel } from "@/models/MomentsReel";
import { Spotlight } from "@/models/Spotlight";
import {
  INITIAL_GALLERY,
  INITIAL_ACTIVITIES,
  INITIAL_COMMITTEE,
  INITIAL_HERO_REEL,
  INITIAL_PULLIN,
  INITIAL_REELS,
  INITIAL_SPOTLIGHT,
} from "@/data/initialClubData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conn = await connectDB();
    if (conn) {
      const [gal, act, com, hero, pull, reels, spot] = await Promise.all([
        GalleryFrame.find({}).sort({ order: 1 }).lean(),
        ActivityEvent.find({}).sort({ order: 1 }).lean(),
        CommitteeMember.find({}).sort({ order: 1 }).lean(),
        HeroReel.find({}).sort({ order: 1 }).lean(),
        PullInExhibit.find({}).sort({ order: 1 }).lean(),
        MomentsReel.find({}).sort({ order: 1 }).lean(),
        Spotlight.findOne({}).sort({ updatedAt: -1 }).lean(),
      ]);

      return NextResponse.json({
        success: true,
        source: "database",
        data: {
          gallery: gal && gal.length > 0 ? gal : INITIAL_GALLERY,
          activities: act && act.length > 0 ? act : INITIAL_ACTIVITIES,
          committee: com && com.length > 0 ? com : INITIAL_COMMITTEE,
          heroReel: hero && hero.length > 0 ? hero : INITIAL_HERO_REEL,
          pullIn: pull && pull.length > 0 ? pull : INITIAL_PULLIN,
          reels: reels && reels.length > 0 ? reels : INITIAL_REELS,
          spotlight: spot
            ? { upcoming: spot.upcoming, live: spot.live }
            : INITIAL_SPOTLIGHT,
        },
      });
    }
  } catch (err) {
    console.warn("Bootstrap API DB fetch error, falling back to instant cache:", err);
  }

  // Instant high-availability fallback
  return NextResponse.json({
    success: true,
    source: "memory",
    data: {
      gallery: INITIAL_GALLERY,
      activities: INITIAL_ACTIVITIES,
      committee: INITIAL_COMMITTEE,
      heroReel: INITIAL_HERO_REEL,
      pullIn: INITIAL_PULLIN,
      reels: INITIAL_REELS,
      spotlight: INITIAL_SPOTLIGHT,
    },
  });
}
