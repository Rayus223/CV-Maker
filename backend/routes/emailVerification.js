const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');

// Configure email transporter (you'll need to update these with your email service credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., gmail, outlook, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// @route   POST api/verify/send-code
// @desc    Send verification code to email
// @access  Public
router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the verification code before storing it
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    
    // Set expiry time (15 minutes from now)
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Check if the user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update the existing user with the new verification code
      user.verificationCode = hashedCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();
    } else {
      // Create a new user with only the email and verification info
      // Note: This assumes name is required, so we set a placeholder
      user = new User({
        email,
        name: 'Pending Registration',
        verificationCode: hashedCode,
        verificationCodeExpires: verificationCodeExpires
      });
      await user.save();
    }

    // Define email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CV Maker - Email Verification Code',
      html: `
        <h2>Email Verification</h2>
        <p>Thank you for using CV Maker! Please use the following code to verify your email address:</p>
        <h3 style="font-size: 24px; background-color: #f0f0f0; padding: 10px; text-align: center;">${verificationCode}</h3>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Verification code sent to email' });
  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/verify/verify-code
// @desc    Verify email using code
// @access  Public
router.post('/verify-code', async (req, res) => {
  const { email, code, password, name } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    // Find the user
    const user = await User.findOne({ 
      email, 
      verificationCodeExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Compare the provided code with the hashed code in the database
    const isMatch = await bcrypt.compare(code, user.verificationCode);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code is valid, update user details
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    // If user is completing registration (providing name and password)
    if (name) user.name = name;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.json({ message: 'Email successfully verified' });
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 