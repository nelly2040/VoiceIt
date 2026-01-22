import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary environment variables are missing! Image uploads will fail.');
} else {
  console.log('☁️  Cloudinary Config:');
  console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('✅ Cloudinary configured successfully');

export default cloudinary;

