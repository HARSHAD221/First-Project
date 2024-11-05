
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./model/userModel/registration');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const useremail = profile.emails[0].value;
      const { id, displayName } = profile;
  
      // First, check if a user exists with this Google ID or email
      let user = await User.findOne({ $or: [{ googleId: id }, { email: useremail }] });
      console.log('user in google',user);

      if (!user) {
        user = new User({
          name: displayName,
          email: useremail,
          googleId: id,
          phone: 9946367058,
          password: id, 
          isVerified: true
        });
  
        const savedUser = await user.save();
        console.log('New User Saved:', savedUser);
      } else {
        console.log('User already exists:', user);
      }
  
      done(null, user);
    } catch (err) {
      console.error('Google OAuth Error:', err);
      done(err, null);
    }
  }));
  


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('Deserialize User Error:', err);
    done(err, null);
  }
});

module.exports = passport;