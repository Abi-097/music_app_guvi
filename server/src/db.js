import mongoose from 'mongoose';
import { seedIfEmpty } from './seedData.js';

let cached = globalThis.__mongoose || { conn: null, promise: null };
globalThis.__mongoose = cached;

// Reuses one connection across warm serverless invocations.
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 })
      .then(async (m) => {
        await seedIfEmpty();
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
