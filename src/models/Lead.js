import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerPhone: String,
  assignedTo: {
    // Team member
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    // Could be vendor or team-member
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'accepted', 'rejected'],
    default: 'new'
  },
  quote: {
    // Calculated quote details
    selectedProducts: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      priceAtQuote: Number
    }],
    baseTotal: { type: Number, default: 0 },
    marginApplied: { type: Number, default: 0 },
    installationPrice: { type: Number, default: 0 },
    miscCharges: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export default mongoose.model('Lead', leadSchema);
