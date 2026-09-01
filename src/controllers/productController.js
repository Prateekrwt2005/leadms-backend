import Product from '../models/Product.js';

// TRADER ENDPOINTS
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, basePrice, isActive } = req.body;
    const product = await Product.create({
      name,
      description,
      basePrice,
      isActive,
      createdBy: req.user._id
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getTraderProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ createdBy: req.user._id });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// VENDOR ENDPOINTS
export const getAvailableProducts = async (req, res, next) => {
  try {
    // Vendors can see all active products from any trader
    const products = await Product.find({ isActive: true });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const lockProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.lockedByVendors.includes(req.user._id)) {
      product.lockedByVendors.push(req.user._id);
      await product.save();
    }
    res.status(200).json({ message: 'Product locked for sale' });
  } catch (error) {
    next(error);
  }
};

export const unlockProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.lockedByVendors = product.lockedByVendors.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await product.save();
    res.status(200).json({ message: 'Product unlocked' });
  } catch (error) {
    next(error);
  }
};

// TEAM-MEMBER ENDPOINTS
export const getVendorLockedProducts = async (req, res, next) => {
  try {
    // Team member fetches products locked by their vendor
    const vendorId = req.user.vendorId;
    const products = await Product.find({ lockedByVendors: vendorId, isActive: true });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};
