import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

export const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cake-shop',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  },
});

export const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

export default cloudinary;
