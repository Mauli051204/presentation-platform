import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret_length: process.env.CLOUDINARY_API_SECRET?.length,
});

try {
  const result = await cloudinary.api.ping();
  console.log('✅ Cloudinary credentials are valid:', result);
} catch (error) {
  console.error('❌ Cloudinary ping failed:');
  console.error(error);
}
