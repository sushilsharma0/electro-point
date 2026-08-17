import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    sort: { type: Number, default: 0 },
  },
  { _id: false },
);

const specFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    filterable: { type: Boolean, default: false },
  },
  { _id: false },
);

const specGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sort: { type: Number, default: 0 },
    fields: { type: [specFieldSchema], default: [] },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    options: { type: mongoose.Schema.Types.Mixed, default: {} },
    pricePaisa: { type: Number, required: true, min: 0 },
    salePricePaisa: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    images: { type: [imageSchema], default: [] },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '', maxlength: 500 },
    pricePaisa: { type: Number, required: true, min: 0, index: true },
    salePricePaisa: { type: Number, default: null, min: 0 },
    costPricePaisa: { type: Number, default: 0, min: 0, select: false },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    images: { type: [imageSchema], default: [] },
    thumbnail: { type: String, default: '' },
    visualMode: { type: String, enum: ['images', 'spin360', 'model3d'], default: 'images' },
    spinImages: { type: [String], default: [] },
    model3d: {
      url: { type: String, default: '' },
      format: { type: String, enum: ['glb', 'gltf', ''], default: '' },
    },
    specGroups: { type: [specGroupSchema], default: [] },
    features: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    warranty: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    countryOfOrigin: { type: String, default: '' },
    tags: { type: [String], default: [] },
    seoTitle: { type: String, default: '', maxlength: 160 },
    seoDescription: { type: String, default: '', maxlength: 320 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    flags: {
      isFeatured: { type: Boolean, default: false },
      isBestSeller: { type: Boolean, default: false },
      isNewArrival: { type: Boolean, default: false },
      isOnSale: { type: Boolean, default: false },
    },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ status: 1, pricePaisa: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'flags.isFeatured': 1, status: 1 });
productSchema.index({ 'flags.isBestSeller': 1, status: 1 });
productSchema.index({ 'flags.isNewArrival': 1, status: 1 });
productSchema.index(
  { name: 'text', brand: 'text', sku: 'text', tags: 'text', shortDescription: 'text' },
  { name: 'product_text', weights: { name: 10, brand: 5, sku: 8, tags: 3, shortDescription: 1 } },
);

productSchema.methods.availableStock = function availableStock(variantId) {
  if (variantId) {
    const v = this.variants.id(variantId);
    if (!v) return 0;
    return Math.max(0, (v.stock || 0) - (v.reservedStock || 0));
  }
  if (this.variants?.length) {
    return this.variants.reduce((sum, v) => sum + Math.max(0, (v.stock || 0) - (v.reservedStock || 0)), 0);
  }
  return Math.max(0, (this.stock || 0) - (this.reservedStock || 0));
};

productSchema.methods.unitPricePaisa = function unitPricePaisa(variantId) {
  if (variantId) {
    const v = this.variants.id(variantId);
    if (!v) return null;
    if (v.salePricePaisa != null && v.salePricePaisa > 0 && v.salePricePaisa < v.pricePaisa) {
      return v.salePricePaisa;
    }
    return v.pricePaisa;
  }
  if (this.salePricePaisa != null && this.salePricePaisa > 0 && this.salePricePaisa < this.pricePaisa) {
    return this.salePricePaisa;
  }
  return this.pricePaisa;
};

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
