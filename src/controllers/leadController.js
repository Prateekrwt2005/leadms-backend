import Lead from '../models/Lead.js';
import Product from '../models/Product.js';
import VendorProfile from '../models/VendorProfile.js';

export const createLead = async (req, res, next) => {
  try {
    const { customerName, customerEmail, customerPhone, assignedTo } = req.body;
    
    let vendorId;
    let actualAssignedTo = assignedTo;

    if (req.user.role === 'team-member') {
      vendorId = req.user.vendorId;
      actualAssignedTo = req.user._id; // Automatically assigned to the team member who created it
    } else if (req.user.role === 'vendor') {
      vendorId = req.user._id;
      // assignedTo can be provided in the request body by the vendor
    }

    const lead = await Lead.create({
      customerName,
      customerEmail,
      customerPhone,
      assignedTo: actualAssignedTo,
      vendorId,
      createdBy: req.user._id
    });

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'team-member') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'vendor') {
      query.vendorId = req.user._id;
    }
    const leads = await Lead.find(query).populate('assignedTo', 'firstName lastName email');
    res.status(200).json(leads);
  } catch (error) {
    next(error);
  }
};

export const assignLead = async (req, res, next) => {
  try {
    // Only vendors can assign leads
    const { assignedTo } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user._id },
      { assignedTo },
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
};

export const generateQuote = async (req, res, next) => {
  try {
    const { products } = req.body; // Array of { productId, quantity }
    
    const lead = await Lead.findOne({ _id: req.params.id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Verify ownership
    if (req.user.role === 'team-member' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this lead' });
    }
    if (req.user.role === 'vendor' && lead.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this lead' });
    }

    const vendorProfile = await VendorProfile.findOne({ vendorId: lead.vendorId });
    if (!vendorProfile) {
      return res.status(400).json({ message: 'Vendor profile not configured for quotes' });
    }

    let baseTotal = 0;
    const selectedProducts = [];

    for (let item of products) {
      const product = await Product.findById(item.productId);
      if (product && product.isActive) {
        const itemTotal = product.basePrice * (item.quantity || 1);
        baseTotal += itemTotal;
        selectedProducts.push({
          productId: product._id,
          quantity: item.quantity || 1,
          priceAtQuote: product.basePrice
        });
      }
    }

    const marginApplied = baseTotal * (vendorProfile.marginPercentage / 100);
    const finalTotal = baseTotal + marginApplied + vendorProfile.installationPrice + vendorProfile.miscCharges;

    lead.quote = {
      selectedProducts,
      baseTotal,
      marginApplied,
      installationPrice: vendorProfile.installationPrice,
      miscCharges: vendorProfile.miscCharges,
      finalTotal
    };
    lead.status = 'quoted';
    await lead.save();

    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
};
