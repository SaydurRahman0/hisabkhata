import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    name: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true
    },
    code: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    unit: {
      type: String,
      trim: true,
      default: 'piece'
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be greater than zero']
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative']
    }
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Walk-in Customer'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: [true, 'Sale number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sale owner is required'],
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    customerSnapshot: {
      type: customerSnapshotSchema,
      default: () => ({ name: 'Walk-in Customer', phone: '', address: '' })
    },
    items: {
      type: [saleItemSchema],
      required: [true, 'At least one sale item is required'],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'A sale must have at least one product line item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'credit'],
      default: 'cash',
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'due'],
      default: 'paid',
      required: true,
      index: true
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    dueAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Due amount cannot be negative']
    },
    changeAmount: {
      type: Number,
      default: 0,
      min: [0, 'Change amount cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    saleDate: {
      type: Date,
      default: Date.now,
      index: true
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

// Compound indexes for fast multi-tenant queries and reporting
saleSchema.index({ owner: 1, saleDate: -1 });
saleSchema.index({ owner: 1, customer: 1, saleDate: -1 });
saleSchema.index({ owner: 1, paymentStatus: 1, saleDate: -1 });
saleSchema.index({ owner: 1, customer: 1, paymentStatus: 1 });
saleSchema.index({ owner: 1, saleNumber: 1 }, { unique: true });

/**
 * Clean serialization: format amounts and IDs
 */
saleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  if (typeof obj.grandTotal === 'number') {
    obj.grandTotal = Math.round(obj.grandTotal * 100) / 100;
  }
  if (typeof obj.subtotal === 'number') {
    obj.subtotal = Math.round(obj.subtotal * 100) / 100;
  }
  if (typeof obj.paidAmount === 'number') {
    obj.paidAmount = Math.round(obj.paidAmount * 100) / 100;
  }
  const calcDue = typeof obj.dueAmount === 'number'
    ? obj.dueAmount
    : Math.max(0, (obj.grandTotal || 0) - (obj.paidAmount || 0));
  obj.dueAmount = Math.round(calcDue * 100) / 100;

  if (Array.isArray(obj.items)) {
    obj.items = obj.items.map((item) => ({
      ...item,
      unitPrice: Math.round(item.unitPrice * 100) / 100,
      lineTotal: Math.round(item.lineTotal * 100) / 100,
      quantity: Math.round(item.quantity * 1000) / 1000
    }));
  }
  return obj;
};

export const Sale = mongoose.model('Sale', saleSchema);
