import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

const app = createApp();

await connectDb();
app.listen(env.PORT, () => {
  console.log(`ElectroPoint API on ${env.BACKEND_URL} (${env.NODE_ENV})`);
});
