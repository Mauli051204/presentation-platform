import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a tiny 1x1 PNG in memory so we don't need a real file
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const testFilePath = path.join(process.cwd(), 'test-upload.png');
fs.writeFileSync(testFilePath, Buffer.from(tinyPngBase64, 'base64'));

try {
  console.log('Attempting direct file upload...');
  const result = await cloudinary.uploader.upload(testFilePath, {
    folder: 'presentation-platform/test',
  });
  console.log('✅ Upload succeeded:', result.secure_url);
} catch (error) {
  console.error('❌ Upload failed. Full error object:');
  console.error(JSON.stringify(error, null, 2));
} finally {
  fs.unlinkSync(testFilePath);
}
