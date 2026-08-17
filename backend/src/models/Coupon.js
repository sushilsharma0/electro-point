import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderPaisa: { type: Number, default: 0, min: 0 },
    maxDiscountPaisa: { type: Number, default: null, min: 0 },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 0 },
    perCustomerLimit: { type: Number, default: 1, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default Coupon;
