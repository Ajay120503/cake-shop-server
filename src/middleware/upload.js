import multer from 'multer';
import { cloudinaryStorage, upload } from '../config/cloudinary.js';

export { upload };

/**
 * Process single image upload
 */
export const uploadSingle = (fieldName) => upload.single(fieldName);

/**
 * Process multiple image uploads
 */
export const uploadMultiple = (fieldName, maxCount = 10) =>
  upload.array(fieldName, maxCount);

/**
 * Process multiple fields with images
 */
export const uploadFields = (fields) => upload.fields(fields);

/**
 * Memory storage for processing before upload
 */
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Handle multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Max 5MB allowed.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

export default upload;
