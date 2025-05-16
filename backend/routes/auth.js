const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// Simple cache to store recently authenticated users by IP + UserAgent
const recentAuthCache = new Map();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of recentAuthCache.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
      recentAuthCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// @route   POST api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // User matched, create JWT payload
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token: 'Bearer ' + token
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth flow');
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })(req, res, next);
});

// @route   GET api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  console.log('Google callback received');
  
  // Generate a request identifier using IP and user agent
  const requestId = `${req.ip}-${req.headers['user-agent'] || 'unknown'}`;
  console.log(`Request ID: ${requestId.substring(0, 20)}...`);
  
  // More detailed authentication with explicit error handling
  passport.authenticate('google', (err, user, info) => {
    console.log('Auth callback executed with info:', info);
    
    // Special handling for TokenError with invalid_grant (duplicate auth code)
    if (err && err.name === 'TokenError' && err.code === 'invalid_grant') {
      console.log('Invalid grant error detected - likely a duplicate request');
      
      // Try to get the user from our recent auth cache
      if (recentAuthCache.has(requestId)) {
        console.log('Using cached user as fallback');
        const cachedData = recentAuthCache.get(requestId);
        
        // Send the stored HTML response
        console.log('Sending cached HTML redirect response');
        return res.send(cachedData.htmlResponse);
      } 
      // Try to get the user directly from the session
      else if (req.user) {
        console.log('Using session user as fallback');
        user = req.user;
      } else {
        console.error('No fallback user available, cannot recover');
        const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <meta http-equiv="refresh" content="0;url=${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Duplicate%20authentication%20attempt">
          </head>
          <body>
            <p>Authentication failed (duplicate request). Redirecting...</p>
            <script>
              window.location.href = "${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Duplicate%20authentication%20attempt";
            </script>
          </body>
        </html>
        `;
        return res.send(errorHtml);
      }
    }
    // Handle other errors
    else if (err) {
      console.error('Authentication error:', err);
      const errorMsg = encodeURIComponent(err.message || 'Authentication failed');
      const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <meta http-equiv="refresh" content="0;url=${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=${errorMsg}">
        </head>
        <body>
          <p>Authentication failed. Redirecting...</p>
          <script>
            window.location.href = "${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=${errorMsg}";
          </script>
        </body>
      </html>
      `;
      return res.send(errorHtml);
    }
    
    if (!user) {
      console.error('No user authenticated, info:', info);
      const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <meta http-equiv="refresh" content="0;url=${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Authentication%20failed">
        </head>
        <body>
          <p>Authentication failed. Redirecting...</p>
          <script>
            window.location.href = "${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Authentication%20failed";
          </script>
        </body>
      </html>
      `;
      return res.send(errorHtml);
    }
    
    // Process the authenticated user
    processAuthenticatedUser(req, res, user, requestId);
    
  })(req, res, next);
});

// Helper function to process authenticated user
function processAuthenticatedUser(req, res, user, requestId) {
  // Log in the user
  req.login(user, (loginErr) => {
    if (loginErr) {
      console.error('Error logging in user:', loginErr);
      const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Error</title>
          <meta http-equiv="refresh" content="0;url=${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Login%20failed">
        </head>
        <body>
          <p>Login failed. Redirecting...</p>
          <script>
            window.location.href = "${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Login%20failed";
          </script>
        </body>
      </html>
      `;
      return res.send(errorHtml);
    }
    
    try {
      // Log the user data
      console.log('User authenticated successfully:', {
        id: user.id,
        name: user.name,
        email: user.email
      });
      
      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      
      // Pass the token directly in the URL instead of using localStorage
      const dashboardUrl = `${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`;
      
      // Instead of redirecting, send an HTML page that will handle the redirect client-side
      console.log('Sending HTML for client-side redirect with token in URL parameter');
      const redirectHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta http-equiv="refresh" content="2;url=${dashboardUrl}">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: green; font-weight: bold; }
            .redirecting { margin-top: 20px; }
            .manual-link { margin-top: 30px; }
            .manual-link a { color: blue; text-decoration: underline; }
            .spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(0,0,0,.3); border-radius: 50%; border-top-color: #3498db; animation: spin 1s ease-in-out infinite; margin-bottom: 10px; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1 class="success">Authentication Successful!</h1>
            <p class="redirecting">Redirecting to dashboard...</p>
            <p class="manual-link">If you are not redirected automatically, <a href="${dashboardUrl}" id="dashboardLink">click here</a>.</p>
          </div>
          
          <script>
            // Direct redirection to the callback URL
            setTimeout(function() {
              window.location.href = "${dashboardUrl}";
            }, 500);
          </script>
        </body>
      </html>
      `;
      
      // Store the user and HTML response in our cache for duplicate requests
      if (requestId) {
        recentAuthCache.set(requestId, {
          user: user,
          htmlResponse: redirectHtml,
          timestamp: Date.now()
        });
      }
      
      return res.send(redirectHtml);
    } catch (tokenErr) {
      console.error('Error creating token:', tokenErr);
      const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Token Error</title>
          <meta http-equiv="refresh" content="0;url=${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Token%20generation%20failed">
        </head>
        <body>
          <p>Token generation failed. Redirecting...</p>
          <script>
            window.location.href = "${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Token%20generation%20failed";
          </script>
        </body>
      </html>
      `;
      return res.send(errorHtml);
    }
  });
}

// @route   GET api/auth/check-env
// @desc    Diagnostic route to check OAuth environment settings
// @access  Public
router.get('/check-env', (req, res) => {
  // Create redacted version of credentials
  const envStatus = {
    googleClientIdStatus: process.env.GOOGLE_CLIENT_ID ? 
      `Set (${process.env.GOOGLE_CLIENT_ID.substring(0, 5)}...${process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 5)})` : 
      'Not set',
    googleClientSecretStatus: process.env.GOOGLE_CLIENT_SECRET ? 
      `Set (${process.env.GOOGLE_CLIENT_SECRET.substring(0, 3)}...${process.env.GOOGLE_CLIENT_SECRET.substring(process.env.GOOGLE_CLIENT_SECRET.length - 3)})` : 
      'Not set',
    callbackURL: process.env.NODE_ENV === 'production' 
      ? `${process.env.API_URL}/api/auth/google/callback` 
      : 'http://localhost:5000/api/auth/google/callback',
    clientURL: process.env.CLIENT_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    hasJwtSecret: process.env.JWT_SECRET ? 'Yes' : 'No',
    hasSessionSecret: process.env.SESSION_SECRET ? 'Yes' : 'No'
  };
  
  res.json(envStatus);
});

// @route   GET api/auth/backup-callback
// @desc    Safety route for OAuth callback issues
// @access  Public
router.get('/backup-callback', (req, res) => {
  try {
    // Log the request for debugging purposes
    console.log('Backup callback route accessed');
    console.log('Query params:', req.query);
    
    // Extract token if it exists
    const { token } = req.query;
    
    if (token) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
    
    // Redirect to login with error
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Authentication failed`);
  } catch (error) {
    console.error('Error in backup callback:', error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Server error`);
  }
});

// @route   GET api/auth/logout
// @desc    Logout user
// @access  Public
router.get('/logout', (req, res) => {
  try {
    // Perform passport logout
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
      }
      
      // Clear session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error('Error destroying session:', sessionErr);
        }
        
        // Redirect to frontend
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login`);
      });
    });
  } catch (error) {
    console.error('Error in logout route:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=Logout failed`);
  }
});

module.exports = router; 