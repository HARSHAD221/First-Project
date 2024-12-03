
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./model/userModel/registration');
require('dotenv').config();
const Wallet = require('./model/userModel/walletModel');

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
        const wallet = new Wallet({
           userId : savedUser._id,
           balance : 0
        });

        await wallet.save();
        savedUser.wallet = wallet._id;
        await savedUser.save();
        
        console.log('wallet created for user google :',wallet);
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
  console.log('Serializing user',user);
  console.log('Session after serialize user',user.id)
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('Deserializing id:', id);  
  try {
      const user = await User.findById(id);
      console.log('User found:', user);  // Log the found user
      if (user) {
          if (user.is_block) {
              console.log('Blocked user:', user.email);
              done(null, false);  
          } else {
              const sessionUser = {
                  id: user._id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
              };
              done(null, sessionUser);  // Pass user info to session
          }
      } else {
          console.log('No user found for id:', id);
          done(null, null);  // If user not found, end session
      }
  } catch (err) {
      console.error('Error in deserialization:', err);
      done(err, null); 
  }
});


module.exports = passport;