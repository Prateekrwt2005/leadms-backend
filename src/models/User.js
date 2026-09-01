import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['trader', 'vendor', 'admin', 'team-member'],
    required: true
  },
  isEmailConfirmed: {
    type: Boolean,
    default: false
  },
  activeRefreshToken: {
    type: String, // Used for single-device login
    default: null
  },
  // If role is team-member, they are assigned to a vendor
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Basic profile info
  firstName: String,
  lastName: String,
  designation: String
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
