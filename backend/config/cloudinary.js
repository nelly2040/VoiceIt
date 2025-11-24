import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Test Cloudinary configuration
const testCloudinary = async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Test the configuration by making a simple API call
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary configured successfully');
    console.log('☁️  Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    return true;
  } catch (error) {
    console.log('⚠️  Cloudinary connection test failed:', error.message);
    console.log('💡 Images will be stored as URLs but not uploaded to Cloudinary');
    return false;
  }
};

testCloudinary();

export default cloudinary;