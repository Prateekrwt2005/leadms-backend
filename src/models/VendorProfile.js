const mongoose = require('mongoose');

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

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);
