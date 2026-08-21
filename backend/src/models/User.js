import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    countryCode: { type: String, trim: true, default: '' },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'superadmin'], default: 'customer', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    emailVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false, default: '' },
    adminRefreshTokenHash: { type: String, select: false, default: '' },
    passwordResetTokenHash: { type: String, select: false, default: '' },
    passwordResetExpires: { type: Date, select: false, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    phone: this.phone,
    countryCode: this.countryCode,
    role: this.role,
    status: this.status,
    emailVerified: this.emailVerified,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
