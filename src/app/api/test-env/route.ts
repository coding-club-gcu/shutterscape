import {NextResponse} from "next/server";

export async function GET() {
  return NextResponse.json({
    mongoDb: Boolean(process.env.MONGODB_URI),
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_URL),
    secret: Boolean(process.env.CLOUDINARY_URL),
    nodeEnv: Boolean(process.env.NODE_ENV),
  });
}