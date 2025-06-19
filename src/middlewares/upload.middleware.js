import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'creators';
    if (req.uploadType === 'profile') folder += '/profile_pictures';
    if (req.uploadType === 'cover') folder += '/cover_pictures';
    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${req.user ? req.user._id : 'unknown'}_${Date.now()}`,
    };
  },
});

const upload = multer({ storage });

export default upload; 