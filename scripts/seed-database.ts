// scripts/seed-database.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;

// Schemas
const HeroReel = mongoose.models.HeroReel || mongoose.model("HeroReel", new mongoose.Schema({
  frameCode: String, title: String, src: String, exif: String, order: Number
}, { timestamps: true }));

const PullInExhibit = mongoose.models.PullInExhibit || mongoose.model("PullInExhibit", new mongoose.Schema({
  code: String, title: String, subTitle: String, src: String, exif: String, focusDistance: String, headline: String, subhead: String, order: Number
}, { timestamps: true }));

const GalleryFrame = mongoose.models.GalleryFrame || mongoose.model("GalleryFrame", new mongoose.Schema({
  id: String, title: String, category: String, photographer: String, filmStock: String, exif: String, src: String, description: String, location: String, order: Number
}, { timestamps: true }));

const CommitteeMember = mongoose.models.CommitteeMember || mongoose.model("CommitteeMember", new mongoose.Schema({
  name: String, role: String, tier: String, dept: String, img: String, order: Number
}, { timestamps: true }));

const ActivityEvent = mongoose.models.ActivityEvent || mongoose.model("ActivityEvent", new mongoose.Schema({
  shortTitle: String, title: String, category: String, year: String, date: String, location: String, description: String, exif: String, filmStock: String, img: String, isUpcoming: Boolean, order: Number
}, { timestamps: true }));

const MomentsReel = mongoose.models.MomentsReel || mongoose.model("MomentsReel", new mongoose.Schema({
  photographer: String, videoSrc: String, order: Number
}, { timestamps: true }));

const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", new mongoose.Schema({
  username: String, email: String, passwordHash: String, role: String
}, { timestamps: true }));

async function seed() {
  console.log("\n========================================================");
  console.log("🌱 SHUTTERSCAPE — FULL DATABASE SEEDING ENGINE");
  console.log("========================================================\n");

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in .env.local. Please configure your Atlas URI first.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas!");

    // 1. Seed Admin User
    const adminUser = process.env.ADMIN_INIT_USERNAME || "admin";
    const adminPass = process.env.ADMIN_INIT_PASSWORD || "ShutterScape2026!";
    const passwordHash = await bcrypt.hash(adminPass, 12);
    await AdminUser.findOneAndUpdate(
      { username: adminUser },
      { username: adminUser, email: "admin@shutterscape.org", passwordHash, role: "SUPERADMIN" },
      { upsert: true }
    );
    console.log(`✅ Admin account seeded: ${adminUser}`);

    // 2. Seed Hero Reel (6 items)
    const HERO_REEL = [
      { frameCode: "01A", title: "SILENT PEAKS", src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=85", exif: "85MM · F/1.4 · ISO 200", order: 1 },
      { frameCode: "02B", title: "GOLDEN HORIZON", src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=85", exif: "35MM · F/2.0 · 1/1000S", order: 2 },
      { frameCode: "03C", title: "CANYON DRIFT", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=85", exif: "50MM · F/1.8 · RAW", order: 3 },
      { frameCode: "04D", title: "MIST & LIGHT", src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=85", exif: "24MM · F/2.8 · GOLDEN HR", order: 4 },
      { frameCode: "05E", title: "URBAN SOLITUDE", src: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=85", exif: "35MM · F/1.4 · NIGHT", order: 5 },
      { frameCode: "06F", title: "ALPINE CREST", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85", exif: "70MM · F/4.0 · DAWN", order: 6 },
    ];
    for (const h of HERO_REEL) {
      await HeroReel.findOneAndUpdate({ frameCode: h.frameCode }, h, { upsert: true });
    }
    console.log(`✅ Seeded ${HERO_REEL.length} Hero Reel frames`);

    // 3. Seed Pull-In Corridor (8 items)
    const EXHIBITS = [
      { code: "EXHIBIT // 01A", title: "STREET & SHADOWS", subTitle: "Guwahati Dusk", src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=85", exif: "f/2.8 · 1/500s · 35mm · ISO 400", focusDistance: "35MM // 1.2M", headline: "Capturing raw light.", subhead: "Spontaneous moments frozen in urban twilight.", order: 1 },
      { code: "EXHIBIT // 02B", title: "BEHIND THE LENS", subTitle: "Human Portrait", src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=85", exif: "f/1.4 · 1/1000s · 85mm · ISO 160", focusDistance: "85MM // 2.4M", headline: "Telling silent stories.", subhead: "The human gaze captured through vintage prime glass.", order: 2 },
      { code: "EXHIBIT // 03C", title: "BRAHMAPUTRA MIST", subTitle: "Exhibition Landscape", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=85", exif: "f/4.0 · 1/250s · 24mm · ISO 100", focusDistance: "24MM // 3.8M", headline: "Chasing golden hours.", subhead: "Ethereal atmospheric depth along the river banks.", order: 3 },
      { code: "EXHIBIT // 04D", title: "SILENT PEAKS", subTitle: "High Altitude", src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=85", exif: "f/2.0 · 1/2000s · 50mm · ISO 200", focusDistance: "50MM // 5.0M", headline: "Reaching the heights.", subhead: "Towering silhouettes piercing morning cloud cover.", order: 4 },
      { code: "EXHIBIT // 05E", title: "URBAN DRIFT", subTitle: "Street Monochrome", src: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=85", exif: "f/1.8 · 1/250s · 35mm · ISO 800", focusDistance: "35MM // 2.0M", headline: "Observing city cadence.", subhead: "High-contrast shadows cutting across crowded transit hubs.", order: 5 },
      { code: "EXHIBIT // 06F", title: "ALPINE DAWN", subTitle: "Fine Art Landscape", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85", exif: "f/5.6 · 1/125s · 70mm · ISO 64", focusDistance: "70MM // ∞", headline: "Waiting for first warmth.", subhead: "The razor line between pitch darkness and violet dawn.", order: 6 },
      { code: "EXHIBIT // 07G", title: "RACK FOCUS CLINIC", subTitle: "Darkroom Studio", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85", exif: "f/1.4 · 1/800s · 85mm · ISO 100", focusDistance: "85MM // 1.5M", headline: "Isolating the emotion.", subhead: "Deliberate shallow depth turning urban clutter into velvet bokeh.", order: 7 },
      { code: "EXHIBIT // 08H", title: "MONOCHROME RIVERS", subTitle: "Archive Retrospective", src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85", exif: "f/8.0 · 1/60s · 20mm · ISO 50", focusDistance: "20MM // 0.8M", headline: "Freezing living heritage.", subhead: "Archival silver gelatin prints documenting Assam's river lifeline.", order: 8 },
    ];
    for (const e of EXHIBITS) {
      await PullInExhibit.findOneAndUpdate({ code: e.code }, e, { upsert: true });
    }
    console.log(`✅ Seeded ${EXHIBITS.length} Corridor exhibits`);

    // 4. Seed Gallery (25 items)
    const GALLERY = [
      { id: "g-01", title: "Monsoon Over Brahmaputra", category: "DOCUMENTARY", photographer: "Riky", location: "Brahmaputra Riverfront", filmStock: "KODAK TRI-X 400", exif: "35MM · F/2.0", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&q=85", description: "Golden-hour riverfront documentation capturing ferry silhouettes.", order: 1 },
      { id: "g-02", title: "Chiaroscuro Gaze", category: "PORTRAITURE", photographer: "Pratyashi P. Das", location: "GCU Studio Lab", filmStock: "KODAK PORTRA 800", exif: "85MM · F/1.4", src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1400&q=85", description: "High-contrast Xenon strobe portrait exploring deep tonal gradients.", order: 2 },
      { id: "g-03", title: "Himalayan Alpenglow", category: "LANDSCAPE", photographer: "Akash Boro", location: "Eastern Himalayan Ridge", filmStock: "FUJIFILM VELVIA 50", exif: "70MM · F/4.0", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85", description: "Dawn mountain exposure capturing atmospheric cloud compression.", order: 3 },
      { id: "g-04", title: "Brutalist Geometry", category: "ARCHITECTURE", photographer: "Aparna Mishra", location: "GCU Campus Complex", filmStock: "ILFORD HP5 PLUS", exif: "24MM · F/8.0", src: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1400&q=85", description: "Monochrome architectural study dissecting concrete planes.", order: 4 },
      { id: "g-05", title: "Midnight Neon Drift", category: "STREET", photographer: "Tiku Sarkar", location: "Paltan Bazaar By-lanes", filmStock: "CINESTILL 800T", exif: "50MM · F/1.4", src: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1400&q=85", description: "Ambient night capture harnessing the red halation of Cinestill.", order: 5 },
      { id: "g-06", title: "Optics & Refraction", category: "EXPERIMENTAL", photographer: "Bituparna", location: "GCU Optics Clinic", filmStock: "KODAK EKTAR 100", exif: "105MM · F/2.8", src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1400&q=85", description: "Extreme close-up examining manual lens aperture blades.", order: 6 },
      { id: "g-07", title: "Silent Peaks At Dawn", category: "LANDSCAPE", photographer: "Arjun Talukdar", location: "Kamrup Foothills", filmStock: "FUJIFILM PROVIA 100F", exif: "85MM · F/1.4", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85", description: "Minimalist alpine silhouette at first light with atmospheric haze.", order: 7 },
      { id: "g-08", title: "Golden Horizon Ferry", category: "DOCUMENTARY", photographer: "Priyanka Kalita", location: "Umananda Ghat", filmStock: "KODAK GOLD 200", exif: "35MM · F/2.0", src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=85", description: "Commuters boarding the wooden river ferry in golden twilight.", order: 8 },
      { id: "g-09", title: "Urban Solitude", category: "STREET", photographer: "Nayan Jyoti", location: "Panbazar Commercial Zone", filmStock: "ILFORD DELTA 3200", exif: "50MM · F/1.8", src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=85", description: "Quiet contemplative moment amidst evening monsoon traffic.", order: 9 },
      { id: "g-10", title: "Studio Xenon Strobe", category: "PORTRAITURE", photographer: "Meghna Barman", location: "GCU Creative Studio", filmStock: "KODAK PORTRA 400", exif: "85MM · F/2.8", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=85", description: "Crisp architectural studio portrait with razor-sharp catchlights.", order: 10 },
      { id: "g-11", title: "Cantilever Shadows", category: "ARCHITECTURE", photographer: "Debashish Roy", location: "GCU Auditorium Wing", filmStock: "KODAK TRI-X 400", exif: "28MM · F/11", src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", description: "Geometric play of shadow and light dissecting the concrete louvers.", order: 11 },
      { id: "g-12", title: "Lens Flare Dispersion", category: "EXPERIMENTAL", photographer: "Kunal Saikia", location: "Darkroom Studio 02", filmStock: "CINESTILL 50D", exif: "50MM · F/1.2", src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", description: "Prismatic spectral dispersion captured with an uncoated prime lens.", order: 12 },
      { id: "g-13", title: "The Tea Garden Mist", category: "LANDSCAPE", photographer: "Manash Pratim", location: "Upper Assam Estates", filmStock: "FUJIFILM VELVIA 50", exif: "24MM · F/5.6", src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=85", description: "Rolling emerald hills of the tea estates caught in the fog.", order: 13 },
      { id: "g-14", title: "Festival of Colors", category: "DOCUMENTARY", photographer: "Sohaib Hussain", location: "GCU Main Courtyard", filmStock: "KODAK EKTAR 100", exif: "35MM · F/2.8", src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85", description: "Vibrant explosion of gulal captured at high shutter speeds.", order: 14 },
      { id: "g-15", title: "Symmetry in Motion", category: "ARCHITECTURE", photographer: "Hiya Das", location: "Library Spiral Staircase", filmStock: "ILFORD HP5 PLUS", exif: "16MM · F/4.0", src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=85", description: "A vertiginous top-down perspective of the brutalist spiral staircase.", order: 15 },
      { id: "g-16", title: "Midnight Rain Reflections", category: "STREET", photographer: "Imran Farhat", location: "GS Road, Guwahati", filmStock: "CINESTILL 800T", exif: "50MM · F/1.4", src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&q=85", description: "Cinematic puddle reflection capturing headlights and neon signs.", order: 16 },
      { id: "g-17", title: "Analog Chemistry", category: "EXPERIMENTAL", photographer: "Rupankar", location: "Darkroom Studio 01", filmStock: "ILFORD MULTIGRADE", exif: "50MM · F/4.0", src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", description: "Silver particles developing in fixer under safe-light red.", order: 17 },
      { id: "g-18", title: "Monsoon Silhouette", category: "PORTRAITURE", photographer: "Sneha Kalita", location: "GCU Campus Corridors", filmStock: "KODAK GOLD 200", exif: "50MM · F/2.0", src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=85", description: "A quiet moment framed by the brutalist campus architecture.", order: 18 },
      { id: "g-19", title: "Market Chaos", category: "DOCUMENTARY", photographer: "Riky", location: "Fancy Bazaar", filmStock: "KODAK PORTRA 400", exif: "35MM · F/5.6", src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=85", description: "The beautiful, overwhelming chaos of the Sunday morning market.", order: 19 },
      { id: "g-20", title: "Glacial Melt", category: "LANDSCAPE", photographer: "Akash Boro", location: "Tawang Valley", filmStock: "FUJIFILM PROVIA", exif: "16MM · F/8.0", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85", description: "High altitude rivers carving through the rocky moraine.", order: 20 },
      { id: "g-21", title: "Neon Rain", category: "STREET", photographer: "Tiku Sarkar", location: "Christian Basti", filmStock: "CINESTILL 800T", exif: "85MM · F/1.4", src: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=85", description: "A lone figure illuminated by the glow of a pharmacy sign in the rain.", order: 21 },
      { id: "g-22", title: "Concrete Ribs", category: "ARCHITECTURE", photographer: "Debashish Roy", location: "Admin Block", filmStock: "ILFORD HP5 PLUS", exif: "24MM · F/8.0", src: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85", description: "The skeletal structure of the unfinished new academic wing.", order: 22 },
      { id: "g-23", title: "Abstract Motion", category: "EXPERIMENTAL", photographer: "Bituparna", location: "Highway 37", filmStock: "KODAK EKTAR", exif: "50MM · 2S", src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", description: "Intentional camera movement (ICM) creating a canvas of light streaks.", order: 23 },
      { id: "g-24", title: "Valley of the Sun", category: "LANDSCAPE", photographer: "Arjun Talukdar", location: "Meghalaya Border", filmStock: "FUJIFILM VELVIA 50", exif: "35MM · F/11", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85", description: "The sun piercing through the dense canopy of the living root bridges.", order: 24 },
      { id: "g-25", title: "Final Exposure", category: "DOCUMENTARY", photographer: "ShutterScape Archive", location: "Assam, India", filmStock: "VARIOUS EMULSIONS", exif: "VARIOUS", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85", description: "The culmination of a year of storytelling through the lens.", order: 25 },
    ];
    for (const g of GALLERY) {
      await GalleryFrame.findOneAndUpdate({ title: g.title }, g, { upsert: true });
    }
    console.log(`✅ Seeded ${GALLERY.length} Gallery frames`);

    // 5. Seed Committee (17 items)
    const COMMITTEE = [
      { name: "Dr. Sangeeta Das", role: "Coordinator", dept: "Dept. of Mechanical Engineering", tier: "MENTOR", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800", order: 1 },
      { name: "Dr. Barsha Chhetri", role: "Co-Coordinator", dept: "Assistant Professor & Head (i/c) Dept. of Education", tier: "MENTOR", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800", order: 2 },
      { name: "Uttama Purkayastha", role: "PRESIDENT", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800", order: 3 },
      { name: "Ikhyt De Neog", role: "VICE-PRESIDENT", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800", order: 4 },
      { name: "Richita Sarma", role: "SECRETARY", dept: "Executive Board", tier: "LEAD", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800", order: 5 },
      { name: "Sohaib Hussain", role: "Core Committee", dept: "Photography Lead", tier: "CORE", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600", order: 6 },
      { name: "Mahadananda Dutta", role: "Core Committee", dept: "Darkroom Specialist", tier: "CORE", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600", order: 7 },
      { name: "Manash Pratim Sarma", role: "Core Committee", dept: "Logistics Lead", tier: "CORE", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600", order: 8 },
      { name: "Mubina Ahmed", role: "Core Committee", dept: "Documentation", tier: "CORE", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600", order: 9 },
      { name: "Pratyush B. Choudhury", role: "Core Committee", dept: "Archival Curator", tier: "CORE", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600", order: 10 },
      { name: "Hiya Das", role: "Core Committee", dept: "Visual Design", tier: "CORE", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600", order: 11 },
      { name: "Dheemaan Deka", role: "Founding Visionary", dept: "Founders Council", tier: "FOUNDER", img: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?q=80&w=800", order: 12 },
      { name: "Subhrajyoti Goswami", role: "Founding Visionary", dept: "Founders Council", tier: "FOUNDER", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800", order: 13 },
      { name: "Riky", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800", order: 14 },
      { name: "Pratyashi P. Das", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800", order: 15 },
      { name: "Akash Boro", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800", order: 16 },
      { name: "Aparna Mishra", role: "Legacy Lead", dept: "Alumni Council", tier: "LEGACY", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800", order: 17 },
    ];
    for (const c of COMMITTEE) {
      await CommitteeMember.findOneAndUpdate({ name: c.name }, c, { upsert: true });
    }
    console.log(`✅ Seeded ${COMMITTEE.length} Committee members`);

    // 6. Seed Activities (24 items)
    const ACTIVITIES = [
      { shortTitle: "BRAHMAPUTRA 4.0", title: "Brahmaputra Heritage Photowalk 4.0", category: "PHOTOWALK", year: "2026", date: "NOV 14, 2026", location: "Riverfront, Guwahati", description: "Golden-hour riverfront documentation exploring ferry silhouettes, twilight reflections, and colonial architecture. Open to all students.", exif: "35MM · F/2.0 · 1/1000S", filmStock: "KODAK PORTRA 400", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", isUpcoming: true, order: 1 },
      { shortTitle: "XENON STROBE LAB", title: "Mastering Manual Optics & Xenon Strobe", category: "WORKSHOP", year: "2026", date: "OCT 04, 2026", location: "GCU Media Lab", description: "Hands-on technical clinic covering aperture control, high-speed sync flash, and Chiaroscuro portrait lighting setups.", exif: "85MM · F/1.4 · 1/250S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 2 },
      { shortTitle: "FRAMES BEYOND TIME", title: "Frames Beyond Time — Annual Print Salon", category: "EXHIBITION", year: "2026", date: "AUG 22, 2026", location: "Auditorium Gallery Wing", description: "Curated 100-frame showcase celebrating student street, portrait, and brutalist architecture documentation across Northeast India.", exif: "24MM · F/8.0 · 1/125S", filmStock: "FUJIFILM VELVIA 50", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85", order: 3 },
      { shortTitle: "CHIAROSCURO '26", title: "Chiaroscuro — National Street Championship", category: "COMPETITION", year: "2026", date: "APR 18, 2026", location: "Campus Main Quad", description: "High-stakes 6-hour live photo sprint tasking 120 photographers with capturing high-contrast light, architecture, and fleeting human gestures.", exif: "50MM · F/1.8 · 1/500S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", order: 4 },
      { shortTitle: "MIST & OPTICS", title: "Mist, Avian Optics & Telephoto Study", category: "PHOTOWALK", year: "2026", date: "FEB 08, 2026", location: "Deepor Beel Ramsar Site", description: "Early dawn telephoto clinic documenting migratory avian fauna, water refractions, and wetland conservation ecosystems.", exif: "400MM · F/4.5 · 1/2000S", filmStock: "KODAK EKTAR 100", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=85", order: 5 },
      { shortTitle: "EASTERN ALPENGLOW", title: "Eastern Himalayan Alpenglow Field Study", category: "PHOTOWALK", year: "2026", date: "NOV 28, 2026", location: "Kamrup Foothills", description: "Extreme low-temperature exposure expedition mastering gradated ND filters, long exposures, and morning mountain mist.", exif: "21MM · F/11 · 30S", filmStock: "FUJIFILM PROVIA 100F", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85", isUpcoming: true, order: 6 },
      { shortTitle: "NOCTURNAL NEON", title: "Nocturnal Neon & Rain Reflections Clinic", category: "WORKSHOP", year: "2026", date: "JUL 12, 2026", location: "Paltan Bazaar By-Lanes", description: "Night-photography clinic focusing on high-ISO tungsten balance, handheld primes, and reflections across wet pavement.", exif: "50MM · F/1.4 · 1/160S", filmStock: "CINESTILL 800T", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=85", order: 7 },
      { shortTitle: "MONSOON RIVERS", title: "Monsoon Over Brahmaputra Documentary", category: "EXHIBITION", year: "2026", date: "JUN 05, 2026", location: "State Art Gallery", description: "Documentary photo essay on the annual monsoon surge, river communities, and the wooden ferry transport network.", exif: "35MM · F/2.8 · 1/640S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=85", order: 8 },
      { shortTitle: "VINTAGE OPTICS", title: "Vintage Uncoated Optics & Flare Lab", category: "WORKSHOP", year: "2026", date: "MAY 19, 2026", location: "Darkroom Studio 02", description: "Adapting manual Soviet and Japanese prime lenses to modern mirrorless digital sensors. Exploring spherical aberration and flare.", exif: "58MM · F/2.0 · 1/400S", filmStock: "ILFORD FP4 PLUS", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", order: 9 },
      { shortTitle: "BRUTALIST SHADOWS", title: "Architectural Form & Concrete Shadows", category: "PHOTOWALK", year: "2026", date: "MAR 02, 2026", location: "GCU Campus Complex", description: "Midday high-sun architectural documentation. Framing cantilever louvers, stairwell spirals, and raw concrete textures.", exif: "16MM · F/8.0 · 1/250S", filmStock: "ILFORD PAN F 50", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85", order: 10 },
      { shortTitle: "UMANANDA FERRIES", title: "Umananda Ghat Ferry Documentary Walk", category: "PHOTOWALK", year: "2026", date: "JAN 17, 2026", location: "Kachari Ghat", description: "Twilight environmental portraits of boatmen, river commuters, and pilgrims boarding wooden catamarans on the Brahmaputra.", exif: "35MM · F/2.0 · 1/320S", filmStock: "KODAK GOLD 200", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=85", order: 11 },
      { shortTitle: "COLLEGIATE PRIX", title: "National Collegiate Portraiture Grand Prix", category: "COMPETITION", year: "2026", date: "DEC 06, 2026", location: "Central Amphitheatre", description: "All-India university photography challenge testing live studio portrait direction under Xenon strobes and continuous tungsten light.", exif: "85MM · F/1.8 · 1/200S", filmStock: "KODAK PORTRA 800", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=85", isUpcoming: true, order: 12 },
      { shortTitle: "CAMPUS NOCTURNES", title: "Campus Nocturnes — Night Exposure Study", category: "PHOTOWALK", year: "2025", date: "NOV 20, 2025", location: "Campus Library Perimeter", description: "Tripod-only night photography workshop exploring architectural long exposures, sodium-vapor lamp reflections, and star trails.", exif: "24MM · F/4.0 · 15S", filmStock: "CINESTILL 800T", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=85", order: 13 },
      { shortTitle: "EMULSION LAB", title: "Monsoon Emulsion Lab & Darkroom Print", category: "WORKSHOP", year: "2025", date: "SEP 14, 2025", location: "GCU Darkroom Studio", description: "Traditional silver-halide chemistry workshop. Hand-developing 35mm Ilford black-and-white negative rolls and contact-sheet printing.", exif: "50MM · F/2.8 · 1/60S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 14 },
      { shortTitle: "VALLEY ECHOES", title: "Echoes of the Valley — Monsoon Retrospective", category: "EXHIBITION", year: "2025", date: "AUG 08, 2025", location: "State Museum Gallery", description: "Retrospective exhibition showcasing 45 archival contact prints taken during Assam's severe monsoon season by student photojournalists.", exif: "35MM · F/3.5 · 1/500S", filmStock: "KODAK TRI-X 400", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85", order: 15 },
      { shortTitle: "CYANOTYPE LAB", title: "Cyanotype & Sun-Printing Explorations", category: "WORKSHOP", year: "2025", date: "JUL 18, 2025", location: "GCU Open Courtyard", description: "Alternative analog photographic process utilizing ferric ammonium citrate and potassium ferricyanide chemistry under sunlight.", exif: "35MM · F/5.6 · 1/250S", filmStock: "SUN EMBOSSED GELATIN", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=85", order: 16 },
      { shortTitle: "GAZE OF ASSAM", title: "Gaze of Assam — Portraiture Invitational", category: "COMPETITION", year: "2025", date: "JUN 02, 2025", location: "Auditorium Hall", description: "Statewide portraiture championship focusing on indigenous handloom artisans, folk dancers, and rural community elders.", exif: "85MM · F/1.4 · 1/320S", filmStock: "KODAK PORTRA 400", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=85", order: 17 },
      { shortTitle: "TEA GARDEN DAWN", title: "Upper Assam Tea Garden Dawn Walk", category: "PHOTOWALK", year: "2025", date: "APR 26, 2025", location: "Sonapur Tea Estate", description: "Capturing first morning sun breaking through dense mist over rolling emerald tea slopes and documenting early-morning pluckers.", exif: "24MM · F/4.0 · 1/800S", filmStock: "FUJIFILM VELVIA 50", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=85", order: 18 },
      { shortTitle: "URBAN SOLITUDE", title: "Urban Solitude — Street Photo Contest", category: "COMPETITION", year: "2025", date: "MAR 15, 2025", location: "Panbazar Commercial Zone", description: "Challenging participants to capture evocative moments of personal reflection amidst the overwhelming chaos of city transit.", exif: "50MM · F/1.8 · 1/400S", filmStock: "ILFORD DELTA 3200", img: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&q=85", order: 19 },
      { shortTitle: "GEOMETRY MOTION", title: "Geometry in Motion — Architecture Walk", category: "PHOTOWALK", year: "2025", date: "FEB 10, 2025", location: "Guwahati High Court Zone", description: "Dissecting modern and colonial civic architectural geometry, repetitive glass facades, and perspective vanishing lines.", exif: "18MM · F/8.0 · 1/250S", filmStock: "KODAK EKTAR 100", img: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=85", order: 20 },
      { shortTitle: "COLOR & SPEED", title: "High-Speed Shutter & Color Story Clinic", category: "WORKSHOP", year: "2025", date: "JAN 25, 2025", location: "GCU Sports Complex", description: "Mastering action freeze techniques at 1/4000s shutter speeds and panning motion blur with high frame-rate digital cameras.", exif: "70MM · F/2.8 · 1/4000S", filmStock: "FUJIFILM PROVIA 100F", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85", order: 21 },
      { shortTitle: "FOUNDERS SHEET", title: "Founders' Archival Contact Sheet Exhibition", category: "EXHIBITION", year: "2025", date: "DEC 12, 2025", location: "Academic Block Concourse", description: "Commemorative exhibition highlighting the original darkroom prints and vintage cameras that established the ShutterScape club.", exif: "35MM · F/2.0 · 1/125S", filmStock: "KODAK PLUS-X 125", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85", order: 22 },
      { shortTitle: "SUALKUCHI WEAVE", title: "Sualkuchi Handloom Documentary Walk", category: "PHOTOWALK", year: "2025", date: "OCT 19, 2025", location: "Sualkuchi Silk Village", description: "Intimate environmental portraits of master silk weavers working traditional wooden looms and weaving golden Muga silk.", exif: "50MM · F/1.4 · 1/200S", filmStock: "KODAK PORTRA 160", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&q=85", order: 23 },
      { shortTitle: "24HR MONOCHROME", title: "24-Hour Monochrome Street Championship", category: "COMPETITION", year: "2025", date: "MAY 04, 2025", location: "Citywide Guwahati", description: "Day-and-night endurance photography contest where competitors submit 5 curated monochrome frames shot over 24 continuous hours.", exif: "28MM · F/2.8 · 1/500S", filmStock: "ILFORD HP5 PLUS", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", order: 24 },
    ];
    for (const a of ACTIVITIES) {
      await ActivityEvent.findOneAndUpdate({ title: a.title }, a, { upsert: true });
    }
    console.log(`✅ Seeded ${ACTIVITIES.length} Activity events`);

    // 7. Seed Moments Reels (6 video reels)
    const REELS = [
      { photographer: "Parambrata Sarkar", videoSrc: "/videos/reel-1.mp4", order: 1 },
      { photographer: "Sayan Saha", videoSrc: "/videos/reel-2.mp4", order: 2 },
      { photographer: "Aman Baha", videoSrc: "/videos/reel-3.mp4", order: 3 },
      { photographer: "Sampad Dutta", videoSrc: "/videos/reel-4.mp4", order: 4 },
      { photographer: "Bituparna", videoSrc: "/videos/reel-5.mp4", order: 5 },
      { photographer: "Sohan Chandra", videoSrc: "/videos/reel-6.mp4", order: 6 },
    ];
    for (const r of REELS) {
      await MomentsReel.findOneAndUpdate({ photographer: r.photographer }, r, { upsert: true });
    }
    console.log(`✅ Seeded ${REELS.length} video reels`);

    console.log("\n🎉 Full database seed completed successfully!\n");
  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
