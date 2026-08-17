import bcrypt from 'bcrypt';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import {
  User,
  Address,
  Category,
  Product,
  Coupon,
  Review,
  Cart,
  Wishlist,
  Order,
  Payment,
  InventoryTransaction,
  Notification,
} from '../models/index.js';

async function upsertAdmin() {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) {
    throw new Error('Set ADMIN_PASSWORD (min 8 characters) in backend/.env before seeding.');
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_COST);
  const email = env.ADMIN_EMAIL.toLowerCase().trim();

  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: 'ElectroPoint Admin',
        email,
        passwordHash,
        role: 'superadmin',
        status: 'active',
        emailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return admin;
}

async function resetCatalogAndCustomers(adminId) {
  await Promise.all([
    User.deleteMany({ _id: { $ne: adminId }, role: { $ne: 'superadmin' } }),
    Address.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Notification.deleteMany({}),
  ]);
}

async function seed() {
  await connectDb();
  const reset = process.argv.includes('--reset');

  console.log('Seeding Super Admin only…');
  const admin = await upsertAdmin();

  if (reset) {
    console.log('Clearing catalog, customers, orders, and related data…');
    await resetCatalogAndCustomers(admin._id);
  }

  console.log(`Super Admin ready: ${admin.email}`);
  console.log('Categories, products, coupons, and customers are not seeded.');
  console.log('Create catalog in /admin. Customers sign up at /register.');
  await disconnectDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
