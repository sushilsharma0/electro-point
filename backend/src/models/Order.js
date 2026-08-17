import mongoose from 'mongoose';

const ORDER_STATUSES = [
  'pending',
  'payment_pending',
  'paid',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'payment_failed',
  'refunded',
];

export const PAID_ORDER_STATUSES = [
  'paid',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    options: { type: mongoose.Schema.Types.Mixed, default: {} },
    qty: { type: Number, required: true, min: 1 },
    unitPricePaisa: { type: Number, required: true, min: 0 },
    lineTotalPaisa: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false },
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    address: { type: addressSnapshotSchema, required: true },
    subtotalPaisa: { type: Number, required: true, min: 0 },
    discountPaisa: { type: Number, default: 0, min: 0 },
    shippingPaisa: { type: Number, default: 0, min: 0 },
    taxPaisa: { type: Number, default: 0, min: 0 },
    totalPaisa: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    timeline: { type: [timelineSchema], default: [] },
    shippingMethod: { type: String, default: '' },
    payment: {
      method: { type: String, enum: ['esewa', 'khalti', ''], default: '' },
      status: { type: String, default: 'pending' },
      gatewayIds: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    inventoryReleased: { type: Boolean, default: false },
    inventoryCommitted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.method': 1, status: 1 });

export { ORDER_STATUSES };
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
