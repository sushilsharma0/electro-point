import mongoose from 'mongoose';

const shippingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    pricePaisa: { type: Number, required: true, min: 0 },
    eta: { type: String, default: '' },
  },
  { _id: false },
);

const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true },
    storeName: { type: String, default: 'ElectroPoint' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    contact: {
      email: { type: String, default: 'ivan.p@example.net' },
      phone: { type: String, default: '+977-1-4000000' },
      address: { type: String, default: 'Kathmandu, Nepal' },
    },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },
    currency: { type: String, default: 'NPR' },
    shipping: { type: [shippingSchema], default: [] },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    payments: {
      esewaEnabled: { type: Boolean, default: true },
      khaltiEnabled: { type: Boolean, default: true },
      esewaProductCode: { type: String, default: '' },
    },
    order: {
      paymentTimeoutMinutes: { type: Number, default: 30 },
      autoConfirmOnPaid: { type: Boolean, default: true },
    },
    inventory: {
      lowStockThresholdDefault: { type: Number, default: 5 },
      allowBackorder: { type: Boolean, default: false },
    },
    review: {
      autoApprove: { type: Boolean, default: false },
      requireVerifiedPurchase: { type: Boolean, default: true },
    },
    seo: {
      title: { type: String, default: 'ElectroPoint — Premium Electronics' },
      description: { type: String, default: 'Professional electronics retailer in Nepal. Smartphones, laptops, audio, and more.' },
      ogImage: { type: String, default: '' },
    },
    homepage: {
      hero: { type: Boolean, default: true },
      featuredCategories: { type: Boolean, default: true },
      bestSellers: { type: Boolean, default: true },
      newArrivals: { type: Boolean, default: true },
      showcase3d: { type: Boolean, default: true },
      specialOffers: { type: Boolean, default: true },
      brands: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
    },
    footer: {
      html: { type: String, default: '' },
      text: { type: String, default: 'ElectroPoint. Professional electronics, authentic warranty, secure payments.' },
    },
    announcementBar: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '' },
      link: { type: String, default: '' },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const StoreSettings = mongoose.models.StoreSettings || mongoose.model('StoreSettings', storeSettingsSchema);
export default StoreSettings;
