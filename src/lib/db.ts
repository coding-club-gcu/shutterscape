// src/lib/db.ts
import mongoose from "mongoose";

const FALLBACK_DIRECT_URI =
  "mongodb://Shutteradmin:ShutterScape2026@ac-mn9xsax-shard-00-00.e7olvae.mongodb.net:27017,ac-mn9xsax-shard-00-01.e7olvae.mongodb.net:27017,ac-mn9xsax-shard-00-02.e7olvae.mongodb.net:27017/shutterscape?ssl=true&replicaSet=atlas-4j81ap-shard-0&authSource=admin&retryWrites=true&w=majority";

const FALLBACK_SRV_URI =
  "mongodb+srv://Shutteradmin:ShutterScape2026@cluster0.e7olvae.mongodb.net/shutterscape?retryWrites=true&w=majority";

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
  bufferCommands: false, // In serverless/Workers: fail fast if not connected, don't buffer commands indefinitely
  maxPoolSize: 5, // Keep connection pool small
  minPoolSize: 0, // Critical: NEVER keep warm idle sockets alive in Cloudflare Workers
  serverSelectionTimeoutMS: 5000, // 5s timeout
  connectTimeoutMS: 5000,
  socketTimeoutMS: 15000,
  heartbeatFrequencyMS: 30000,
};

function resolveMongoUri(): string {
  const envUri = process.env.MONGODB_URI?.trim();
  if (envUri) {
    // If running in edge/workers and given the default cluster0 SRV uri, use direct seedlist for 0ms DNS lookup
    if (envUri.includes("cluster0.e7olvae.mongodb.net") && envUri.startsWith("mongodb+srv://")) {
      return FALLBACK_DIRECT_URI;
    }
    return envUri;
  }
  return FALLBACK_DIRECT_URI;
}

/**
 * Connect to MongoDB Atlas safely in both Node.js and Cloudflare Workers (workerd).
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = resolveMongoUri();

  // 1. Fast path: already connected and healthy
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // 2. If connecting, await existing promise with a safety timeout
  if (mongoose.connection.readyState === 2 && cached.promise) {
    try {
      const conn = await Promise.race([
        cached.promise,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 5000)
        ),
      ]);
      if (conn && (mongoose.connection.readyState as number) === 1) {
        return conn;
      }
    } catch {
      cached.promise = null;
    }
  }

  // 3. Initiate fresh connection
  cached.promise = (async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        try {
          await mongoose.disconnect();
        } catch {
          // ignore cleanup error
        }
      }

      const instance = await mongoose.connect(uri, OPTS);
      cached.conn = instance;
      return instance;
    } catch (err) {
      console.warn("[connectDB] Primary connection attempt failed:", err);
      // Fallback: if primary failed and uri is not FALLBACK_SRV_URI, try FALLBACK_SRV_URI once
      if (uri !== FALLBACK_SRV_URI) {
        try {
          const fallbackInstance = await mongoose.connect(FALLBACK_SRV_URI, OPTS);
          cached.conn = fallbackInstance;
          return fallbackInstance;
        } catch (srvErr) {
          console.error("[connectDB] Fallback SRV connection also failed:", srvErr);
        }
      }
      cached.promise = null;
      cached.conn = null;
      return null;
    } finally {
      // Clear promise once completed so subsequent requests do not share a settled/detached promise context
      cached.promise = null;
    }
  })();

  const result = await cached.promise;
  return result;
}
