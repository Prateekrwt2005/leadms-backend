import Product from "../models/Product.js";

// =====================================================
// TRADER ENDPOINTS
// =====================================================

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      basePrice,
      isActive,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      basePrice,
      isActive,
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getTraderProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      createdBy: req.user._id,
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted",
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// VENDOR ENDPOINTS
// =====================================================

export const getAvailableProducts = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const products = await Product.find({
      isActive: true,
      lockedByVendors: { $nin: [vendorId] }
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};
// -----------------------------------------------------
// Lock Product
// -----------------------------------------------------

export const lockProduct = async (req, res, next) => {
  try {
    console.log("UPDATED LOCK PRODUCT CONTROLLER RUNNING");
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        message: "Cannot lock an inactive product",
      });
    }

    // This endpoint is vendor-only.
    // The vendor ID is the authenticated user's ID.
    const vendorId = req.user._id;

    const alreadyLocked = product.lockedByVendors.some(
      (id) => id.toString() === vendorId.toString()
    );

    if (!alreadyLocked) {
      product.lockedByVendors.push(vendorId);
      await product.save();
    }

    res.status(200).json({
      message: "Product locked for sale",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------
// Unlock Product
// -----------------------------------------------------

export const unlockProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const vendorId = req.user._id;

    const wasLocked = product.lockedByVendors.some(
      (id) => id.toString() === vendorId.toString()
    );

    if (!wasLocked) {
      return res.status(400).json({
        message: "Product is not locked by this vendor",
      });
    }

    product.lockedByVendors = product.lockedByVendors.filter(
      (id) => id.toString() !== vendorId.toString()
    );

    await product.save();

    res.status(200).json({
      message: "Product unlocked",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// TEAM MEMBER / VENDOR LOCKED PRODUCTS
// =====================================================

export const getVendorLockedProducts = async (
  req,
  res,
  next
) => {
  try {
    let vendorId;

    // Vendor owns their own locked products.
    if (req.user.role === "vendor") {
      vendorId = req.user._id;
    }

    // Team member belongs to a vendor.
    else if (req.user.role === "team-member") {
      vendorId = req.user.vendorId;
    }

    if (!vendorId) {
      return res.status(400).json({
        message: "Vendor association not found",
      });
    }

    const products = await Product.find({
      lockedByVendors: vendorId,
      isActive: true,
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};