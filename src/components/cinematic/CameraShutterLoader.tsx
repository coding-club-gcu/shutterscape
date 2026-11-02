// src/components/cinematic/CameraShutterLoader.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins immediately to prevent execution failures
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CRITICAL_IMAGE_ASSETS = [
  "/images/gcu-campus-anime.jpg",
  "/images/gcu-campus-sketch.jpg",
  "/images/shutterscape-logo-cropped.png",
  "/images/gcu-logo-black-text.png",
  "/images/codenix-logo.png",
  "/api/media/6ade7b95927760001b6fed1b",
  "/api/media/6ade7bfe927760001b6fed1c",
  "/api/media/6ade7c66d43c2f957e160ddd",
  "/api/media/6ade7dd4c134b1867ef53687",
  "/api/media/6ade74822b808e482f8eb5d7",
];

const CRITICAL_VIDEO_ASSETS = [
  "/videos/mobile-hero-background.mp4",
  "/api/media/6adf9397d782e64ad5ebca9a",
  "/api/media/6ade6c0a40346d3181c85f3a",
];

export default function CameraShutterLoader() {
  const pathname = usePathname();
  const [percent, setPercent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const leftLabelRef = useRef<HTMLDivElement>(null);
  const rightCounterRef = useRef<HTMLDivElement>(null);
  const bracketsWrapRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLSpanElement>(null);
  const reelColumnRef = useRef<HTMLDivElement>(null);
  const topReelFrameRef = useRef<HTMLDivElement>(null);
  const bottomReelFrameRef = useRef<HTMLDivElement>(null);
  const centerWebsitePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("shutter_loader_seen")) {
          setDismissed(true);
          (
            window as unknown as { __shutterLoaderDismissed?: boolean }
          ).__shutterLoaderDismissed = true;
          window.dispatchEvent(new CustomEvent("shutterscape:loader-complete"));
          return;
        }
      } catch {}
    }

    // 0. Preload critical video & image assets in background while shutter is closed
    if (typeof window !== "undefined") {
      CRITICAL_VIDEO_ASSETS.forEach((vSrc) => {
        try {
          const v = document.createElement("video");
          v.src = vSrc;
          v.preload = "auto";
          v.muted = true;
          v.playsInline = true;
          v.load();
        } catch {}
      });

      CRITICAL_IMAGE_ASSETS.forEach((src) => {
        try {
          const img = new Image();
          img.src = src;
          if (img.decode) img.decode().catch(() => {});
        } catch {}
      });
    }

    // 1. Reset scroll position cleanly
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      const navEntries = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      const isReload =
        navEntries.length > 0
          ? navEntries[0].type === "reload"
          : (performance as unknown as { navigation?: { type: number } })
              .navigation?.type === 1;

      if (isReload || !window.location.hash) {
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        window.scrollTo(0, 0);
      }
    }

    // 2. Subtle mechanical shutter lock sound
    const playShutterLockSound = () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } catch {}
    };

    // 3. TIMELINE SETUP
    const counterObj = { val: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        setDismissed(true);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("shutter_loader_seen", "1");
          } catch {}
          (
            window as unknown as { __shutterLoaderDismissed?: boolean }
          ).__shutterLoaderDismissed = true;
          window.dispatchEvent(new CustomEvent("shutterscape:loader-complete"));
          ScrollTrigger.refresh();
        }
      },
    });

    if (reelColumnRef.current) {
      gsap.set(reelColumnRef.current, { y: "38vh", opacity: 0 });
    }

    // Count from 000 to 100 PERCENT over 1.75s
    tl.to(
      counterObj,
      {
        val: 100,
        duration: 1.75,
        ease: "power2.inOut",
        onUpdate: () => {
          setPercent(Math.round(counterObj.val));
        },
      },
      0
    );

    if (crosshairRef.current) {
      tl.to(
        crosshairRef.current,
        {
          opacity: 0,
          scale: 0.5,
          duration: 0.25,
          ease: "power2.out",
        },
        0.35
      );
    }

    if (reelColumnRef.current) {
      tl.to(
        reelColumnRef.current,
        {
          y: "0vh",
          opacity: 1,
          duration: 1.15,
          ease: "expo.out",
          onStart: () => playShutterLockSound(),
        },
        0.35
      );
    }

    if (topReelFrameRef.current) {
      tl.to(
        topReelFrameRef.current,
        {
          y: -60,
          opacity: 0,
          duration: 0.45,
          ease: "power3.in",
        },
        1.65
      );
    }

    if (bottomReelFrameRef.current) {
      tl.to(
        bottomReelFrameRef.current,
        {
          y: 60,
          opacity: 0,
          duration: 0.45,
          ease: "power3.in",
        },
        1.65
      );
    }

    tl.to(
      [
        leftLabelRef.current,
        rightCounterRef.current,
        bracketsWrapRef.current,
      ],
      {
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      },
      1.7
    );

    if (centerWebsitePreviewRef.current) {
      tl.to(
        centerWebsitePreviewRef.current,
        {
          width: "100vw",
          height: "100vh",
          borderRadius: "0px",
          duration: 0.75,
          ease: "expo.inOut",
        },
        1.75
      );
    }

    if (loaderRef.current) {
      tl.to(
        loaderRef.current,
        {
          opacity: 0,
          pointerEvents: "none",
          duration: 0.4,
          ease: "power2.out",
        },
        2.35
      );
    }

    return () => {
      tl.kill();
    };
  }, [pathname]);

  if (dismissed || pathname?.startsWith("/admin")) return null;

  const formattedPercent = String(percent).padStart(3, "0");

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[99999] bg-[#040405] text-white flex items-center justify-center overflow-hidden select-none cursor-default"
      style={{ willChange: "opacity" }}
    >
      {/* Left Telemetry Label */}
      <div
        ref={leftLabelRef}
        className="fixed left-3 sm:left-8 top-1/2 -translate-y-1/2 z-30 font-mono text-[8.5px] sm:text-[10px] tracking-[0.22em] text-white/80 uppercase pointer-events-none"
      >
        [ THE ART OF SHUTTERSCAPE ]
      </div>

      {/* Right Percentage Counter */}
      <div
        ref={rightCounterRef}
        className="fixed right-3 sm:right-8 top-1/2 -translate-y-1/2 z-30 font-mono text-[8.5px] sm:text-[10px] tracking-[0.22em] text-white/80 uppercase pointer-events-none"
      >
        [ {formattedPercent} PERCENT ]
      </div>

      {/* Center Viewfinder Reticle */}
      <div
        ref={bracketsWrapRef}
        style={{
          width: "min(56vw, 420px)",
          height: "min(36vw, 255px)",
          minWidth: "220px",
          minHeight: "145px",
        }}
        className="relative z-20 flex items-center justify-center pointer-events-none"
      >
        <span className="absolute -top-2 -left-2 w-3.5 h-3.5 border-t border-l border-white/75" />
        <span className="absolute -top-2 -right-2 w-3.5 h-3.5 border-t border-r border-white/75" />
        <span className="absolute -bottom-2 -left-2 w-3.5 h-3.5 border-b border-l border-white/75" />
        <span className="absolute -bottom-2 -right-2 w-3.5 h-3.5 border-b border-r border-white/75" />

        <span
          ref={crosshairRef}
          className="font-mono text-sm text-white/75 font-light leading-none"
        >
          +
        </span>
      </div>

      {/* Vertical Filmstrip Column */}
      <div
        ref={reelColumnRef}
        className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div
          ref={topReelFrameRef}
          style={{
            width: "min(44vw, 330px)",
            height: "min(28vw, 195px)",
            minWidth: "175px",
            minHeight: "110px",
          }}
          className="relative overflow-hidden bg-[#111115] opacity-65 shrink-0"
        >
          <img
            src="/images/gcu-campus-sketch.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/api/media/6ade7b95927760001b6fed1b";
            }}
            alt="Archive Frame Top"
            className="w-full h-full object-cover brightness-75"
          />
        </div>

        <div
          ref={centerWebsitePreviewRef}
          style={{
            width: "min(54vw, 405px)",
            height: "min(34vw, 240px)",
            minWidth: "210px",
            minHeight: "136px",
          }}
          className="relative overflow-hidden bg-[#070709] shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center shrink-0"
        >
          <img
            src="/images/gcu-campus-anime.jpg"
            alt="ShutterScape Website Preview"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.58] contrast-[1.08]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,5,7,0.72) 0%, rgba(5,5,7,0.32) 45%, rgba(5,5,7,0.88) 100%)",
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-3">
            <span className="font-mono text-[6px] sm:text-[8px] tracking-[0.24em] uppercase text-[#D4A843] font-bold mb-1">
              EST. 2023 · GCU PHOTOGRAPHY CLUB
            </span>
            <span className="font-serif text-lg sm:text-3xl tracking-[0.06em] uppercase text-white font-normal leading-none">
              SHUTTERSCAPE
            </span>
          </div>
        </div>

        <div
          ref={bottomReelFrameRef}
          style={{
            width: "min(44vw, 330px)",
            height: "min(28vw, 195px)",
            minWidth: "175px",
            minHeight: "110px",
          }}
          className="relative overflow-hidden bg-[#111115] opacity-65 shrink-0"
        >
          <img
            src="/api/media/6ade7bfe927760001b6fed1c"
            alt="Archive Frame Bottom"
            className="w-full h-full object-cover brightness-75"
          />
        </div>
      </div>
    </div>
  );
}
