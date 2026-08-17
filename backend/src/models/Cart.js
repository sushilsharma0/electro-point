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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: '', uppercase: true, trim: true },
  },
  { timestamps: true },
);

cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } },
);
cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string', $gt: '' } } },
);

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export async function ensureCartIndexes() {
  const col = Cart.collection;
  const existing = await col.indexes();
  for (const idx of existing) {
    if (idx.name === '_id_') continue;
    const isUser = idx.key && idx.key.user === 1 && Object.keys(idx.key).length === 1;
    const isGuest = idx.key && idx.key.guestId === 1 && Object.keys(idx.key).length === 1;
    const partial = idx.partialFilterExpression;
    if ((isUser || isGuest) && (!partial || idx.sparse)) {
      await col.dropIndex(idx.name);
    }
  }
  await Cart.updateMany({ guestId: null }, { $unset: { guestId: 1 } });
  await Cart.updateMany({ user: null }, { $unset: { user: 1 } });
  await Cart.syncIndexes();
}

export default Cart;
