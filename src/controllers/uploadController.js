import cloudinary, { deleteFromCloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  res.status(201).json(ApiResponse.created(res, {
    public_id: req.file.filename,
    url: req.file.path,
  }, 'Image uploaded successfully'));
});

export const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new ApiError(400, 'No files uploaded');
  const images = req.files.map((f) => ({ public_id: f.filename, url: f.path }));
  return ApiResponse.created(res, images, 'Images uploaded successfully');
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) throw new ApiError(400, 'public_id is required');
  const result = await deleteFromCloudinary(public_id);
  return ApiResponse.success(res, result, 'Image deleted');
});

export const deleteMultipleImages = asyncHandler(async (req, res) => {
  const { public_ids } = req.body;
  if (!Array.isArray(public_ids) || !public_ids.length) {
    throw new ApiError(400, 'public_ids array is required');
  }
  const results = await Promise.all(public_ids.map((id) => deleteFromCloudinary(id)));
  return ApiResponse.success(res, results, 'Images deleted');
});

export const getSignature = asyncHandler(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: 'cake-shop' },
    process.env.CLOUDINARY_API_SECRET,
  );
  res.status(200).json(ApiResponse.success(res, {
    signature,
    timestamp,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    folder: 'cake-shop',
  }));
});

export default {
  uploadImage, uploadMultipleImages, deleteImage, deleteMultipleImages, getSignature,
};
