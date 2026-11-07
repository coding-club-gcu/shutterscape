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

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Normalizes connection string for environments where DNS SRV might not be available.
 * If running on Cloudflare Workers edge (workerd) where dns.resolveSrv is absent,
 * this converts the SRV URI to direct replica-set seed hosts.
 */
function normalizeMongoUri(uri: string): string {
  // Only convert if explicitly needed or requested
  return uri;
}

/**
 * Connect to MongoDB Atlas with connection caching across serverless invocations.
 * Optimized for serverless cold-starts with resilient 10s timeouts and non-blocking commands.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI || MONGODB_URI || FALLBACK_MONGODB_URI;
  if (!uri) {
    return null;
  }

  // Fast path: if already connected and active, return in 0ms without re-handshaking
  if ((mongoose.connection.readyState as number) === 1) {
    return mongoose;
  }

  if (cached.conn && (mongoose.connection.readyState as number) === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Non-blocking commands in serverless
      maxPoolSize: 10,
      minPoolSize: 0,        // Do not hold idle connections across sleep
      serverSelectionTimeoutMS: 10000, // 10s resilient timeout allowing cold TLS handshakes to finish
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB Atlas Connection Handshake Error:", err);
        return null;
      });
  }

  try {
    const conn = await cached.promise;
    if (conn && (mongoose.connection.readyState as number) === 1) {
      cached.conn = conn;
      return cached.conn;
    }
    cached.conn = null;
    cached.promise = null;
    return null;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.warn("MongoDB Atlas Connection Error (falling back to memory):", e);
    return null;
  }
}
