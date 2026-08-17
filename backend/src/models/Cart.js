import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    qty: { type: Number, required: true, min: 1, max: 99 },
    priceSnapshotPaisa: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestId: { type: String, default: null },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: '', uppercase: true, trim: true },
  },
  { timestamps: true },
);

cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
