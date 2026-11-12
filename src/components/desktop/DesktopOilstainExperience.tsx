/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import { MOBILE_HERO_MEDIA } from "@/config/mobileHeroMedia";
import {
  INITIAL_GALLERY,
  INITIAL_ACTIVITIES,
  INITIAL_COMMITTEE,
  INITIAL_REELS,
  INITIAL_SPOTLIGHT,
} from "@/data/initialClubData";

// ==========================================
// FALLBACK DATASETS (Synced with Live GCU Club Data)
// ==========================================
const FALLBACK_GALLERY = INITIAL_GALLERY;
const FALLBACK_REELS = INITIAL_REELS;

function getReelInitials(name: string) {
  if (!name) return "SS";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBaseLikes(idStr: string, idx: number, apiLikes?: number): number {
  if (typeof apiLikes === "number" && apiLikes >= 0) return apiLikes;
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) % 1000;
  }
  return 28 + ((hash + idx * 17) % 64);
}

// Default Spotlight Data (Synced with Admin `/api/spotlight`)
const FALLBACK_SPOTLIGHT = (INITIAL_SPOTLIGHT as any) || {
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
    img: "/api/media/6ade74822b808e482f8eb5d7",
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
    img: "/api/media/6ade74822b808e482f8eb5da",
    description:
      "Live hands-on studio session exploring high-speed Xenon flash choreography, Chiaroscuro portrait lighting, and manual optics.",
    ctaText: "JOIN LIVE SESSION NOW",
  },
};

const FALLBACK_ACTIVITIES = INITIAL_ACTIVITIES;
const FALLBACK_COMMITTEE = INITIAL_COMMITTEE;

const MEMBER_CARD_BACKDROPS = [
  "#8CE99A", // Mint Studio Green
  "#FFA8A8", // Coral Peach
  "#74C0FC", // Sky Blue
  "#D0BFFF", // Soft Lavender
  "#FFE066", // Warm Amber Gold
  "#FCC2D7", // Rose Quartz
];

type AboutTabKey =
  | "ORIGINS"
  | "THE TEACHERS"
  | "BEHIND THE LENS"
  | "CORE MEMBERS"
  | "WHERE IT ALL STARTED"
  | "CARRYING IT FORWARD";

const ABOUT_CHAPTER_TABS: {
  id: AboutTabKey;
  code: string;
  shortLabel: string;
}[] = [
  { id: "ORIGINS", code: "01", shortLabel: "ORIGINS" },
  { id: "THE TEACHERS", code: "02", shortLabel: "THE TEACHERS" },
  { id: "BEHIND THE LENS", code: "03", shortLabel: "BEHIND THE LENS" },
  { id: "CORE MEMBERS", code: "04", shortLabel: "CORE MEMBERS" },
  { id: "WHERE IT ALL STARTED", code: "05", shortLabel: "WHERE IT ALL STARTED" },
  { id: "CARRYING IT FORWARD", code: "06", shortLabel: "CARRYING IT FORWARD" },
];

type NavTabId = "home" | "gallery" | "about" | "activity" | "moments";

const FLOATING_NAV_ITEMS: {
  id: NavTabId;
  label: string;
  sectionId: string;
}[] = [
  { id: "home", label: "Home", sectionId: "desktop-hero-top" },
  { id: "gallery", label: "Gallery", sectionId: "desktop-light-bento-section" },
  { id: "about", label: "About", sectionId: "desktop-light-about-section" },
  { id: "activity", label: "Activity", sectionId: "desktop-dark-showcase" },
  { id: "moments", label: "Moments", sectionId: "desktop-chronology-matrix" },
];

function renderFloatingNavIcon(id: NavTabId, isActive: boolean) {
  const strokeColor = isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.78)";
  const size = isActive ? 16 : 15;
  switch (id) {
    case "home":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z" />
          <circle cx="12" cy="14" r="2.5" />
        </svg>
      );
    case "gallery":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "about":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" />
          <path d="M18 4l.8 2.2L21 7l-2.2.8L18 10l-.8-2.2L15 7l2.2-.8L18 4z" />
        </svg>
      );
    case "activity":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 11 11 14 14 22 22 3" />
        </svg>
      );
    case "moments":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
  }
}

// Sleek Proportioned Desktop Notch Path (Width = 460px, Height = 52px)
function buildCompactNotchPath(cx: number): string {
  const width = 460;
  const height = 52;
  const safeCx = Math.max(66, Math.min(width - 66, cx));
  const nStart = (safeCx - 23).toFixed(2);
  const c1 = (safeCx - 13.5).toFixed(2);
  const center = safeCx.toFixed(2);
  const c2 = (safeCx + 13.5).toFixed(2);
  const nEnd = (safeCx + 23).toFixed(2);

  return `M 24 0 L ${nStart} 0 C ${c1} 0, ${c1} 20, ${center} 20 C ${c2} 20, ${c2} 0, ${nEnd} 0 L ${
    width - 24
  } 0 A 24 24 0 0 1 ${width} 24 L ${width} ${height - 24} A 24 24 0 0 1 ${
    width - 24
  } ${height} L 24 ${height} A 24 24 0 0 1 0 ${height - 24} L 0 24 A 24 24 0 0 1 24 0 Z`;
}

// Helper to compute live DAYS / HRS / MIN / SEC from an ISO targetDate
function computeCountdownParts(targetIso?: string, fallbackHours = 72) {
  let targetMs = targetIso ? Date.parse(targetIso) : NaN;
  if (isNaN(targetMs) || targetMs <= Date.now()) {
    const cycleMs = fallbackHours * 3600 * 1000;
    const remainder = cycleMs - (Date.now() % cycleMs);
    targetMs = Date.now() + remainder;
  }
  const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

const SLICES_PER_CARD = 6;
const SLICE_INDICES = Array.from({ length: SLICES_PER_CARD }, (_, i) => i);

// =========================================================================
// 1. DESKTOP "ORIGINS" MAGAZINE SPREAD
//    - Pure Plain White Photo Stage + Matching Twin Archival Cards
// =========================================================================
const StopMotionFlipbook = React.memo(function StopMotionFlipbook({
  matrixStack,
  onOpenRegister,
}: {
  matrixStack: Array<{ src: string; title: string; orientation: string }>;
  onOpenRegister: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      isVisibleRef.current = true;
      setIsHighlighted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) setIsHighlighted(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (matrixStack.length <= 1) return;
    const interval = setInterval(() => {
      if (isVisibleRef.current) {
        setPhotoIdx((prev) => (prev + 1) % matrixStack.length);
      }
    }, 950);
    return () => clearInterval(interval);
  }, [matrixStack.length]);

  const currentFrame = matrixStack[photoIdx % matrixStack.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* TOP 12-COLUMN EDITORIAL SPREAD */}
      <div className="grid grid-cols-12 gap-10 items-center">
        <div
          className="col-span-7"
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div className="flex items-center gap-3">
            <h3 className="font-heading font-black text-4xl uppercase tracking-[-0.03em] text-[#111111]">
              STORYTELLERS
            </h3>
            <span
              style={{ padding: "4px 12px" }}
              className="rounded-full bg-[#111111] text-[#FFE066] font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]"
            >
              CHAPTER 01 // ORIGINS
            </span>
          </div>

          <p className="font-serif text-[21px] leading-[1.65] text-[#111111] font-normal">
            Born at{" "}
            <span
              style={{ padding: "2px 8px" }}
              className={`inline-block rounded font-heading font-bold text-[15px] uppercase tracking-tight transition-all duration-700 ${
                isHighlighted
                  ? "bg-[#D4A843] text-[#111111]"
                  : "bg-transparent text-[#111111]"
              }`}
            >
              Girijananda Chowdhury University
            </span>{" "}
            in Assam,{" "}
            <span className="italic font-semibold underline decoration-[#D92B2B] decoration-wavy decoration-1 underline-offset-4">
              ShutterScape
            </span>{" "}
            is our unmedicated{" "}
            <span
              style={{ padding: "2px 8px" }}
              className={`inline-block rounded font-mono text-[13px] font-bold uppercase tracking-wider transition-all duration-700 delay-150 ${
                isHighlighted
                  ? "bg-[#D92B2B] text-white"
                  : "bg-transparent text-[#111111]"
              }`}
            >
              Visual Archive
            </span>{" "}
            — a pure manifesto of{" "}
            <span className="border-b-2 border-dashed border-[#0F766E] font-semibold text-[#0F766E]">
              analog optics
            </span>
            ,{" "}
            <span className="border-b-2 border-dashed border-[#D4A843] font-semibold">
              street documentary
            </span>
            , and creative excess.
          </p>
        </div>

        {/* Right 5 Columns: Matched Studio Pillar Card */}
        <div
          style={{
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
          className="col-span-5 rounded-2xl bg-white border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center justify-between border-b border-black/10 pb-2.5 font-mono text-[9px] uppercase tracking-[0.2em]">
            <span className="font-bold text-[#D92B2B]">
              ★ THE SHUTTERSCAPE CREDO
            </span>
            <span className="text-black/45 font-bold">EST. 2023 · ASSAM</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div
              style={{ padding: "12px 8px" }}
              className="rounded-xl bg-[#FAF9F5] border border-black/8"
            >
              <span className="font-mono text-[8px] font-bold uppercase text-black/45 block">
                01 // EYE
              </span>
              <span className="font-heading font-black text-xs uppercase text-[#111111] mt-1 block">
                OBSERVE
              </span>
            </div>
            <div
              style={{ padding: "12px 8px" }}
              className="rounded-xl bg-[#FAF9F5] border border-black/8"
            >
              <span className="font-mono text-[8px] font-bold uppercase text-black/45 block">
                02 // SHUTTER
              </span>
              <span className="font-heading font-black text-xs uppercase text-[#111111] mt-1 block">
                CAPTURE
              </span>
            </div>
            <div
              style={{ padding: "12px 8px" }}
              className="rounded-xl bg-[#FAF9F5] border border-black/8"
            >
              <span className="font-mono text-[8px] font-bold uppercase text-black/45 block">
                03 // PRINT
              </span>
              <span className="font-heading font-black text-xs uppercase text-[#111111] mt-1 block">
                ARCHIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE STAGE: PURE PLAIN WHITE LIGHTBOX + MATCHING TWIN ARCHIVAL CARDS */}
      <div
        ref={containerRef}
        onClick={() => setPhotoIdx((prev) => (prev + 1) % matrixStack.length)}
        style={{
          padding: "28px 32px",
          height: "465px",
        }}
        className="relative w-full overflow-hidden grid grid-cols-12 gap-7 items-center border border-black/12 bg-white rounded-3xl cursor-pointer shadow-[0_16px_44px_rgba(0,0,0,0.05)]"
      >
        {/* LEFT COLUMN (3 cols): Professional Plate Telemetry Card */}
        <div
          style={{ padding: "18px" }}
          onClick={(e) => e.stopPropagation()}
          className="col-span-3 h-[400px] flex flex-col justify-between bg-[#FAF9F5] border border-black/10 rounded-2xl select-none text-left font-mono"
        >
          <div className="flex items-center justify-between text-[8.5px] tracking-[0.18em] uppercase text-black/50 pb-2.5 border-b border-black/10">
            <span>PLATE DOSSIER</span>
            <span className="text-[#D92B2B] font-bold">
              PLATE 0{photoIdx + 1}A
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              margin: "auto 0",
            }}
          >
            <div>
              <span className="text-[8px] tracking-[0.18em] uppercase text-black/40 block">
                ACTIVE EXHIBITION PLATE
              </span>
              <h4
                style={{ marginTop: "4px" }}
                className="font-serif text-xl text-[#111111] font-normal leading-snug line-clamp-2"
              >
                {currentFrame?.title || "GCU Visual Study"}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                style={{ padding: "9px 10px" }}
                className="rounded-xl bg-white border border-black/8"
              >
                <span className="text-[7px] text-black/40 uppercase block">
                  FILM STOCK
                </span>
                <span className="text-[9.5px] font-bold text-[#111111] mt-0.5 block truncate">
                  KODAK 400TX
                </span>
              </div>
              <div
                style={{ padding: "9px 10px" }}
                className="rounded-xl bg-white border border-black/8"
              >
                <span className="text-[7px] text-black/40 uppercase block">
                  OPTICS
                </span>
                <span className="text-[9.5px] font-bold text-[#111111] mt-0.5 block truncate">
                  35MM · F/1.4
                </span>
              </div>
              <div
                style={{ padding: "9px 10px" }}
                className="rounded-xl bg-white border border-black/8"
              >
                <span className="text-[7px] text-black/40 uppercase block">
                  PROCESS
                </span>
                <span className="text-[9.5px] font-bold text-[#0F766E] mt-0.5 block truncate">
                  C-41 / D-76
                </span>
              </div>
              <div
                style={{ padding: "9px 10px" }}
                className="rounded-xl bg-white border border-black/8"
              >
                <span className="text-[7px] text-black/40 uppercase block">
                  ARCHIVE LAB
                </span>
                <span className="text-[9.5px] font-bold text-[#D92B2B] mt-0.5 block truncate">
                  GCU AZARA
                </span>
              </div>
            </div>

            <p className="font-sans text-[11px] text-black/60 leading-relaxed line-clamp-2">
              Captured and archived by GCU student storytellers during campus
              and Brahmaputra field expeditions.
            </p>
          </div>

          <div className="pt-2.5 border-t border-black/10 text-[8.5px] tracking-wider uppercase text-black/55 flex items-center justify-between">
            <span>GCU ARCHIVE VAULT</span>
            <button
              type="button"
              onClick={() =>
                setPhotoIdx((prev) => (prev + 1) % matrixStack.length)
              }
              className="text-[#111111] hover:text-[#D92B2B] font-bold cursor-pointer transition-colors"
            >
              NEXT PLATE →
            </button>
          </div>
        </div>

        {/* CENTER COLUMN (6 cols): PURE PLAIN WHITE BACKGROUND + CHANGING COLOR PHOTO */}
        <div className="col-span-6 relative h-[400px] w-full bg-white flex items-center justify-center overflow-hidden">
          {matrixStack.map((frame, i) => {
            const isCurrent = i === photoIdx % matrixStack.length;
            const isPortrait = frame.orientation === "portrait";
            return (
              <div
                key={i}
                style={{
                  opacity: isCurrent ? 1 : 0,
                  width: isPortrait ? "300px" : "460px",
                  height: isPortrait ? "375px" : "345px",
                  padding: "10px",
                  transform: isCurrent
                    ? "scale(1) rotate(-1deg)"
                    : "scale(0.96) rotate(1deg)",
                }}
                className="absolute bg-white rounded-2xl shadow-[0_24px_55px_rgba(0,0,0,0.18)] border border-black/12 pointer-events-none transition-all duration-200"
              >
                <img
                  src={frame.src}
                  alt={frame.title}
                  className="w-full h-full object-cover rounded-xl saturate-[1.15] contrast-[1.04]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN (3 cols): Interactive 6-Frame Contact Sheet Grid */}
        <div
          style={{ padding: "18px" }}
          onClick={(e) => e.stopPropagation()}
          className="col-span-3 h-[400px] flex flex-col justify-between bg-[#FAF9F5] border border-black/10 rounded-2xl select-none text-left font-mono"
        >
          <div className="flex items-center justify-between text-[8.5px] tracking-[0.18em] uppercase text-black/50 pb-2.5 border-b border-black/10">
            <span>CONTACT SHEET</span>
            <span className="text-[#D92B2B] font-bold">
              0{photoIdx + 1} / 0{matrixStack.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-auto py-2">
            {matrixStack.slice(0, 6).map((thumb, idx) => {
              const isSelected = idx === photoIdx % matrixStack.length;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoIdx(idx)}
                  className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#D92B2B] scale-[1.03] shadow-sm"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <img
                    src={thumb.src}
                    alt={thumb.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[7px] text-[#FFE066] font-bold">
                    0{idx + 1}A
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-black/10 text-[8.5px] tracking-wider uppercase text-black/55 flex items-center justify-between">
            <span>SELECT ANY PLATE</span>
            <span className="text-[#111111] font-bold">35MM LOUPE ↗</span>
          </div>
        </div>
      </div>

      {/* BOTTOM 12-COLUMN EDITORIAL SPREAD */}
      <div className="grid grid-cols-12 gap-10 items-center">
        <div className="col-span-7">
          <span
            style={{ marginBottom: "8px" }}
            className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#D92B2B] font-bold block"
          >
            DOUBLE VISION // {currentFrame?.title || "GCU ARCHIVE"}
          </span>
          <p className="font-serif text-[20px] text-[#111111]/85 leading-[1.65]">
            ShutterScape was created for students who love to{" "}
            <span className="font-semibold text-[#111111] underline decoration-[#D4A843] decoration-2 underline-offset-4">
              observe, capture, and tell stories
            </span>{" "}
            through photographs. Whether you shoot on a{" "}
            <span
              style={{ padding: "2px 7px" }}
              className="rounded bg-[#FFF3BF] text-[#8C6D1F] font-mono text-[11.5px] font-bold"
            >
              35mm SLR
            </span>
            , a{" "}
            <span
              style={{ padding: "2px 7px" }}
              className="rounded bg-[#E7F5FF] text-[#1864AB] font-mono text-[11.5px] font-bold"
            >
              mirrorless rig
            </span>
            , or your{" "}
            <span
              style={{ padding: "2px 7px" }}
              className="rounded bg-[#EBFBEE] text-[#2B8A3E] font-mono text-[11.5px] font-bold"
            >
              phone
            </span>{" "}
            —{" "}
            <span className="italic font-semibold text-[#D92B2B]">
              there is a place for you in our darkroom.
            </span>
          </p>
        </div>

        <div
          style={{ padding: "20px 24px" }}
          className="col-span-5 rounded-2xl bg-[#111111] text-white flex items-center justify-between gap-4 shadow-lg"
        >
          <div className="space-y-1">
            <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-[#FFE066] font-bold block">
              ● OPEN TO ALL GCU STUDENTS
            </span>
            <h4 className="font-heading font-bold text-base text-white tracking-tight">
              Step Into Our Darkroom Roster
            </h4>
            <p className="font-sans text-[11px] text-white/65">
              SLR · Mirrorless · Smartphone · Strobe Lab
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRegister}
            style={{ padding: "10px 18px" }}
            className="rounded-full bg-[#FFE066] hover:bg-white text-[#111111] font-mono text-[9.5px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-colors"
          >
            JOIN US ↗
          </button>
        </div>
      </div>
    </div>
  );
});

// =========================================================================
// 2. UNCLIPPED, FRAMELESS ROTATING HALF-WHEEL COLORED FAN (Fixes Screenshot 3!)
//    - overflow: visible + centered arc math = ZERO cards cut at top or bottom!
// =========================================================================
const WHEEL_SLOTS = 12;

const HalfWheelGalleryFan = React.memo(function HalfWheelGalleryFan({
  items,
  onSelectCard,
}: {
  items: any[];
  onSelectCard: (idx: number) => void;
}) {
  const wheelCards = useMemo(() => {
    const source = items.length > 0 ? items : FALLBACK_GALLERY;
    return Array.from({ length: WHEEL_SLOTS }, (_, i) => ({
      ...source[i % source.length],
      _wheelSlot: i,
      _origIdx: i % source.length,
    }));
  }, [items]);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isInViewRef = useRef<boolean>(true);

  useEffect(() => {
    const count = wheelCards.length;
    if (count === 0) return;

    let rafId = 0;
    let lastTime = performance.now();

    const updateWheel = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (isInViewRef.current && !isPausedRef.current) {
        angleRef.current = (angleRef.current + dt * 10.5) % 180;
      }

      const baseAngle = angleRef.current;
      const stepDeg = 180 / count;

      for (let i = 0; i < count; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const rawDeg = (i * stepDeg + baseAngle) % 180;
        const deg = rawDeg - 90;
        const rad = (deg * Math.PI) / 180;

        // Centered arc radius & offset so top and bottom edges of rotated cards NEVER clip
        const radius = 195;
        const x = Math.sin(rad) * radius;
        const y = -Math.cos(rad) * radius + 105;

        const norm = Math.min(1, Math.abs(deg) / 84);
        const smoothBell = Math.pow(Math.cos(norm * (Math.PI / 2)), 1.35);
        const scale = 0.78 + 0.22 * smoothBell;
        const opacity = Math.abs(deg) >= 84 ? 0 : smoothBell;
        const zIdx = Math.round(100 - Math.abs(deg));

        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
          2
        )}px, 0) rotate(${(deg * 0.78).toFixed(2)}deg) scale(${scale.toFixed(
          3
        )})`;
        el.style.opacity = `${opacity.toFixed(3)}`;
        el.style.pointerEvents = opacity > 0.35 ? "auto" : "none";
        el.style.zIndex = `${zIdx}`;
      }

      if (isInViewRef.current) {
        rafId = requestAnimationFrame(updateWheel);
      } else {
        rafId = 0;
      }
    };

    const el = stageRef.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          isInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !rafId) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(updateWheel);
          }
        },
        { rootMargin: "100px 0px" }
      );
      io.observe(el);
    } else {
      rafId = requestAnimationFrame(updateWheel);
    }

    return () => {
      if (io) io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [wheelCards]);

  return (
    <div
      ref={stageRef}
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
      style={{ height: "450px", overflow: "visible" }}
      className="relative w-full bg-transparent flex items-center justify-center select-none"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {wheelCards.map((item, idx) => (
          <div
            key={`${item._id || item.id || idx}-slot-${item._wheelSlot}`}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            onClick={() => onSelectCard(item._origIdx)}
            style={{
              width: "172px",
              height: "230px",
              padding: "6px",
              willChange: "transform, opacity",
            }}
            className="absolute bg-white rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.16)] border border-black/10 cursor-pointer hover:border-[#D4A843] transition-colors group"
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#111111]">
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover saturate-[1.16] transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <span className="block font-mono text-[7px] tracking-[0.16em] uppercase text-[#FFE066] font-bold truncate">
                  {item.category}
                </span>
                <span className="block font-serif text-xs text-white leading-tight truncate">
                  {item.title}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function DesktopOilstainExperience() {
  const [gallery, setGallery] = useState<any[]>(FALLBACK_GALLERY);
  const [activities, setActivities] = useState<any[]>(FALLBACK_ACTIVITIES);
  const [committee, setCommittee] = useState<any[]>(FALLBACK_COMMITTEE);
  const [reels, setReels] = useState<any[]>(FALLBACK_REELS);
  const [activeReelIdx, setActiveReelIdx] = useState<number>(0);
  const [activeAudioReelIdx, setActiveAudioReelIdx] = useState<number | null>(
    null
  );
  const progressBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reelTouchStartXRef = useRef<number>(0);
  const isAdvancingReelRef = useRef<boolean>(false);

  // Interactive UI States
  const [activeNavTab, setActiveNavTab] = useState<NavTabId>("home");
  const [isScrolledTop, setIsScrolledTop] = useState(false);

  // Full-Screen Dedicated Pages
  const [isGalleryPageOpen, setIsGalleryPageOpen] = useState(false);
  const [galleryFilterCat, setGalleryFilterCat] = useState<string>("ALL");
  const [expandedGalleryId, setExpandedGalleryId] = useState<string | null>(
    null
  );

  // Gallery Photo Love / Like Counter States
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [heartBurstId, setHeartBurstId] = useState<string | null>(null);

  const [isActivitiesPageOpen, setIsActivitiesPageOpen] = useState(false);
  const [activityFilterCat, setActivityFilterCat] = useState<string>("ALL");
  const [activeActivitySlideIdx, setActiveActivitySlideIdx] = useState(0);

  // Section 3: Spotlight State ("UPCOMING" vs "LIVE" + Timer)
  const [spotlightTab, setSpotlightTab] = useState<"UPCOMING" | "LIVE">(
    "UPCOMING"
  );
  const [spotlightData, setSpotlightData] = useState<{
    upcoming: any;
    live: any;
  }>(FALLBACK_SPOTLIGHT);
  const [countdown, setCountdown] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  }>({ days: "14", hours: "06", minutes: "45", seconds: "00" });

  // Section 4 Creative Genre Spotlight State (Replaces old 35mm Loupe / Emulsion / Optics Rig!)
  const [archiveSpotlightIdx, setArchiveSpotlightIdx] = useState<number>(0);

  // Section 5 6-Chapter About & Member Bio Modal
  const [activeAboutTab, setActiveAboutTab] =
    useState<AboutTabKey>("ORIGINS");
  const [selectedMemberModal, setSelectedMemberModal] = useState<{
    person: any;
    bgColor: string;
  } | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerEventName, setRegisterEventName] = useState<string>("");
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [heroAnimKey, setHeroAnimKey] = useState(0);
  const [isHeroAnimReady, setIsHeroAnimReady] = useState(false);
  const [isHeroMuted, setIsHeroMuted] = useState(true);

  const heroSectionRef = useRef<HTMLElement>(null);
  const archiveSectionRef = useRef<HTMLElement>(null);
  const ribbonDropWrapRef = useRef<HTMLDivElement>(null);
  const lowerContentRiseRef = useRef<HTMLDivElement>(null);
  const activitiesPeekScrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Refs for Sleek 460px Desktop Floating Notch Navbar (padding = 25px left/right -> 410px inner / 5 cols = 82px per col -> centers at 66 + idx * 82)
  const clipPathElementRef = useRef<SVGPathElement>(null);
  const borderPathElementRef = useRef<SVGPathElement>(null);
  const activeBubbleRef = useRef<HTMLDivElement>(null);
  const currentNotchXRef = useRef<number>(66);
  const targetNotchXRef = useRef<number>(66);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const programmaticScrollTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Refs for the 3D Concave Cylindrical Curved Auto-Ribbon
  const curvedCardOuterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const curvedSliceRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const curvedSliceInnerRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const isRibbonPausedRef = useRef<boolean>(false);
  const isRibbonInViewRef = useRef<boolean>(true);
  const isNotchAnimatingRef = useRef<boolean>(false);
  const playheadRef = useRef<number>(0);

  // Cached Section Offsets
  const sectionOffsetsRef = useRef<{
    vh: number;
    archiveTop: number;
    activityTop: number;
    galleryTop: number;
    aboutTop: number;
    momentsTop: number;
  }>({
    vh: 800,
    archiveTop: 800,
    activityTop: 1800,
    galleryTop: 2600,
    aboutTop: 3400,
    momentsTop: 4200,
  });

  // Load persisted gallery likes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shutterscape_gallery_likes_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setLikedMap(parsed);
        }
      }
    } catch {}
  }, []);

  const handleToggleLike = useCallback(
    (cardKey: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setLikedMap((prev) => {
        const nextLiked = !prev[cardKey];
        const updated = { ...prev, [cardKey]: nextLiked };
        try {
          localStorage.setItem(
            "shutterscape_gallery_likes_v1",
            JSON.stringify(updated)
          );
        } catch {}
        if (nextLiked) {
          setHeartBurstId(cardKey);
          setTimeout(() => {
            setHeartBurstId((curr) => (curr === cardKey ? null : curr));
          }, 650);
        }
        return updated;
      });
    },
    []
  );

  const toggleHeroAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = heroVideoRef.current;
    if (!vid) return;
    if (isHeroMuted) {
      vid.muted = false;
      setIsHeroMuted(false);
      vid.play().catch(() => {});
    } else {
      vid.muted = true;
      setIsHeroMuted(true);
    }
  };

  const lockProgrammaticScroll = (durationMs = 900) => {
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, durationMs);
  };

  const handleEnterArchiveTransition = () => {
    lockProgrammaticScroll(950);
    setActiveNavTab("gallery");
    archiveSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFloatingNavClick = (
    item: (typeof FLOATING_NAV_ITEMS)[number]
  ) => {
    lockProgrammaticScroll(950);
    setActiveNavTab(item.id);
    if (item.id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = document.getElementById(item.sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const startNotchAnimation = useCallback(() => {
    if (isNotchAnimatingRef.current) return;
    isNotchAnimatingRef.current = true;

    const animateNotch = () => {
      const diff = targetNotchXRef.current - currentNotchXRef.current;
      if (Math.abs(diff) > 0.15) {
        currentNotchXRef.current += diff * 0.26;
        const cx = currentNotchXRef.current;
        const dStr = buildCompactNotchPath(cx);

        if (clipPathElementRef.current) {
          clipPathElementRef.current.setAttribute("d", dStr);
        }
        if (borderPathElementRef.current) {
          borderPathElementRef.current.setAttribute("d", dStr);
        }
        if (activeBubbleRef.current) {
          activeBubbleRef.current.style.left = `${((cx / 460) * 100).toFixed(
            2
          )}%`;
        }

        requestAnimationFrame(animateNotch);
      } else {
        currentNotchXRef.current = targetNotchXRef.current;
        const cx = currentNotchXRef.current;
        const dStr = buildCompactNotchPath(cx);

        if (clipPathElementRef.current) {
          clipPathElementRef.current.setAttribute("d", dStr);
        }
        if (borderPathElementRef.current) {
          borderPathElementRef.current.setAttribute("d", dStr);
        }
        if (activeBubbleRef.current) {
          activeBubbleRef.current.style.left = `${((cx / 460) * 100).toFixed(
            2
          )}%`;
        }

        isNotchAnimatingRef.current = false;
      }
    };

    requestAnimationFrame(animateNotch);
  }, []);

  useEffect(() => {
    const idx = Math.max(
      0,
      FLOATING_NAV_ITEMS.findIndex((it) => it.id === activeNavTab)
    );
    // For 460px width with 25px left/right padding: 410px inner width / 5 cols = 82px per col -> centers at 66 + idx * 82
    targetNotchXRef.current = 66 + idx * 82;
    startNotchAnimation();
  }, [activeNavTab, startNotchAnimation]);

  // Zero-Reflow Scroll Engine
  useEffect(() => {
    let scrollRafId = 0;
    let isHeroCurrentlyHidden = false;
    let lastDropP = -1;

    const measureSectionOffsets = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const getTop = (id: string, fallback: number) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + scrollY : fallback;
      };

      sectionOffsetsRef.current = {
        vh,
        archiveTop: getTop("desktop-light-spec-section", vh),
        activityTop: getTop("desktop-dark-showcase", vh * 2),
        galleryTop: getTop("desktop-light-bento-section", vh * 2.8),
        aboutTop: getTop("desktop-light-about-section", vh * 3.5),
        momentsTop: getTop("desktop-chronology-matrix", vh * 4.5),
      };
    };

    const onScroll = () => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) return;
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const {
          vh,
          archiveTop,
          galleryTop,
          activityTop,
          aboutTop,
          momentsTop,
        } = sectionOffsetsRef.current;

        const shouldBeScrolled = scrollY > 24;
        setIsScrolledTop((prev) =>
          prev !== shouldBeScrolled ? shouldBeScrolled : prev
        );

        const heroCovered = scrollY >= archiveTop + 16;
        if (heroCovered !== isHeroCurrentlyHidden) {
          isHeroCurrentlyHidden = heroCovered;
          if (heroSectionRef.current) {
            heroSectionRef.current.style.visibility = heroCovered
              ? "hidden"
              : "visible";
          }
          if (heroVideoRef.current) {
            if (heroCovered) {
              heroVideoRef.current.pause();
            } else {
              heroVideoRef.current.play().catch(() => {});
            }
          }
        }

        const secTopInViewport = archiveTop - scrollY;
        const raw = (vh * 0.58 - secTopInViewport) / (vh * 0.58);
        const p = Math.max(0, Math.min(1, raw));

        if (Math.abs(p - lastDropP) > 0.002) {
          lastDropP = p;
          const ribbonWrap = ribbonDropWrapRef.current;
          const lowerWrap = lowerContentRiseRef.current;
          if (ribbonWrap && lowerWrap) {
            const ease = 1 - Math.pow(1 - p, 3);
            const dropY = (1 - ease) * -48;
            const scale = 0.9 + ease * 0.1;
            ribbonWrap.style.transform = `translate3d(0, ${dropY.toFixed(
              1
            )}px, 0) scale(${scale.toFixed(3)})`;

            const textP = Math.max(0, Math.min(1, (p - 0.15) / 0.85));
            const textY = (1 - textP) * 20;
            lowerWrap.style.transform = `translate3d(0, ${textY.toFixed(
              1
            )}px, 0)`;
            lowerWrap.style.opacity = `${(0.2 + textP * 0.8).toFixed(2)}`;
          }
        }

        if (!isProgrammaticScrollRef.current) {
          const triggerLine = scrollY + vh * 0.52;
          let nextTab: NavTabId = "home";
          if (scrollY < vh * 0.45) {
            nextTab = "home";
          } else if (triggerLine >= momentsTop) {
            nextTab = "moments";
          } else if (triggerLine >= aboutTop) {
            nextTab = "about";
          } else if (triggerLine >= galleryTop) {
            nextTab = "gallery";
          } else if (triggerLine >= activityTop) {
            nextTab = "activity";
          } else if (triggerLine >= archiveTop) {
            nextTab = "gallery";
          }
          setActiveNavTab((prev) => (prev !== nextTab ? nextTab : prev));
        }
      });
    };

    measureSectionOffsets();
    const remeasureTimer = setTimeout(measureSectionOffsets, 800);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureSectionOffsets, { passive: true });
    onScroll();

    return () => {
      clearTimeout(remeasureTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureSectionOffsets);
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
    };
  }, [
    gallery.length,
    activities.length,
    activeAboutTab,
    archiveSpotlightIdx,
    spotlightTab,
  ]);

  // Fetch Live Club Data from ShutterScape APIs (Including `/api/spotlight`)
  useEffect(() => {
    // Safely hydrate from localStorage on the client without SSR mismatch
    try {
      const cachedGallery = localStorage.getItem("ss_cache_gallery");
      if (cachedGallery) {
        const parsed = JSON.parse(cachedGallery);
        if (Array.isArray(parsed) && parsed.length > 0) setGallery(parsed);
      }
      const cachedActivities = localStorage.getItem("ss_cache_activities");
      if (cachedActivities) {
        const parsed = JSON.parse(cachedActivities);
        if (Array.isArray(parsed) && parsed.length > 0) setActivities(parsed);
      }
      const cachedCommittee = localStorage.getItem("ss_cache_committee");
      if (cachedCommittee) {
        const parsed = JSON.parse(cachedCommittee);
        if (Array.isArray(parsed) && parsed.length > 0) setCommittee(parsed);
      }
      const cachedReels = localStorage.getItem("ss_cache_reels");
      if (cachedReels) {
        const parsed = JSON.parse(cachedReels);
        if (Array.isArray(parsed) && parsed.length > 0) setReels(parsed);
      }
    } catch (e) {}

    Promise.allSettled([
      fetch("/api/gallery").then((r) => r.json()),
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/committee").then((r) => r.json()),
      fetch("/api/moments-reels").then((r) => r.json()),
      fetch("/api/spotlight").then((r) => r.json()),
    ]).then(([galRes, actRes, comRes, reelRes, spotRes]) => {
      if (galRes.status === "fulfilled" && galRes.value?.data?.length > 0) {
        setGallery(galRes.value.data);
        try { localStorage.setItem("ss_cache_gallery", JSON.stringify(galRes.value.data)); } catch (e) {}
      }
      if (actRes.status === "fulfilled" && actRes.value?.data?.length > 0) {
        const actList = actRes.value.data;
        setActivities(actList);
        try { localStorage.setItem("ss_cache_activities", JSON.stringify(actList)); } catch (e) {}

        const foundUpcoming = actList.find(
          (a: any) => a.spotlightType === "upcoming" || a.isUpcoming
        );
        const foundLive = actList.find(
          (a: any) => a.spotlightType === "live" || a.isLive
        );
        setSpotlightData((prev) => ({
          upcoming: foundUpcoming
            ? {
                ...prev.upcoming,
                ...foundUpcoming,
                targetDate:
                  foundUpcoming.targetDate || prev.upcoming.targetDate,
              }
            : prev.upcoming,
          live: foundLive
            ? {
                ...prev.live,
                ...foundLive,
                targetDate: foundLive.targetDate || prev.live.targetDate,
              }
            : prev.live,
        }));
      }
      if (comRes.status === "fulfilled" && comRes.value?.data?.length > 0) {
        setCommittee(comRes.value.data);
        try { localStorage.setItem("ss_cache_committee", JSON.stringify(comRes.value.data)); } catch (e) {}
      }
      if (reelRes.status === "fulfilled" && reelRes.value?.data?.length > 0) {
        const mappedReels = reelRes.value.data.map((d: any, idx: number) => {
          const def = FALLBACK_REELS[idx % FALLBACK_REELS.length];
          const validSrc =
            d.videoSrc && !d.videoSrc.startsWith("blob:")
              ? d.videoSrc
              : def.videoSrc;
          return {
            id: d._id || String(idx + 1).padStart(2, "0"),
            photographer: d.photographer || def.photographer,
            videoSrc: validSrc,
          };
        });
        setReels(mappedReels);
        try { localStorage.setItem("ss_cache_reels", JSON.stringify(mappedReels)); } catch (e) {}
      }
      if (spotRes.status === "fulfilled" && spotRes.value?.data) {
        const sData = spotRes.value.data;
        setSpotlightData((prev) => ({
          upcoming: sData.upcoming
            ? { ...prev.upcoming, ...sData.upcoming }
            : prev.upcoming,
          live: sData.live ? { ...prev.live, ...sData.live } : prev.live,
        }));
      }
    });
  }, []);

  // Active Spotlight Event (Based on 2-Part Toggle: "UPCOMING" vs "LIVE")
  const activeSpotlightEvent =
    spotlightTab === "UPCOMING" ? spotlightData.upcoming : spotlightData.live;

  // Live 1-Second Ticking Countdown Engine for Both UPCOMING & LIVE GOING
  useEffect(() => {
    const updateTimer = () => {
      const fallbackHrs = spotlightTab === "UPCOMING" ? 336 : 5;
      setCountdown(
        computeCountdownParts(activeSpotlightEvent?.targetDate, fallbackHrs)
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSpotlightEvent?.targetDate, spotlightTab]);

  // Synchronize Hero Letter-by-Letter Animation with Camera Shutter Preloader
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { __shutterLoaderDismissed?: boolean })
        .__shutterLoaderDismissed
    ) {
      setIsHeroAnimReady(true);
      return;
    }

    let triggered = false;
    const triggerAnim = () => {
      if (!triggered) {
        triggered = true;
        setIsHeroAnimReady(true);
      }
    };

    window.addEventListener("shutterscape:loader-complete", triggerAnim);
    const timer = setTimeout(triggerAnim, 2850);

    return () => {
      window.removeEventListener("shutterscape:loader-complete", triggerAnim);
      clearTimeout(timer);
    };
  }, []);

  // Widescreen 3D Concave Cylindrical Curved Ribbon Engine (Section 2)
  useEffect(() => {
    const total = gallery.length;
    if (total === 0) return;

    let cardW = 380;
    let cardH = 238;
    let gap = 22;
    let stride = cardW + gap;
    let sliceW = cardW / SLICES_PER_CARD;
    let cylRadius = 860;

    const renderCylindricalSlices = (currentFloatIdx: number) => {
      for (let i = 0; i < total; i++) {
        const cardEl = curvedCardOuterRefs.current[i];
        if (!cardEl) continue;

        let deltaCards = i - currentFloatIdx;
        if (deltaCards > total / 2) deltaCards -= total;
        if (deltaCards < -total / 2) deltaCards += total;

        if (Math.abs(deltaCards) > 2.35) {
          if (cardEl.style.display !== "none") {
            cardEl.style.display = "none";
          }
          continue;
        }

        if (cardEl.style.display !== "block") {
          cardEl.style.display = "block";
        }
        cardEl.style.zIndex = `${Math.round(100 - Math.abs(deltaCards) * 20)}`;

        const cardCenterX = deltaCards * stride;
        const cardSlices = curvedSliceRefs.current[i] || [];

        for (let s = 0; s < SLICES_PER_CARD; s++) {
          const sliceEl = cardSlices[s];
          if (!sliceEl) continue;

          const localX = (s + 0.5) * sliceW - cardW / 2;
          const u = cardCenterX + localX;

          const rawPhi = u / cylRadius;
          const phi = Math.max(-1.32, Math.min(1.32, rawPhi));

          const cylX = cylRadius * Math.sin(phi);
          const cylZ = cylRadius * (1 - Math.cos(phi));
          const rotYDeg = -((phi * 180) / Math.PI);

          sliceEl.style.transform = `translate3d(${cylX.toFixed(
            1
          )}px, 0px, ${cylZ.toFixed(1)}px) rotateY(${rotYDeg.toFixed(1)}deg)`;
        }
      }
    };

    const setupStaticCardMetrics = () => {
      cardW = 380;
      cardH = 238;
      gap = 22;
      stride = cardW + gap;
      sliceW = cardW / SLICES_PER_CARD;
      cylRadius = Math.max(800, window.innerWidth * 0.56);

      for (let i = 0; i < total; i++) {
        const cardEl = curvedCardOuterRefs.current[i];
        if (!cardEl) continue;

        cardEl.style.width = `${cardW}px`;
        cardEl.style.height = `${cardH}px`;
        cardEl.style.marginLeft = `${-cardW / 2}px`;
        cardEl.style.marginTop = `${-cardH / 2}px`;

        const cardSlices = curvedSliceRefs.current[i] || [];
        const cardInners = curvedSliceInnerRefs.current[i] || [];

        for (let s = 0; s < SLICES_PER_CARD; s++) {
          const sliceEl = cardSlices[s];
          const innerEl = cardInners[s];
          if (!sliceEl || !innerEl) continue;

          sliceEl.style.width = `${sliceW + 1.4}px`;
          sliceEl.style.height = `${cardH}px`;
          sliceEl.style.left = `${cardW / 2 - sliceW / 2}px`;

          innerEl.style.width = `${cardW}px`;
          innerEl.style.height = `${cardH}px`;
          innerEl.style.transform = `translate3d(${(-s * sliceW).toFixed(
            2
          )}px, 0, 0)`;
        }
      }

      renderCylindricalSlices(playheadRef.current);
    };

    setupStaticCardMetrics();

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (isRibbonInViewRef.current && !isRibbonPausedRef.current) {
        playheadRef.current = (playheadRef.current + dt * 0.16) % total;
        renderCylindricalSlices(playheadRef.current);
      }

      if (isRibbonInViewRef.current) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const secEl = archiveSectionRef.current;
    let io: IntersectionObserver | null = null;
    if (secEl && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          isRibbonInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !rafId) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
          }
        },
        { rootMargin: "120px 0px" }
      );
      io.observe(secEl);
    } else {
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", setupStaticCardMetrics, {
      passive: true,
    });

    return () => {
      if (io) io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setupStaticCardMetrics);
    };
  }, [gallery]);

  const matrixStack = useMemo(() => {
    const combined = [
      ...gallery.slice(0, 6).map((g, i) => ({
        src: g.src,
        title: g.title,
        orientation: i % 2 === 0 ? "portrait" : "landscape",
      })),
      ...activities.slice(0, 2).map((a) => ({
        src: a.img,
        title: a.title,
        orientation: "portrait",
      })),
    ];
    return combined.length > 0
      ? combined
      : FALLBACK_GALLERY.map((g, i) => ({
          src: g.src,
          title: g.title,
          orientation: i % 2 === 0 ? "portrait" : "landscape",
        }));
  }, [gallery, activities]);

  const filteredGalleryItems = useMemo(() => {
    if (galleryFilterCat === "ALL") return gallery;
    return gallery.filter(
      (g) => (g.category || "").toUpperCase() === galleryFilterCat
    );
  }, [gallery, galleryFilterCat]);

  const filteredActivityItems = useMemo(() => {
    if (activityFilterCat === "ALL") return activities;
    return activities.filter(
      (a) =>
        (a.category || "").toUpperCase() === activityFilterCat ||
        String(a.year) === activityFilterCat
    );
  }, [activities, activityFilterCat]);

  const scrollActivitiesPeekTo = (idx: number) => {
    const total = filteredActivityItems.length;
    if (total === 0) return;
    const clamped = (idx + total) % total;
    setActiveActivitySlideIdx(clamped);
    if (activitiesPeekScrollRef.current) {
      const container = activitiesPeekScrollRef.current;
      const cardEl = container.children[clamped] as HTMLElement | undefined;
      if (cardEl) {
        container.scrollTo({
          left: cardEl.offsetLeft - 24,
          behavior: "smooth",
        });
      }
    }
  };

  // Committee Member Buckets
  const mentorsList = useMemo(() => {
    const m = committee.filter((c) => c.tier === "MENTOR");
    return m.length > 0
      ? m
      : FALLBACK_COMMITTEE.filter((c) => c.tier === "MENTOR");
  }, [committee]);

  const leadsList = useMemo(() => {
    const l = committee.filter((c) => c.tier === "LEAD");
    return l.length > 0
      ? l
      : FALLBACK_COMMITTEE.filter((c) => c.tier === "LEAD");
  }, [committee]);

  const coreList = useMemo(() => {
    const c = committee.filter((m) => m.tier === "CORE");
    return c.length > 0
      ? c
      : FALLBACK_COMMITTEE.filter((m) => m.tier === "CORE");
  }, [committee]);

  const foundersList = useMemo(() => {
    const f = committee.filter((m) => m.tier === "FOUNDER");
    return f.length > 0
      ? f
      : FALLBACK_COMMITTEE.filter((m) => m.tier === "FOUNDER");
  }, [committee]);

  const legacyList = useMemo(() => {
    const leg = committee.filter((m) => m.tier === "LEGACY");
    return leg.length > 0
      ? leg
      : FALLBACK_COMMITTEE.filter(
          (m) => m.tier === "LEGACY" || m.tier === "FOUNDER"
        );
  }, [committee]);

  // ALL VISIBLE REEL VIDEOS PLAY SIMULTANEOUSLY WHEN SECTION IS IN VIEW
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const total = reels.length;
          videoRefs.current.forEach((vid, idx) => {
            if (!vid) return;
            let relIdx = idx - activeReelIdx;
            if (relIdx > total / 2) relIdx -= total;
            if (relIdx < -total / 2) relIdx += total;
            const isVisibleCard = Math.abs(relIdx) <= 2;

            if (entry.isIntersecting && isVisibleCard) {
              vid.muted = activeAudioReelIdx !== idx;
              const p = vid.play();
              if (p !== undefined) {
                p.catch(() => {
                  vid.muted = true;
                  vid.play().catch(() => {});
                });
              }
            } else {
              vid.pause();
            }
          });
        });
      },
      { threshold: 0.15 }
    );

    const sectionEl = document.getElementById("desktop-chronology-matrix");
    if (sectionEl) {
      observer.observe(sectionEl);
    }

    return () => observer.disconnect();
  }, [activeReelIdx, activeAudioReelIdx, reels.length]);

  // Play all 5 visible carousel videos simultaneously (center + 4 flanking background videos!)
  useEffect(() => {
    // Reset non-active progress bars via direct DOM
    progressBarRefs.current.forEach((bar, idx) => {
      if (bar && idx !== activeReelIdx) {
        bar.style.width = "0%";
      }
    });

    const total = reels.length;
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      let relIdx = idx - activeReelIdx;
      if (relIdx > total / 2) relIdx -= total;
      if (relIdx < -total / 2) relIdx += total;
      const isVisibleCard = Math.abs(relIdx) <= 2;

      if (isVisibleCard) {
        vid.muted = activeAudioReelIdx !== idx;
        const p = vid.play();
        if (p !== undefined) {
          p.catch(() => {
            vid.muted = true;
            vid.play().catch(() => {});
          });
        }
      } else {
        vid.pause();
      }
    });
  }, [activeReelIdx, activeAudioReelIdx, reels.length]);

  // Desktop 5-Card Widescreen 3D Reel Carousel Math
  const getReelCardStyle = (index: number) => {
    const total = reels.length;
    let relativeIndex = index - activeReelIdx;

    if (relativeIndex > total / 2) relativeIndex -= total;
    if (relativeIndex < -total / 2) relativeIndex += total;

    let translateX = 0;
    let scale = 1;
    let zIndex = 40;
    let opacity = 1;
    let rotateY = 0;
    let filter = "none";

    if (relativeIndex === 0) {
      translateX = 0;
      scale = 1;
      zIndex = 50;
      opacity = 1;
      rotateY = 0;
      filter = "none";
    } else if (relativeIndex === 1) {
      translateX = 210;
      scale = 0.88;
      zIndex = 35;
      opacity = 0.88;
      rotateY = -8;
      filter = "brightness(0.82)";
    } else if (relativeIndex === -1) {
      translateX = -210;
      scale = 0.88;
      zIndex = 35;
      opacity = 0.88;
      rotateY = 8;
      filter = "brightness(0.82)";
    } else if (relativeIndex === 2) {
      translateX = 390;
      scale = 0.76;
      zIndex = 20;
      opacity = 0.58;
      rotateY = -14;
      filter = "brightness(0.65)";
    } else if (relativeIndex === -2) {
      translateX = -390;
      scale = 0.76;
      zIndex = 20;
      opacity = 0.58;
      rotateY = 14;
      filter = "brightness(0.65)";
    } else {
      translateX = 0;
      scale = 0.6;
      zIndex = 10;
      opacity = 0;
      rotateY = 0;
      filter = "none";
    }

    return {
      transform: `translate3d(calc(-50% + ${translateX}px), -50%, 0) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      opacity,
      filter,
      transition: "all 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  };

  const handleReelTouchStart = (e: React.TouchEvent) => {
    reelTouchStartXRef.current = e.touches[0].clientX;
  };

  const handleReelTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - reelTouchStartXRef.current;
    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        setActiveReelIdx((prev) => (prev + 1) % reels.length);
      } else {
        setActiveReelIdx((prev) => (prev - 1 + reels.length) % reels.length);
      }
    }
  };

  const handleReelCardClick = (index: number) => {
    if (index !== activeReelIdx) {
      setActiveReelIdx(index);
      const targetVid = videoRefs.current[index];
      if (targetVid) {
        targetVid.muted = activeAudioReelIdx !== index;
        targetVid.play().catch(() => {});
      }
    } else {
      setActiveAudioReelIdx((prev) => (prev === index ? null : index));
    }
  };

  const handleReelVideoEnded = (index: number) => {
    if (index !== activeReelIdx || isAdvancingReelRef.current) return;
    isAdvancingReelRef.current = true;
    setActiveReelIdx((prev) => (prev + 1) % reels.length);
    setActiveAudioReelIdx((prev) =>
      prev !== null ? (prev + 1) % reels.length : null
    );
    setTimeout(() => {
      isAdvancingReelRef.current = false;
    }, 700);
  };

  // Standard, Crisp Studio Member Card (235px Standard Width — Centered!)
  const renderStudioMemberCard = (person: any, idx: number) => {
    const bgColor = MEMBER_CARD_BACKDROPS[idx % MEMBER_CARD_BACKDROPS.length];

    return (
      <div
        key={`${person.name}-${idx}`}
        onClick={() => setSelectedMemberModal({ person, bgColor })}
        style={{
          width: "235px",
          padding: "11px",
        }}
        className="group bg-white rounded-2xl border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[4px_4px_0px_#111111] transition-all duration-300 flex flex-col justify-between cursor-pointer shrink-0"
      >
        <div>
          <div
            style={{
              backgroundColor: bgColor,
              clipPath:
                "polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px))",
            }}
            className="relative w-full aspect-[4/4.3] rounded-xl overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.45) 0%, transparent 70%)",
              }}
            />

            <img
              src={person.img}
              alt={person.name}
              className="w-full h-full object-cover object-top saturate-[1.08] contrast-[1.03] group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div style={{ padding: "10px 4px 2px" }}>
            <div className="flex items-center justify-between gap-1.5">
              <span
                style={{ backgroundColor: bgColor, padding: "2px 7px" }}
                className="rounded font-mono text-[7.5px] font-bold uppercase tracking-[0.12em] text-[#111111] truncate"
              >
                {person.role}
              </span>
              <span className="font-mono text-[7.5px] text-black/40 uppercase shrink-0">
                GCU &apos;26
              </span>
            </div>

            <h4
              style={{ marginTop: "8px" }}
              className="font-heading font-bold text-[14.5px] text-[#111111] tracking-tight leading-snug truncate"
            >
              {person.name}
            </h4>
            {person.dept && (
              <p
                style={{ marginTop: "2px" }}
                className="font-sans text-[10.5px] font-medium text-[#D92B2B] line-clamp-1"
              >
                {person.dept}
              </p>
            )}
          </div>
        </div>

        <div
          style={{ paddingTop: "8px", marginTop: "8px" }}
          className="border-t border-black/8 flex items-center justify-between"
        >
          <span className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-black/45">
            VIEW BIO
          </span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/[0.04] group-hover:bg-[#111111] text-[#111111] group-hover:text-white text-xs transition-colors">
            →
          </span>
        </div>
      </div>
    );
  };

  const featuredArchiveItem =
    gallery[archiveSpotlightIdx % Math.max(1, gallery.length)] ||
    FALLBACK_GALLERY[0];

  return (
    <div
      id="shutterscape-desktop-oilstain"
      className="w-full min-h-screen bg-[#ECEBE6] text-[#111111] font-sans select-none overflow-x-clip"
    >
      {/* Scoped Stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        header[aria-label="Global Viewfinder Navigation"],
        #shutterscape-universal-footer {
          display: none !important;
        }

        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Nothing+You+Could+Do&family=Reenie+Beanie&display=swap');

        #shutterscape-desktop-oilstain .font-script {
          font-family: 'Dancing Script', cursive !important;
        }

        #shutterscape-desktop-oilstain .sound-wave {
          display: flex;
          align-items: center;
          gap: 2.5px;
          height: 12px;
        }
        #shutterscape-desktop-oilstain .sound-wave span {
          display: block;
          width: 2px;
          background: #EF4444;
          border-radius: 2px;
          animation: wave 1s ease-in-out infinite;
        }
        #shutterscape-desktop-oilstain .sound-wave span:nth-child(1) { animation-delay: 0.1s; height: 40%; }
        #shutterscape-desktop-oilstain .sound-wave span:nth-child(2) { animation-delay: 0.25s; height: 100%; }
        #shutterscape-desktop-oilstain .sound-wave span:nth-child(3) { animation-delay: 0.4s; height: 60%; }
        @keyframes wave { 50% { height: 20%; } }

        @keyframes oslHeartBurst {
          0% { transform: scale(0.3); opacity: 0; }
          35% { transform: scale(1.25); opacity: 1; }
          70% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        #shutterscape-desktop-oilstain .osl-heart-burst {
          animation: oslHeartBurst 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        #shutterscape-desktop-oilstain {
          background-color: #ECEBE6;
          color: #111111;
          -webkit-overflow-scrolling: touch;
        }
        #shutterscape-desktop-oilstain .osl-top-capsule {
          padding: 7px 22px !important;
        }
        #shutterscape-desktop-oilstain .osl-pad-sm { padding: 12px 24px !important; }
        #shutterscape-desktop-oilstain .osl-pad-md { padding: 20px 24px !important; }
        #shutterscape-desktop-oilstain .osl-pad-lg { padding: 36px 28px !important; }
        #shutterscape-desktop-oilstain .osl-btn-pill { padding: 7px 14px !important; }
        #shutterscape-desktop-oilstain .osl-bar-btn {
          padding: 15px 24px !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-family: var(--font-space-mono), monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        #shutterscape-desktop-oilstain .osl-chapter-pill {
          padding: 15px 24px !important;
          font-family: var(--font-space-mono), monospace;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          white-space: nowrap;
          border-right: 1px solid rgba(17, 17, 17, 0.12);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        #shutterscape-desktop-oilstain .osl-input-line {
          width: 100%;
          padding: 13px 0 !important;
          border: none;
          border-bottom: 1px solid rgba(17, 17, 17, 0.25);
          background: transparent;
          font-family: var(--font-space-mono), monospace;
          font-size: 11.5px;
          letter-spacing: 0.12em;
          color: #111111;
          outline: none;
        }
        #shutterscape-desktop-oilstain .osl-input-line:focus {
          border-bottom-color: #D92B2B;
        }
        #shutterscape-desktop-oilstain .osl-input-line::placeholder {
          color: rgba(17, 17, 17, 0.55);
          text-transform: uppercase;
        }
        #shutterscape-desktop-oilstain .handmade-fountain-pen {
          font-family: 'Nothing You Could Do', cursive !important;
          font-weight: 400;
          color: #1D1C1A;
        }
        #shutterscape-desktop-oilstain .handmade-signature-pen {
          font-family: 'Reenie Beanie', cursive !important;
          font-weight: 400;
          color: #141311;
        }
        @keyframes oslLetterReveal {
          0% {
            opacity: 0;
            transform: translate3d(0, 32px, 0) scale(0.86);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        #shutterscape-desktop-oilstain .osl-letter-char {
          display: inline-block;
          opacity: 0;
          transform: translate3d(0, 32px, 0) scale(0.86);
          animation: oslLetterReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        @keyframes oslFadeDown {
          0% { opacity: 0; transform: translate3d(0, -10px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        #shutterscape-desktop-oilstain .osl-hero-badge {
          opacity: 0;
          animation: oslFadeDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards;
        }
        @keyframes oslRuleExpand {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        #shutterscape-desktop-oilstain .osl-hero-rule {
          transform: scaleX(0);
          animation: oslRuleExpand 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.02s forwards;
          transform-origin: center;
        }
        @keyframes oslSubtitleReveal {
          0% { opacity: 0; transform: translate3d(0, 12px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        #shutterscape-desktop-oilstain .osl-hero-subtitle {
          opacity: 0;
          animation: oslSubtitleReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 1.15s forwards;
        }
        @keyframes oslTaglineReveal {
          0% { opacity: 0; transform: translate3d(0, 14px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        #shutterscape-desktop-oilstain .osl-hero-tagline {
          opacity: 0;
          animation: oslTaglineReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.35s forwards;
        }
      `,
        }}
      />

      {/* ============================================================
          UP NAVBAR: SLEEK, PROPORTIONED DESKTOP GLASS CAPSULE (640px x 46px)
          ============================================================ */}
      <div
        style={{
          backgroundColor: isScrolledTop
            ? "rgba(12, 12, 16, 0.62)"
            : "rgba(12, 12, 16, 0.38)",
          backdropFilter: "blur(16px) saturate(150%)",
          WebkitBackdropFilter: "blur(16px) saturate(150%)",
          borderColor: isScrolledTop
            ? "rgba(255, 255, 255, 0.24)"
            : "rgba(255, 255, 255, 0.16)",
          transform: "translate3d(-50%, 0, 0)",
          width: "min(88vw, 640px)",
          height: "46px",
        }}
        className="osl-top-capsule fixed top-4 left-1/2 z-[9980] rounded-full border shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-all duration-300 flex items-center justify-between pointer-events-auto select-none"
      >
        <button
          type="button"
          onClick={() => {
            lockProgrammaticScroll(950);
            setActiveNavTab("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center cursor-pointer shrink-0 hover:opacity-85 transition-opacity"
        >
          <div
            style={{ width: "105px", height: "25px" }}
            className="relative shrink-0"
          >
            <Image
              src="/images/shutterscape-brand-white.png"
              alt="ShutterScape Logo"
              fill
              sizes="105px"
              priority
              unoptimized
              className="object-contain object-left"
            />
          </div>
        </button>

        <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.2em] uppercase text-white/75">
          <span className="h-3.5 w-[1px] bg-white/20 shrink-0" />
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse shadow-[0_0_8px_#EF4444]" />
            <span className="tracking-widest">LIVE REC</span>
          </div>
          <span className="text-white/35">//</span>
          <span className="text-[#FFE066] font-bold">35MM GCU ARCHIVE</span>
          <span className="h-3.5 w-[1px] bg-white/20 shrink-0" />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setRegisterEventName("");
              setRegisterSubmitted(false);
              setIsRegisterModalOpen(true);
            }}
            style={{ padding: "6px 15px" }}
            className="rounded-full bg-[#D4A843] hover:bg-[#FFE066] text-[#050505] font-mono text-[9px] font-bold tracking-[0.16em] uppercase cursor-pointer shrink-0 shadow-xs hover:scale-105 active:scale-95 transition-all"
          >
            JOIN &apos;26
          </button>

          <a
            href="https://gcu.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: "86px", height: "24px" }}
            className="relative opacity-95 hover:opacity-100 transition-opacity shrink-0 flex items-center"
            title="Girijananda Chowdhury University"
          >
            <img
              src="/images/gcu-logo-white-text.png"
              alt="GCU"
              className="w-full h-full object-contain object-center"
            />
          </a>
        </div>
      </div>

      {/* ============================================================
          DOWN NAVBAR: SLEEK, PROPORTIONED DESKTOP DOCK (460px x 52px)
          ============================================================ */}
      <nav
        aria-label="Desktop Floating Navigation"
        style={{
          width: "460px",
          height: "52px",
          transform: "translate3d(-50%, 0, 0)",
        }}
        className="fixed bottom-4 left-1/2 z-[9985] max-w-[90vw] select-none pointer-events-auto"
      >
        <svg
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="desktop-compact-glass-notch-clip">
              <path
                ref={clipPathElementRef}
                d={buildCompactNotchPath(66)}
              />
            </clipPath>
          </defs>
        </svg>

        <div
          style={{
            clipPath: "url(#desktop-compact-glass-notch-clip)",
            WebkitClipPath: "url(#desktop-compact-glass-notch-clip)",
            backgroundColor: "rgba(16, 16, 22, 0.56)",
            backdropFilter: "blur(16px) saturate(150%)",
            WebkitBackdropFilter: "blur(16px) saturate(150%)",
            transform: "translate3d(0, 0, 0)",
          }}
          className="absolute inset-0 w-full h-full shadow-[0_10px_28px_rgba(0,0,0,0.38)]"
        />

        <svg
          viewBox="0 0 460 52"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
          <path
            ref={borderPathElementRef}
            d={buildCompactNotchPath(66)}
            fill="rgba(255, 255, 255, 0.04)"
            stroke="rgba(255, 255, 255, 0.26)"
            strokeWidth="1.1"
          />
        </svg>

        <div
          ref={activeBubbleRef}
          style={{
            left: `${(66 / 460) * 100}%`,
            top: "-13px",
            width: "36px",
            height: "36px",
            backgroundColor: "rgba(22, 22, 30, 0.78)",
            backdropFilter: "blur(16px) saturate(150%)",
            WebkitBackdropFilter: "blur(16px) saturate(150%)",
            border: "1.2px solid rgba(255, 255, 255, 0.38)",
            transform: "translate3d(-50%, 0, 0)",
          }}
          className="absolute rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-none z-20"
        >
          {renderFloatingNavIcon(activeNavTab, true)}
        </div>

        <div
          style={{ paddingLeft: "25px", paddingRight: "25px" }}
          className="absolute inset-0 grid grid-cols-5 items-center z-10"
        >
          {FLOATING_NAV_ITEMS.map((item) => {
            const isActive = item.id === activeNavTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFloatingNavClick(item)}
                className="relative h-full w-full flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 outline-none group"
              >
                <span
                  style={{
                    transform: isActive
                      ? "translate3d(0, -10px, 0) scale(0.4)"
                      : "translate3d(0, -1px, 0) scale(1)",
                    opacity: isActive ? 0 : 0.85,
                    transition: "transform 0.24s ease, opacity 0.24s ease",
                  }}
                  className="flex items-center justify-center transition-transform group-hover:scale-110"
                >
                  {renderFloatingNavIcon(item.id, false)}
                </span>

                <span
                  style={{
                    marginTop: isActive ? "14px" : "3px",
                    transition: "margin-top 0.24s ease",
                  }}
                  className={`font-sans text-[10.5px] tracking-[0.02em] leading-none ${
                    isActive
                      ? "text-white font-bold"
                      : "text-white/75 font-medium group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============================================================
          1. OPENING SPLASH HERO
          ============================================================ */}
      <section
        id="desktop-hero-top"
        ref={heroSectionRef}
        className="sticky top-0 z-10 w-full h-[100svh] min-h-[680px] bg-[#070709] text-white flex flex-col justify-between overflow-hidden"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={MOBILE_HERO_MEDIA.posterSrc}
            alt="Girijananda Chowdhury University Campus"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.58] contrast-[1.08]"
          />

          <video
            ref={heroVideoRef}
            src={MOBILE_HERO_MEDIA.videoSrc}
            poster={MOBILE_HERO_MEDIA.posterSrc}
            autoPlay
            loop
            muted={isHeroMuted}
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.58] contrast-[1.08]"
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,5,7,0.75) 0%, rgba(5,5,7,0.35) 45%, rgba(5,5,7,0.92) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full pt-16 pointer-events-none" />

        <div
          key={heroAnimKey}
          onClick={() => setHeroAnimKey((prev) => prev + 1)}
          title="Tap to replay intro sequence"
          style={{ margin: "auto" }}
          className="relative z-10 px-6 py-8 flex flex-col items-center text-center w-full max-w-4xl cursor-pointer select-none"
        >
          <div className="flex items-center justify-center gap-3 mb-4 w-full">
            <span
              className={`w-6 h-[1px] bg-[#D4A843] shrink-0 ${
                isHeroAnimReady ? "osl-hero-rule" : "opacity-0"
              }`}
            />
            <span
              className={`font-mono text-[10.5px] tracking-[0.26em] uppercase text-[#D4A843] font-bold ${
                isHeroAnimReady ? "osl-hero-badge" : "opacity-0"
              }`}
            >
              EST. 2023 · MORE THAN JUST A CAMERA CLUB
            </span>
            <span
              className={`w-6 h-[1px] bg-[#D4A843] shrink-0 ${
                isHeroAnimReady ? "osl-hero-rule" : "opacity-0"
              }`}
            />
          </div>

          <h1 className="font-serif text-[clamp(3.2rem,6.8vw,5.8rem)] leading-[0.92] tracking-[0.05em] uppercase text-white font-normal w-full text-center">
            {"SHUTTERSCAPE".split("").map((char, i) => (
              <span
                key={i}
                className={
                  isHeroAnimReady ? "osl-letter-char" : "opacity-0 inline-block"
                }
                style={
                  isHeroAnimReady
                    ? {
                        animationDelay: `${0.16 + i * 0.075}s`,
                      }
                    : { opacity: 0 }
                }
              >
                {char}
              </span>
            ))}
          </h1>

          <p
            style={{ marginTop: "14px" }}
            className={`font-mono text-xs tracking-[0.34em] uppercase text-white/90 font-semibold ${
              isHeroAnimReady ? "osl-hero-subtitle" : "opacity-0"
            }`}
          >
            GCU PHOTOGRAPHY CLUB
          </p>

          <p
            style={{ marginTop: "12px" }}
            className={`font-serif italic text-lg text-white/75 max-w-md ${
              isHeroAnimReady ? "osl-hero-tagline" : "opacity-0"
            }`}
          >
            &ldquo;Observe, capture, and tell stories through light.&rdquo;
          </p>
        </div>

        <div className="relative z-10 w-full flex flex-col bg-black/65">
          <div className="osl-pad-sm flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleHeroAudio}
                style={{ padding: "5px 12px" }}
                className="rounded-full border border-[#D4A843]/60 bg-[#161513] text-[#D4A843] font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-[#D4A843] hover:text-black transition-colors"
              >
                <span>{isHeroMuted ? "🔇 SOUND OFF" : "🔊 SOUND ON"}</span>
              </button>
              <span>f/1.4 · 1/1000s · ISO 400</span>
            </div>
            <span>GCU · ASSAM</span>
          </div>

          <div className="relative w-full">
            <button
              type="button"
              onClick={handleEnterArchiveTransition}
              style={{ padding: "14px 32px" }}
              className="w-full flex items-center justify-between bg-[#D4A843] hover:bg-[#E5B955] text-[#050505] font-mono text-[11px] font-bold tracking-[0.2em] uppercase cursor-pointer transition-colors"
            >
              <span>ENTER THE DARKROOM ARCHIVE</span>
              <span className="text-sm leading-none">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. PAGE 2: WIDESCREEN ARCHIVE STAGE + COHESIVE POLAROID &
             MATTED EXHIBITION PRINT DESK (Fixes Screenshot 1!)
          ============================================================ */}
      <section
        id="desktop-light-spec-section"
        ref={archiveSectionRef}
        style={{ minHeight: "100svh", paddingBottom: "84px" }}
        className="relative z-20 w-full bg-[#ECEBE6] text-[#111111] shadow-[0_-20px_50px_rgba(0,0,0,0.45)] flex flex-col justify-between overflow-hidden"
      >
        <div
          style={{
            padding: "58px 40px 14px",
            maxWidth: "1360px",
            margin: "0 auto",
          }}
          className="relative z-10 w-full flex items-center justify-between border-b border-black/10 shrink-0"
        >
          <div className="relative h-12 w-[160px] shrink-0">
            <Image
              src="/images/shutterscape-logo.png"
              alt="ShutterScape Logo"
              fill
              sizes="160px"
              priority
              unoptimized
              className="object-contain object-left"
            />
          </div>
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] tracking-[0.22em] uppercase text-black/45">
            <span>OPTICAL ARCHIVE // EDITION 2026</span>
            <span>•</span>
            <span>35MM &amp; 120 FORMATS</span>
          </div>
          <span className="font-heading font-light text-5xl tracking-[-0.05em] leading-none text-[#111111] select-none">
            26
          </span>
        </div>

        {/* Widescreen 3D Cylindrical Curved Ribbon */}
        <div
          ref={ribbonDropWrapRef}
          onTouchStart={() => {
            isRibbonPausedRef.current = true;
          }}
          onTouchEnd={() => {
            isRibbonPausedRef.current = false;
          }}
          onMouseEnter={() => {
            isRibbonPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isRibbonPausedRef.current = false;
          }}
          style={{
            marginTop: "18px",
            marginBottom: "10px",
            height: "260px",
            perspective: "980px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
          className="relative z-20 w-full flex items-center justify-center overflow-visible shrink-0"
        >
          {gallery.map((item, cardIdx) => {
            if (!curvedSliceRefs.current[cardIdx]) {
              curvedSliceRefs.current[cardIdx] = [];
            }
            if (!curvedSliceInnerRefs.current[cardIdx]) {
              curvedSliceInnerRefs.current[cardIdx] = [];
            }

            return (
              <div
                key={item._id || item.id || cardIdx}
                ref={(el) => {
                  curvedCardOuterRefs.current[cardIdx] = el;
                }}
                onClick={() => {
                  setGalleryFilterCat("ALL");
                  setExpandedGalleryId(item._id || item.id || String(cardIdx));
                  setIsGalleryPageOpen(true);
                }}
                className="absolute top-1/2 left-1/2 cursor-pointer"
                style={{
                  transformStyle: "preserve-3d",
                  display: cardIdx < 5 ? "block" : "none",
                }}
              >
                {SLICE_INDICES.map((s) => (
                  <div
                    key={s}
                    ref={(el) => {
                      curvedSliceRefs.current[cardIdx][s] = el;
                    }}
                    className="absolute top-0 overflow-hidden will-change-transform"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div
                      ref={(el) => {
                        curvedSliceInnerRefs.current[cardIdx][s] = el;
                      }}
                      className="relative overflow-hidden rounded-[8px] bg-[#0B0B0E] border border-black/20"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.3) 100%), url(${item.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div
                        style={{ padding: "12px 14px" }}
                        className="absolute top-0 inset-x-0 flex items-center justify-between pointer-events-none"
                      >
                        <span
                          style={{ padding: "3px 8px" }}
                          className="rounded bg-black/80 border border-white/20 font-mono text-[8px] uppercase tracking-[0.18em] text-[#D4A843] font-semibold"
                        >
                          {item.category || "ARCHIVE"}
                        </span>
                        <span className="font-mono text-[8px] tracking-[0.18em] text-white/85 uppercase font-medium">
                          {item.filmStock || "KODAK TRI-X 400"}
                        </span>
                      </div>

                      <div
                        style={{ padding: "12px 14px" }}
                        className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 pointer-events-none"
                      >
                        <div className="max-w-[73%]">
                          <h3 className="font-serif text-xl text-white font-light leading-[0.98] tracking-tight truncate">
                            {item.title}
                          </h3>
                          <p
                            style={{ marginTop: "3px" }}
                            className="font-body text-[10px] text-white/85 line-clamp-1"
                          >
                            {item.description}
                          </p>
                        </div>

                        <span
                          style={{ padding: "4px 10px" }}
                          className="shrink-0 rounded-full bg-[#D4A843] text-[#050505] font-mono text-[7.5px] font-bold uppercase tracking-[0.16em]"
                        >
                          INSPECT ↗
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Cohesive 3-Piece Archival Light-Table Desk (Left Polaroids + Center Handwritten Letter + Right Matted Exhibition Frame!) */}
        <div
          ref={lowerContentRiseRef}
          style={{
            willChange: "transform, opacity",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
          className="relative z-10 flex-1 flex flex-col justify-evenly items-center w-full px-8"
        >
          <div
            style={{ padding: "8px 24px 16px" }}
            className="w-full text-center border-b border-black/10 shrink-0"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="h-px w-14 bg-black/20" />
              <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.25em] text-[#D92B2B]">
                ★ DARKROOM PROMISES // ARCHIVE EPILOGUE
              </span>
              <span className="h-px w-14 bg-black/20" />
            </div>
            <h2 className="font-heading font-black text-3xl lg:text-4xl tracking-[-0.03em] uppercase leading-[1.02] text-[#111111]">
              LIGHT IS MEMORY. MEMORY IS LIGHT.
            </h2>
            <p
              style={{ marginTop: "8px" }}
              className="font-mono text-[10px] tracking-[0.24em] uppercase text-black/50"
            >
              [ GIRIJANANDA CHOWDHURY UNIVERSITY · GUWAHATI ]
            </p>
          </div>

          <div
            style={{ padding: "26px 32px", marginTop: "16px" }}
            className="w-full rounded-3xl bg-[#E4E1D8]/75 border border-black/10 shadow-inner grid grid-cols-12 gap-8 items-center"
          >
            {/* LEFT COLUMN (4 cols): Layered Dual Polaroid Stack */}
            <div className="col-span-4 relative h-[285px] flex items-center justify-center">
              <div
                onClick={() => {
                  setGalleryFilterCat("ALL");
                  setIsGalleryPageOpen(true);
                }}
                style={{
                  width: "215px",
                  padding: "10px 10px 28px 10px",
                  transform: "translate(-28px, 8px) rotate(-6deg)",
                }}
                className="absolute bg-white rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.14)] border border-black/10 cursor-pointer hover:rotate-[-2deg] transition-transform"
              >
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black">
                  <img
                    src={
                      gallery[2]?.src ||
                      FALLBACK_GALLERY[2]?.src ||
                      "/api/media/6ade7bfe927760001b6fed1c"
                    }
                    alt="Polaroid 1"
                    className="w-full h-full object-cover saturate-[1.15]"
                  />
                </div>
                <span className="handmade-fountain-pen text-[14px] text-black/75 block text-center mt-2 leading-none">
                  Brahmaputra Twilight · &apos;26
                </span>
              </div>

              <div
                onClick={() => {
                  setGalleryFilterCat("ALL");
                  setIsGalleryPageOpen(true);
                }}
                style={{
                  width: "225px",
                  padding: "10px 10px 30px 10px",
                  transform: "translate(24px, -6px) rotate(4.5deg)",
                }}
                className="relative z-10 bg-white rounded-xl shadow-[0_20px_42px_rgba(0,0,0,0.2)] border border-black/12 cursor-pointer hover:rotate-0 transition-transform"
              >
                <span
                  style={{ padding: "2px 8px" }}
                  className="absolute top-4 left-4 z-20 rounded bg-[#FFE066] text-[#111111] font-mono text-[7.5px] font-bold uppercase tracking-wider shadow-xs"
                >
                  PLATE 01A
                </span>
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black">
                  <img
                    src={
                      gallery[0]?.src ||
                      FALLBACK_GALLERY[0]?.src ||
                      "/api/media/6ade7b95927760001b6fed1b"
                    }
                    alt="Polaroid 2"
                    className="w-full h-full object-cover saturate-[1.15]"
                  />
                </div>
                <span className="handmade-fountain-pen text-[15px] text-[#111111] block text-center mt-2.5 leading-none">
                  Campus Golden Hour · 35mm
                </span>
              </div>
            </div>

            {/* CENTER COLUMN (4 cols): Handwritten Fountain-Pen Letter */}
            <div className="col-span-4 flex justify-center">
              <div
                style={{
                  transform: "rotate(-1.5deg)",
                  padding: "26px 24px",
                }}
                className="w-full bg-[#FFFDF8] rounded-2xl border border-[#E7DFCF] shadow-[0_20px_45px_rgba(0,0,0,0.1)] relative overflow-hidden select-none transition-transform hover:rotate-0 duration-300"
              >
                <div
                  aria-hidden="true"
                  className="absolute -top-3 left-10 w-28 h-6 bg-[#E8DCBF]/90 rounded-xs rotate-[-2deg] shadow-xs border border-black/5 pointer-events-none"
                />

                <div
                  aria-hidden="true"
                  className="absolute top-3.5 right-3.5 w-13 h-13 rounded-full border-2 border-red-700/50 flex flex-col items-center justify-center text-red-700/65 font-mono text-[6px] font-bold uppercase tracking-widest rotate-[14deg] pointer-events-none"
                >
                  <span>GCU CLUB</span>
                  <span className="text-[8.5px] font-black leading-none">
                    2026
                  </span>
                  <span>35MM</span>
                </div>

                <div className="handmade-fountain-pen text-[21px] leading-[1.45] tracking-[0.01em] text-left text-[#151515] mt-1">
                  <p style={{ marginLeft: "4px" }}>
                    Every photograph holds a little piece of time,
                  </p>
                  <p style={{ marginLeft: "16px", marginTop: "3px" }}>
                    every frame keeps a story alive.
                  </p>
                </div>

                <div
                  style={{ marginTop: "12px" }}
                  className="handmade-fountain-pen text-[21px] leading-[1.45] tracking-[0.01em] text-left text-[#151515]"
                >
                  <p style={{ marginLeft: "20px" }}>
                    Through light, laughter, and the moments
                  </p>
                  <p style={{ marginLeft: "4px", marginTop: "3px" }}>
                    in between, we learn to see the world a little differently.
                  </p>
                </div>

                <div
                  style={{ marginTop: "14px", paddingRight: "4px" }}
                  className="w-full flex flex-col items-end text-right border-t border-black/8 pt-3"
                >
                  <span className="handmade-fountain-pen text-[17px] text-[#1D1C1A]/85 leading-none">
                    With love, light, and endless stories,
                  </span>

                  <div
                    style={{ marginTop: "5px" }}
                    className="flex flex-col items-end"
                  >
                    <span className="handmade-signature-pen text-[36px] leading-[0.88] tracking-[0.02em] text-[#111111]">
                      The Shutterscape Family
                    </span>
                    <svg
                      width="170"
                      height="11"
                      viewBox="0 0 220 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ marginTop: "2px" }}
                      className="text-[#1D1C1A]/75"
                    >
                      <path
                        d="M4 14C58 6 138 4 214 9C182 11 140 13 112 16"
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (4 cols): Matching Warm Ivory Matted Exhibition Print Card (Replaces the Black Box!) */}
            <div className="col-span-4 flex justify-center">
              <div
                onClick={() => {
                  setGalleryFilterCat("ALL");
                  setExpandedGalleryId(null);
                  setIsGalleryPageOpen(true);
                }}
                style={{
                  transform: "rotate(2deg)",
                  padding: "14px 14px 18px 14px",
                }}
                className="w-full max-w-[320px] bg-white rounded-2xl border border-black/12 shadow-[0_20px_44px_rgba(0,0,0,0.12)] cursor-pointer transition-transform hover:rotate-0 duration-300 relative"
              >
                {/* Top Matted Print Header */}
                <div
                  style={{ paddingBottom: "8px", marginBottom: "8px" }}
                  className="flex items-center justify-between border-b border-black/8 font-mono text-[8px] uppercase tracking-[0.18em] text-black/50"
                >
                  <span>EXHIBITION PRINT // 02B</span>
                  <span className="text-[#D92B2B] font-bold">
                    ● KODAK PORTRA
                  </span>
                </div>

                {/* Framed Photograph */}
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#111111] border border-black/10">
                  <img
                    src={
                      gallery[1]?.src ||
                      gallery[0]?.src ||
                      FALLBACK_GALLERY[1]?.src ||
                      "/api/media/6ade7c66d43c2f957e160ddd"
                    }
                    alt="Matted Print"
                    className="w-full h-full object-cover saturate-[1.12]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    style={{ padding: "2.5px 8px" }}
                    className="absolute bottom-2 right-2 rounded bg-black/75 text-[#FFE066] font-mono text-[7.5px] font-bold uppercase tracking-wider"
                  >
                    85MM · F/1.4
                  </span>
                </div>

                {/* Handwritten Print Caption & Action Footer */}
                <div
                  style={{ marginTop: "12px" }}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="handmade-fountain-pen text-[16px] text-[#111111] block leading-none">
                      {gallery[1]?.title || "Chiaroscuro Studio Gaze"}
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.16em] uppercase text-black/45 block mt-1">
                      {gallery.length} ARCHIVAL PLATES · GCU
                    </span>
                  </div>

                  <span
                    style={{ padding: "6px 12px" }}
                    className="rounded-full bg-[#111111] hover:bg-[#D92B2B] text-white font-mono text-[8px] font-bold uppercase tracking-wider shrink-0 transition-colors"
                  >
                    ARCHIVE ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. DESKTOP WIDESCREEN "SPOTLIGHT '26" SECTION (Fixes Screenshot 2!)
             - Explicit Inline Spacing Guarantees Generous Breathing Room
          ============================================================ */}
      <section
        id="desktop-dark-showcase"
        className="relative z-20 w-full bg-[#0A0A0E] text-white border-t border-white/10 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 w-[620px] h-[340px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              spotlightTab === "LIVE"
                ? "radial-gradient(circle, #FF6B6B 0%, transparent 70%)"
                : "radial-gradient(circle, #FFE066 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            padding: "80px 40px 76px",
            maxWidth: "1320px",
            margin: "0 auto",
          }}
          className="relative z-10 w-full"
        >
          <div className="grid grid-cols-12 gap-12 items-center">
            {/* LEFT COLUMN (5 cols): Explicit Inline Gap & Margins for Breathing Room! */}
            <div
              className="col-span-12 lg:col-span-5"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >
                {/* 1. Eyebrow Row with Explicit Spacing Between Pills */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{ padding: "5px 13px" }}
                    className="rounded-full bg-[#FFE066] text-[#111111] font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  >
                    ★ GCU DISPATCH
                  </span>
                  <span className="font-serif italic text-base text-white/70">
                    Collector&apos;s Pass
                  </span>
                  <span
                    style={{ padding: "5px 13px" }}
                    className={`rounded-full font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] flex items-center gap-1.5 border ${
                      spotlightTab === "LIVE"
                        ? "bg-[#FF6B6B]/20 border-[#FF6B6B]/50 text-[#FFA8A8]"
                        : "bg-white/10 border-white/20 text-[#FFE066]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        spotlightTab === "LIVE"
                          ? "bg-[#FF6B6B] animate-ping"
                          : "bg-[#8CE99A] animate-pulse"
                      }`}
                    />
                    {spotlightTab === "LIVE"
                      ? "LIVE ON CAMPUS"
                      : "OPEN FOR RSVP"}
                  </span>
                </div>

                {/* 2. Headline & Description with Generous Breathing Space */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <h2 className="font-heading font-black text-5xl tracking-[-0.03em] uppercase text-white leading-[1.04]">
                    SPOTLIGHT{" "}
                    <span className="font-serif italic font-normal text-[#FFE066]">
                      &apos;26
                    </span>
                  </h2>
                  <p
                    style={{ maxWidth: "430px", lineHeight: "1.75" }}
                    className="font-sans text-sm text-white/75"
                  >
                    Curated student showcases, golden-hour photo expeditions,
                    and live darkroom labs hosted by Girijananda Chowdhury
                    University Photography Club.
                  </p>
                </div>

                {/* 3. 2-Part Pill Switcher with Breathing Space Above & Below */}
                <div
                  style={{
                    padding: "5px",
                    marginTop: "6px",
                    marginBottom: "6px",
                    maxWidth: "360px",
                  }}
                  className="grid grid-cols-2 gap-2 rounded-full bg-white/[0.07] border border-white/15 backdrop-blur-md"
                >
                  <button
                    type="button"
                    onClick={() => setSpotlightTab("UPCOMING")}
                    style={{ padding: "11px 16px" }}
                    className={`rounded-full font-sans text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      spotlightTab === "UPCOMING"
                        ? "bg-[#FFE066] text-[#111111] shadow-[0_4px_14px_rgba(255,224,102,0.35)]"
                        : "bg-transparent text-white/65 hover:text-white"
                    }`}
                  >
                    <span>✦</span>
                    <span>Upcoming</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpotlightTab("LIVE")}
                    style={{ padding: "11px 16px" }}
                    className={`rounded-full font-sans text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      spotlightTab === "LIVE"
                        ? "bg-[#FF5A5F] text-white shadow-[0_4px_14px_rgba(255,90,95,0.4)]"
                        : "bg-transparent text-white/65 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        spotlightTab === "LIVE"
                          ? "bg-white animate-ping"
                          : "bg-[#FF5A5F]"
                      }`}
                    />
                    <span>Live Going</span>
                  </button>
                </div>

                {/* 4. 3-Pillar Highlight Strip */}
                <div
                  style={{ maxWidth: "430px" }}
                  className="grid grid-cols-3 gap-3.5 font-mono"
                >
                  <div
                    style={{ padding: "14px 12px" }}
                    className="rounded-2xl bg-white/[0.04] border border-white/10"
                  >
                    <span className="text-xl font-bold text-white block leading-none">
                      {activities.length}+
                    </span>
                    <span
                      style={{ marginTop: "6px" }}
                      className="text-[8px] uppercase tracking-wider text-white/50 block"
                    >
                      Field Works
                    </span>
                  </div>
                  <div
                    style={{ padding: "14px 12px" }}
                    className="rounded-2xl bg-white/[0.04] border border-white/10"
                  >
                    <span className="text-xl font-bold text-[#FFE066] block leading-none">
                      35MM
                    </span>
                    <span
                      style={{ marginTop: "6px" }}
                      className="text-[8px] uppercase tracking-wider text-white/50 block"
                    >
                      Optics Lab
                    </span>
                  </div>
                  <div
                    style={{ padding: "14px 12px" }}
                    className="rounded-2xl bg-white/[0.04] border border-white/10"
                  >
                    <span className="text-xl font-bold text-[#8CE99A] block leading-none">
                      FREE
                    </span>
                    <span
                      style={{ marginTop: "6px" }}
                      className="text-[8px] uppercase tracking-wider text-white/50 block"
                    >
                      GCU Pass
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. SOLID WHITE "ACTIVITIES +" BAR BUTTON */}
              <div style={{ maxWidth: "430px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setActivityFilterCat("ALL");
                    setActiveActivitySlideIdx(0);
                    setIsActivitiesPageOpen(true);
                  }}
                  className="osl-bar-btn w-full bg-white hover:bg-[#FFE066] text-[#0A0A0D] rounded-xl shadow-[0_12px_30px_rgba(255,255,255,0.14)] active:scale-[0.99] transition-all"
                >
                  <span className="font-bold">
                    ACTIVITIES ({activities.length} CHRONOLOGY WORKS)
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#0A0A0D] text-white flex items-center justify-center text-sm leading-none">
                    +
                  </span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): Collector's Pass Card with Explicit Inner Breathing Space */}
            <div className="col-span-12 lg:col-span-7">
              <div
                style={{
                  boxShadow:
                    spotlightTab === "LIVE"
                      ? "0 28px 65px rgba(0,0,0,0.75), 6px 6px 0px #FF5A5F"
                      : "0 28px 65px rgba(0,0,0,0.75), 6px 6px 0px #D4A843",
                }}
                className="relative rounded-3xl bg-[#FAF8F5] text-[#111111] border-2 border-white overflow-hidden"
              >
                <div style={{ padding: "14px 14px 0 14px" }}>
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#111111] shadow-md">
                    <img
                      src={activeSpotlightEvent.img}
                      alt={activeSpotlightEvent.title}
                      className="w-full h-full object-cover saturate-[1.14] transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.78) 100%)",
                      }}
                    />

                    <div
                      style={{
                        padding: "5px 12px",
                        transform: "rotate(-2deg)",
                        backgroundColor:
                          spotlightTab === "LIVE" ? "#FFA8A8" : "#8CE99A",
                      }}
                      className="absolute top-4 left-4 rounded-lg text-[#111111] font-mono text-[9px] font-bold uppercase tracking-[0.15em] shadow-md border border-black/15"
                    >
                      ★ {activeSpotlightEvent.category}
                    </div>

                    <div
                      style={{ padding: "5px 12px" }}
                      className={`absolute top-4 right-4 rounded-full font-mono text-[9px] font-bold uppercase tracking-[0.14em] shadow-md ${
                        spotlightTab === "LIVE"
                          ? "bg-[#FF5A5F] text-white"
                          : "bg-white/95 text-[#111111]"
                      }`}
                    >
                      {spotlightTab === "LIVE"
                        ? "● HAPPENING NOW"
                        : activeSpotlightEvent.date}
                    </div>

                    <div
                      style={{ padding: "12px 16px" }}
                      className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 text-white"
                    >
                      <span className="font-sans text-xs font-semibold truncate drop-shadow">
                        📍 {activeSpotlightEvent.location}
                      </span>
                      <span
                        style={{ padding: "3.5px 10px" }}
                        className="rounded-full bg-black/65 backdrop-blur-md text-[#FFE066] font-mono text-[8px] font-bold uppercase tracking-wider shrink-0"
                      >
                        {activeSpotlightEvent.filmStock || "35MM ARCHIVE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perforated Ticket Divider */}
                <div
                  style={{ marginTop: "16px", marginBottom: "16px" }}
                  className="relative w-full border-t-2 border-dashed border-black/15"
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "-10px",
                    }}
                    className="absolute -left-[10px] rounded-full bg-[#0A0A0E] border-r-2 border-white"
                  />
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      marginTop: "-10px",
                    }}
                    className="absolute -right-[10px] rounded-full bg-[#0A0A0E] border-l-2 border-white"
                  />
                </div>

                {/* Spacious Ticket Story & Countdown Deck with Explicit Inline Gaps */}
                <div
                  style={{
                    padding: "4px 28px 28px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="handmade-fountain-pen text-[19px] text-[#D92B2B] leading-none block">
                        {spotlightTab === "UPCOMING"
                          ? "Don't miss the golden hour!"
                          : "Doors are open right now!"}
                      </span>
                      <span
                        style={{ marginTop: "5px" }}
                        className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-black/50 block"
                      >
                        {spotlightTab === "UPCOMING"
                          ? "COUNTDOWN TO LAUNCH"
                          : "LIVE SESSION ENDS IN"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { val: countdown.days, label: "DAYS", bg: "#FFE066" },
                        { val: countdown.hours, label: "HRS", bg: "#8CE99A" },
                        { val: countdown.minutes, label: "MIN", bg: "#74C0FC" },
                        { val: countdown.seconds, label: "SEC", bg: "#FFA8A8" },
                      ].map((unit) => (
                        <div
                          key={unit.label}
                          style={{
                            padding: "6px 11px",
                            backgroundColor: unit.bg,
                          }}
                          className="rounded-xl border border-black/15 shadow-[2px_2px_0px_#111111] flex flex-col items-center justify-center text-center"
                        >
                          <span className="font-heading font-black text-sm text-[#111111] leading-none">
                            {unit.val}
                          </span>
                          <span
                            style={{ marginTop: "3px" }}
                            className="font-mono text-[6.5px] font-bold tracking-[0.12em] text-black/65 uppercase leading-none"
                          >
                            {unit.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explicit Gap Between Title and Description */}
                  <div
                    style={{
                      paddingTop: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                    className="border-t border-black/10"
                  >
                    <h3 className="font-serif text-2xl lg:text-[28px] text-[#111111] font-normal leading-[1.15] tracking-tight">
                      {activeSpotlightEvent.title}
                    </h3>
                    <p
                      style={{ lineHeight: "1.7" }}
                      className="font-sans text-xs text-black/70"
                    >
                      {activeSpotlightEvent.description}
                    </p>
                  </div>

                  {/* Join Button with Explicit Top Breathing Space */}
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterEventName(
                        `${
                          spotlightTab === "LIVE" ? "[LIVE] " : "[UPCOMING] "
                        }${activeSpotlightEvent.title}`
                      );
                      setRegisterSubmitted(false);
                      setIsRegisterModalOpen(true);
                    }}
                    style={{
                      padding: "13px 16px 13px 24px",
                      marginTop: "4px",
                    }}
                    className={`w-full rounded-full font-sans text-xs font-bold tracking-wide flex items-center justify-between cursor-pointer transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] ${
                      spotlightTab === "LIVE"
                        ? "bg-[#D92B2B] hover:bg-[#B91C1C] text-white"
                        : "bg-[#111111] hover:bg-[#D92B2B] text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {spotlightTab === "LIVE" && (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      )}
                      <span>
                        {activeSpotlightEvent.ctaText ||
                          (spotlightTab === "LIVE"
                            ? "Join Live Session Now"
                            : "Join Upcoming Event")}
                      </span>
                    </span>
                    <span
                      style={{
                        backgroundColor:
                          spotlightTab === "LIVE" ? "#FFFFFF" : "#FFE066",
                      }}
                      className="w-7 h-7 rounded-full text-[#111111] flex items-center justify-center font-mono text-xs font-bold leading-none"
                    >
                      ↗
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. VISUAL ARCHIVE: UNCLIPPED ROTATING FAN + CREATIVE CURATOR'S
             EXHIBITION DECK (Fixes Screenshot 3!)
          ============================================================ */}
      <section
        id="desktop-light-bento-section"
        className="relative z-20 w-full bg-[#ECEBE6] text-[#111111]"
      >
        <div
          style={{
            padding: "72px 36px",
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "36px",
          }}
        >
          {/* Clean Header Without "[ 25 COLOR PLATES ]" */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/12 pb-5">
            <div>
              <span className="font-serif italic text-lg text-black/60 block">
                Curated Contact Sheet
              </span>
              <h2
                style={{ marginTop: "4px" }}
                className="font-heading font-black text-4xl uppercase tracking-[-0.03em] text-[#111111]"
              >
                VISUAL ARCHIVE
              </h2>
            </div>
            <p className="font-sans text-xs text-black/65 max-w-md leading-relaxed">
              Explore student-captured plates across documentary, portraiture,
              architecture, and street reportage from Girijananda Chowdhury
              University.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-12 items-center">
            {/* LEFT COLUMN (5 cols): Creative Curator's Featured Plate & Interactive Genre Deck */}
            <div
              className="col-span-12 lg:col-span-5"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
                className="rounded-3xl bg-white border border-black/12 shadow-[0_16px_38px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#D92B2B]">
                    ★ CURATOR&apos;S SPOTLIGHT PLATE
                  </span>
                  <span className="font-mono text-[8.5px] font-bold uppercase text-black/45">
                    0{(archiveSpotlightIdx % gallery.length) + 1} / 0
                    {Math.min(9, gallery.length)}
                  </span>
                </div>

                {/* Featured Plate Interactive Preview */}
                <div
                  onClick={() => {
                    setGalleryFilterCat("ALL");
                    setExpandedGalleryId(
                      featuredArchiveItem._id ||
                        featuredArchiveItem.id ||
                        String(archiveSpotlightIdx)
                    );
                    setIsGalleryPageOpen(true);
                  }}
                  className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#111111] cursor-pointer"
                >
                  <img
                    src={featuredArchiveItem.src}
                    alt={featuredArchiveItem.title}
                    className="w-full h-full object-cover saturate-[1.15] transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <span
                    style={{ padding: "4px 10px" }}
                    className="absolute top-3 left-3 rounded-full bg-black/75 backdrop-blur-md text-[#FFE066] font-mono text-[8px] font-bold uppercase tracking-wider"
                  >
                    {featuredArchiveItem.category}
                  </span>

                  <div
                    style={{ padding: "14px" }}
                    className="absolute bottom-0 inset-x-0 flex items-end justify-between gap-2 text-white"
                  >
                    <div>
                      <h4 className="font-serif text-xl text-white leading-tight">
                        {featuredArchiveItem.title}
                      </h4>
                      <span className="font-mono text-[8.5px] text-white/75 uppercase tracking-wider block mt-0.5">
                        BY {featuredArchiveItem.photographer || "GCU ARCHIVE"} ·{" "}
                        {featuredArchiveItem.filmStock || "35MM"}
                      </span>
                    </div>
                    <span
                      style={{ padding: "5px 10px" }}
                      className="rounded-full bg-white text-[#111111] font-mono text-[8px] font-bold uppercase tracking-wider shrink-0"
                    >
                      LOUPE ↗
                    </span>
                  </div>
                </div>

                {/* Interactive Contact Strip Thumbnail Selector */}
                <div className="grid grid-cols-5 gap-2">
                  {gallery.slice(0, 5).map((thumb, idx) => {
                    const isSelected =
                      idx === archiveSpotlightIdx % gallery.length;
                    return (
                      <button
                        key={thumb._id || thumb.id || idx}
                        type="button"
                        onClick={() => setArchiveSpotlightIdx(idx)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#D92B2B] scale-105 shadow-xs"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={thumb.src}
                          alt={thumb.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Genre Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    "ALL",
                    "DOCUMENTARY",
                    "PORTRAITURE",
                    "LANDSCAPE",
                    "STREET",
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setGalleryFilterCat(cat);
                        setExpandedGalleryId(null);
                        setIsGalleryPageOpen(true);
                      }}
                      style={{ padding: "5px 10px" }}
                      className="rounded-full bg-[#FAF9F5] hover:bg-[#111111] text-black/75 hover:text-white border border-black/10 font-mono text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      {cat === "ALL" ? "✦ All Genres" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SOLID JET BLACK "GALLERY +" BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setGalleryFilterCat("ALL");
                  setExpandedGalleryId(null);
                  setIsGalleryPageOpen(true);
                }}
                className="osl-bar-btn w-full bg-[#111111] hover:bg-[#D92B2B] text-white rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.16)] active:scale-[0.99] transition-all"
              >
                <span className="font-bold">
                  GALLERY // EXPLORE ALL {gallery.length} FRAMES
                </span>
                <span className="w-6 h-6 rounded-full bg-[#D4A843] text-[#050505] flex items-center justify-center text-sm font-bold leading-none">
                  +
                </span>
              </button>
            </div>

            {/* RIGHT COLUMN (7 cols): Unclipped, Frameless Rotating Half-Wheel Fan */}
            <div className="col-span-12 lg:col-span-7 flex items-center justify-center">
              <HalfWheelGalleryFan
                items={gallery}
                onSelectCard={(idx) => {
                  setGalleryFilterCat("ALL");
                  const chosen = gallery[idx];
                  setExpandedGalleryId(
                    chosen?._id || chosen?.id || String(idx)
                  );
                  setIsGalleryPageOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. "ABOUT" BANNER + 6-CHAPTER BAR + PERFECTLY CENTERED MEMBER CARDS
             (Fixes Screenshot 4!)
          ============================================================ */}
      <section
        id="desktop-light-about-section"
        className="relative z-20 w-full bg-[#FAF9F5] text-[#111111] border-t border-black/15"
      >
        <div
          style={{ height: "290px" }}
          className="relative w-full bg-[#111111] flex items-center justify-center overflow-hidden"
        >
          <img
            src="/images/gcu-campus-sketch.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/api/media/6ade7c66d43c2f957e160ddd";
            }}
            alt="About ShutterScape"
            className="absolute inset-0 w-full h-full object-cover opacity-65"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/40" />
          <div className="relative z-10 text-center px-4">
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#D4A843] font-bold block mb-1.5">
              GIRIJANANDA CHOWDHURY UNIVERSITY
            </span>
            <h2 className="font-heading font-black text-4xl lg:text-5xl tracking-[0.06em] uppercase text-white">
              ABOUT US
            </h2>
          </div>
        </div>

        {/* Centered 6-Chapter Horizontal Taskbar */}
        <div className="w-full overflow-x-auto no-scrollbar bg-[#ECEBE6] border-y border-black/15 flex items-center justify-center">
          <div className="flex items-center">
            {ABOUT_CHAPTER_TABS.map((tab) => {
              const isActive = activeAboutTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveAboutTab(tab.id)}
                  className={`osl-chapter-pill shrink-0 flex items-center gap-2 ${
                    isActive
                      ? "bg-[#111111] text-white"
                      : "bg-[#ECEBE6] text-[#111111]/70 hover:text-[#111111]"
                  }`}
                >
                  <span
                    className={
                      isActive ? "text-[#D4A843] font-bold" : "opacity-45"
                    }
                  >
                    {tab.code}
                  </span>
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Centered 1280px Chapter Stage */}
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "52px 32px 68px",
          }}
        >
          {activeAboutTab === "ORIGINS" && (
            <StopMotionFlipbook
              matrixStack={matrixStack}
              onOpenRegister={() => {
                setRegisterEventName("");
                setRegisterSubmitted(false);
                setIsRegisterModalOpen(true);
              }}
            />
          )}

          {activeAboutTab === "THE TEACHERS" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "560px",
                  margin: "0 auto 36px auto",
                }}
              >
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#0F766E] font-bold block">
                  CHAPTER 02 // THE TEACHERS
                </span>
                <h3
                  style={{ marginTop: "6px" }}
                  className="font-heading font-black text-3xl uppercase tracking-[-0.03em] text-[#111111]"
                >
                  THE TEACHERS WHO GUIDE US
                </h3>
                <p
                  style={{ marginTop: "8px" }}
                  className="font-body text-xs text-black/65 leading-relaxed"
                >
                  Our faculty coordinators who mentor our visual archive,
                  symposia, and campus-wide exhibitions at GCU.
                </p>
              </div>

              <div
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                }}
              >
                {mentorsList.map((person, idx) =>
                  renderStudioMemberCard(person, idx)
                )}
              </div>
            </div>
          )}

          {activeAboutTab === "BEHIND THE LENS" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "560px",
                  margin: "0 auto 36px auto",
                }}
              >
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#D92B2B] font-bold block">
                  CHAPTER 03 // LEADERSHIP
                </span>
                <h3
                  style={{ marginTop: "6px" }}
                  className="font-heading font-black text-3xl uppercase tracking-[-0.03em] text-[#111111]"
                >
                  BEHIND THE LENS
                </h3>
                <p
                  style={{ marginTop: "8px" }}
                  className="font-body text-xs text-black/65 leading-relaxed"
                >
                  Student executive directors leading expeditions, darkroom
                  critiques, and curation across Assam.
                </p>
              </div>

              <div
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                }}
              >
                {leadsList.map((person, idx) =>
                  renderStudioMemberCard(person, idx + 2)
                )}
              </div>
            </div>
          )}

          {activeAboutTab === "CORE MEMBERS" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "560px",
                  margin: "0 auto 36px auto",
                }}
              >
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#1864AB] font-bold block">
                  CHAPTER 04 // THE FOUNDATION
                </span>
                <h3
                  style={{ marginTop: "6px" }}
                  className="font-heading font-black text-3xl uppercase tracking-[-0.03em] text-[#111111]"
                >
                  CORE MEMBERS
                </h3>
                <p
                  style={{ marginTop: "8px" }}
                  className="font-body text-xs text-black/65 leading-relaxed"
                >
                  The creative backbone driving street reportage, strobe
                  portraiture, landscape expeditions, and motion reels.
                </p>
              </div>

              {/* Explicitly Centered Container via Inline Margin so globals.css Never Shifts It Left! */}
              <div
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                }}
              >
                {coreList.map((person, idx) =>
                  renderStudioMemberCard(person, idx + 1)
                )}
              </div>
            </div>
          )}

          {activeAboutTab === "WHERE IT ALL STARTED" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "560px",
                  margin: "0 auto 36px auto",
                }}
              >
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#B45309] font-bold block">
                  CHAPTER 05 // GENESIS
                </span>
                <h3
                  style={{ marginTop: "6px" }}
                  className="font-heading font-black text-3xl uppercase tracking-[-0.03em] text-[#111111]"
                >
                  WHERE IT ALL STARTED
                </h3>
                <p
                  style={{ marginTop: "8px" }}
                  className="font-body text-xs text-black/65 leading-relaxed"
                >
                  Founded in 2023 to unite Girijananda Chowdhury
                  University&apos;s visual storytellers under one banner.
                </p>
              </div>

              <div
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                }}
              >
                {foundersList.map((person, idx) =>
                  renderStudioMemberCard(person, idx + 4)
                )}
              </div>
            </div>
          )}

          {activeAboutTab === "CARRYING IT FORWARD" && (
            <div>
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "560px",
                  margin: "0 auto 36px auto",
                }}
              >
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6B21A8] font-bold block">
                  CHAPTER 06 // LEGACY
                </span>
                <h3
                  style={{ marginTop: "6px" }}
                  className="font-heading font-black text-3xl uppercase tracking-[-0.03em] text-[#111111]"
                >
                  CARRYING IT FORWARD
                </h3>
                <p
                  style={{ marginTop: "8px" }}
                  className="font-body text-xs text-black/65 leading-relaxed"
                >
                  Alumni torchbearers whose early exhibitions and mentorship
                  built the creative culture of ShutterScape.
                </p>
              </div>

              <div
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "24px",
                }}
              >
                {legacyList.map((person, idx) =>
                  renderStudioMemberCard(person, idx + 3)
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          6. FRAMES IN MOTION — ALL 5 VISIBLE VIDEOS PLAY SIMULTANEOUSLY!
             (Fixes Screenshot 5!)
          ============================================================ */}
      <section
        id="desktop-chronology-matrix"
        className="relative z-20 w-full bg-[#070709] text-white border-t border-white/10 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 65% 45% at 50% 25%, rgba(239, 68, 68, 0.22) 0%, transparent 75%)",
          }}
        />

        <div
          style={{
            padding: "48px 24px 16px",
            maxWidth: "680px",
            margin: "0 auto",
          }}
          className="relative z-10 flex flex-col items-center justify-center text-center gap-2 w-full"
        >
          <h2 className="font-script text-6xl font-bold tracking-normal leading-[0.9]">
            <span className="text-white drop-shadow-sm">Frames in </span>
            <span className="text-[#EF4444] drop-shadow-[0_0_35px_rgba(239,68,68,0.45)]">
              Motion
            </span>
          </h2>
          <p className="font-sans text-sm text-gray-400 font-medium tracking-wide">
            Moments in motion — from the club and its members.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setGalleryFilterCat("ALL");
                setExpandedGalleryId(null);
                setIsGalleryPageOpen(true);
              }}
              className="group inline-flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 hover:text-white cursor-pointer transition-colors"
            >
              <span>SEE MORE</span>
              <span className="text-[#EF4444] group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>
        </div>

        <div
          className="relative w-full h-[58vh] min-h-[440px] max-h-[560px] flex items-center justify-center overflow-hidden my-2"
          onTouchStart={handleReelTouchStart}
          onTouchEnd={handleReelTouchEnd}
        >
          {reels.map((reel, index) => {
            const isActive = index === activeReelIdx;
            const isActiveAudio = activeAudioReelIdx === index;
            const total = reels.length;
            let relIdx = index - activeReelIdx;
            if (relIdx > total / 2) relIdx -= total;
            if (relIdx < -total / 2) relIdx += total;
            const isVisibleCard = Math.abs(relIdx) <= 2;

            return (
              <div
                key={reel._id || reel.id || index}
                onClick={() => handleReelCardClick(index)}
                className="absolute top-1/2 left-1/2 w-[275px] aspect-[9/16] max-h-[54vh] rounded-[24px] overflow-hidden group bg-[#0A0A0D] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.8)] cursor-pointer select-none"
                style={getReelCardStyle(index)}
              >
                {/* Visual loading poster / darkroom placeholder behind the video */}
                <div className="absolute inset-0 bg-[#0E0E12] flex flex-col items-center justify-center gap-2 pointer-events-none z-0">
                  <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                  </div>
                  <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-white/35">
                    35MM FILM REEL
                  </span>
                </div>

                {isVisibleCard ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={
                      reel.videoSrc.includes("#")
                        ? reel.videoSrc
                        : `${reel.videoSrc}#t=0.001`
                    }
                    autoPlay={isActive}
                    loop={!isActive}
                    muted={activeAudioReelIdx !== index}
                    playsInline
                    preload={isActive ? "auto" : "metadata"}
                    onLoadedData={(e) => {
                      const video = e.currentTarget;
                      video.defaultMuted = true;
                      video.muted = activeAudioReelIdx !== index;
                      if (isActive) {
                        const p = video.play();
                        if (p !== undefined) p.catch(() => {});
                      }
                    }}
                    onTimeUpdate={(e) => {
                      const video = e.currentTarget;
                      if (video.duration && !isNaN(video.duration)) {
                        const pct = (video.currentTime / video.duration) * 100;
                        const bar = progressBarRefs.current[index];
                        if (bar) {
                          bar.style.width = `${pct}%`;
                        }
                        if (
                          isActive &&
                          video.currentTime >= video.duration - 0.12 &&
                          !isAdvancingReelRef.current
                        ) {
                          handleReelVideoEnded(index);
                        }
                      }
                    }}
                    onEnded={() => {
                      if (isActive) {
                        handleReelVideoEnded(index);
                      }
                    }}
                    className="relative z-10 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#0A0A0D]" />
                )}

                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/10 to-black/30 opacity-85 pointer-events-none" />

                <div
                  className={`absolute inset-0 z-20 border-2 rounded-[24px] pointer-events-none transition-all duration-500 ${
                    isActive ? "border-white/35" : "border-transparent"
                  }`}
                />

                {isActive && (
                  <div className="absolute top-4 right-4 z-30 pointer-events-none">
                    {isActiveAudio ? (
                      <div className="bg-black/65 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                        <div className="sound-wave">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center opacity-80">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{ padding: "14px 16px" }}
                  className="absolute bottom-0 inset-x-0 z-30 flex items-center gap-2.5 pointer-events-none"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-[#050505] font-sans font-bold text-[9px] flex items-center justify-center shadow-md shrink-0">
                    {getReelInitials(reel.photographer)}
                  </div>
                  <span className="font-sans font-semibold text-xs text-white drop-shadow-md truncate">
                    {reel.photographer}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-30 pointer-events-none overflow-hidden">
                  <div
                    ref={(el) => {
                      progressBarRefs.current[index] = el;
                    }}
                    className="h-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.85)]"
                    style={{
                      width: "0%",
                      transition: "width 0.12s linear",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{ paddingBottom: "24px", paddingTop: "8px" }}
          className="text-center"
        >
          <p className="font-sans text-xs text-white/45 font-medium tracking-wide">
            Click active reel to toggle sound · Click side reels to navigate
          </p>
        </div>

        <div className="w-full">
          <button
            type="button"
            onClick={() => {
              setRegisterEventName("");
              setRegisterSubmitted(false);
              setIsRegisterModalOpen(true);
            }}
            style={{
              maxWidth: "1320px",
              margin: "0 auto 36px",
              borderRadius: "12px",
            }}
            className="osl-bar-btn bg-[#D92B2B] hover:bg-[#B91C1C] text-white border border-white/15 shadow-lg"
          >
            <span>REGISTER YOUR INTEREST // JOIN SHUTTERSCAPE</span>
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
      </section>

      {/* ============================================================
          7. CORPORATE-GRADE MINIMALIST FOOTER + LIVE GOOGLE MAP VIEW
             + OFFICIAL INSTAGRAM & WHATSAPP LOGOS
          ============================================================ */}
      <footer
        id="desktop-global-footer"
        style={{
          padding: "36px 36px 96px 36px",
          backgroundColor: "#FAF9F5",
          color: "#0A0A0C",
        }}
        className="relative z-20 w-full border-t border-black/10 select-none overflow-hidden"
      >
        <div
          aria-hidden="true"
          style={{ maxWidth: "1320px", margin: "0 auto" }}
          className="pointer-events-none absolute inset-x-6 bottom-12 flex items-center justify-center overflow-hidden select-none"
        >
          <svg
            viewBox="0 0 620 64"
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="50%"
              y="52"
              textAnchor="middle"
              fill="rgba(10, 10, 12, 0.04)"
              style={{
                fontFamily: "var(--font-sora), system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "62px",
                letterSpacing: "0.02em",
              }}
            >
              SHUTTERSCAPE
            </text>
          </svg>
        </div>

        <div
          style={{ maxWidth: "1320px", margin: "0 auto" }}
          className="relative z-10 w-full flex flex-col gap-5"
        >
          <div className="grid grid-cols-12 gap-8 items-center pb-4 border-b border-black/[0.08]">
            <div
              className="col-span-7"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    style={{ width: "96px", height: "26px" }}
                    className="relative shrink-0"
                  >
                    <Image
                      src="/images/shutterscape-logo-cropped.png"
                      alt="ShutterScape"
                      fill
                      sizes="96px"
                      unoptimized
                      className="object-contain object-left"
                    />
                  </div>

                  <span className="h-4 w-[1px] bg-black/15 shrink-0" />

                  <a
                    href="https://gcu.ac.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Girijananda Chowdhury University"
                    style={{ width: "105px", height: "26px" }}
                    className="relative opacity-90 hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Image
                      src="/images/gcu-logo-black-text.png"
                      alt="GCU"
                      fill
                      sizes="105px"
                      unoptimized
                      className="object-contain object-left"
                    />
                  </a>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href="https://www.instagram.com/shutterscape_gcu"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "7px 14px" }}
                    className="rounded-full bg-black/[0.05] hover:bg-[#111111] text-[#111111] hover:text-white font-sans text-xs font-semibold tracking-tight flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <span>Instagram</span>
                    <span className="text-[10px] opacity-60">↗</span>
                  </a>

                  <a
                    href="https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "7px 14px" }}
                    className="rounded-full bg-[#111111] hover:bg-[#25D366] text-white hover:text-[#050505] font-sans text-xs font-semibold tracking-tight flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                    </svg>
                    <span>WhatsApp</span>
                    <span className="text-[10px] text-[#FFE066]">↗</span>
                  </a>
                </div>
              </div>

              <p className="font-serif italic text-sm text-black/65 leading-relaxed max-w-xl">
                Official visual arts &amp; photography collective of Girijananda
                Chowdhury University, Assam. Documenting time, culture, and
                stories through light.
              </p>

              <div className="flex flex-wrap items-center gap-6 font-sans text-xs text-black/75 pt-1">
                <a
                  href="mailto:shutterscape@gcuniversity.ac.in"
                  className="flex items-center gap-2 hover:text-black transition-colors font-medium"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-black/45 shrink-0"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>shutterscape@gcuniversity.ac.in</span>
                </a>

                <a
                  href="https://maps.app.goo.gl/NhdHs1u76Bjxo2J87"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-black/70 hover:text-black font-medium transition-colors"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#D92B2B] shrink-0"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>GCU Campus, Hathkhowapara, Azara, Guwahati</span>
                  <span className="text-[10px] opacity-50">↗</span>
                </a>
              </div>
            </div>

            {/* Right 5 Columns: Embedded Interactive Campus Map View Card */}
            <div className="col-span-5">
              <div
                style={{ padding: "8px" }}
                className="rounded-2xl bg-white border border-black/12 shadow-sm overflow-hidden"
              >
                <div className="relative w-full h-[125px] rounded-xl overflow-hidden bg-[#ECEBE6]">
                  <iframe
                    title="Girijananda Chowdhury University Campus Map"
                    src="https://www.google.com/maps?q=Girijananda+Chowdhury+University+Azara+Guwahati&output=embed"
                    className="w-full h-full border-0 filter contrast-[1.04]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href="https://maps.app.goo.gl/NhdHs1u76Bjxo2J87"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "4px 10px" }}
                    className="absolute bottom-2 right-2 rounded-full bg-[#111111]/90 hover:bg-[#D92B2B] text-white font-mono text-[8px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-md transition-colors"
                  >
                    OPEN IN GOOGLE MAPS ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-4 font-sans text-xs text-black/50">
            <span className="font-mono text-[9.5px] tracking-[0.12em] uppercase whitespace-nowrap">
              © 2026 SHUTTERSCAPE · GIRIJANANDA CHOWDHURY UNIVERSITY
            </span>

            <div className="flex items-center gap-1.5 text-xs text-black/65 whitespace-nowrap">
              <span>
                Crafted by{" "}
                <strong className="font-semibold text-[#111111]">
                  Krishnayan
                </strong>
              </span>
              <span className="text-black/25">·</span>
              <a
                href="https://codingclub.gcuniversity.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#111111] hover:underline"
              >
                Codénix (GCU)
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================
          PAGE OVERLAY 1: DESKTOP-CENTERED ACTIVITIES PAGE
          ============================================================ */}
      {isActivitiesPageOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#F4F2EC] text-[#111111] flex flex-col overflow-y-auto animate-fade-in">
          <div className="sticky top-0 z-30 bg-[#F4F2EC]/95 backdrop-blur-md border-b border-black/10 shrink-0">
            <div
              style={{
                padding: "14px 32px",
                maxWidth: "1360px",
                margin: "0 auto",
              }}
              className="flex items-center justify-between"
            >
              <button
                type="button"
                onClick={() => setIsActivitiesPageOpen(false)}
                style={{ padding: "7px 16px" }}
                className="rounded-full bg-[#111111] text-white font-sans text-xs font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <div className="text-center">
                <span className="font-heading font-black text-base uppercase tracking-tight text-[#111111] block leading-none">
                  CLUB ACTIVITIES
                </span>
                <span className="handmade-fountain-pen text-[14px] text-[#D92B2B] block mt-0.5 leading-none">
                  Field Works &amp; Chronology
                </span>
              </div>

              <span
                style={{ padding: "5px 12px" }}
                className="rounded-full bg-[#FFE066] border border-black/15 text-[#111111] font-mono text-[9px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#111111]"
              >
                {filteredActivityItems.length} WORKS
              </span>
            </div>

            <div className="w-full border-t border-black/5 bg-[#EAE7DF]">
              <div
                style={{
                  padding: "10px 32px",
                  maxWidth: "1360px",
                  margin: "0 auto",
                }}
                className="flex items-center gap-2.5 overflow-x-auto no-scrollbar"
              >
                {[
                  { key: "ALL", label: "✦ All Works" },
                  { key: "PHOTOWALK", label: "Photowalks" },
                  { key: "WORKSHOP", label: "Workshops" },
                  { key: "EXHIBITION", label: "Exhibitions" },
                  { key: "COMPETITION", label: "Competitions" },
                  { key: "2026", label: "Works '26" },
                  { key: "2025", label: "Works '25" },
                ].map((cat) => {
                  const isSelected = activityFilterCat === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setActivityFilterCat(cat.key);
                        setActiveActivitySlideIdx(0);
                        if (activitiesPeekScrollRef.current) {
                          activitiesPeekScrollRef.current.scrollTo({
                            left: 0,
                            behavior: "smooth",
                          });
                        }
                      }}
                      style={{ padding: "6.5px 15px" }}
                      className={`rounded-full font-sans text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#111111] text-white shadow-[2px_2px_0px_#D4A843]"
                          : "bg-white text-black/70 border border-black/10 hover:text-black"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "24px 32px",
              maxWidth: "1360px",
              margin: "0 auto",
            }}
            className="flex-1 w-full flex flex-col justify-between gap-5"
          >
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#D92B2B] font-bold block">
                  ARCHIVE DIRECTORY // 2025–2026
                </span>
                <h2
                  style={{ marginTop: "3px" }}
                  className="font-heading font-black text-3xl text-[#111111] tracking-[-0.03em] leading-none"
                >
                  EXPLORE{" "}
                  <span className="font-serif italic font-normal text-[#D92B2B]">
                    ShutterScape.
                  </span>
                </h2>
              </div>

              <span
                style={{ padding: "4px 12px" }}
                className="rounded-full bg-black/[0.06] font-mono text-[10px] font-bold text-[#111111] shrink-0"
              >
                {String(activeActivitySlideIdx + 1).padStart(2, "0")} /{" "}
                {String(filteredActivityItems.length).padStart(2, "0")}
              </span>
            </div>

            <div
              ref={activitiesPeekScrollRef}
              onScroll={(e) => {
                const container = e.currentTarget;
                const idx = Math.round(container.scrollLeft / 370);
                if (
                  idx !== activeActivitySlideIdx &&
                  idx >= 0 &&
                  idx < filteredActivityItems.length
                ) {
                  setActiveActivitySlideIdx(idx);
                }
              }}
              style={{ paddingBottom: "8px" }}
              className="flex items-stretch gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {filteredActivityItems.map((ev, idx) => {
                const isSelectedCard = idx === activeActivitySlideIdx;
                const pillAccent =
                  MEMBER_CARD_BACKDROPS[idx % MEMBER_CARD_BACKDROPS.length];

                return (
                  <div
                    key={ev._id || ev.id || idx}
                    onClick={() => scrollActivitiesPeekTo(idx)}
                    style={{
                      padding: "13px",
                      width: "355px",
                      boxShadow: isSelectedCard
                        ? "5px 5px 0px #111111"
                        : "2px 2px 0px rgba(17,17,17,0.2)",
                    }}
                    className={`shrink-0 snap-start bg-white rounded-3xl border-2 border-[#111111] flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                      isSelectedCard
                        ? "opacity-100 scale-100"
                        : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div
                        style={{ padding: "0 2px 8px" }}
                        className="flex items-center justify-between gap-2"
                      >
                        <div
                          style={{
                            padding: "3.5px 10px",
                            backgroundColor: pillAccent,
                            transform: "rotate(-1.5deg)",
                          }}
                          className="rounded-lg border border-black/20 text-[#111111] font-mono text-[8px] font-bold uppercase tracking-[0.14em]"
                        >
                          #{String(idx + 1).padStart(2, "0")} · {ev.category}
                        </div>

                        <span
                          style={{ padding: "3.5px 9px" }}
                          className={`rounded-full font-mono text-[8px] font-bold uppercase tracking-[0.12em] ${
                            ev.isUpcoming
                              ? "bg-[#10B981] text-[#050505]"
                              : "bg-black/[0.06] text-[#111111]"
                          }`}
                        >
                          {ev.isUpcoming ? "● LIVE RSVP" : ev.date}
                        </span>
                      </div>

                      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#111115] border border-black/15">
                        <img
                          src={ev.img}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-55 scale-110"
                        />
                        <img
                          src={ev.img}
                          alt={ev.title}
                          className="relative z-10 w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />

                        <div
                          style={{ padding: "6px 10px" }}
                          className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/85 to-transparent flex items-center justify-between gap-2 text-white"
                        >
                          <span className="font-sans text-[10.5px] font-semibold truncate drop-shadow">
                            📍 {ev.location}
                          </span>
                          <span
                            style={{ padding: "2px 7px" }}
                            className="rounded bg-black/70 text-[#FFE066] font-mono text-[7px] font-bold uppercase tracking-wider shrink-0"
                          >
                            {ev.filmStock || ev.exif || "35MM"}
                          </span>
                        </div>
                      </div>

                      <div className="relative w-full h-4 flex items-center justify-between my-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#F4F2EC] border border-[#111111] -ml-4 shrink-0" />
                        <div className="w-full border-t-2 border-dashed border-black/12 mx-1.5" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#F4F2EC] border border-[#111111] -mr-4 shrink-0" />
                      </div>

                      <div
                        style={{ padding: "2px 6px 10px" }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="handmade-fountain-pen text-[14px] text-[#D92B2B] leading-none">
                            {ev.isUpcoming
                              ? "Open for GCU registrations"
                              : "Official Club Archive"}
                          </span>
                          <span className="font-mono text-[8px] font-bold text-black/45 uppercase">
                            {ev.year || "2026"}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl text-[#111111] font-normal leading-tight tracking-tight line-clamp-2">
                          {ev.title}
                        </h3>

                        <p className="font-sans text-xs text-black/70 leading-relaxed line-clamp-2">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRegisterEventName(ev.title);
                        setRegisterSubmitted(false);
                        setIsRegisterModalOpen(true);
                      }}
                      style={{
                        padding: "10px 12px 10px 16px",
                        marginTop: "10px",
                      }}
                      className={`w-full rounded-full font-sans text-xs font-bold tracking-wide flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                        ev.isUpcoming
                          ? "bg-[#D92B2B] hover:bg-[#B91C1C] text-white"
                          : "bg-[#111111] hover:bg-[#D92B2B] text-white"
                      }`}
                    >
                      <span>
                        {ev.isUpcoming
                          ? "Join / RSVP This Session"
                          : "Register Interest // Archive"}
                      </span>
                      <span
                        style={{ backgroundColor: pillAccent }}
                        className="w-6 h-6 rounded-full text-[#111111] flex items-center justify-center font-mono text-xs font-bold leading-none"
                      >
                        →
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() =>
                    scrollActivitiesPeekTo(activeActivitySlideIdx - 1)
                  }
                  style={{ padding: "8px 18px" }}
                  className="rounded-full bg-white border-2 border-[#111111] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#111111] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#111111] active:scale-95"
                >
                  <span>←</span>
                  <span>PREV</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {filteredActivityItems.slice(0, 10).map((_, dotIdx) => {
                    const isCurrentDot =
                      dotIdx ===
                      activeActivitySlideIdx %
                        Math.min(10, filteredActivityItems.length);
                    return (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => scrollActivitiesPeekTo(dotIdx)}
                        style={{
                          width: isCurrentDot ? "24px" : "7px",
                          height: "7px",
                        }}
                        className={`rounded-full transition-all duration-300 cursor-pointer ${
                          isCurrentDot ? "bg-[#D92B2B]" : "bg-black/25"
                        }`}
                        aria-label={`Go to slide ${dotIdx + 1}`}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    scrollActivitiesPeekTo(activeActivitySlideIdx + 1)
                  }
                  style={{ padding: "8px 18px" }}
                  className="rounded-full bg-[#111111] border-2 border-[#111111] text-white font-mono text-[10px] font-bold uppercase tracking-[0.14em] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#D4A843] active:scale-95"
                >
                  <span>NEXT</span>
                  <span>→</span>
                </button>
              </div>

              <div
                style={{ padding: "10px 16px" }}
                className="rounded-2xl bg-white/85 border border-black/10 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="shrink-0">
                  <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-black/45 font-bold block">
                    CONTACT STRIP
                  </span>
                  <span className="font-serif italic text-sm text-[#111111]">
                    Quick Jump
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {filteredActivityItems.map((thumbEv, tIdx) => {
                    const isActiveThumb = tIdx === activeActivitySlideIdx;
                    return (
                      <button
                        key={thumbEv._id || thumbEv.id || tIdx}
                        type="button"
                        onClick={() => scrollActivitiesPeekTo(tIdx)}
                        style={{ width: "48px", height: "36px" }}
                        className={`relative rounded-lg overflow-hidden shrink-0 cursor-pointer transition-all ${
                          isActiveThumb
                            ? "ring-2 ring-[#D92B2B] scale-105 opacity-100"
                            : "opacity-55 hover:opacity-90"
                        }`}
                      >
                        <img
                          src={thumbEv.img}
                          alt={thumbEv.shortTitle || thumbEv.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111113] text-white shrink-0">
            <div
              style={{
                padding: "14px 32px",
                maxWidth: "1360px",
                margin: "0 auto",
              }}
              className="flex items-center justify-between gap-3"
            >
              <div>
                <span className="font-serif italic text-sm text-[#FFE066] block leading-none">
                  ShutterScape GCU
                </span>
                <p className="font-sans text-[11px] text-white/65 mt-0.5">
                  Capturing stories that outlive the moment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActivitiesPageOpen(false)}
                style={{ padding: "6px 14px" }}
                className="rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-[8.5px] font-bold uppercase tracking-widest shrink-0 cursor-pointer"
              >
                CLOSE ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PAGE OVERLAY 2: DESKTOP 2-COLUMN CENTERED GALLERY PAGE
          (Eliminates the Left-Stuck Column & Right Black Void!)
          ============================================================ */}
      {isGalleryPageOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#0B0B0E] text-white overflow-y-auto animate-fade-in">
          <div className="sticky top-0 z-40 bg-[#0B0B0E]/95 backdrop-blur-md border-b border-white/10">
            <div
              style={{
                padding: "14px 32px",
                maxWidth: "1240px",
                margin: "0 auto",
              }}
              className="flex items-center justify-between"
            >
              <button
                type="button"
                onClick={() => setIsGalleryPageOpen(false)}
                style={{ padding: "7px 16px" }}
                className="rounded-full bg-white text-[#0B0B0E] font-mono text-[10px] font-bold uppercase tracking-[0.18em] flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>←</span>
                <span>BACK</span>
              </button>

              <span className="font-serif italic text-xl tracking-wide text-white">
                ShutterScape{" "}
                <span className="font-mono not-italic text-[10.5px] text-[#D4A843] uppercase tracking-widest">
                  Archive
                </span>
              </span>

              <span className="font-mono text-[10px] tracking-[0.18em] text-white/60 uppercase">
                {filteredGalleryItems.length} PLATES
              </span>
            </div>

            <div className="w-full border-t border-white/10 bg-black/50">
              <div
                style={{
                  padding: "10px 32px",
                  maxWidth: "1240px",
                  margin: "0 auto",
                }}
                className="flex items-center gap-2.5 overflow-x-auto no-scrollbar"
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
                  const isSelected = galleryFilterCat === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGalleryFilterCat(cat)}
                      style={{ padding: "6.5px 14px" }}
                      className={`rounded-full font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#D4A843] text-[#050505]"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {cat === "ALL" ? "ALL PLATES" : cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Centered 2-Column Desktop Editorial Grid */}
          <div
            style={{
              padding: "28px 32px 64px",
              maxWidth: "1240px",
              margin: "0 auto",
            }}
            className="grid grid-cols-2 gap-6"
          >
            {filteredGalleryItems.map((item, idx) => {
              const cardKey = item._id || item.id || String(idx);
              const isExpanded = expandedGalleryId === cardKey;
              const isLiked = !!likedMap[cardKey];
              const likeCount =
                getBaseLikes(cardKey, idx, item.likes) + (isLiked ? 1 : 0);
              const isBursting = heartBurstId === cardKey;

              return (
                <div
                  key={cardKey}
                  className="relative w-full rounded-2xl overflow-hidden bg-[#141418] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.75)] flex flex-col"
                >
                  <div
                    onDoubleClick={(e) => handleToggleLike(cardKey, e)}
                    className="relative w-full aspect-[4/3] overflow-hidden"
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover saturate-[1.12] transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 pointer-events-none" />

                    {isBursting && (
                      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                        <svg
                          width="68"
                          height="68"
                          viewBox="0 0 24 24"
                          fill="#EF4444"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                          className="osl-heart-burst drop-shadow-[0_8px_24px_rgba(239,68,68,0.75)]"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    )}

                    <div
                      style={{ padding: "12px 14px" }}
                      className="absolute top-0 inset-x-0 flex items-center justify-between font-mono text-[8.5px] tracking-[0.2em] uppercase pointer-events-none"
                    >
                      <span
                        style={{ padding: "3px 8px" }}
                        className="rounded bg-black/70 text-[#D4A843] font-bold"
                      >
                        {item.category}
                      </span>
                      <span className="text-white/75">{item.filmStock}</span>
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                      <h3 className="font-serif text-2xl lg:text-3xl text-white font-light tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        {item.title}
                      </h3>
                      <p
                        style={{ marginTop: "4px" }}
                        className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-white/85"
                      >
                        BY {item.photographer}
                      </p>
                    </div>

                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGalleryId(isExpanded ? null : cardKey)
                        }
                        style={{ padding: "7.5px 16px" }}
                        className="rounded-md bg-white/95 hover:bg-[#D4A843] text-[#050505] font-mono text-[9px] font-bold uppercase tracking-[0.18em] shadow-lg cursor-pointer transition-colors"
                      >
                        {isExpanded ? "− HIDE DETAILS" : "+ VIEW IN LOUPE"}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(cardKey, e)}
                        aria-label={isLiked ? "Unlike photo" : "Love photo"}
                        style={{ padding: "7px 13px" }}
                        className={`rounded-md border-0 font-mono text-[9.5px] font-bold tracking-[0.12em] flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-90 ${
                          isLiked
                            ? "bg-[#EF4444] text-white"
                            : "bg-black/70 backdrop-blur-md text-white hover:bg-black/90"
                        }`}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill={isLiked ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-200 ${
                            isLiked ? "scale-110" : "scale-100"
                          }`}
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span>{likeCount}</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{ padding: "16px 18px" }}
                      className="bg-[#18181F] border-t border-white/10 space-y-2.5 animate-fade-in"
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] text-[#D4A843] uppercase tracking-[0.18em]">
                        <span>EXIF // {item.exif || "35MM · F/2.0"}</span>
                        <span>📍 {item.location || "GCU ARCHIVE"}</span>
                      </div>
                      <p className="font-body text-xs text-white/80 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: STUDIO MEMBER BIO SHEET
          ============================================================ */}
      {selectedMemberModal && (
        <div
          onClick={() => setSelectedMemberModal(null)}
          style={{ padding: "24px" }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "24px", maxWidth: "420px", margin: "0 auto" }}
            className="w-full bg-white text-[#111111] rounded-3xl shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                style={{ padding: "6px 14px" }}
                className="rounded-full bg-[#111111] text-white font-mono text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
              >
                <span>←</span>
                <span>BACK</span>
              </button>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-black/45 font-bold">
                SHUTTERSCAPE ROSTER
              </span>
            </div>

            <div
              style={{
                backgroundColor: selectedMemberModal.bgColor,
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
              }}
              className="relative w-full aspect-[4/4.2] rounded-2xl overflow-hidden"
            >
              <img
                src={selectedMemberModal.person.img}
                alt={selectedMemberModal.person.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#D92B2B] font-bold block">
                {selectedMemberModal.person.role}
              </span>
              <h3 className="font-heading font-black text-2xl text-[#111111]">
                {selectedMemberModal.person.name}
              </h3>
              {selectedMemberModal.person.dept && (
                <p className="font-mono text-[10px] text-black/55">
                  {selectedMemberModal.person.dept}
                </p>
              )}
              <p className="font-body text-xs text-black/75 leading-relaxed pt-2">
                {selectedMemberModal.person.bio ||
                  `${selectedMemberModal.person.name} is a key member of ShutterScape at Girijananda Chowdhury University, contributing to exhibitions, photowalks, and archival documentation.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: "REGISTER YOUR INTEREST" SWISS FORM MODAL (CENTERED)
          ============================================================ */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#FAF9F5] text-[#111111] overflow-y-auto animate-fade-in flex flex-col justify-between">
          <div>
            <div className="border-b border-black/15 sticky top-0 bg-[#FAF9F5]/95 z-20">
              <div
                style={{
                  padding: "18px 32px",
                  maxWidth: "760px",
                  margin: "0 auto",
                }}
                className="flex items-center justify-between"
              >
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  style={{ padding: "7px 14px" }}
                  className="rounded-full bg-[#111111] text-white font-mono text-[9.5px] tracking-[0.18em] uppercase font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <span>←</span>
                  <span>BACK</span>
                </button>
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[#111111] font-bold">
                  JOIN SHUTTERSCAPE &apos;26
                </span>
              </div>
            </div>

            <div
              style={{
                padding: "40px 32px",
                maxWidth: "760px",
                margin: "0 auto",
              }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-heading font-black text-4xl uppercase tracking-[-0.03em] leading-[0.95] text-[#111111]">
                  REGISTER
                  <br />
                  YOUR INTEREST
                  <br />
                  IN SHUTTERSCAPE:
                </h2>
                {registerEventName && (
                  <span
                    style={{ marginTop: "10px", padding: "5px 12px" }}
                    className="inline-block rounded bg-[#D4A843] text-[#050505] font-mono text-[10px] font-bold uppercase tracking-wider"
                  >
                    EVENT RSVP // {registerEventName}
                  </span>
                )}
              </div>

              {registerSubmitted ? (
                <div
                  style={{ padding: "24px" }}
                  className="border border-black/20 bg-[#ECEBE6] rounded-2xl space-y-3"
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#D92B2B] font-bold block">
                    ● TRANSMISSION RECEIVED
                  </span>
                  <h3 className="font-heading font-bold text-xl uppercase text-[#111111]">
                    WELCOME TO THE DARKROOM.
                  </h3>
                  <p className="font-body text-xs text-black/75 leading-relaxed">
                    Your registration has been logged for ShutterScape GCU. You
                    can also join our official WhatsApp community for instant
                    photowalk dispatches.
                  </p>
                  <a
                    href="https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="osl-bar-btn bg-[#111111] text-white rounded-xl mt-3"
                  >
                    <span>JOIN WHATSAPP COMMUNITY</span>
                    <span>↗</span>
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRegisterSubmitted(true);
                  }}
                  className="space-y-4 pt-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="NAME*"
                    className="osl-input-line"
                  />
                  <input
                    type="email"
                    required
                    placeholder="EMAIL*"
                    className="osl-input-line"
                  />
                  <input
                    type="tel"
                    placeholder="PHONE"
                    className="osl-input-line"
                  />
                  <input
                    type="text"
                    placeholder="DEPARTMENT & SEMESTER (GCU)"
                    className="osl-input-line"
                  />
                  <textarea
                    rows={3}
                    required
                    defaultValue={
                      registerEventName
                        ? `RSVP for ${registerEventName} — `
                        : ""
                    }
                    placeholder="YOUR MESSAGE / CAMERA GEAR*"
                    className="osl-input-line resize-none"
                  />
                  <select
                    defaultValue=""
                    className="osl-input-line uppercase cursor-pointer"
                  >
                    <option value="" disabled>
                      PRIMARY DISCIPLINE
                    </option>
                    <option value="STREET">STREET &amp; DOCUMENTARY</option>
                    <option value="PORTRAITURE">
                      PORTRAITURE &amp; STROBE
                    </option>
                    <option value="LANDSCAPE">LANDSCAPE &amp; WILDLIFE</option>
                    <option value="CINEMATOGRAPHY">
                      MOTION REELS &amp; VIDEO
                    </option>
                    <option value="MOBILE">MOBILE PHOTOGRAPHY</option>
                  </select>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      style={{ padding: "14px 38px" }}
                      className="rounded-xl bg-[#D92B2B] hover:bg-[#B91C1C] text-white font-mono text-[11px] font-bold uppercase tracking-[0.2em] cursor-pointer shadow-md transition-colors"
                    >
                      SUBMIT
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
