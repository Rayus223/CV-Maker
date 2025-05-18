const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

// Upload image to Cloudinary
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the Cloudinary URL
    return res.status(200).json({ 
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Delete image from Cloudinary
router.delete('/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { cloudinary } = require('../config/cloudinary');
    
    await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

module.exports = router; 