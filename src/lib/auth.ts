// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

function getJwtKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "shutterscape-default-dev-secret-change-me-32chars";
  return new TextEncoder().encode(secret);
}

export const SESSION_COOKIE_NAME = "shutterscape_session_token";

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  exp?: number;
}

/**
 * Hash a plain password with 12 rounds of bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plain text password against stored hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically signed JWT token for admin session.
 */
export async function signSessionToken(payload: {
  userId: string;
  username: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtKey());
}

/**
 * Verify session token. Returns payload or null if invalid/expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
