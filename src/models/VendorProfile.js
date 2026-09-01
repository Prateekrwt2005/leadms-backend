import mongoose from 'mongoose';

const vendorProfileSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  marginPercentage: {
    type: Number,
    default: 0 // e.g., 10 means 10%
  },
  installationPrice: {
    type: Number,
    default: 0
  },
  miscCharges: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('VendorProfile', vendorProfileSchema);
