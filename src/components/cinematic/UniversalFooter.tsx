// src/components/cinematic/UniversalFooter.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UniversalFooter() {
  const pathname = usePathname();

  // Do not render the public universal footer inside the Admin CMS portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer
      id="shutterscape-universal-footer"
      className={`relative z-30 w-full bg-[#FFFFFF] text-[#0A0A0A] border-t border-black/10 overflow-hidden select-none ${
        pathname === "/" ? "hidden lg:block" : "block"
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        #shutterscape-universal-footer {
          padding-top: 56px !important;
          padding-bottom: 32px !important;
          padding-left: clamp(20px, 5vw, 64px) !important;
          padding-right: clamp(20px, 5vw, 64px) !important;
          background-color: #FFFFFF !important;
          color: #0A0A0A !important;
        }
      `,
        }}
      />

      {/* ============================================================
          ATMOSPHERIC MOUNTAIN LANDSCAPE BACKGROUND
          Increased brightness with gentle optical blur for dreamy depth & text legibility
          ============================================================ */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none opacity-[0.16] mix-blend-multiply filter blur-[2px] scale-105"
        style={{
          backgroundImage:
            "url('/images/gcu-campus-anime.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 65%",
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
        }}
      />

      {/* ============================================================
          OVERLAPPING CREATIVE TRANSPARENT WATERMARK: "SHUTTERSCAPE"
          Enlarged, bold, capital letters spanning across the background
          ============================================================ */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 select-none px-2"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 210"
          className="w-full max-w-[1500px] h-auto text-black/[0.045] overflow-visible"
          fill="currentColor"
        >
          <text
            x="50%"
            y="56%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily="var(--font-sora), sans-serif"
            fontWeight="900"
            letterSpacing="0.04em"
            fontSize="172"
          >
            SHUTTERSCAPE
          </text>
        </svg>
      </div>

      {/* Ambient Subtle Warm Gold Gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(212, 168, 67, 0.05) 0%, transparent 70%)",
        }}
      />

      {/* ============================================================
          FRAMELESS, BORDERLESS EDITORIAL CONTENT
          ============================================================ */}
      <div className="relative z-10 max-w-[1440px] mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start justify-between">
          {/* COLUMN 1: DUAL LOGOS (SHUTTERSCAPE + GCU CLOSE TOGETHER) & EMAIL (4 Cols) */}
          <div className="md:col-span-4 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {/* ShutterScape Official Logo */}
              <Link className="flex items-center group shrink-0" href="/">
                <div className="relative h-7 w-[64px] sm:w-[72px]">
                  <Image
                    alt="ShutterScape Logo"
                    className="object-contain object-left"
                    fill
                    src="/images/shutterscape-logo.png"
                    unoptimized
                  />
                </div>
              </Link>

              <span className="h-5 w-[1px] bg-black/20 shrink-0" />

              {/* GCU Official University Logo */}
              <a
                href="https://gcuniversity.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center group shrink-0"
                title="Girijananda Chowdhury University"
              >
                <div className="relative h-7 w-[96px] sm:w-[105px]">
                  <Image
                    alt="Girijananda Chowdhury University Logo"
                    className="object-contain object-left"
                    fill
                    src="/images/gcu-logo-black-text.png"
                    unoptimized
                  />
                </div>
              </a>
            </div>

            <p className="font-body text-xs text-black/65 leading-relaxed max-w-sm">
              The official visual archive and analog-inspired photography society of Girijananda Chowdhury University.
            </p>

            {/* Official Club Email */}
            <div style={{ marginTop: "2px" }}>
              <span className="block font-mono text-[9px] tracking-[0.22em] uppercase text-black/40 mb-1 font-semibold">
                OFFICIAL DESK & INQUIRIES
              </span>
              <a
                href="mailto:shutterscape@gcuniversity.ac.in"
                className="inline-flex items-center gap-2 font-mono text-xs text-[#B8860B] hover:text-black transition-colors font-medium"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 7l-10 7L2 7" />
                </svg>
                <span>shutterscape@gcuniversity.ac.in</span>
              </a>
            </div>
          </div>

          {/* COLUMN 2: NAVIGATION & FRAMELESS REAL SOCIAL COMMUNITY LINKS (4 Cols) */}
          <div className="md:col-span-4 flex flex-col justify-between gap-5">
            {/* Quick Navigation Links */}
            <div>
              <span className="block font-mono text-[9px] tracking-[0.24em] uppercase text-black/40 mb-2 font-semibold">
                ARCHIVE DIRECTORY
              </span>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase font-bold">
                <Link className="text-black/70 hover:text-[#B8860B] transition-colors" href="/">
                  Home
                </Link>
                <Link className="text-black/70 hover:text-[#B8860B] transition-colors" href="/gallery">
                  Gallery
                </Link>
                <Link className="text-black/70 hover:text-[#B8860B] transition-colors" href="/activities">
                  Activity
                </Link>
                <Link className="text-black/70 hover:text-[#B8860B] transition-colors" href="/about">
                  About
                </Link>
              </div>
            </div>

            {/* JOIN US — Frameless Social Media Community Links */}
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.26em] uppercase text-[#B8860B] font-bold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
                JOIN US // COMMUNITY
              </span>
              <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                {/* Frameless, Borderless Instagram with Real Logo */}
                <a
                  href="https://www.instagram.com/shutterscape_gcu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 text-[#0A0A0A] hover:text-[#B8860B] font-sans text-xs font-semibold tracking-wide transition-all duration-200"
                >
                  <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform rounded-[5px] shadow-xs" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="instagram-gradient-footer" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FD5949" />
                        <stop offset="25%" stopColor="#D6249F" />
                        <stop offset="50%" stopColor="#833AB4" />
                        <stop offset="100%" stopColor="#405DE6" />
                      </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient-footer)" />
                    <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4z" fill="#FFFFFF" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="#FFFFFF" />
                  </svg>
                  <span className="underline-offset-4 group-hover:underline">Instagram</span>
                  <span className="text-black/35 group-hover:text-[#B8860B] transition-colors text-xs">↗</span>
                </a>

                {/* Frameless, Borderless WhatsApp with Real Logo */}
                <a
                  href="https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 text-[#0A0A0A] hover:text-[#25D366] font-sans text-xs font-semibold tracking-wide transition-all duration-200"
                >
                  <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform shadow-xs" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#25D366" />
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.199 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                  <span className="underline-offset-4 group-hover:underline">Join WhatsApp</span>
                  <span className="text-black/35 group-hover:text-[#25D366] transition-colors text-xs">↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 3: GCU CAMPUS ADDRESS & PROMINENT INTERACTIVE MAP (4 Cols) */}
          <div className="md:col-span-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] tracking-[0.24em] uppercase text-[#B8860B] font-bold">
                  CAMPUS LOCATION
                </span>
                <a
                  href="https://maps.app.goo.gl/NhdHs1u76Bjxo2J87"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] tracking-[0.14em] uppercase text-black/60 hover:text-[#B8860B] font-bold transition-colors inline-flex items-center gap-1"
                >
                  <span>Open Maps</span>
                  <span>↗</span>
                </a>
              </div>
              <p className="font-body text-xs text-black/90 font-semibold leading-snug">
                Girijananda Chowdhury University
              </p>
              <p className="font-body text-[11px] text-black/60 leading-relaxed">
                Hathkhowapara, Azara, Guwahati, Assam 781017
              </p>
            </div>

            {/* Prominent, Generous Interactive Google Map */}
            <a
              href="https://maps.app.goo.gl/NhdHs1u76Bjxo2J87"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Girijananda Chowdhury University in Google Maps"
              className="relative w-full h-[150px] sm:h-[160px] rounded-xl overflow-hidden border border-black/10 group shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(212,168,67,0.18)] transition-all duration-300 block"
            >
              <iframe
                title="GCU Campus Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3582.493527263544!2d91.60334817610196!3d26.11520639391097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375a4ffab238a8e1%3A0xda591cc5a3592bc1!2sGirijananda%20Chowdhury%20University%2C%20Assam!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0 pointer-events-none grayscale-[50%] group-hover:grayscale-0 transition-all duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-[#D4A843] text-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Legal & Personal Touch Credit Strip */}
        <div
          style={{ marginTop: "32px", paddingTop: "20px" }}
          className="border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[9.5px] sm:text-[10px] tracking-[0.16em] text-black/55 uppercase"
        >
          <span>© 2026 SHUTTERSCAPE · GIRIJANANDA CHOWDHURY UNIVERSITY</span>

          {/* Personal Touch: Designed and made with love by Krishnayan */}
          <span className="text-black/80 font-medium inline-flex items-center gap-1.5 normal-case tracking-normal font-sans text-xs">
            <span>Designed and made with</span>
            <span className="text-[#EF4444] text-sm animate-pulse inline-block" title="love">❤</span>
            <span>by <strong className="font-bold text-black">Krishnayan</strong></span>
          </span>

          {/* Codénix Maintenance Link */}
          <a
            href="https://codingclub.gcuniversity.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black/60 hover:text-[#B8860B] transition-colors inline-flex items-center gap-2 font-semibold"
          >
            <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-black/5 border border-black/15">
              <Image
                src="/images/codenix-logo.png"
                alt="Codénix Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span>Website Maintained by Codénix (GCU Coding Club) ↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
