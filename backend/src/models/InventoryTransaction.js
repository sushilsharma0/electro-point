import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    type: {
      type: String,
      enum: ['order', 'cancellation', 'manual', 'refund', 'restock', 'reserve', 'release'],
      required: true,
      index: true,
    },
    qtyDelta: { type: Number, required: true },
    reason: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    stockAfter: { type: Number, required: true },
    reservedAfter: { type: Number, required: true },
  },
  { timestamps: true },
);

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });

export const InventoryTransaction =
  mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);
export default InventoryTransaction;
