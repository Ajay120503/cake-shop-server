import { StoreSettings, Settings } from '../models/Settings.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const getPublicSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSettings.findOne();
  if (!settings) settings = await StoreSettings.create({});
  return ApiResponse.success(res, settings);
});

export const getStoreSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSettings.findOne();
  if (!settings) settings = await StoreSettings.create({});
  return ApiResponse.success(res, settings);
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) {
    updates.logo = { public_id: req.file.filename, url: req.file.path };
  }
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return ApiResponse.success(res, settings, 'Settings updated');
});

export const updateHeroBanners = asyncHandler(async (req, res) => {
  let banners;
  try {
    banners = JSON.parse(req.body.heroBanners || '[]');
  } catch {
    throw new ApiError(400, 'Invalid heroBanners JSON');
  }
  if (!Array.isArray(banners)) throw new ApiError(400, 'heroBanners must be an array');

  // Attach uploaded images to banners if files were provided
  const files = req.files || [];
  for (let i = 0; i < banners.length; i++) {
    const file = files.find((f) => f.fieldname === `bannerImage_${i}`);
    if (file) {
      // Delete old image if replacing
      if (banners[i].image?.public_id) {
        await deleteFromCloudinary(banners[i].image.public_id).catch(() => {});
      }
      banners[i].image = { public_id: file.filename, url: file.path };
    }
  }

  const settings = await StoreSettings.findOneAndUpdate(
    {},
    { $set: { heroBanners: banners } },
    { new: true, upsert: true },
  );
  return ApiResponse.success(res, settings, 'Hero banners updated');
});

export const updateGallery = asyncHandler(async (req, res) => {
  const { galleryImages } = req.body;
  if (!Array.isArray(galleryImages)) throw new ApiError(400, 'galleryImages must be an array');
  const settings = await StoreSettings.findOneAndUpdate(
    {},
    { $set: { galleryImages } },
    { new: true, upsert: true },
  );
  return ApiResponse.success(res, settings, 'Gallery updated');
});

export const updateSection = asyncHandler(async (req, res) => {
  const { section, data } = req.body;
  const validSections = ['featuredSection', 'bestSellersSection', 'newArrivalsSection', 'pastriesSection', 'trendingSection'];
  if (!validSections.includes(section)) throw new ApiError(400, 'Invalid section');
  const updateObj = {};
  updateObj[section] = data;
  const settings = await StoreSettings.findOneAndUpdate({}, { $set: updateObj }, { new: true, upsert: true });
  return ApiResponse.success(res, settings, 'Section updated');
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.find();
  return ApiResponse.success(res, settings);
});

export const setSetting = asyncHandler(async (req, res) => {
  const setting = await Settings.findOneAndUpdate(
    { key: req.body.key },
    { ...req.body },
    { new: true, upsert: true, runValidators: true },
  );
  return ApiResponse.success(res, setting, 'Setting saved');
});

export default {
  getPublicSettings, getStoreSettings, updateStoreSettings,
  updateHeroBanners, updateGallery, updateSection,
  getSettings, setSetting,
};
