import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGO_URI) {
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export default connectDb;
