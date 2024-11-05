
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
   //   userId : {
   //      type : mongoose.Schema.Types.ObjectId,
   //      ref : "User",
   //      required : true
   //   },
     email : {
      type : String,
      required : true
     },
     otp : {
      type : Number,
      required : true
     },
    //  createdAt : {
    //   type : Date,
    //   default : Date.now(),
  
    //  }
})

const OTP = mongoose.model('OTP',otpSchema)

module.exports = OTP;