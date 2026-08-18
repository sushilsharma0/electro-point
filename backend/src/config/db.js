import mongoose from 'mongoose';
import { env } from './env.js';
import { ensureCartIndexes } from '../models/Cart.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

let dbListenersBound = false;

export async function connectDb(uri = env.MONGO_URI) {
  if (!dbListenersBound) {
    dbListenersBound = true;
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  }
  await mongoose.connect(uri);
  try {
    await ensureCartIndexes();
  } catch (err) {
    logger.warn('Cart index repair skipped', err.message);
  }
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export default connectDb;
