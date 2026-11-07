import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
      maxlength: [255, 'Email cannot exceed 255 characters']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Do not select by default in queries
    },
    role: {
      type: String,
      enum: ['owner'],
      default: 'owner'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Hash a plaintext password with Argon2id.
 * @param {string} plaintext 
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = async function (plaintext) {
  if (!plaintext || typeof plaintext !== 'string' || plaintext.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1
  });
};

/**
 * Verify a candidate password against an Argon2id hash.
 * @param {string} hash 
 * @param {string} candidate 
 * @returns {Promise<boolean>}
 */
userSchema.statics.verifyPassword = async function (hash, candidate) {
  if (!hash || !candidate) return false;
  try {
    return await argon2.verify(hash, candidate);
  } catch {
    return false;
  }
};

/**
 * Clean serialization: Never expose passwordHash or internal fields to JSON
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
