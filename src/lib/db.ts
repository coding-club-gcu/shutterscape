// src/lib/db.ts
import mongoose from "mongoose";

const FALLBACK_MONGODB_URI =
  "mongodb+srv://Shutteradmin:ShutterScape2026@cluster0.e7olvae.mongodb.net/shutterscape?retryWrites=true&w=majority";
const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const OPTS: mongoose.ConnectOptions = {
  bufferCommands: true, // Buffer commands while initial connection is being established
  maxPoolSize: 25, // Higher connection ceiling to serve high-volume media requests without blocking
  minPoolSize: 1, // Keep 1 warm socket alive to eliminate cold SSL handshakes
  serverSelectionTimeoutMS: 25000, // 25s timeout for resilient cold DNS SRV lookup
  connectTimeoutMS: 25000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000, // Ping server every 10s to keep connection alive
};

/**
 * Connect to MongoDB Atlas with aggressive connection caching across serverless and Node invocations.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = (process.env.MONGODB_URI || MONGODB_URI || FALLBACK_MONGODB_URI).trim();
  if (!uri) {
    return null;
  }

  // Fast path: if already connected, return in 0ms
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // If currently connecting (readyState === 2) and promise exists, await it
  if (mongoose.connection.readyState === 2 && cached.promise) {
    try {
      const conn = await cached.promise;
      if (conn && (mongoose.connection.readyState as number) === 1) {
        return conn;
      }
    } catch {
      // Fall through to retry connection
    }
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        const instance = await mongoose.connect(uri, OPTS);
        cached.conn = instance;
        return instance;
      } catch (err) {
        console.warn("MongoDB initial connection attempt error, retrying in 1s...", err);
        // Retry once after 1s before giving up
        try {
          await new Promise((r) => setTimeout(r, 1000));
          const retryInstance = await mongoose.connect(uri, OPTS);
          cached.conn = retryInstance;
          return retryInstance;
        } catch (retryErr) {
          cached.promise = null;
          cached.conn = null;
          console.error("MongoDB Atlas Connection Handshake Error:", retryErr);
          return null;
        }
      }
    })();
  }

  try {
    const conn = await cached.promise;
    if (conn && (mongoose.connection.readyState as number) === 1) {
      cached.conn = conn;
      return cached.conn;
    }
    // If not ready, clear cached promise so subsequent attempts can reconnect
    cached.promise = null;
    return null;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.warn("MongoDB Atlas Connection Error:", e);
    return null;
  }
}

// Eagerly initiate connection on server start so cold starts don't delay first user request
if (typeof window === "undefined") {
  connectDB().catch(() => {});
}
