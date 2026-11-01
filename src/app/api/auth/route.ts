// src/app/api/auth/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import {
  verifyPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // --- LOGOUT ACTION ---
    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out cleanly" });
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      return response;
    }

    // --- LOGIN ACTION ---
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const conn = await connectDB();

    const isKrishnayan =
      (username.trim().toLowerCase() === "krishnayankashyap6@gmail.com" ||
        username.trim().toLowerCase() === "krishnayankashyap6") &&
      password === "developeradmin";

    const defaultAdminUser = process.env.ADMIN_INIT_USERNAME || "admin";
    const validPasswords = [
      process.env.ADMIN_INIT_PASSWORD,
      "ShutterScape2026!",
      "ShutterScape2026",
    ].filter(Boolean);

    const isDefaultAdmin =
      (username.trim().toLowerCase() === defaultAdminUser.toLowerCase() ||
        username.trim().toLowerCase() === "admin@shutterscape.org") &&
      validPasswords.includes(password);

    // If MongoDB is not yet configured or auth failed, allow fallback admin credentials
    if (!conn) {
      if (isKrishnayan) {
        const token = await signSessionToken({
          userId: "dev-mock-krishnayan-id",
          username: "krishnayankashyap6@gmail.com",
          role: "SUPERADMIN",
        });

        const response = NextResponse.json({
          success: true,
          user: { username: "krishnayankashyap6@gmail.com", role: "SUPERADMIN" },
          note: "Running on developer credentials (MongoDB not connected)",
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }

      if (isDefaultAdmin) {
        const token = await signSessionToken({
          userId: "dev-mock-admin-id",
          username: defaultAdminUser,
          role: "SUPERADMIN",
        });

        const response = NextResponse.json({
          success: true,
          user: { username: defaultAdminUser, role: "SUPERADMIN" },
          note: "Running on emergency credentials (MongoDB not connected)",
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }

      return NextResponse.json(
        {
          error:
            "Invalid credentials. Please enter your administrator username and password.",
        },
        { status: 401 }
      );
    }

    // Direct developer bypass when database is connected: ensure developer user exists
    if (isKrishnayan) {
      let kUser = await AdminUser.findOne({
        $or: [
          { username: "krishnayankashyap6" },
          { email: "krishnayankashyap6@gmail.com" },
        ],
      });

      const { hashPassword } = await import("@/lib/auth");
      const passwordHash = await hashPassword("developeradmin");

      if (!kUser) {
        kUser = await AdminUser.create({
          username: "krishnayankashyap6",
          email: "krishnayankashyap6@gmail.com",
          passwordHash,
          role: "SUPERADMIN",
          lastLogin: new Date(),
        });
      } else {
        kUser.passwordHash = passwordHash;
        kUser.lastLogin = new Date();
        await kUser.save();
      }

      const token = await signSessionToken({
        userId: kUser._id.toString(),
        username: kUser.username,
        role: kUser.role,
      });

      const response = NextResponse.json({
        success: true,
        user: { username: kUser.username, role: kUser.role },
      });

      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // Auto-provision initial superadmin if database has no admin users yet
    const adminCount = await AdminUser.countDocuments();
    if (adminCount === 0) {
      if (isDefaultAdmin) {
        const { hashPassword } = await import("@/lib/auth");
        const passwordHash = await hashPassword(password);
        const newAdmin = await AdminUser.create({
          username: defaultAdminUser.toLowerCase(),
          email: "admin@shutterscape.org",
          passwordHash,
          role: "SUPERADMIN",
        });

        const token = await signSessionToken({
          userId: newAdmin._id.toString(),
          username: newAdmin.username,
          role: newAdmin.role,
        });

        const response = NextResponse.json({
          success: true,
          user: { username: newAdmin.username, role: newAdmin.role },
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }
    }

    // Connect to database and find user
    const user = await AdminUser.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: username.trim().toLowerCase() },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Sign session JWT
    const token = await signSessionToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );

    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out cleanly" });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
