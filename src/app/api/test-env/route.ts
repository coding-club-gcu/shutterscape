import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mongoDb: Boolean(process.env.MONGODB_URI),
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_URL
    ),
    cloudinaryUrl: Boolean(process.env.CLOUDINARY_URL),
    authSecret: Boolean(process.env.AUTH_SECRET),
    adminInitUser: Boolean(process.env.ADMIN_INIT_USERNAME),
    nodeEnv: process.env.NODE_ENV || "unknown",
  });
}
