import mongoose from 'mongoose';
import { env } from './env.js';
import { ensureCartIndexes } from '../models/Cart.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGO_URI) {
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });
  await mongoose.connect(uri);
  try {
    await ensureCartIndexes();
  } catch (err) {
    console.warn('[db] cart index repair skipped:', err.message);
  }
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export default connectDb;
