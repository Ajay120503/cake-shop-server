import Address from '../models/Address.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return ApiResponse.success(res, addresses);
});

export const getAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  return ApiResponse.success(res, address);
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });
  return ApiResponse.created(res, address, 'Address added');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!address) throw new ApiError(404, 'Address not found');
  return ApiResponse.success(res, address, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  return ApiResponse.success(res, null, 'Address deleted');
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  address.isDefault = true;
  await address.save();
  return ApiResponse.success(res, address, 'Default address set');
});

export default {
  getMyAddresses, getAddress, createAddress,
  updateAddress, deleteAddress, setDefaultAddress,
};
