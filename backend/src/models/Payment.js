import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, enum: ['esewa', 'khalti'], required: true },
    amountPaisa: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['initiated', 'pending', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
      default: 'initiated',
      index: true,
    },
    gateway: { type: String, required: true },
    gatewayTxnId: { type: String, default: null },
    pidx: { type: String, default: null, index: true },
    transactionUuid: { type: String, default: null, index: true },
    rawLookup: { type: mongoose.Schema.Types.Mixed, default: {} },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentSchema.index({ gatewayTxnId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ order: 1, method: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
