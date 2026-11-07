// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

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
 * Normalizes connection string for Cloudflare Workers edge environment.
 * Cloudflare Workers (workerd) does not support DNS SRV records (dns.resolveSrv is not implemented),
 * which causes mongodb+srv:// URIs to fail. This auto-transforms cluster0.e7olvae.mongodb.net SRV strings
 * into direct replica-set seed list format.
 */
function normalizeMongoUri(uri: string): string {
  if (uri.startsWith("mongodb+srv://") && uri.includes("cluster0.e7olvae.mongodb.net")) {
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@cluster0\.e7olvae\.mongodb\.net\/?([^?]*)(\?.*)?$/);
    if (match) {
      const [, user, pass, dbName] = match;
      const targetDb = dbName || "shutterscape";
      return `mongodb://${user}:${pass}@ac-mn9xsax-shard-00-00.e7olvae.mongodb.net:27017,ac-mn9xsax-shard-00-01.e7olvae.mongodb.net:27017,ac-mn9xsax-shard-00-02.e7olvae.mongodb.net:27017/${targetDb}?ssl=true&replicaSet=atlas-4j81ap-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }
  return uri;
}

/**
 * Connect to MongoDB Atlas with connection caching across serverless invocations.
 * Returns null if MONGODB_URI is not configured or if connection times out,
 * allowing seamless static/memory fallback without hanging the worker.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  let uri = process.env.MONGODB_URI || MONGODB_URI;
  if (!uri) {
    return null;
  }

  uri = normalizeMongoUri(uri);

  // Fast path: if already connected and active, return in 0ms without re-handshaking
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // CRITICAL FIX FOR CLOUDFLARE WORKERS:
  // If connection is in a stale/disconnected state (0, 2, or 3), purge cache.
  // Never return cached.conn when readyState !== 1, otherwise queries hang permanently
  // waiting for an open event, causing Cloudflare to cancel with "Worker code had hung".
  if (mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Do not buffer queries in serverless edge
      maxPoolSize: 1,        // Limit pool size per worker isolate to prevent connection exhaustion
      minPoolSize: 0,        // Do not keep idle persistent sockets across isolate sleep
      serverSelectionTimeoutMS: 3000, // 3s fail-fast: prevents Worker runtime timeout
      connectTimeoutMS: 3000,
      socketTimeoutMS: 15000,
      family: 4,             // Force IPv4 to avoid IPv6 dual-stack resolution hangs
    };

    const connectPromise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      cached.conn = mongooseInstance;
      return mongooseInstance;
    });

    // Hard 3.5s failsafe timeout: guarantees execution never hangs indefinitely in workerd
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(
        () => reject(new Error("MongoDB connection timed out (3500ms limit reached)")),
        3500
      )
    );

    cached.promise = Promise.race([connectPromise, timeoutPromise]);
  }

  try {
    const conn = await cached.promise;
    if (mongoose.connection.readyState !== 1) {
      cached.conn = null;
      cached.promise = null;
      return null;
    }
    cached.conn = conn;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.warn("MongoDB Atlas Connection Error (falling back to memory):", e);
    return null;
  }
}
