// src/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FileUploadZone from "@/components/admin/FileUploadZone";
import {
  INITIAL_GALLERY,
  INITIAL_ACTIVITIES,
  INITIAL_COMMITTEE,
  INITIAL_HERO_REEL,
  INITIAL_PULLIN,
  INITIAL_REELS,
  INITIAL_SPOTLIGHT,
} from "@/data/initialClubData";

// Model interfaces matching database schemas
interface HeroReelItem {
  _id?: string;
  frameCode: string;
  title: string;
  src: string;
  exif: string;
  order?: number;
}

interface PullInExhibitItem {
  _id?: string;
  code: string;
  title: string;
  subTitle?: string;
  src: string;
  exif?: string;
  focusDistance?: string;
  headline: string;
  subhead?: string;
  order?: number;
}

interface GalleryItem {
  _id?: string;
  id?: string;
  title: string;
  category:
    | "DOCUMENTARY"
    | "PORTRAITURE"
    | "LANDSCAPE"
    | "ARCHITECTURE"
    | "STREET"
    | "EXPERIMENTAL";
  photographer: string;
  filmStock: string;
  exif: string;
  src: string;
  description: string;
  location: string;
}

interface CommitteeMemberItem {
  _id?: string;
  name: string;
  role: string;
  tier: "MENTOR" | "LEAD" | "CORE" | "FOUNDER" | "LEGACY";
  dept?: string;
  img: string;
}

interface ActivityEventItem {
  _id?: string;
  shortTitle: string;
  title: string;
  category: "PHOTOWALK" | "WORKSHOP" | "EXHIBITION" | "COMPETITION";
  year: "2026" | "2025";
  date: string;
  location: string;
  description: string;
  exif: string;
  filmStock: string;
  img: string;
  isUpcoming: boolean;
}

interface MomentsReelItem {
  _id?: string;
  photographer: string;
  videoSrc: string;
  order?: number;
}

type TabType =
  | "gallery"
  | "activities"
  | "committee"
  | "hero"
  | "pullin"
  | "reels"
  | "spotlight";

const TABS: {
  id: TabType;
  label: string;
  group: "ARCHIVES" | "SCENES";
  description: string;
}[] = [
  {
    id: "gallery",
    label: "Visual Archive",
    group: "ARCHIVES",
    description:
      "Curated 35mm & 120 contact frames, photographic EXIF, and inspection loupe essays.",
  },
  {
    id: "activities",
    label: "Activities & Timeline",
    group: "ARCHIVES",
    description:
      "Photowalks, workshops, and exhibitions across '26 and '25 with live RSVP triggers.",
  },
  {
    id: "committee",
    label: "Committee Roster",
    group: "ARCHIVES",
    description:
      "Club leadership across Mentors, Leads, Core, Founders, and Legacy chapters.",
  },
  {
    id: "hero",
    label: "Hero Contact Reel",
    group: "SCENES",
    description:
      "The 6 vertical 35mm filmstrip frames (01A–06F) flanking the camera aperture hero.",
  },
  {
    id: "pullin",
    label: "Corridor Exhibits",
    group: "SCENES",
    description:
      "The 8 3D perspective depth exhibits featured in the pull-in corridor sequence.",
  },
  {
    id: "reels",
    label: "Motion Video Reels",
    group: "SCENES",
    description:
      "Vertical phone video reels featured in the 'Frames of Moments' cinema section.",
  },
  {
    id: "spotlight",
    label: "Spotlight & Countdown",
    group: "SCENES",
    description:
      "Configure the Featured Upcoming and Live Going events, countdown timers, and join actions.",
  },
];

function getTabIcon(id: TabType, className = "w-4 h-4") {
  switch (id) {
    case "gallery":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="3" y="3" width="18" height="18" rx="2.5" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 15l-5-5L5 21"
          />
        </svg>
      );
    case "hero":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="2" y="2" width="20" height="20" rx="2.5" />
          <path
            strokeLinecap="round"
            d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"
          />
        </svg>
      );
    case "pullin":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 21h16M4 10h16M6 10v11M18 10v11M10 10v11M14 10v11M12 3L2 7h20L12 3z"
          />
        </svg>
      );
    case "committee":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
          />
          <circle cx="9" cy="7" r="4" />
          <path
            strokeLinecap="round"
            d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          />
        </svg>
      );
    case "activities":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="3" y="4" width="18" height="18" rx="2.5" />
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "reels":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <polygon points="23 7 16 12 23 17 23 7" strokeLinejoin="round" />
          <rect x="1" y="5" width="15" height="14" rx="2.5" />
        </svg>
      );
    case "spotlight":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
  }
}

function toLocalDatetimeString(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("gallery");
  const [loading, setLoading] = useState(false);
  const [dbSource, setDbSource] = useState<"database" | "fallback">("fallback");
  const [statusToast, setStatusToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Collection Data States — pre-populated with instant local club data for 0ms initial render
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(INITIAL_GALLERY as any);
  const [activityList, setActivityList] = useState<ActivityEventItem[]>(INITIAL_ACTIVITIES as any);
  const [committeeList, setCommitteeList] = useState<CommitteeMemberItem[]>(INITIAL_COMMITTEE as any);
  const [heroReelList, setHeroReelList] = useState<HeroReelItem[]>(INITIAL_HERO_REEL as any);
  const [pullInList, setPullInList] = useState<PullInExhibitItem[]>(INITIAL_PULLIN as any);
  const [reelsList, setReelsList] = useState<MomentsReelItem[]>(INITIAL_REELS as any);

  // Spotlight Admin State
  const [spotlightAdminData, setSpotlightAdminData] = useState<{
    upcoming: any;
    live: any;
  }>({
    upcoming: {
      id: "SPOT-UPCOMING-01",
      title: "Brahmaputra Heritage Photowalk 4.0",
      category: "PHOTOWALK",
      date: "NOV 14, 2026",
      targetDate: new Date(
        Date.now() + (14 * 86400 + 6 * 3600 + 45 * 60) * 1000
      ).toISOString(),
      location: "Riverfront, Guwahati",
      filmStock: "KODAK PORTRA 400",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=75",
      description:
        "Golden-hour riverfront expedition capturing ferry silhouettes, heritage ghats, and twilight reflections with live framing critiques.",
      ctaText: "JOIN UPCOMING EVENT",
    },
    live: {
      id: "SPOT-LIVE-01",
      title: "Campus Nocturnes & Strobe Light Lab",
      category: "LIVE WORKSHOP",
      date: "HAPPENING NOW",
      targetDate: new Date(
        Date.now() + (4 * 3600 + 38 * 60 + 25) * 1000
      ).toISOString(),
      location: "GCU Media Lab, Azara",
      filmStock: "GODEX AD600 PRO · 35MM",
      img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=75",
      description:
        "Live hands-on studio session exploring high-speed Xenon flash choreography, Chiaroscuro portrait lighting, and manual optics.",
      ctaText: "JOIN LIVE SESSION NOW",
    },
  });
  const [activeSpotlightSubTab, setActiveSpotlightSubTab] = useState<
    "upcoming" | "live"
  >("upcoming");
  const [savingSpotlight, setSavingSpotlight] = useState(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<any>({});
  const [savingItem, setSavingItem] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = "#F4F7FE";
      document.documentElement.style.backgroundColor = "#F4F7FE";
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isMobileDrawerOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }, [isMobileDrawerOpen]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusToast({ text, type });
    setTimeout(() => setStatusToast(null), 4500);
  };

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      // Fast single-trip bootstrap: 1 connection, 0 thundering herd
      const bootRes = await fetch("/api/admin/bootstrap").catch(() => null);
      if (bootRes && bootRes.ok) {
        const d = await bootRes.json();
        if (d.success && d.data) {
          if (d.data.gallery) setGalleryList(d.data.gallery);
          if (d.data.activities) setActivityList(d.data.activities);
          if (d.data.committee) setCommitteeList(d.data.committee);
          if (d.data.heroReel) setHeroReelList(d.data.heroReel);
          if (d.data.pullIn) setPullInList(d.data.pullIn);
          if (d.data.reels) setReelsList(d.data.reels);
          if (d.data.spotlight) {
            setSpotlightAdminData((prev) => ({
              upcoming: d.data.spotlight.upcoming
                ? { ...prev.upcoming, ...d.data.spotlight.upcoming }
                : prev.upcoming,
              live: d.data.spotlight.live
                ? { ...prev.live, ...d.data.spotlight.live }
                : prev.live,
            }));
          }
          if (d.source === "database") {
            setDbSource("database");
          }
          return;
        }
      }

      // Fallback: Individual endpoints if bootstrap is unavailable
      const responses = await Promise.allSettled([
        fetch("/api/gallery"),
        fetch("/api/activities"),
        fetch("/api/committee"),
        fetch("/api/hero-reel"),
        fetch("/api/pullin-exhibits"),
        fetch("/api/moments-reels"),
        fetch("/api/spotlight"),
      ]);

      const [resGal, resAct, resCom, resHero, resPull, resReels, resSpot] =
        responses;

      if (resGal.status === "fulfilled" && resGal.value.ok) {
        const d = await resGal.value.json();
        if (d.success && d.data) setGalleryList(d.data);
        if (d.source === "database") setDbSource("database");
      }

      if (resAct.status === "fulfilled" && resAct.value.ok) {
        const d = await resAct.value.json();
        if (d.success && d.data) setActivityList(d.data);
        if (d.source === "database") setDbSource("database");
      }

      if (resCom.status === "fulfilled" && resCom.value.ok) {
        const d = await resCom.value.json();
        if (d.success && d.data) setCommitteeList(d.data);
      }

      if (resHero.status === "fulfilled" && resHero.value.ok) {
        const d = await resHero.value.json();
        if (d.success && d.data) setHeroReelList(d.data);
      }

      if (resPull.status === "fulfilled" && resPull.value.ok) {
        const d = await resPull.value.json();
        if (d.success && d.data) setPullInList(d.data);
      }

      if (resReels.status === "fulfilled" && resReels.value.ok) {
        const d = await resReels.value.json();
        if (d.success && d.data) setReelsList(d.data);
      }

      if (resSpot && resSpot.status === "fulfilled" && resSpot.value.ok) {
        const d = await resSpot.value.json();
        if (d.success && d.data) {
          setSpotlightAdminData((prev) => ({
            upcoming: d.data.upcoming
              ? { ...prev.upcoming, ...d.data.upcoming }
              : prev.upcoming,
            live: d.data.live ? { ...prev.live, ...d.data.live } : prev.live,
          }));
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      showToast(
        "Unable to reach CMS server. Working in offline fallback mode.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    refreshAllData();
  }, [refreshAllData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
      document.cookie =
        "shutterscape_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingItem({
      category:
        activeTab === "gallery"
          ? "DOCUMENTARY"
          : activeTab === "activities"
          ? "PHOTOWALK"
          : undefined,
      tier: activeTab === "committee" ? "LEAD" : undefined,
      year: activeTab === "activities" ? "2026" : undefined,
      isUpcoming: false,
      filmStock: "KODAK PORTRA 400",
      exif: "35MM · F/2.0 · 1/500S",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalMode("edit");
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);

    try {
      let endpoint = "/api/gallery";
      if (activeTab === "activities") endpoint = "/api/activities";
      if (activeTab === "committee") endpoint = "/api/committee";
      if (activeTab === "hero") endpoint = "/api/hero-reel";
      if (activeTab === "pullin") endpoint = "/api/pullin-exhibits";
      if (activeTab === "reels") endpoint = "/api/moments-reels";

      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to save record");
      }

      showToast(
        modalMode === "create"
          ? "Record created successfully!"
          : "Record updated cleanly!",
        "success"
      );
      setIsModalOpen(false);
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || "Operation failed", "error");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this record?"
      )
    )
      return;

    try {
      setLoading(true);
      let endpoint = `/api/gallery?id=${id}`;
      if (activeTab === "activities") endpoint = `/api/activities?id=${id}`;
      if (activeTab === "committee") endpoint = `/api/committee?id=${id}`;
      if (activeTab === "reels") endpoint = `/api/moments-reels?id=${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      showToast("Record deleted cleanly", "success");
      refreshAllData();
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpotlight = async () => {
    try {
      setSavingSpotlight(true);
      const res = await fetch("/api/spotlight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spotlightAdminData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update Spotlight");
      }
      showToast("Spotlight and Countdown saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save spotlight", "error");
    } finally {
      setSavingSpotlight(false);
    }
  };

  const updateSpotlightField = (field: string, val: any) => {
    setSpotlightAdminData((prev) => ({
      ...prev,
      [activeSpotlightSubTab]: {
        ...prev[activeSpotlightSubTab],
        [field]: val,
      },
    }));
  };

  const applyQuickPreset = (hoursToAdd: number) => {
    const targetIso = new Date(
      Date.now() + hoursToAdd * 3600 * 1000
    ).toISOString();
    updateSpotlightField("targetDate", targetIso);
    const label =
      hoursToAdd >= 24 ? `${hoursToAdd / 24} Days` : `${hoursToAdd} Hours`;
    showToast(`Countdown timer set to +${label} from now`, "success");
  };

  const activeTabMeta = useMemo(() => {
    return TABS.find((t) => t.id === activeTab) || TABS[0];
  }, [activeTab]);

  const getTabCount = (id: TabType) => {
    if (id === "gallery") return galleryList.length;
    if (id === "hero") return heroReelList.length;
    if (id === "pullin") return pullInList.length;
    if (id === "committee") return committeeList.length;
    if (id === "activities") return activityList.length;
    if (id === "reels") return reelsList.length;
    if (id === "spotlight") return 2;
    return 0;
  };

  return (
    <div
      id="cms-enterprise-root"
      className="min-h-screen w-full bg-[#F4F7FE] text-[#1E293B] font-sans flex flex-col lg:flex-row antialiased selection:bg-[#5D87FF]/15 selection:text-[#5D87FF]"
    >
      {/* Scoped Enterprise Stylesheet — 100% immune to globals.css * { padding: 0; margin: 0 } */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        #cms-enterprise-root {
          font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", "Segoe UI", Roboto, sans-serif;
          background-color: #F4F7FE;
          color: #1E293B;
          font-size: 13px;
        }
        #cms-enterprise-root .cms-sidebar {
          width: 240px;
          background: #FFFFFF;
          border-right: 1px solid #EAEFF4;
          box-shadow: 0 0 20px rgba(145, 158, 171, 0.05);
        }
        @media (max-width: 768px) {
          #cms-enterprise-root .cms-action-edit,
          #cms-enterprise-root .cms-action-delete {
            padding: 8px 14px !important;
            font-size: 12px;
            min-height: 38px;
            border-radius: 8px;
          }
          #cms-enterprise-root .cms-filter-pill {
            padding: 6px 12px !important;
            font-size: 11px;
            white-space: nowrap;
          }
        }
        #cms-enterprise-root .cms-nav-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px !important;
          margin-bottom: 3px !important;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          color: #5A6A85;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        #cms-enterprise-root .cms-nav-btn:hover {
          background-color: #F6F9FC;
          color: #5D87FF;
        }
        #cms-enterprise-root .cms-nav-btn.active {
          background-color: #5D87FF;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(93, 135, 255, 0.25);
        }
        #cms-enterprise-root .cms-card {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #EAEFF4;
          box-shadow: 0 2px 12px rgba(145, 158, 171, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        #cms-enterprise-root .cms-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(145, 158, 171, 0.1);
          border-color: #D5E0EE;
        }
        #cms-enterprise-root .cms-card-body {
          padding: 12px 14px !important;
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: space-between;
        }
        #cms-enterprise-root .cms-kpi-card {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #EAEFF4;
          padding: 12px 16px !important;
          box-shadow: 0 2px 10px rgba(145, 158, 171, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        #cms-enterprise-root .cms-primary-btn {
          background: #5D87FF;
          color: #FFFFFF;
          padding: 7px 14px !important;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(93, 135, 255, 0.25);
          cursor: pointer;
          transition: all 0.18s ease;
        }
        #cms-enterprise-root .cms-primary-btn:hover {
          background: #4570EA;
          box-shadow: 0 4px 14px rgba(93, 135, 255, 0.35);
        }
        #cms-enterprise-root .cms-action-edit {
          padding: 5px 10px !important;
          border-radius: 6px;
          border: 1px solid #DFE5EF;
          background: #FFFFFF;
          color: #2A3547;
          font-size: 11.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.16s ease;
        }
        #cms-enterprise-root .cms-action-edit:hover {
          background: #ECF2FF;
          border-color: #5D87FF;
          color: #5D87FF;
        }
        #cms-enterprise-root .cms-action-delete {
          padding: 5px 10px !important;
          border-radius: 6px;
          border: 1px solid #FDEDE8;
          background: #FDEDE8;
          color: #FA896B;
          font-size: 11.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.16s ease;
        }
        #cms-enterprise-root .cms-action-delete:hover {
          background: #FA896B;
          border-color: #FA896B;
          color: #FFFFFF;
        }
        #cms-enterprise-root .cms-filter-pill {
          padding: 5px 12px !important;
          border-radius: 7px;
          font-size: 11.5px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.16s ease;
          white-space: nowrap;
        }
        #cms-enterprise-root .cms-filter-pill.active {
          background: #5D87FF;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(93, 135, 255, 0.22);
        }
        #cms-enterprise-root .cms-filter-pill.inactive {
          background: transparent;
          color: #5A6A85;
        }
        #cms-enterprise-root .cms-filter-pill.inactive:hover {
          background: #EAEFF4;
          color: #2A3547;
        }
        #cms-enterprise-root .cms-search-input {
          width: 100%;
          height: 36px;
          padding: 6px 14px 6px 36px !important;
          border-radius: 8px;
          border: 1px solid #DFE5EF;
          background: #F8FAFC;
          font-size: 12px;
          color: #2A3547;
          outline: none;
          transition: all 0.18s ease;
        }
        #cms-enterprise-root .cms-search-input:focus {
          background: #FFFFFF;
          border-color: #5D87FF;
          box-shadow: 0 0 0 2px rgba(93, 135, 255, 0.12);
        }
        #cms-enterprise-root .cms-form-input {
          width: 100%;
          padding: 8px 12px !important;
          border-radius: 8px;
          border: 1px solid #DFE5EF;
          background: #FFFFFF;
          font-size: 12.5px;
          color: #2A3547;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        #cms-enterprise-root .cms-form-input:focus {
          border-color: #5D87FF;
          box-shadow: 0 0 0 2px rgba(93, 135, 255, 0.12);
        }
        #cms-enterprise-root .cms-badge {
          padding: 3px 8px !important;
          border-radius: 5px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          #cms-enterprise-root .cms-card {
            border-radius: 10px;
          }
          #cms-enterprise-root .cms-card-body {
            padding: 8px 9px !important;
          }
          #cms-enterprise-root .cms-action-edit,
          #cms-enterprise-root .cms-action-delete {
            padding: 4px 6px !important;
            font-size: 10px !important;
          }
          #cms-enterprise-root .cms-badge {
            padding: 2px 5px !important;
            font-size: 8px !important;
          }
          #cms-enterprise-root .cms-filter-pill {
            padding: 4px 8px !important;
            font-size: 10.5px !important;
          }
        }
      `,
        }}
      />

      {/* ============================================================
          SIDEBAR NAVIGATION (MaterialPro Enterprise Left Rail)
          ============================================================ */}
      <aside className="hidden lg:flex cms-sidebar lg:h-screen lg:sticky lg:top-0 flex-col justify-between shrink-0 z-40">
        <div>
          {/* Brand Logo Header */}
          <div
            style={{ padding: "14px 18px" }}
            className="border-b border-[#EAEFF4] flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ width: "30px", height: "30px" }}
                className="rounded-lg bg-[#5D87FF] flex items-center justify-center text-white font-serif italic font-bold text-sm shadow-xs"
              >
                S
              </div>
              <div>
                <span className="block font-bold text-[14px] text-[#2A3547] tracking-tight leading-none">
                  ShutterScape
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="block text-[10px] font-medium text-[#7C8FAC]"
                >
                  Darkroom CMS v4.0
                </span>
              </div>
            </div>

            <span
              style={{ padding: "3px 8px" }}
              className={`rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                dbSource === "database"
                  ? "bg-[#E6FFFA] text-[#13DEB9]"
                  : "bg-[#FEF5E5] text-[#FFAE1F]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dbSource === "database" ? "bg-[#13DEB9]" : "bg-[#FFAE1F]"
                }`}
              />
              {dbSource === "database" ? "Live DB" : "Cached"}
            </span>
          </div>

          {/* Navigation Menu Groups */}
          <div style={{ padding: "12px 14px" }}>
            <div
              style={{ padding: "0 10px", marginBottom: "6px" }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#7C8FAC]"
            >
              Content Archives
            </div>

            {TABS.filter((t) => t.group === "ARCHIVES").map((tab) => {
              const isActive = activeTab === tab.id;
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                    setFilterCategory("ALL");
                  }}
                  className={`cms-nav-btn ${isActive ? "active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {getTabIcon(tab.id, "w-4 h-4")}
                    <span>{tab.label}</span>
                  </div>
                  <span
                    style={{ padding: "2px 8px" }}
                    className={`rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#ECF2FF] text-[#5D87FF]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <div
              style={{
                padding: "0 10px",
                marginTop: "16px",
                marginBottom: "6px",
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#7C8FAC]"
            >
              Cinematic Scenes
            </div>

            {TABS.filter((t) => t.group === "SCENES").map((tab) => {
              const isActive = activeTab === tab.id;
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                    setFilterCategory("ALL");
                  }}
                  className={`cms-nav-btn ${isActive ? "active" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    {getTabIcon(tab.id, "w-3.5 h-3.5")}
                    <span>{tab.label}</span>
                  </div>
                  <span
                    style={{ padding: "1.5px 7px" }}
                    className={`rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#ECF2FF] text-[#5D87FF]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Live Website Card */}
        <div
          style={{ padding: "12px 14px" }}
          className="border-t border-[#EAEFF4] bg-[#FAFBFD]"
        >
          <Link
            href="/"
            target="_blank"
            style={{ padding: "7px 12px", marginBottom: "10px" }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ECF2FF] hover:bg-[#5D87FF] text-[#5D87FF] hover:text-white text-[11px] font-bold transition-all"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Open Public Website</span>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                style={{ width: "30px", height: "30px" }}
                className="rounded-full bg-[#5D87FF] text-white flex items-center justify-center font-bold text-[10.5px] shadow-xs"
              >
                AD
              </div>
              <div>
                <span className="block text-[11.5px] font-bold text-[#2A3547]">
                  Admin Lead
                </span>
                <span className="block text-[10px] text-[#7C8FAC]">
                  GCU ShutterScape
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{ padding: "4px 8px" }}
              className="rounded-md bg-[#FDEDE8] hover:bg-[#FA896B] text-[#FA896B] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MOBILE SLIDE-OVER NAVIGATION DRAWER (Smooth Animated Slide-Over)
          ============================================================ */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex transition-[visibility,opacity] duration-300 ease-in-out ${
          isMobileDrawerOpen
            ? "visible opacity-100 pointer-events-auto"
            : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isMobileDrawerOpen}
      >
        {/* Backdrop with smooth fade */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileDrawerOpen(false)}
        />

        {/* Drawer Panel with smooth slide-in/slide-out */}
        <div
          className={`relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 overflow-y-auto transform transition-transform duration-300 ease-out ${
            isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div
              style={{ padding: "14px 18px" }}
              className="border-b border-[#EAEFF4] flex items-center justify-between bg-[#FAFBFD]"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ width: "28px", height: "28px" }}
                  className="rounded-lg bg-[#5D87FF] flex items-center justify-center text-white font-serif italic font-bold text-sm shadow-xs"
                >
                  S
                </div>
                <div>
                  <span className="block font-bold text-[13px] text-[#2A3547] leading-none">
                    ShutterScape
                  </span>
                  <span className="block text-[9.5px] font-medium text-[#7C8FAC] mt-0.5">
                    Darkroom CMS v4.0
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-lg bg-white border border-[#DFE5EF] text-[#5A6A85] flex items-center justify-center text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "12px 14px" }}>
              <div
                style={{ padding: "0 10px", marginBottom: "6px" }}
                className="text-[10px] font-bold uppercase tracking-wider text-[#7C8FAC]"
              >
                Content Archives
              </div>

              {TABS.filter((t) => t.group === "ARCHIVES").map((tab) => {
                const isActive = activeTab === tab.id;
                const count = getTabCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery("");
                      setFilterCategory("ALL");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`cms-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {getTabIcon(tab.id, "w-4 h-4")}
                      <span>{tab.label}</span>
                    </div>
                    <span
                      style={{ padding: "2px 8px" }}
                      className={`rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#ECF2FF] text-[#5D87FF]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              <div
                style={{
                  padding: "0 10px",
                  marginTop: "16px",
                  marginBottom: "6px",
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-[#7C8FAC]"
              >
                Cinematic Scenes
              </div>

              {TABS.filter((t) => t.group === "SCENES").map((tab) => {
                const isActive = activeTab === tab.id;
                const count = getTabCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery("");
                      setFilterCategory("ALL");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`cms-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {getTabIcon(tab.id, "w-3.5 h-3.5")}
                      <span>{tab.label}</span>
                    </div>
                    <span
                      style={{ padding: "1.5px 7px" }}
                      className={`rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#ECF2FF] text-[#5D87FF]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{ padding: "12px 14px" }}
            className="border-t border-[#EAEFF4] bg-[#FAFBFD]"
          >
            <Link
              href="/"
              target="_blank"
              style={{ padding: "8px 12px", marginBottom: "10px" }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ECF2FF] hover:bg-[#5D87FF] text-[#5D87FF] hover:text-white text-[11px] font-bold transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>Open Public Website</span>
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  style={{ width: "28px", height: "28px" }}
                  className="rounded-full bg-[#5D87FF] text-white flex items-center justify-center font-bold text-[10px]"
                >
                  AD
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#2A3547]">
                    Admin Lead
                  </span>
                  <span className="block text-[9.5px] text-[#7C8FAC]">
                    GCU ShutterScape
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{ padding: "4px 8px" }}
                className="rounded-md bg-[#FDEDE8] hover:bg-[#FA896B] text-[#FA896B] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN WORKSPACE CANVAS
          ============================================================ */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        {/* Mobile Sticky Top Header Bar (Solid White 50px) */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#EAEFF4] px-3.5 h-[50px] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-1.5 -ml-1 text-[#2A3547] hover:text-[#5D87FF] rounded-lg hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              aria-label="Open Navigation Drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#5D87FF] flex items-center justify-center text-white font-serif italic font-bold text-xs shadow-xs">
                S
              </div>
              <div>
                <span className="block font-bold text-xs text-[#2A3547] leading-none">
                  ShutterScape
                </span>
                <span className="block text-[9px] text-[#7C8FAC] mt-0.5 font-medium">
                  Darkroom CMS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              style={{ padding: "3px 7px" }}
              className={`rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                dbSource === "database"
                  ? "bg-[#E6FFFA] text-[#13DEB9]"
                  : "bg-[#FEF5E5] text-[#FFAE1F]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dbSource === "database" ? "bg-[#13DEB9]" : "bg-[#FFAE1F]"
                }`}
              />
              {dbSource === "database" ? "Live DB" : "Cached"}
            </span>

            {/* Quick Header Action Button */}
            {activeTab === "spotlight" && (
              <button
                type="button"
                onClick={handleSaveSpotlight}
                disabled={savingSpotlight}
                className="cms-primary-btn text-xs py-1.5 px-3 rounded-lg"
              >
                <svg
                  className={`w-3.5 h-3.5 ${savingSpotlight ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span>{savingSpotlight ? "Saving..." : "Save"}</span>
              </button>
            )}

            {["gallery", "activities", "committee", "reels"].includes(activeTab) && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="cms-primary-btn text-xs py-1.5 px-3 rounded-lg"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>+ Add</span>
              </button>
            )}

            <button
              type="button"
              onClick={refreshAllData}
              className="p-1.5 rounded-lg border border-[#DFE5EF] bg-white hover:bg-[#F6F9FC] text-[#5A6A85] text-xs transition-colors"
              title="Sync Data"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Enterprise Header Bar */}
        <header
          style={{ padding: "12px 24px" }}
          className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEFF4] items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ width: "36px", height: "36px" }}
              className="rounded-lg bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0"
            >
              {getTabIcon(activeTab, "w-4 h-4")}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#2A3547] tracking-tight">
                {activeTabMeta.label}
              </h1>
              <p
                style={{ marginTop: "1px" }}
                className="text-[11px] text-[#7C8FAC]"
              >
                {activeTabMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAllData}
              style={{ padding: "7px 12px" }}
              className="rounded-lg border border-[#DFE5EF] bg-white hover:bg-[#F6F9FC] text-[#5A6A85] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Sync</span>
            </button>

            {activeTab === "spotlight" && (
              <button
                type="button"
                onClick={handleSaveSpotlight}
                disabled={savingSpotlight}
                className="cms-primary-btn"
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    savingSpotlight ? "animate-spin" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span>{savingSpotlight ? "Saving..." : "Save Spotlight"}</span>
              </button>
            )}

            {["gallery", "activities", "committee", "reels"].includes(
              activeTab
            ) && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="cms-primary-btn"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>
                  Add New{" "}
                  {activeTab === "gallery"
                    ? "Frame"
                    : activeTab === "committee"
                    ? "Member"
                    : activeTab === "reels"
                    ? "Reel"
                    : "Event"}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Container */}
        <div
          className="flex-1 flex flex-col gap-3 sm:gap-4 max-w-[1560px] w-full mx-auto px-2.5 sm:px-6 py-2.5 sm:py-5 lg:px-8 lg:py-6"
        >
          {/* ============================================================
              EXECUTIVE KPI SUMMARY ROW (Desktop: 4 Cards, Mobile: Sleek 1-Line Chip)
              ============================================================ */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="cms-kpi-card">
              <div>
                <span className="text-[11px] font-semibold text-[#7C8FAC] block">
                  Visual Archive Frames
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-xl font-bold text-[#2A3547] block"
                >
                  {galleryList.length}
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-[10px] font-semibold text-[#13DEB9] block"
                >
                  35mm & 120 Contact Sheets
                </span>
              </div>
              <div
                style={{ width: "38px", height: "38px" }}
                className="rounded-xl bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0"
              >
                {getTabIcon("gallery", "w-4 h-4")}
              </div>
            </div>

            <div className="cms-kpi-card">
              <div>
                <span className="text-[11px] font-semibold text-[#7C8FAC] block">
                  Chronology Events
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-xl font-bold text-[#2A3547] block"
                >
                  {activityList.length}
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-[10px] font-semibold text-[#5D87FF] block"
                >
                  {activityList.filter((a) => a.isUpcoming).length} Upcoming
                  Live RSVP
                </span>
              </div>
              <div
                style={{ width: "38px", height: "38px" }}
                className="rounded-xl bg-[#E6FFFA] text-[#13DEB9] flex items-center justify-center shrink-0"
              >
                {getTabIcon("activities", "w-4 h-4")}
              </div>
            </div>

            <div className="cms-kpi-card">
              <div>
                <span className="text-[11px] font-semibold text-[#7C8FAC] block">
                  Committee Roster
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-xl font-bold text-[#2A3547] block"
                >
                  {committeeList.length}
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-[10px] font-semibold text-[#FFAE1F] block"
                >
                  Mentors, Leads & Core
                </span>
              </div>
              <div
                style={{ width: "38px", height: "38px" }}
                className="rounded-xl bg-[#FEF5E5] text-[#FFAE1F] flex items-center justify-center shrink-0"
              >
                {getTabIcon("committee", "w-4 h-4")}
              </div>
            </div>

            <div className="cms-kpi-card">
              <div>
                <span className="text-[11px] font-semibold text-[#7C8FAC] block">
                  Scene Reels & Exhibits
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-xl font-bold text-[#2A3547] block"
                >
                  {heroReelList.length + pullInList.length + reelsList.length}
                </span>
                <span
                  style={{ marginTop: "2px" }}
                  className="text-[10px] font-semibold text-[#FA896B] block"
                >
                  Hero, Corridor & Motion
                </span>
              </div>
              <div
                style={{ width: "38px", height: "38px" }}
                className="rounded-xl bg-[#FDEDE8] text-[#FA896B] flex items-center justify-center shrink-0"
              >
                {getTabIcon("reels", "w-4 h-4")}
              </div>
            </div>
          </div>

          {/* Mobile Sleek 1-Line Stat Chip */}
          <div className="md:hidden flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#EAEFF4] shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#5D87FF] shrink-0" />
              <span className="font-bold text-xs text-[#2A3547] truncate">{activeTabMeta.label}</span>
            </div>
            <span className="text-[10.5px] font-bold text-[#5D87FF] bg-[#ECF2FF] px-2.5 py-0.5 rounded-full shrink-0">
              {getTabCount(activeTab)} items
            </span>
          </div>

          {/* ============================================================
              ELEVATED SEARCH & SEGMENTED FILTER BAR CARD
              ============================================================ */}
          {activeTab !== "spotlight" && (
            <div
              className="bg-white rounded-xl border border-[#EAEFF4] shadow-[0_2px_12px_rgba(145,158,171,0.05)] p-2.5 sm:px-4 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3"
            >
              {/* Search Box with non-overlapping icon */}
              <div className="relative w-full lg:w-80">
                <svg
                  style={{ left: "12px" }}
                  className="w-3.5 h-3.5 text-[#7C8FAC] absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder={`Search ${activeTabMeta.label.toLowerCase()}...`}
                  className="cms-search-input"
                />
              </div>

              {/* Category Filter Pills for Gallery */}
              {activeTab === "gallery" && (
                <div
                  className="flex items-center gap-1.5 p-1 bg-[#F4F7FE] rounded-xl border border-[#EAEFF4] overflow-x-auto no-scrollbar"
                >
                  {[
                    "ALL",
                    "DOCUMENTARY",
                    "PORTRAITURE",
                    "LANDSCAPE",
                    "ARCHITECTURE",
                    "STREET",
                    "EXPERIMENTAL",
                  ].map((cat) => {
                    const isSelected = filterCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={`cms-filter-pill ${
                          isSelected ? "active" : "inactive"
                        }`}
                      >
                        {cat === "ALL" ? "All Categories" : cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Year Filter Pills for Activities */}
              {activeTab === "activities" && (
                <div
                  className="flex items-center gap-1.5 p-1 bg-[#F4F7FE] rounded-xl border border-[#EAEFF4] overflow-x-auto no-scrollbar"
                >
                  {["ALL", "2026", "2025"].map((yr) => {
                    const isSelected = filterCategory === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setFilterCategory(yr)}
                        className={`cms-filter-pill ${
                          isSelected ? "active" : "inactive"
                        }`}
                      >
                        {yr === "ALL" ? "All Years" : `Works '${yr.slice(-2)}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 1: VISUAL ARCHIVE GALLERY GRID (Mobile: 2 Cards / Column)
              ============================================================ */}
          {activeTab === "gallery" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5">
              {galleryList
                .filter((item) => {
                  if (
                    filterCategory !== "ALL" &&
                    item.category !== filterCategory
                  )
                    return false;
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    item.title.toLowerCase().includes(q) ||
                    item.photographer.toLowerCase().includes(q) ||
                    item.category.toLowerCase().includes(q) ||
                    item.filmStock.toLowerCase().includes(q)
                  );
                })
                .map((item, idx) => (
                  <div
                    key={item._id || item.id || idx}
                    className="cms-card group"
                  >
                    <div className="relative aspect-[16/10] w-full bg-[#F1F5F9] overflow-hidden">
                      <Image
                        src={item.src || (item as any).img || "/images/og-image.jpg"}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 400px"
                        unoptimized
                        loading="lazy"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="cms-badge absolute bg-white/95 text-[#5D87FF] shadow-xs"
                      >
                        {item.category}
                      </div>
                      <div
                        style={{
                          bottom: "6px",
                          right: "6px",
                          padding: "2px 5px",
                        }}
                        className="absolute rounded bg-[#2A3547]/85 backdrop-blur-xs text-white text-[8px] sm:text-[9.5px] font-mono font-semibold"
                      >
                        {item.filmStock}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <h3 className="text-xs sm:text-[13.5px] font-bold text-[#2A3547] group-hover:text-[#5D87FF] transition-colors line-clamp-1 leading-snug">
                          {item.title}
                        </h3>
                        <p
                          style={{ marginTop: "1px" }}
                          className="text-[10px] sm:text-[11.5px] font-semibold text-[#5D87FF] truncate"
                        >
                          By {item.photographer}
                        </p>
                        <p
                          style={{ marginTop: "3px" }}
                          className="text-[9.5px] sm:text-[11px] text-[#7C8FAC] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed"
                        >
                          {item.description}
                        </p>
                      </div>

                      <div
                        style={{ marginTop: "8px", paddingTop: "6px" }}
                        className="border-t border-[#EAEFF4] flex items-center justify-between gap-1"
                      >
                        <span
                          className="hidden sm:inline-block font-mono text-[9px] text-[#5A6A85] bg-[#F4F7FE] rounded truncate px-1.5 py-0.5 max-w-[80px]"
                        >
                          {item.exif || item.location}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="cms-action-edit flex-1 sm:flex-none text-center"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteItem(item._id || item.id || "")
                            }
                            className="cms-action-delete flex-1 sm:flex-none text-center"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ============================================================
              TAB 2: HERO CONTACT REEL (01A - 06F)
              ============================================================ */}
          {activeTab === "hero" && (
            <div className="flex flex-col gap-4">
              <div
                style={{ padding: "10px 16px" }}
                className="rounded-xl bg-[#ECF2FF] border border-[#D3E2FF] text-[#5D87FF] text-xs font-semibold flex items-center gap-2.5"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                </svg>
                <span>
                  These 6 vertical 35mm frames appear directly on the right side
                  of the camera aperture hero on the live website.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3.5">
                {heroReelList.map((item, idx) => (
                  <div
                    key={item._id || item.frameCode || idx}
                    className="cms-card"
                  >
                    <div className="relative aspect-[3/4] max-h-[190px] sm:max-h-[220px] w-full bg-[#F1F5F9] overflow-hidden">
                      <Image
                        src={item.src || (item as any).img || "/images/og-image.jpg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 300px"
                        unoptimized
                        loading="lazy"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="cms-badge absolute bg-[#5D87FF] text-white shadow-xs"
                      >
                        {item.frameCode}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <h3 className="text-xs font-bold text-[#2A3547] line-clamp-1">
                          {item.title}
                        </h3>
                        <p
                          style={{ marginTop: "1px" }}
                          className="font-mono text-[9.5px] sm:text-[10.5px] text-[#7C8FAC] truncate"
                        >
                          {item.exif}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        style={{ marginTop: "8px", width: "100%" }}
                        className="cms-action-edit justify-center text-center"
                      >
                        Change Frame
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 3: PULL-IN CORRIDOR EXHIBITS (01 - 08)
              ============================================================ */}
          {activeTab === "pullin" && (
            <div className="flex flex-col gap-4">
              <div
                style={{ padding: "10px 16px" }}
                className="rounded-xl bg-[#ECF2FF] border border-[#D3E2FF] text-[#5D87FF] text-xs font-semibold flex items-center gap-2.5"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                </svg>
                <span>
                  The 8 3D perspective depth exhibits featured during the home
                  corridor scroll sequence.
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
                {pullInList.map((item, idx) => (
                  <div key={item._id || item.code || idx} className="cms-card">
                    <div className="relative aspect-[16/10] w-full bg-[#F1F5F9] overflow-hidden">
                      <Image
                        src={item.src || (item as any).img || "/images/og-image.jpg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 400px"
                        unoptimized
                        loading="lazy"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="cms-badge absolute bg-[#5D87FF] text-white shadow-xs"
                      >
                        {item.code}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <h3 className="text-xs sm:text-[13.5px] font-bold text-[#2A3547] line-clamp-1 leading-snug">
                          {item.title}
                        </h3>
                        <p
                          style={{ marginTop: "1px" }}
                          className="text-[10px] sm:text-[11.5px] font-semibold text-[#5D87FF] truncate"
                        >
                          {item.subTitle}
                        </p>
                        <p
                          style={{ marginTop: "3px" }}
                          className="text-[9.5px] sm:text-[11px] text-[#7C8FAC] italic line-clamp-1 sm:line-clamp-2 leading-tight"
                        >
                          &ldquo;{item.headline}&rdquo;
                        </p>
                      </div>

                      <div
                        style={{ marginTop: "8px", paddingTop: "6px" }}
                        className="border-t border-[#EAEFF4] flex items-center justify-between"
                      >
                        <span className="hidden sm:inline-block font-mono text-[9px] sm:text-[10.5px] text-[#7C8FAC] truncate max-w-[80px]">
                          {item.exif}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="cms-action-edit w-full sm:w-auto text-center justify-center"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 4: COMMITTEE ROSTER
              ============================================================ */}
          {activeTab === "committee" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3.5">
              {committeeList
                .filter((m) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    m.name.toLowerCase().includes(q) ||
                    m.role.toLowerCase().includes(q) ||
                    m.tier.toLowerCase().includes(q)
                  );
                })
                .map((m, idx) => (
                  <div key={m._id || idx} className="cms-card">
                    <div className="relative aspect-[4/5] w-full bg-[#F1F5F9] overflow-hidden">
                      <Image
                        src={m.img || (m as any).src || "/images/og-image.jpg"}
                        alt={m.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 300px"
                        unoptimized
                        loading="lazy"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="cms-badge absolute bg-white/95 text-[#5D87FF] shadow-xs"
                      >
                        {m.tier}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <h3 className="text-xs sm:text-[13px] font-bold text-[#2A3547] line-clamp-1 leading-snug">
                          {m.name}
                        </h3>
                        <p
                          style={{ marginTop: "1px" }}
                          className="text-[10px] sm:text-[11px] font-semibold text-[#5D87FF] truncate"
                        >
                          {m.role}
                        </p>
                        {m.dept && (
                          <p
                            style={{ marginTop: "1px" }}
                            className="text-[9px] sm:text-[10px] text-[#7C8FAC] line-clamp-1 truncate"
                          >
                            {m.dept}
                          </p>
                        )}
                      </div>

                      <div
                        style={{ marginTop: "8px", paddingTop: "6px" }}
                        className="border-t border-[#EAEFF4] flex items-center gap-1 sm:gap-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(m)}
                          className="cms-action-edit flex-1 justify-center text-center"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(m._id || "")}
                          className="cms-action-delete flex-1 justify-center text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ============================================================
              TAB 5: ACTIVITIES & TIMELINE
              ============================================================ */}
          {activeTab === "activities" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5">
              {activityList
                .filter((ev) => {
                  if (filterCategory !== "ALL" && ev.year !== filterCategory)
                    return false;
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    ev.title.toLowerCase().includes(q) ||
                    ev.shortTitle.toLowerCase().includes(q) ||
                    ev.category.toLowerCase().includes(q) ||
                    ev.location.toLowerCase().includes(q)
                  );
                })
                .map((ev, idx) => (
                  <div key={ev._id || idx} className="cms-card">
                    <div className="relative aspect-[16/10] w-full bg-[#F1F5F9] overflow-hidden">
                      <Image
                        src={ev.img || (ev as any).src || "/images/og-image.jpg"}
                        alt={ev.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 400px"
                        unoptimized
                        loading="lazy"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="absolute flex items-center gap-1"
                      >
                        <span className="cms-badge bg-white/95 text-[#5D87FF] shadow-xs">
                          {ev.category} · {ev.year}
                        </span>
                        {ev.isUpcoming && (
                          <span className="cms-badge bg-[#E6FFFA] text-[#13DEB9] shadow-xs hidden sm:inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#13DEB9] animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          bottom: "6px",
                          right: "6px",
                          padding: "2px 5px",
                        }}
                        className="absolute rounded bg-white/95 text-[8.5px] sm:text-[10px] font-bold text-[#2A3547] shadow-xs"
                      >
                        {ev.date}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <span className="text-[8.5px] sm:text-[10px] tracking-wider text-[#7C8FAC] uppercase font-bold block truncate">
                          {ev.shortTitle}
                        </span>
                        <h3
                          style={{ marginTop: "1px" }}
                          className="text-xs sm:text-[13.5px] font-bold text-[#2A3547] line-clamp-1 leading-snug"
                        >
                          {ev.title}
                        </h3>
                        <p
                          style={{ marginTop: "1px" }}
                          className="text-[10px] sm:text-[11.5px] font-semibold text-[#5D87FF] truncate"
                        >
                          {ev.location}
                        </p>
                        <p
                          style={{ marginTop: "3px" }}
                          className="text-[9.5px] sm:text-[11px] text-[#7C8FAC] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed"
                        >
                          {ev.description}
                        </p>
                      </div>

                      <div
                        style={{ marginTop: "8px", paddingTop: "6px" }}
                        className="border-t border-[#EAEFF4] flex items-center justify-between gap-1"
                      >
                        <span className="hidden sm:inline-block font-mono text-[9px] sm:text-[10.5px] text-[#7C8FAC] truncate max-w-[80px]">
                          {ev.filmStock || ev.exif}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ev)}
                            className="cms-action-edit flex-1 sm:flex-none text-center"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(ev._id || "")}
                            className="cms-action-delete flex-1 sm:flex-none text-center"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ============================================================
              TAB 6: MOTION VIDEO REELS
              ============================================================ */}
          {activeTab === "reels" && (
            <div className="flex flex-col gap-4">
              <div
                style={{ padding: "10px 16px" }}
                className="rounded-xl bg-[#ECF2FF] border border-[#D3E2FF] text-[#5D87FF] text-xs font-semibold flex items-center gap-2.5"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
                </svg>
                <span>
                  Vertical phone video reels featured in the &ldquo;Frames of
                  Moments&rdquo; section. Upload .mp4 or .webm files directly
                  from your computer.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3.5">
                {reelsList.map((reel, idx) => (
                  <div key={reel._id || idx} className="cms-card">
                    <div className="relative aspect-[9/16] max-h-[190px] sm:max-h-[250px] w-full bg-[#0F172A] flex items-center justify-center overflow-hidden">
                      <video
                        src={reel.videoSrc}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      <div
                        style={{ top: "6px", left: "6px" }}
                        className="cms-badge absolute bg-white/95 text-[#5D87FF] shadow-xs"
                      >
                        REEL #{idx + 1}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <div>
                        <p className="text-[8.5px] sm:text-[9.5px] font-bold text-[#7C8FAC] uppercase truncate">
                          Creator
                        </p>
                        <h3
                          style={{ marginTop: "1px" }}
                          className="text-xs font-bold text-[#2A3547] line-clamp-1 leading-snug"
                        >
                          {reel.photographer}
                        </h3>
                      </div>

                      <div
                        style={{ marginTop: "8px", paddingTop: "6px" }}
                        className="border-t border-[#EAEFF4] flex items-center gap-1"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(reel)}
                          className="cms-action-edit flex-1 justify-center text-center"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(reel._id || "")}
                          className="cms-action-delete flex-1 justify-center text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 7: EXECUTIVE SPOTLIGHT & COUNTDOWN MODULE
              ============================================================ */}
          {activeTab === "spotlight" && (
            <div className="flex flex-col gap-5">
              {/* Info Header Banner */}
              <div
                style={{ padding: "16px 20px" }}
                className="rounded-2xl bg-white border border-[#EAEFF4] shadow-xs flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ width: "42px", height: "42px" }}
                    className="rounded-xl bg-[#FFF9E6] text-[#FFAE1F] flex items-center justify-center shrink-0 border border-[#FFE7A8]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2A3547]">
                      Spotlight Dispatch &amp; Live Countdown Manager
                    </h3>
                    <p
                      style={{ marginTop: "2px" }}
                      className="text-xs text-[#7C8FAC]"
                    >
                      Controls Section 3 on mobile. Manage the Upcoming event,
                      the Live Going session, and their real-time DAYS : HRS :
                      MIN : SEC countdown timers.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSpotlight}
                  disabled={savingSpotlight}
                  style={{ padding: "9px 20px" }}
                  className="rounded-xl bg-[#5D87FF] hover:bg-[#4F75E0] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-60"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${
                      savingSpotlight ? "animate-spin" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  <span>
                    {savingSpotlight ? "Saving Changes..." : "Save Spotlight"}
                  </span>
                </button>
              </div>

              {/* Sub-Tab Switcher: UPCOMING vs LIVE GOING */}
              <div
                style={{ padding: "6px" }}
                className="grid grid-cols-2 gap-2 bg-[#EAEFF4]/70 rounded-2xl border border-[#DFE5EF] max-w-md"
              >
                <button
                  type="button"
                  onClick={() => setActiveSpotlightSubTab("upcoming")}
                  style={{ padding: "10px 16px" }}
                  className={`rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    activeSpotlightSubTab === "upcoming"
                      ? "bg-white text-[#2A3547] shadow-sm"
                      : "bg-transparent text-[#7C8FAC] hover:text-[#2A3547]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FFAE1F]" />
                  <span>1. UPCOMING EVENT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSpotlightSubTab("live")}
                  style={{ padding: "10px 16px" }}
                  className={`rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    activeSpotlightSubTab === "live"
                      ? "bg-[#FA896B] text-white shadow-sm"
                      : "bg-transparent text-[#7C8FAC] hover:text-[#FA896B]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeSpotlightSubTab === "live"
                        ? "bg-white animate-ping"
                        : "bg-[#FA896B]"
                    }`}
                  />
                  <span>2. LIVE GOING SESSION</span>
                </button>
              </div>

              {/* Form & Live Mobile Simulation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Form: 7 Columns */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAEFF4] shadow-xs flex flex-col justify-between overflow-hidden">
                  <div style={{ padding: "24px" }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EAEFF4] pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5D87FF]">
                        {activeSpotlightSubTab === "upcoming"
                          ? "Upcoming Event Settings (Default Schedule)"
                          : "Live Going Session Settings (Happening Now)"}
                      </span>
                      <span
                        style={{ padding: "3px 8px" }}
                        className={`rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          activeSpotlightSubTab === "upcoming"
                            ? "bg-[#FFF9E6] text-[#FFAE1F]"
                            : "bg-[#FDEDE8] text-[#FA896B]"
                        }`}
                      >
                        {activeSpotlightSubTab === "upcoming"
                          ? "STARTS IN TIMER"
                          : "LIVE SESSION TIMER"}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Title */}
                      <div>
                        <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={
                            spotlightAdminData[activeSpotlightSubTab]?.title ||
                            ""
                          }
                          onChange={(e) =>
                            updateSpotlightField("title", e.target.value)
                          }
                          placeholder="e.g. Brahmaputra Heritage Photowalk 4.0"
                          className="cms-form-input w-full"
                        />
                      </div>

                      {/* Category & Date Label */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                            Category Badge
                          </label>
                          <input
                            type="text"
                            value={
                              spotlightAdminData[activeSpotlightSubTab]
                                ?.category || ""
                            }
                            onChange={(e) =>
                              updateSpotlightField("category", e.target.value)
                            }
                            placeholder="e.g. PHOTOWALK, WORKSHOP, EXHIBITION"
                            className="cms-form-input w-full"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                            Display Date Label
                          </label>
                          <input
                            type="text"
                            value={
                              spotlightAdminData[activeSpotlightSubTab]?.date ||
                              ""
                            }
                            onChange={(e) =>
                              updateSpotlightField("date", e.target.value)
                            }
                            placeholder="e.g. NOV 14, 2026 or HAPPENING NOW"
                            className="cms-form-input w-full"
                          />
                        </div>
                      </div>

                      {/* Countdown Timer Target Date & Presets */}
                      <div
                        style={{ padding: "14px", marginTop: "4px" }}
                        className="rounded-xl bg-[#F8FAFC] border border-[#EAEFF4] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-[#2A3547] uppercase block">
                            ⏱ Countdown Target Date &amp; Time (ISO) *
                          </label>
                          <span className="text-[10px] text-[#7C8FAC] font-medium">
                            Controls DAYS : HRS : MIN : SEC
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="datetime-local"
                            value={toLocalDatetimeString(
                              spotlightAdminData[activeSpotlightSubTab]
                                ?.targetDate
                            )}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const iso = new Date(
                                e.target.value
                              ).toISOString();
                              updateSpotlightField("targetDate", iso);
                            }}
                            className="cms-form-input flex-1 bg-white font-mono text-xs"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const iso = new Date(
                                Date.now() + 24 * 3600 * 1000
                              ).toISOString();
                              updateSpotlightField("targetDate", iso);
                            }}
                            style={{ padding: "8px 12px" }}
                            className="rounded-lg bg-white border border-[#DFE5EF] text-[#5A6A85] text-[11px] font-semibold hover:bg-slate-50 cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <span className="text-[10px] font-bold text-[#7C8FAC] uppercase block mb-1">
                            Quick Presets (From Now):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "+2 Hours", hrs: 2 },
                              { label: "+24 Hours", hrs: 24 },
                              { label: "+3 Days", hrs: 72 },
                              { label: "+7 Days", hrs: 168 },
                              { label: "+14 Days", hrs: 336 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyQuickPreset(preset.hrs)}
                                style={{ padding: "4px 9px" }}
                                className="rounded-md bg-white border border-[#DFE5EF] hover:border-[#5D87FF] hover:text-[#5D87FF] text-[#2A3547] text-[10.5px] font-medium cursor-pointer transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Location & Film Stock */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={
                              spotlightAdminData[activeSpotlightSubTab]
                                ?.location || ""
                            }
                            onChange={(e) =>
                              updateSpotlightField("location", e.target.value)
                            }
                            placeholder="e.g. Riverfront, Guwahati"
                            className="cms-form-input w-full"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                            Film Stock / Gear Badge
                          </label>
                          <input
                            type="text"
                            value={
                              spotlightAdminData[activeSpotlightSubTab]
                                ?.filmStock || ""
                            }
                            onChange={(e) =>
                              updateSpotlightField("filmStock", e.target.value)
                            }
                            placeholder="e.g. KODAK PORTRA 400"
                            className="cms-form-input w-full"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                          Description Overview
                        </label>
                        <textarea
                          rows={3}
                          value={
                            spotlightAdminData[activeSpotlightSubTab]
                              ?.description || ""
                          }
                          onChange={(e) =>
                            updateSpotlightField("description", e.target.value)
                          }
                          placeholder="Event synopsis or live workshop instructions..."
                          className="cms-form-input w-full resize-none text-xs"
                        />
                      </div>

                      {/* Join Button CTA */}
                      <div>
                        <label className="text-[11px] font-bold text-[#2A3547] uppercase block mb-1">
                          Action Button Label (CTA)
                        </label>
                        <input
                          type="text"
                          value={
                            spotlightAdminData[activeSpotlightSubTab]?.ctaText ||
                            ""
                          }
                          onChange={(e) =>
                            updateSpotlightField("ctaText", e.target.value)
                          }
                          placeholder="e.g. JOIN UPCOMING EVENT or JOIN LIVE SESSION NOW"
                          className="cms-form-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ padding: "16px 24px" }}
                    className="border-t border-[#EAEFF4] bg-[#F8FAFC] flex items-center justify-between"
                  >
                    <span className="text-[11px] text-[#7C8FAC]">
                      Clicking Save will update both Mobile and Desktop
                      dispatches.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveSpotlight}
                      disabled={savingSpotlight}
                      style={{ padding: "8px 20px" }}
                      className="rounded-xl bg-[#5D87FF] hover:bg-[#4F75E0] text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-60"
                    >
                      {savingSpotlight ? "Saving..." : "Save Spotlight"}
                    </button>
                  </div>
                </div>

                {/* Right Form: 5 Columns (Media Upload & Mobile Preview Simulation) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Image Upload Zone */}
                  <div
                    style={{ padding: "20px" }}
                    className="bg-white rounded-2xl border border-[#EAEFF4] shadow-xs space-y-3"
                  >
                    <label className="text-[11px] font-bold text-[#2A3547] uppercase block">
                      Spotlight Cover Photograph *
                    </label>

                    <FileUploadZone
                      value={
                        spotlightAdminData[activeSpotlightSubTab]?.img || ""
                      }
                      onChange={(url) => updateSpotlightField("img", url)}
                      accept="image"
                      label="Upload Cover Photo (JPG / PNG / WEBP)"
                      helperText="High-resolution landscape/wide photograph for the upper 16:10 frame."
                    />

                    <div>
                      <span className="text-[10px] font-bold text-[#7C8FAC] uppercase block mb-1">
                        Or Paste Direct Image URL:
                      </span>
                      <input
                        type="url"
                        value={
                          spotlightAdminData[activeSpotlightSubTab]?.img || ""
                        }
                        onChange={(e) =>
                          updateSpotlightField("img", e.target.value)
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="cms-form-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Live Mobile Spotlight Preview */}
                  <div
                    style={{ padding: "20px" }}
                    className="bg-[#0A0A0D] text-white rounded-2xl border border-black/20 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-mono text-[9px] tracking-widest uppercase text-[#D4A843] font-bold">
                        📱 LIVE MOBILE SIMULATION
                      </span>
                      <span className="font-mono text-[9px] text-white/50 uppercase">
                        {activeSpotlightSubTab === "upcoming"
                          ? "UPCOMING TAB"
                          : "LIVE TAB"}
                      </span>
                    </div>

                    {/* Architectural Mobile Card Preview */}
                    <div className="rounded-xl bg-[#131319] border border-white/15 overflow-hidden shadow-md">
                      <div className="relative w-full aspect-[16/10] bg-[#070709] overflow-hidden">
                        {spotlightAdminData[activeSpotlightSubTab]?.img ? (
                          <img
                            src={spotlightAdminData[activeSpotlightSubTab]?.img}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                            No Cover Image Uploaded
                          </div>
                        )}
                        <div
                          style={{ padding: "8px 10px" }}
                          className="absolute top-0 inset-x-0 flex items-center justify-between"
                        >
                          <span className="px-2 py-0.5 rounded bg-black/80 font-mono text-[7.5px] uppercase font-bold text-[#D4A843]">
                            {spotlightAdminData[activeSpotlightSubTab]
                              ?.category || "CATEGORY"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[7.5px] uppercase font-bold ${
                              activeSpotlightSubTab === "live"
                                ? "bg-[#D92B2B] text-white"
                                : "bg-black/80 text-white/90"
                            }`}
                          >
                            {spotlightAdminData[activeSpotlightSubTab]?.date ||
                              "DATE"}
                          </span>
                        </div>
                      </div>

                      {/* 4-Unit Counter preview */}
                      <div
                        style={{ padding: "8px 10px" }}
                        className="bg-[#0D0D12] border-y border-white/10 flex items-center justify-between"
                      >
                        <span className="font-mono text-[8px] uppercase tracking-wider text-[#D4A843] font-bold">
                          {activeSpotlightSubTab === "upcoming"
                            ? "STARTS IN :"
                            : "ENDS IN :"}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-white tracking-widest">
                          DAYS : HRS : MIN : SEC
                        </span>
                      </div>

                      <div
                        style={{ padding: "12px 14px" }}
                        className="space-y-2 bg-[#131319]"
                      >
                        <h4 className="font-heading font-extrabold text-sm text-white line-clamp-1">
                          {spotlightAdminData[activeSpotlightSubTab]?.title ||
                            "Event Title"}
                        </h4>
                        <p className="font-sans text-[10.5px] text-white/60 line-clamp-2">
                          {spotlightAdminData[activeSpotlightSubTab]
                            ?.description || "Description preview..."}
                        </p>
                        <div
                          style={{ padding: "8px 12px" }}
                          className={`rounded-lg text-center font-mono text-[8.5px] font-bold uppercase tracking-widest ${
                            activeSpotlightSubTab === "live"
                              ? "bg-[#D92B2B] text-white"
                              : "bg-[#D4A843] text-black"
                          }`}
                        >
                          {spotlightAdminData[activeSpotlightSubTab]?.ctaText ||
                            "JOIN EVENT"}{" "}
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) for Quick 1-Thumb Record Creation */}
      {["gallery", "activities", "committee", "reels"].includes(activeTab) && (
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="lg:hidden fixed bottom-6 right-5 z-40 w-13 h-13 rounded-full bg-[#5D87FF] hover:bg-[#4F75E0] text-white shadow-xl shadow-[#5D87FF]/40 flex items-center justify-center active:scale-95 transition-all"
          aria-label="Add New Item"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* ============================================================
          MODAL DRAWER / DIALOG (Enterprise Clean Form)
          ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E293B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#EAEFF4] rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#EAEFF4] flex items-center justify-between bg-[#FAFBFD] shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5D87FF] block">
                  {modalMode === "create"
                    ? "Create New Record"
                    : "Update Existing Record"}
                </span>
                <h2
                  style={{ marginTop: "2px" }}
                  className="text-base sm:text-lg font-bold text-[#2A3547]"
                >
                  {activeTabMeta.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ width: "32px", height: "32px" }}
                className="rounded-lg bg-white hover:bg-slate-100 border border-[#DFE5EF] text-[#5A6A85] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveItem}
              className="px-4 py-3.5 sm:px-6 sm:py-5 flex flex-col gap-4 overflow-y-auto flex-1 text-xs"
            >
              <div
                style={{ padding: "14px" }}
                className="rounded-xl bg-[#F8FAFC] border border-[#EAEFF4]"
              >
                <FileUploadZone
                  value={
                    activeTab === "reels"
                      ? editingItem.videoSrc || ""
                      : editingItem.src || editingItem.img || ""
                  }
                  onChange={(url) => {
                    if (activeTab === "reels") {
                      setEditingItem({ ...editingItem, videoSrc: url });
                    } else if (
                      activeTab === "activities" ||
                      activeTab === "committee"
                    ) {
                      setEditingItem({ ...editingItem, img: url });
                    } else {
                      setEditingItem({ ...editingItem, src: url });
                    }
                  }}
                  accept={activeTab === "reels" ? "video" : "image"}
                  label={
                    activeTab === "reels"
                      ? "Upload Video Reel (MP4 / WebM)"
                      : "Upload Photography / Artwork Frame"
                  }
                  helperText={
                    activeTab === "reels"
                      ? "Upload vertical video reel directly from your computer"
                      : "Upload high-res photography directly from your computer"
                  }
                />
              </div>

              {activeTab === "gallery" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Frame Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.title || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. Monsoon Over Brahmaputra"
                        className="cms-form-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Category
                      </label>
                      <select
                        value={editingItem.category || "DOCUMENTARY"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            category: e.target.value,
                          })
                        }
                        className="cms-form-input"
                      >
                        {[
                          "DOCUMENTARY",
                          "PORTRAITURE",
                          "LANDSCAPE",
                          "ARCHITECTURE",
                          "STREET",
                          "EXPERIMENTAL",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Photographer Credit
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.photographer || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            photographer: e.target.value,
                          })
                        }
                        placeholder="e.g. Riky"
                        className="cms-form-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Film Stock / Emulsion
                      </label>
                      <input
                        type="text"
                        value={editingItem.filmStock || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            filmStock: e.target.value,
                          })
                        }
                        placeholder="e.g. KODAK PORTRA 400"
                        className="cms-form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        EXIF Specifications
                      </label>
                      <input
                        type="text"
                        value={editingItem.exif || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            exif: e.target.value,
                          })
                        }
                        placeholder="e.g. 35MM · F/2.0 · 1/1000S"
                        className="cms-form-input font-mono"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        value={editingItem.location || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            location: e.target.value,
                          })
                        }
                        placeholder="e.g. Guwahati Riverfront"
                        className="cms-form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{ marginBottom: "6px" }}
                      className="block text-xs font-bold text-[#2A3547]"
                    >
                      Inspection Loupe Extended Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingItem.description || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        })
                      }
                      placeholder="Backstory, lighting technique, and artistic intention..."
                      className="cms-form-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === "activities" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Short Title (Card Header)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.shortTitle || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            shortTitle: e.target.value,
                          })
                        }
                        placeholder="e.g. BRAHMAPUTRA 4.0"
                        className="cms-form-input font-bold"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Collection Year
                      </label>
                      <select
                        value={editingItem.year || "2026"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            year: e.target.value,
                          })
                        }
                        className="cms-form-input"
                      >
                        <option value="2026">WORKS &apos;26</option>
                        <option value="2025">WORKS &apos;25</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{ marginBottom: "6px" }}
                      className="block text-xs font-bold text-[#2A3547]"
                    >
                      Full Event Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.title || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. Brahmaputra Heritage Photowalk 4.0"
                      className="cms-form-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Category
                      </label>
                      <select
                        value={editingItem.category || "PHOTOWALK"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            category: e.target.value,
                          })
                        }
                        className="cms-form-input"
                      >
                        {[
                          "PHOTOWALK",
                          "WORKSHOP",
                          "EXHIBITION",
                          "COMPETITION",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Event Date
                      </label>
                      <input
                        type="text"
                        value={editingItem.date || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            date: e.target.value,
                          })
                        }
                        placeholder="NOV 14, 2026"
                        className="cms-form-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        value={editingItem.location || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            location: e.target.value,
                          })
                        }
                        placeholder="GCU Media Lab"
                        className="cms-form-input"
                      />
                    </div>
                  </div>

                  <div
                    style={{ padding: "14px 18px" }}
                    className="rounded-xl bg-[#F8FAFC] border border-[#EAEFF4] flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-xs font-bold text-[#2A3547]">
                        Live RSVP Status
                      </span>
                      <span className="block text-[11px] text-[#7C8FAC]">
                        Displays the pulsing green &ldquo;UPCOMING&rdquo; badge
                        across the timeline.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.isUpcoming)}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          isUpcoming: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#5D87FF] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#2A3547]">
                        Event Description
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = editingItem.description || "";
                            setEditingItem({
                              ...editingItem,
                              description: cur + " **bold text** ",
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F4F7FE] hover:bg-[#5D87FF] hover:text-white border border-[#DFE5EF] text-[#2A3547] transition-all cursor-pointer"
                          title="Add bold formatting"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = editingItem.description || "";
                            setEditingItem({
                              ...editingItem,
                              description: cur + " *italic text* ",
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[11px] italic font-serif bg-[#F4F7FE] hover:bg-[#5D87FF] hover:text-white border border-[#DFE5EF] text-[#2A3547] transition-all cursor-pointer"
                          title="Add italic formatting"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = editingItem.description || "";
                            setEditingItem({
                              ...editingItem,
                              description: cur + " [Link Title](https://example.com) ",
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F4F7FE] hover:bg-[#5D87FF] hover:text-white border border-[#DFE5EF] text-[#2A3547] transition-all cursor-pointer"
                          title="Add web link"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={editingItem.description || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        })
                      }
                      placeholder="Details, gear requirements, and itinerary... (supports **bold**, *italics*, and [link](url))"
                      className="cms-form-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === "committee" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. Dr. Sangeeta Das"
                        className="cms-form-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Executive Role
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.role || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            role: e.target.value,
                          })
                        }
                        placeholder="e.g. Club Lead / Visual Director"
                        className="cms-form-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Chapter Tier
                      </label>
                      <select
                        value={editingItem.tier || "LEAD"}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            tier: e.target.value,
                          })
                        }
                        className="cms-form-input"
                      >
                        {["MENTOR", "LEAD", "CORE", "FOUNDER", "LEGACY"].map(
                          (t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Department
                      </label>
                      <input
                        type="text"
                        value={editingItem.dept || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            dept: e.target.value,
                          })
                        }
                        placeholder="e.g. Dept. of Computer Science"
                        className="cms-form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "hero" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Frame Code
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.frameCode || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            frameCode: e.target.value,
                          })
                        }
                        placeholder="01A"
                        className="cms-form-input font-mono"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Artwork Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.title || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            title: e.target.value,
                          })
                        }
                        placeholder="SILENT PEAKS"
                        className="cms-form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{ marginBottom: "6px" }}
                      className="block text-xs font-bold text-[#2A3547]"
                    >
                      EXIF Specifications
                    </label>
                    <input
                      type="text"
                      value={editingItem.exif || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, exif: e.target.value })
                      }
                      placeholder="85MM · F/1.4 · ISO 200"
                      className="cms-form-input font-mono"
                    />
                  </div>
                </div>
              )}

              {activeTab === "pullin" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Exhibit Code
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.code || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            code: e.target.value,
                          })
                        }
                        placeholder="EXHIBIT // 01A"
                        className="cms-form-input font-mono"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Exhibit Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.title || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            title: e.target.value,
                          })
                        }
                        placeholder="STREET & SHADOWS"
                        className="cms-form-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        Subtitle / Location
                      </label>
                      <input
                        type="text"
                        value={editingItem.subTitle || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            subTitle: e.target.value,
                          })
                        }
                        placeholder="Guwahati Dusk"
                        className="cms-form-input"
                      />
                    </div>
                    <div>
                      <label
                        style={{ marginBottom: "6px" }}
                        className="block text-xs font-bold text-[#2A3547]"
                      >
                        EXIF Specs
                      </label>
                      <input
                        type="text"
                        value={editingItem.exif || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            exif: e.target.value,
                          })
                        }
                        placeholder="f/2.8 · 1/500s · ISO 400"
                        className="cms-form-input font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{ marginBottom: "6px" }}
                      className="block text-xs font-bold text-[#2A3547]"
                    >
                      Headline Text
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.headline || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          headline: e.target.value,
                        })
                      }
                      placeholder="Moments Suspended in Light"
                      className="cms-form-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === "reels" && (
                <div>
                  <label
                    style={{ marginBottom: "6px" }}
                    className="block text-xs font-bold text-[#2A3547]"
                  >
                    Photographer / Creator Credit
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.photographer || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        photographer: e.target.value,
                      })
                    }
                    placeholder="e.g. Aman Baha"
                    className="cms-form-input"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#EAEFF4] flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cms-action-edit py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="cms-primary-btn py-2 px-4 text-xs"
                >
                  {savingItem && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  <span>
                    {modalMode === "create" ? "Create Record" : "Save Changes"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Status Toast Alert */}
      {statusToast && (
        <div
          style={{ padding: "14px 20px" }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl text-xs font-bold shadow-xl ${
            statusToast.type === "success"
              ? "bg-[#E6FFFA] border border-[#13DEB9]/40 text-[#0F766E]"
              : "bg-[#FDEDE8] border border-[#FA896B]/40 text-[#C2410C]"
          }`}
        >
          <span>{statusToast.text}</span>
        </div>
      )}
    </div>
  );
}
