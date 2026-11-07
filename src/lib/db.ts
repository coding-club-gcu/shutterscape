// src/lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
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
 * Returns null if MONGODB_URI is not configured, allowing seamless static fallback.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  let uri = process.env.MONGODB_URI || MONGODB_URI;
  if (!uri) {
    return null;
  }

  uri = normalizeMongoUri(uri);

  // Fast path: if already connected, return in 0ms without re-handshaking
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Do not buffer queries in serverless edge
      maxPoolSize: 1,        // Limit pool size per worker isolate to prevent connection exhaustion
      minPoolSize: 0,        // Do not keep idle persistent sockets across isolate sleep
      serverSelectionTimeoutMS: 10000, // 10s to allow cold-start TLS handshake
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      cached.conn = mongooseInstance;
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB Atlas Connection Error:", e);
    return null;
  }
}

