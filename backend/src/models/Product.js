import mongoose from 'mongoose';

const VALID_UNITS = [
  'piece',
  'kg',
  'gram',
  'litre',
  'ml',
  'box',
  'packet',
  'dozen',
  'meter',
  'other'
];

const productSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product owner is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [1, 'Product name cannot be empty'],
      maxlength: [150, 'Product name cannot exceed 150 characters']
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: [50, 'Product code cannot exceed 50 characters']
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [80, 'Category name cannot exceed 80 characters']
    },
    unit: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: VALID_UNITS,
        message: 'Invalid unit of measurement'
      },
      default: 'piece'
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
      default: 0
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      default: 0
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      required: [true, 'Low stock threshold is required'],
      min: [0, 'Low stock threshold cannot be negative'],
      default: 5
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index for product code per owner (only applied when code is non-empty)
productSchema.index(
  { owner: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $type: 'string', $gt: '' } }
  }
);

// Compound index for owner-scoped active product lookups & sorting
productSchema.index({ owner: 1, isArchived: 1, name: 1 });

/**
 * Clean serialization: format prices and stock reliably
 */
productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  // Format prices to avoid floating-point display inaccuracies
  if (typeof obj.purchasePrice === 'number') {
    obj.purchasePrice = Math.round(obj.purchasePrice * 100) / 100;
  }
  if (typeof obj.sellingPrice === 'number') {
    obj.sellingPrice = Math.round(obj.sellingPrice * 100) / 100;
  }
  if (typeof obj.stockQuantity === 'number') {
    obj.stockQuantity = Math.round(obj.stockQuantity * 1000) / 1000;
  }
  // Calculated property for client convenience
  obj.isLowStock = obj.stockQuantity <= obj.lowStockThreshold;
  return obj;
};

export const Product = mongoose.model('Product', productSchema);
export { VALID_UNITS };
