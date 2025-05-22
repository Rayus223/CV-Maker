const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if Cloudinary credentials are set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('==== CLOUDINARY ERROR ====');
  console.error('Missing Cloudinary credentials. Please set the following environment variables:');
  if (!cloudName) console.error('- CLOUDINARY_CLOUD_NAME');
  if (!apiKey) console.error('- CLOUDINARY_API_KEY');
  if (!apiSecret) console.error('- CLOUDINARY_API_SECRET');
  console.error('============================');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(result => {
    console.log('Cloudinary connection successful:', result.status);
  })
  .catch(error => {
    console.error('Cloudinary connection error:', error.message);
  });

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cv-maker',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Create multer upload middleware with error handling
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB in bytes
  }
});

module.exports = {
  cloudinary,
  upload
}; 