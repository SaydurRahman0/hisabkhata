import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: [true, 'Payment number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment owner is required'],
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer'],
      default: 'cash',
      required: true
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast owner-scoped queries and ledger ordering
paymentSchema.index({ owner: 1, paidAt: -1 });
paymentSchema.index({ owner: 1, customer: 1, paidAt: -1 });
paymentSchema.index({ owner: 1, sale: 1, paidAt: -1 });
paymentSchema.index({ owner: 1, paymentNumber: 1 }, { unique: true });
paymentSchema.index(
  { owner: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

/**
 * Clean serialization: format amounts and strip internal version keys
 */
paymentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  if (typeof obj.amount === 'number') {
    obj.amount = Math.round(obj.amount * 100) / 100;
  }
  return obj;
};

export const Payment = mongoose.model('Payment', paymentSchema);
