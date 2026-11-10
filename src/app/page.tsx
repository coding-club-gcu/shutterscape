// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import DesktopOilstainExperience from "@/components/desktop/DesktopOilstainExperience";
import MobileOilstainExperience from "@/components/mobile/MobileOilstainExperience";

export default function Home() {
  const [device, setDevice] = useState<"desktop" | "mobile" | "all">("all");

  useEffect(() => {
    const updateDevice = () => {
      setDevice(window.innerWidth >= 1024 ? "desktop" : "mobile");
    };
    updateDevice();
    window.addEventListener("resize", updateDevice, { passive: true });
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  if (device === "desktop") {
    return <DesktopOilstainExperience />;
  }

  if (device === "mobile") {
    return <MobileOilstainExperience />;
  }

  return (
    <>
      {/* ============================================================
          DESKTOP EXPERIENCE (>= 1024px) - VISUAL & STRUCTURAL TWIN
          ============================================================ */}
      <div className="hidden lg:block">
        <DesktopOilstainExperience />
      </div>

      {/* ============================================================
          MOBILE EXPERIENCE (< 1024px) - 100% UNTOUCHED
          ============================================================ */}
      <div className="block lg:hidden">
        <MobileOilstainExperience />
      </div>
    </>
  );
}
