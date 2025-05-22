const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      profileImage: req.user.profileImage
    });
  }
);

// @route   PUT api/users/profile
// @desc    Update user profile information
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, email, profileImage } = req.body;
  
  try {
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (profileImage) {
      user.profileImage = profileImage;
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 