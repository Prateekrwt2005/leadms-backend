import VendorProfile from '../models/VendorProfile.js';

export const updateProfile = async (req, res, next) => {
  try {
    const { marginPercentage, installationPrice, miscCharges } = req.body;
    let profile = await VendorProfile.findOne({ vendorId: req.user._id });
    
    if (!profile) {
      profile = await VendorProfile.create({
        vendorId: req.user._id,
        marginPercentage,
        installationPrice,
        miscCharges
      });
    } else {
      profile.marginPercentage = marginPercentage !== undefined ? marginPercentage : profile.marginPercentage;
      profile.installationPrice = installationPrice !== undefined ? installationPrice : profile.installationPrice;
      profile.miscCharges = miscCharges !== undefined ? miscCharges : profile.miscCharges;
      await profile.save();
    }
    
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await VendorProfile.findOne({ vendorId: req.user._id });
    res.status(200).json(profile || {});
  } catch (error) {
    next(error);
  }
};
