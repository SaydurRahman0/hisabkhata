import mongoose from 'mongoose';

/**
 * Normalizes customer phone number:
 * 1. Strips spaces, dashes, dots, and parentheses.
 * 2. If it is standard BD local 11-digit starting with '01' (e.g. 017XXXXXXXX), converts to E.164 format: +8801XXXXXXXXX.
 * 3. If it starts with '8801' (13 digits), converts to +8801XXXXXXXXX.
 * 4. If it starts with '+8801', keeps it as +8801XXXXXXXXX.
 * 5. If it starts with '+' (international format), preserves '+' and digits.
 * 6. Returns cleaned string.
 * @param {string} raw 
 * @returns {string}
 */
export function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');

  if (!digitsOnly) return '';

  // If originally had leading plus (international or +880)
  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  // BD 11-digit local mobile starting with 01 (e.g. 01712345678 -> +8801712345678)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
    return `+88${digitsOnly}`;
  }

  // BD 13-digit format without leading plus (8801712345678 -> +8801712345678)
  if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * Validates normalized phone number:
 * - Must contain only digits with optional leading '+'
 * - Total length must be between 7 and 20 characters
 * - If it's a Bangladeshi mobile number (+8801...), must have valid operator prefix (013–019)
 *   and exactly 11 local digits (14 characters total: +8801[3-9]XXXXXXXX).
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // General international / E.164 boundary: 7 to 20 digits with optional +
  if (!/^\+?[0-9]{7,20}$/.test(phone)) {
    return false;
  }

  // Specific validation for Bangladeshi mobile numbers (+8801...)
  if (phone.startsWith('+8801')) {
    // Valid Bangladeshi mobile operators: 013, 014, 015, 016, 017, 018, 019
    // Must be +8801 followed by [3-9] and exactly 8 more digits (14 chars total)
    return /^\+8801[3-9][0-9]{8}$/.test(phone);
  }

  // If raw starts with 8801 without plus (in case not normalized)
  if (phone.startsWith('8801')) {
    return /^8801[3-9][0-9]{8}$/.test(phone);
  }

  // If local starts with 01
  if (phone.startsWith('01')) {
    return /^01[3-9][0-9]{8}$/.test(phone);
  }

  return true;
}

const customerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer owner is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [1, 'Customer name cannot be empty'],
      maxlength: [150, 'Customer name cannot exceed 150 characters']
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      maxlength: [25, 'Phone number cannot exceed 25 characters']
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    nid: {
      type: String,
      trim: true,
      default: '',
      maxlength: [30, 'NID cannot exceed 30 characters'],
      // Sensitive Personal Data: never included in ordinary list queries by default
      select: false
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      // Notes: excluded from default list responses to preserve payload lightness and confidentiality
      select: false
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

// Compound indexes for fast owner-scoped queries and listing
customerSchema.index({ owner: 1, isArchived: 1, name: 1 });
customerSchema.index({ owner: 1, phone: 1 });

/**
 * Clean serialization: format ID and strip internal version keys
 */
customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  return obj;
};

export const Customer = mongoose.model('Customer', customerSchema);
