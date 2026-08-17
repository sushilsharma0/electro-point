import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    image: { type: String, default: '' },
    icon: { type: String, default: '' },
    banner: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 4000 },
    seoTitle: { type: String, default: '', maxlength: 160 },
    seoDescription: { type: String, default: '', maxlength: 320 },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
  },
  { timestamps: true },
);

categorySchema.index({ parent: 1, isActive: 1, displayOrder: 1 });

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
