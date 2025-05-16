const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

// Keep track of recently used OAuth codes to prevent duplicate processing
// This is a simple in-memory cache - in production you'd want something more robust
const recentlyUsedCodes = new Set();

// Clean up old codes more frequently to prevent memory leaks
setInterval(() => {
  console.log(`Cleaning up OAuth code cache (had ${recentlyUsedCodes.size} entries)`);
  recentlyUsedCodes.clear();
}, 2 * 60 * 1000); // Clear every 2 minutes

module.exports = passport => {
  // JWT Strategy for protected routes
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };  

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        } 
        return done(null, false);
      } catch (err) {
        console.error(err);
        return done(err, false);
      }
    })
  );

  // For debugging purposes
  console.log('=== Google OAuth Configuration ===');
  console.log(`GOOGLE_CLIENT_ID length: ${process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.length : 'not set'}`);
  console.log(`GOOGLE_CLIENT_SECRET length: ${process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.length : 'not set'}`);
  
  // Use absolute URL instead of relative path for callbackURL
  const callbackURL = process.env.NODE_ENV === 'production' 
    ? `${process.env.API_URL}/api/auth/google/callback` 
    : 'http://localhost:5000/api/auth/google/callback';
  
  console.log(`Using callback URL: ${callbackURL}`);

  // Simple Google OAuth Strategy without advanced options
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
    passReqToCallback: true // Get access to the request object
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Handle duplicate requests to prevent the invalid_grant error
      const authCode = req.query.code;
      if (authCode) {
        if (recentlyUsedCodes.has(authCode)) {
          console.log('Duplicate OAuth code detected, skipping token exchange');
          // For duplicates, we'll still try to find the user by profile ID
          const existingUser = await User.findOne({ googleId: profile.id });
          if (existingUser) {
            return done(null, existingUser);
          }
          return done(null, false, { message: 'Duplicate OAuth code' });
        }
        
        // Mark this code as used
        recentlyUsedCodes.add(authCode);
      }
      
      // More detailed logging
      console.log('Google auth callback executed');
      console.log(`Profile ID: ${profile.id}`);
      console.log(`Display Name: ${profile.displayName}`);
      console.log(`Emails: ${profile.emails ? JSON.stringify(profile.emails) : 'none'}`);
      
      // Find existing user or create new one
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        console.log('Existing user found:', user.email);
        return done(null, user);
      }
      
      if (!profile.emails || !profile.emails.length) {
        console.log('No email received from Google');
        return done(null, false, { message: 'No email provided by Google' });
      }

      // Create new user
      console.log('Creating new user with Google profile:', profile.displayName);
      user = new User({
        name: profile.displayName || 'New User',
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
      });
      
      await user.save();
      console.log('New user created:', user.email);
      return done(null, user);
    } catch (err) {
      console.error('Error in Google strategy:', err);
      return done(err, false);
    }
  }));

  // Serialize user into the session
  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      console.log('Deserialized user:', user ? user.email : 'not found');
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err, null);
    }
  });
}; 