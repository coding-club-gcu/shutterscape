
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ?? {
    conn: null,
    promise: null,
  };

global.mongooseCache = cached;

const options: mongoose.ConnectOptions = {
  bufferCommands: false,

  maxPoolSize: 5,
  minPoolSize: 0,

  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

export async function connectDB(): Promise<typeof mongoose> {
  // Reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reuse ongoing connection attempt
  if (cached.promise) {
    return cached.promise;
  }

  // Start a new connection
  cached.promise = mongoose
    .connect(MONGODB_URI, options)
    .then((instance) => {
      cached.conn = instance;

      console.log("[MongoDB] Connected successfully");

      return instance;
    })
    .catch((error) => {
      cached.conn = null;
      cached.promise = null;

      console.error("[MongoDB] Connection failed:", error);

      throw error;
    });

  return cached.promise;
}
