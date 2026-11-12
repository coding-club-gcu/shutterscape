// src/app/activities/page.tsx
"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SmoothScroller from "@/components/cinematic/SmoothScroller";
import { INITIAL_ACTIVITIES } from "@/data/initialClubData";

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// DATA PAYLOADS (The Film Archive — 2026 & 2025)
// ==========================================
type FilterKey =
  | "ALL"
  | "WORK_2026"
  | "WORK_2025"
  | "UPCOMING"
  | "ARCHIVE"
  | "PHOTOWALK"
  | "WORKSHOP"
  | "EXHIBITION"
  | "COMPETITION";

interface ArchiveEvent {
  id: string;
  year: "2026" | "2025";
  shortTitle: string;
  title: string;
  category: "PHOTOWALK" | "WORKSHOP" | "EXHIBITION" | "COMPETITION";
  date: string;
  location: string;
  description: string;
  exif: string;
  filmStock: string;
  img: string;
  isUpcoming?: boolean;
}

const ARCHIVE_DATA: ArchiveEvent[] = INITIAL_ACTIVITIES as unknown as ArchiveEvent[];

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: "ALL", value: "ALL" },
  { label: "WORK 2026", value: "WORK_2026" },
  { label: "WORK 2025", value: "WORK_2025" },
  { label: "UPCOMING", value: "UPCOMING" },
  { label: "ARCHIVE", value: "ARCHIVE" },
  { label: "PHOTOWALKS", value: "PHOTOWALK" },
  { label: "WORKSHOPS", value: "WORKSHOP" },
  { label: "EXHIBITIONS", value: "EXHIBITION" },
  { label: "COMPETITIONS", value: "COMPETITION" },
];

// Hexagonal edge angles (flat-top inner hexagon matching the video reference)
const HEX_ANGLES_DEG = [-90, -30, 30, 90, 150, -150];
// Radial aperture tilts: cards dynamically curve along the circular ring
const HEX_ROTATIONS_DEG = [0, 14, -14, 0, 14, -14];

function renderFormattedDescription(text: string) {
  if (!text) return null;
  const paragraphs = text.split(/\r?\n+/).filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
        const parts = para.split(regex);
        return (
          <p key={pIdx} className="leading-[1.8]">
            {parts.map((part, index) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={index} className="font-semibold text-[#141413]">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return (
                  <em key={index} className="italic text-[#141413]">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
              if (linkMatch) {
                return (
                  <a
                    key={index}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4A843] underline font-semibold hover:text-[#141413] transition-colors"
                  >
                    {linkMatch[1]}
                  </a>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function ActivitiesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topBannerRef = useRef<HTMLDivElement>(null);
  const centerWorksRef = useRef<HTMLDivElement>(null);
  const leftTitleWrapRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  const [archiveData, setArchiveData] = useState<ArchiveEvent[]>(ARCHIVE_DATA);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCylinderPhase, setIsCylinderPhase] = useState<boolean>(false);
  const [activeModalEvent, setActiveModalEvent] = useState<ArchiveEvent | null>(
    null
  );

  useEffect(() => {
    try {
      const cached = localStorage.getItem("ss_cache_activities");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) setArchiveData(parsed);
      }
    } catch (e) {}

    let isMounted = true;
    async function fetchActivities() {
      try {
        const res = await fetch("/api/activities");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
          const mapped: ArchiveEvent[] = json.data.map((item: any, idx: number) => ({
            id: item.id || item._id?.toString() || `ACT-${idx + 1}`,
            year: item.year === "2025" ? "2025" : "2026",
            shortTitle: item.shortTitle || "",
            title: item.title || "",
            category: item.category || "PHOTOWALK",
            date: item.date || "",
            location: item.location || "",
            description: item.description || "",
            exif: item.exif || "",
            filmStock: item.filmStock || "",
            img:
              item.img && !item.img.startsWith("blob:")
                ? item.img
                : ARCHIVE_DATA[idx]?.img || ARCHIVE_DATA[0].img,
            isUpcoming: Boolean(item.isUpcoming),
          }));
          setArchiveData(mapped);
          try {
            localStorage.setItem("ss_cache_activities", JSON.stringify(mapped));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to load activities from API, using fallback:", err);
      }
    }
    fetchActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredData = useMemo(() => {
    if (activeFilter === "ALL") return archiveData;
    if (activeFilter === "WORK_2026")
      return archiveData.filter((e) => e.year === "2026");
    if (activeFilter === "WORK_2025")
      return archiveData.filter((e) => e.year === "2025");
    if (activeFilter === "UPCOMING")
      return archiveData.filter((e) => e.isUpcoming);
    if (activeFilter === "ARCHIVE")
      return archiveData.filter((e) => !e.isUpcoming);
    return archiveData.filter((e) => e.category === activeFilter);
  }, [activeFilter, archiveData]);

  // Dynamic edition label ("WORKS '25" when viewing 2025, "WORKS '26" otherwise)
  const editionLabel = useMemo(() => {
    if (activeFilter === "WORK_2025") return "WORKS '25";
    if (activeFilter === "WORK_2026") return "WORKS '26";
    const activeItem = filteredData[activeIndex];
    if (isCylinderPhase && activeItem) {
      return `WORKS '${activeItem.year.slice(-2)}`;
    }
    return "WORKS '26";
  }, [activeFilter, activeIndex, filteredData, isCylinderPhase]);

  const resetScrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    const lenis = (
      window as unknown as {
        __lenis?: {
          scrollTo: (target: number, options?: { immediate?: boolean }) => void;
        };
      }
    ).__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
    resetScrollToTop();
  }, [resetScrollToTop]);

  const handleFilterClick = useCallback(
    (filterKey: FilterKey) => {
      if (filterKey === activeFilter) return;
      setActiveIndex(0);
      setIsCylinderPhase(false);
      resetScrollToTop();
      setActiveFilter(filterKey);
    },
    [activeFilter, resetScrollToTop]
  );

  // Jump to a specific item in the 3D cylinder when clicking the right-hand directory
  const scrollToCardIndex = useCallback(
    (targetIdx: number) => {
      const st = stRef.current;
      if (!st || filteredData.length === 0) return;
      const morphEnd = 0.22;
      const maxIdx = Math.max(1, filteredData.length - 1);
      const targetProgress =
        morphEnd + (targetIdx / maxIdx) * (1 - morphEnd);
      const targetScroll =
        st.start + targetProgress * (st.end - st.start);

      const lenis = (
        window as unknown as {
          __lenis?: {
            scrollTo: (
              target: number,
              options?: { immediate?: boolean; duration?: number }
            ) => void;
          };
        }
      ).__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(targetScroll, { duration: 1.1 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    },
    [filteredData.length]
  );

  // Lock background scroll when modal is open
  useEffect(() => {
    const lenis = (
      window as unknown as {
        __lenis?: { stop: () => void; start: () => void };
      }
    ).__lenis;

    if (activeModalEvent) {
      if (lenis && typeof lenis.stop === "function") lenis.stop();
      document.body.style.overflow = "hidden";
    } else {
      if (lenis && typeof lenis.start === "function") lenis.start();
      document.body.style.overflow = "";
    }

    return () => {
      if (lenis && typeof lenis.start === "function") lenis.start();
      document.body.style.overflow = "";
    };
  }, [activeModalEvent]);

  // Modal Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModalEvent || filteredData.length === 0) return;
      if (e.key === "Escape") {
        setActiveModalEvent(null);
      } else if (e.key === "ArrowRight") {
        const currIdx = filteredData.findIndex(
          (ev) => ev.id === activeModalEvent.id
        );
        const nextIdx = (currIdx + 1) % filteredData.length;
        setActiveModalEvent(filteredData[nextIdx]);
      } else if (e.key === "ArrowLeft") {
        const currIdx = filteredData.findIndex(
          (ev) => ev.id === activeModalEvent.id
        );
        const prevIdx =
          (currIdx - 1 + filteredData.length) % filteredData.length;
        setActiveModalEvent(filteredData[prevIdx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalEvent, filteredData]);

  // =========================================================================
  // MASTER 3D HEXAGON -> VERTICAL CYLINDER ROLODEX ENGINE
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const easeInOut = gsap.parseEase("power3.inOut");
    const easeOut = gsap.parseEase("power2.out");
    const morphEnd = 0.22; // First 22% of scroll morphs Hexagon -> 3D Cylinder

    let lastActiveIdx = -1;
    let lastCylinderPhase = false;

    const renderScene = (progress: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;
      const total = filteredData.length;

      // Clean, responsive card dimensions calibrated for all laptop and desktop screens
      const cardW = isMobile
        ? Math.min(260, vw * 0.65)
        : Math.min(300, Math.max(240, Math.min(vw * 0.20, vh * 0.29)));
      const cardH = cardW * 0.635;

      // Circular radial separation: cards form a true, balanced circle around WORKS '26
      const circleBase = isMobile
        ? Math.min(vw * 0.35, vh * 0.28, 170)
        : Math.min(vw * 0.23, vh * 0.30, 260);
      const hexRadiusX = circleBase * (isMobile ? 1.05 : 1.08);
      const hexRadiusY = circleBase;

      // 3D Vertical Cylinder radius
      const cylRadius = isMobile
        ? Math.min(210, vh * 0.26)
        : Math.min(270, vh * 0.32);

      // Optical stage offset so top frames clear the filter bar cleanly
      const stageOffsetY = isMobile ? 12 : 20;

      // Compute morph factor `t` (0 = Pure Hexagon, 1 = Pure 3D Cylinder)
      const rawMorph = Math.min(1, Math.max(0, progress / morphEnd));
      const t = easeInOut(rawMorph);

      // Compute continuous wheel index along the 3D cylinder
      const cylProgress =
        progress <= morphEnd
          ? 0
          : (progress - morphEnd) / Math.max(0.0001, 1 - morphEnd);
      const wheelIndex = cylProgress * Math.max(0, total - 1);

      const currentIdx = Math.min(
        total - 1,
        Math.max(0, Math.round(wheelIndex))
      );
      if (currentIdx !== lastActiveIdx) {
        lastActiveIdx = currentIdx;
        setActiveIndex(currentIdx);
      }

      const inCyl = rawMorph > 0.68;
      if (inCyl !== lastCylinderPhase) {
        lastCylinderPhase = inCyl;
        setIsCylinderPhase(inCyl);
      }

      // 1. Animate Top-Left "ACTIVITY ARCHIVE" banner
      if (topBannerRef.current) {
        const bannerProgress = easeOut(Math.min(1, progress / 0.12));
        topBannerRef.current.style.transform = `translate3d(0, ${
          -bannerProgress * 50
        }px, 0)`;
        topBannerRef.current.style.opacity = `${1 - bannerProgress}`;
      }

      // 2. Animate Center "WORKS '26 / '25" Hexagon Core Label
      if (centerWorksRef.current) {
        const centerFade = easeOut(Math.min(1, progress / 0.15));
        centerWorksRef.current.style.transform = `translate3d(0, ${stageOffsetY}px, 0) scale(${
          1 - centerFade * 0.18
        })`;
        centerWorksRef.current.style.opacity = `${1 - centerFade}`;
      }

      // 3. Animate Left Active Title Column
      if (leftTitleWrapRef.current) {
        const leftShow = easeOut(
          Math.min(1, Math.max(0, (rawMorph - 0.55) / 0.45))
        );
        leftTitleWrapRef.current.style.opacity = `${leftShow}`;
        leftTitleWrapRef.current.style.transform = `translate3d(${
          (1 - leftShow) * -28
        }px, 0, 0)`;
      }

      // 4. Position every card in 3D space
      for (let i = 0; i < total; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // --- STATE A: 2D HEXAGONAL APERTURE RING ---
        let hexX = 0;
        let hexY = vh * 0.9;
        let hexZ = -220;
        let hexRotX = 0;
        let hexRotZ = 0;
        let hexScale = 0.75;
        let hexOpacity = 0;

        if (i < 6) {
          const spinOffsetDeg = rawMorph * 15;
          const angleDeg = HEX_ANGLES_DEG[i] + spinOffsetDeg;
          const angleRad = (angleDeg * Math.PI) / 180;

          hexX = Math.cos(angleRad) * hexRadiusX;
          hexY = Math.sin(angleRad) * hexRadiusY + stageOffsetY;
          hexZ = 0;
          hexRotX = 0;
          hexRotZ = HEX_ROTATIONS_DEG[i] + spinOffsetDeg;
          hexScale = 1.0;
          hexOpacity = 1;
        }

        // --- STATE B: 3D VERTICAL CYLINDER (ROLODEX) ---
        const delta = i - wheelIndex;
        const clampedDelta = Math.max(-2.2, Math.min(2.2, delta));
        const drumAngleDeg = clampedDelta * 52;
        const drumAngleRad = (drumAngleDeg * Math.PI) / 180;

        const cylX = 0;
        const cylY = Math.sin(drumAngleRad) * cylRadius + stageOffsetY;
        const cylZ = (Math.cos(drumAngleRad) - 1) * 220;
        const cylRotX = -drumAngleDeg;
        const cylRotZ = 0;

        // Scale for cylinder frames
        const distFromCenter = Math.abs(delta);
        const cylScale = isMobile
          ? Math.max(0.92, 1.20 - distFromCenter * 0.2)
          : Math.max(0.95, 1.30 - distFromCenter * 0.25);

        // Cylinder opacity: smoothly fades cards before they ever reach an edge-on angle
        let cylOpacity = 0;
        if (distFromCenter <= 0.5) {
          cylOpacity = 1;
        } else if (distFromCenter <= 1.0) {
          cylOpacity = 1 - (distFromCenter - 0.5) * 0.35;
        } else if (distFromCenter < 1.25) {
          cylOpacity = (1 - (distFromCenter - 1.0) / 0.25) * 0.75;
        } else {
          cylOpacity = 0;
        }

        // --- LERP BETWEEN HEXAGON (t=0) AND CYLINDER (t=1) ---
        // During pure aperture (t <= 0.25), only cards 0-5 exist; cards >= 6 remain completely hidden
        const activeHexOpacity = i < 6 ? hexOpacity : 0;
        const activeCylOpacity = rawMorph > 0.25 ? cylOpacity : 0;

        const x = hexX + (cylX - hexX) * t;
        const y = hexY + (cylY - hexY) * t;
        const z = hexZ + (cylZ - hexZ) * t;
        const rotX = hexRotX + (cylRotX - hexRotX) * t;
        const rotZ = hexRotZ + (cylRotZ - hexRotZ) * t;
        const scale = hexScale + (cylScale - hexScale) * t;
        const opacity =
          activeHexOpacity + (activeCylOpacity - activeHexOpacity) * t;

        const finalOpacity = Math.max(0, Math.min(1, opacity));
        el.style.width = `${cardW}px`;
        el.style.height = `${cardH}px`;
        el.style.marginLeft = `${-cardW / 2}px`;
        el.style.marginTop = `${-cardH / 2}px`;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
          2
        )}px, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(
          2
        )}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = `${finalOpacity.toFixed(3)}`;
        el.style.zIndex = `${Math.round(100 - distFromCenter * 25)}`;

        // Complete visibility toggling eradicates all smear artifacts, edge-on lines & phantom drop shadows
        if (finalOpacity <= 0.01) {
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        } else {
          el.style.visibility = "visible";
          el.style.pointerEvents = finalOpacity > 0.25 ? "auto" : "none";
        }
      }
    };

    renderScene(0);

    const totalScrollVh = Math.max(340, filteredData.length * 48);

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: () => `+=${Math.round((window.innerHeight * totalScrollVh) / 100)}`,
      pin: true,
      scrub: 0.85,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        renderScene(self.progress);
      },
      onRefresh: (self) => {
        renderScene(self.progress);
      },
    });

    stRef.current = st;

    const handleResize = () => {
      renderScene(st.progress);
    };
    window.addEventListener("resize", handleResize);

    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      st.kill();
      stRef.current = null;
    };
  }, [filteredData]);

  const currentEvent = filteredData[activeIndex] || filteredData[0];

  return (
    <SmoothScroller>
      <main className="relative w-full min-h-screen bg-[#F5F4F0] text-[#141413] overflow-x-clip selection:bg-[#141413] selection:text-[#F5F4F0]">
        {/* Subtle Paper Grain Texture */}
        <div
          className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage:
              "url('/noise.svg')",
          }}
        />

        {/* ============================================================
            MASTER PINNED STAGE (100VH)
            ============================================================ */}
        <div
          ref={containerRef}
          className="relative w-full h-screen overflow-hidden select-none"
        >
          {/* ---------------------------------------------------------
              1. TOP-LEFT EDITORIAL RETURN LINK
              --------------------------------------------------------- */}
          <Link
            href="/#scene-activity-showcase"
            className="group fixed top-[112px] sm:top-[118px] left-5 sm:left-10 z-40 inline-flex items-center gap-2 py-1 px-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-bold text-[#141413] hover:text-[#B8860B] transition-colors"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span>RETURN HOME</span>
          </Link>

          {/* ---------------------------------------------------------
              2. TOP-CENTER MINIMAL FILTER BAR
              --------------------------------------------------------- */}
          <div className="fixed top-[64px] sm:top-[68px] md:top-[72px] left-1/2 -translate-x-1/2 z-40 flex items-center justify-start sm:justify-center gap-2 sm:gap-4 md:gap-5 px-4 sm:px-6 py-1.5 rounded-full bg-[#F5F4F0]/90 backdrop-blur-md border border-[#141413]/10 max-w-[92vw] overflow-x-auto no-scrollbar shadow-xs">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleFilterClick(filter.value)}
                  className={`font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase transition-colors cursor-pointer shrink-0 py-0.5 ${
                    isActive
                      ? "text-[#141413] font-bold border-b border-[#141413]"
                      : "text-[#141413]/45 hover:text-[#141413]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* ---------------------------------------------------------
              3. TOP-LEFT EDITORIAL HEADER (Unclipped & cleanly aligned)
              --------------------------------------------------------- */}
          <div
            ref={topBannerRef}
            className="pointer-events-none fixed top-[148px] sm:top-[156px] left-5 sm:left-10 z-20 will-change-transform"
          >
            <span className="block font-mono text-[9px] sm:text-[9.5px] tracking-[0.26em] uppercase text-[#141413]/50 mb-1">
              CHRONOLOGICAL EXHIBITION // {editionLabel}
            </span>
            <h1 className="font-heading text-xl sm:text-2xl md:text-[28px] font-black uppercase tracking-[-0.03em] text-[#141413] leading-none">
              ACTIVITY ARCHIVE
            </h1>
          </div>

          {/* ---------------------------------------------------------
              3. CENTER HEXAGON CORE LABEL ("WORKS '26" / "WORKS '25")
              --------------------------------------------------------- */}
          <div
            ref={centerWorksRef}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center will-change-transform"
          >
            <span className="font-sans text-lg sm:text-2xl md:text-[26px] font-medium tracking-[0.18em] uppercase text-[#141413]">
              {editionLabel}
            </span>
            <span className="mt-3 w-4 h-4 rounded-full border border-[#141413]/30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#141413]/65" />
            </span>
          </div>

          {/* ---------------------------------------------------------
              4. LEFT COLUMN: ACTIVE PROJECT TITLE (Appears in Cylinder Phase)
              --------------------------------------------------------- */}
          <div
            ref={leftTitleWrapRef}
            style={{ opacity: 0 }}
            className="pointer-events-none absolute left-5 sm:left-10 md:left-14 top-1/2 -translate-y-1/2 z-30 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] will-change-transform"
          >
            {currentEvent && (
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-[#141413]/45">
                  {currentEvent.category} // {currentEvent.date}
                </span>
                <h2 className="font-sans text-lg sm:text-2xl md:text-[28px] font-medium uppercase tracking-[0.08em] text-[#141413] leading-tight">
                  {currentEvent.shortTitle}
                </h2>
                <span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#141413]/55 mt-1">
                  {currentEvent.filmStock} · {currentEvent.exif}
                </span>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------
              5. RIGHT COLUMN: COMPACT VERTICAL INDEX DIRECTORY (All contents visible)
              --------------------------------------------------------- */}
          <aside className="hidden lg:flex flex-col items-end justify-center fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 text-right max-h-[82vh] overflow-y-auto no-scrollbar py-2">
            <span className="font-mono text-[9px] font-bold tracking-[0.24em] uppercase text-[#141413]/70 mb-2">
              {editionLabel}
            </span>
            <ul className="flex flex-col gap-1">
              {filteredData.map((ev, idx) => {
                const isCurrent = isCylinderPhase && idx === activeIndex;
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => scrollToCardIndex(idx)}
                      className={`font-sans text-[9.5px] lg:text-[10px] leading-tight tracking-[0.02em] transition-all duration-200 cursor-pointer block max-w-[210px] truncate ${
                        isCurrent
                          ? "text-[#141413] font-bold -translate-x-1"
                          : "text-[#141413]/40 hover:text-[#141413] font-normal"
                      }`}
                    >
                      {ev.title.split("—")[0].trim()}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* ---------------------------------------------------------
              6. 3D STAGE: HEXAGONAL APERTURE -> 3D VERTICAL CYLINDER
              --------------------------------------------------------- */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              perspective: "1200px",
              transformStyle: "preserve-3d",
            }}
          >
            {filteredData.map((event, idx) => {
              const isCenteredCard = isCylinderPhase && idx === activeIndex;
              return (
                <div
                  key={event.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (isCylinderPhase && idx !== activeIndex) {
                      scrollToCardIndex(idx);
                    } else {
                      setActiveModalEvent(event);
                    }
                  }}
                  className="absolute top-1/2 left-1/2 cursor-pointer will-change-transform group"
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Editorial Card Surface */}
                  <div className="relative w-full h-full rounded-[12px] overflow-hidden bg-white border border-black/10 shadow-[0_24px_55px_rgba(20,20,19,0.18)] transition-shadow duration-300 group-hover:shadow-[0_30px_70px_rgba(20,20,19,0.28)]">
                    <Image
                      src={event.img}
                      alt={event.title}
                      fill
                      unoptimized
                      sizes="520px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Subtle Editorial Gradient & Micro-HUD */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

                    {/* Top Bar inside Card */}
                    <div className="absolute top-3 inset-x-3.5 flex items-center justify-between pointer-events-none">
                      <span className="font-mono text-[8px] sm:text-[8.5px] tracking-[0.2em] uppercase px-2 py-0.5 rounded bg-white/90 text-[#141413] font-semibold">
                        {event.date}
                      </span>
                      {event.isUpcoming && (
                        <span className="font-mono text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 rounded bg-[#EF4444] text-white font-bold">
                          UPCOMING
                        </span>
                      )}
                    </div>

                    {/* Bottom Caption inside Card */}
                    <div className="absolute bottom-3 inset-x-3.5 flex items-end justify-between gap-2 pointer-events-none">
                      <div className="min-w-0">
                        <span className="block font-mono text-[8px] tracking-[0.2em] uppercase text-white/75">
                          {event.category}
                        </span>
                        <h3 className="font-serif text-sm sm:text-base md:text-[17px] text-white font-normal truncate">
                          {event.title}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-mono tracking-[0.16em] uppercase transition-opacity ${
                          isCenteredCard
                            ? "bg-white text-[#141413] opacity-100"
                            : "bg-black/60 text-white/80 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        OPEN ↗
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------------------------------------------------------
              7. BOTTOM CENTER SCROLL INDICATOR
              --------------------------------------------------------- */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 font-mono text-[9.5px] tracking-[0.26em] uppercase text-[#141413]/50">
            <span>
              {isCylinderPhase
                ? `FRAME ${String(activeIndex + 1).padStart(2, "0")} / ${String(
                    filteredData.length
                  ).padStart(2, "0")} — CLICK CENTER CARD TO INSPECT`
                : "[ SCROLL TO FOLD ARCHIVE ]"}
            </span>
          </div>
        </div>

        {/* =========================================================
            ACTIVITY EXPANSIVE LIGHTBOX MODAL (Matched to Screenshot 2)
            ========================================================= */}
        {activeModalEvent && (() => {
          const currIdx = filteredData.findIndex((ev) => ev.id === activeModalEvent.id);
          const themeIndex = currIdx >= 0 ? currIdx : 0;
          const themeBg = [
            "#00C7E6", // Vivid Cyan (matches Screenshot 2)
            "#F5B700", // Warm Gold
            "#00C781", // Vibrant Emerald
            "#7B68EE", // Periwinkle / Violet
            "#FF6B6B", // Coral
            "#FFAB00", // Amber
          ][themeIndex % 6];

          return (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setActiveModalEvent(null)}
              style={{ padding: "20px" }}
              className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-auto"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ padding: "36px 32px" }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar bg-white text-[#172B4D] rounded-2xl shadow-[0_35px_90px_rgba(0,0,0,0.75)] flex flex-col md:flex-row items-center md:items-start gap-8"
              >
                {/* Top-Right Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveModalEvent(null)}
                  aria-label="Close Activity Details"
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-[#172B4D] text-[#172B4D] hover:text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>

                {/* Left Column: Pop-Out Portrait Frame + Name & Title */}
                <div className="w-56 sm:w-64 shrink-0 flex flex-col items-center text-center">
                  <div className="relative w-full aspect-[3/3.6] flex items-end justify-center overflow-visible">
                    <div
                      style={{
                        backgroundColor: themeBg,
                      }}
                      className="absolute inset-x-0 bottom-0 h-[72%] rounded-xl overflow-hidden shadow-md"
                    >
                      <div
                        className="absolute -top-6 -left-6 w-28 h-28 opacity-80 pointer-events-none"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(17,24,39,0.22) 0px, rgba(17,24,39,0.22) 5px, transparent 5px, transparent 11px)",
                        }}
                      />
                    </div>

                    <div className="relative z-10 w-[88%] h-[98%] rounded-xl overflow-hidden shadow-xl bg-[#0F172A] flex items-center justify-center">
                      {/* Ambient blur fill so letterbox borders look photographic */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
                        <Image
                          src={activeModalEvent.img}
                          alt=""
                          fill
                          sizes="200px"
                          className="object-cover blur-md scale-110"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                      </div>

                      {/* Full uncropped image */}
                      <div className="relative w-full h-full flex items-center justify-center p-1.5">
                        <Image
                          src={activeModalEvent.img}
                          alt={activeModalEvent.title}
                          fill
                          unoptimized
                          sizes="300px"
                          className="object-contain drop-shadow-md"
                        />
                      </div>
                    </div>
                  </div>

                  <h3
                    style={{ marginTop: "16px" }}
                    className="font-heading font-bold text-base sm:text-lg text-[#172B4D] leading-tight px-2"
                  >
                    {activeModalEvent.shortTitle || activeModalEvent.title.split("—")[0].trim()}
                  </h3>
                  <span
                    style={{ marginTop: "4px" }}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#0052CC] font-bold"
                  >
                    {activeModalEvent.category} · {activeModalEvent.isUpcoming ? "UPCOMING" : "ARCHIVE"}
                  </span>
                </div>

                {/* Right Column: Narrative Bio & Department Details */}
                <div className="flex-1 flex flex-col justify-center text-left">
                  <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-slate-400 font-bold">
                    SHUTTERSCAPE {activeModalEvent.category} & ARCHIVE
                  </span>
                  <h4
                    style={{ marginTop: "6px" }}
                    className="font-serif text-2xl sm:text-3xl text-[#172B4D] font-normal leading-snug"
                  >
                    {activeModalEvent.title}
                  </h4>
                  <p
                    style={{ marginTop: "4px" }}
                    className="font-mono text-xs text-[#0052CC] font-semibold"
                  >
                    {activeModalEvent.date} · {activeModalEvent.location}
                  </p>

                  <div
                    style={{ marginTop: "16px", marginBottom: "16px" }}
                    className="w-12 h-[2px] bg-[#F5B700]"
                  />

                  <div className="font-body text-sm text-slate-600 leading-relaxed space-y-3">
                    {renderFormattedDescription(activeModalEvent.description)}
                  </div>

                  <p
                    style={{ marginTop: "12px" }}
                    className="font-body text-xs text-slate-500 leading-relaxed"
                  >
                    Captured on {activeModalEvent.filmStock} · {activeModalEvent.exif}
                  </p>

                  {/* Navigation controls */}
                  <div
                    style={{ marginTop: "20px", paddingTop: "14px" }}
                    className="border-t border-slate-100 flex items-center justify-between font-mono text-[10px] tracking-[0.18em]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx =
                          (currIdx - 1 + filteredData.length) % filteredData.length;
                        setActiveModalEvent(filteredData[prevIdx]);
                      }}
                      className="text-[#0052CC] hover:underline font-bold cursor-pointer py-1"
                    >
                      ← PREV EVENT
                    </button>

                    <span className="text-slate-400 text-[9.5px]">
                      {currIdx + 1} OF {filteredData.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = (currIdx + 1) % filteredData.length;
                        setActiveModalEvent(filteredData[nextIdx]);
                      }}
                      className="text-[#0052CC] hover:underline font-bold cursor-pointer py-1"
                    >
                      NEXT EVENT →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </SmoothScroller>
  );
}
