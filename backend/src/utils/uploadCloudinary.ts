import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadToCloudinary = async (filePath: string, resource_type: string = 'image'): Promise<string> => {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error('File does not exist');
  }

  try {
    const result = await cloudinary.uploader.upload(absolutePath, {
      resource_type,
    });
    console.log('✅ File uploaded successfully:', result);

    // fs.unlinkSync(absolutePath);

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Failed to upload to Cloudinary');
  }
};

export { uploadToCloudinary };
