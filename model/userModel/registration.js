
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
   name : {
    type : String,
    required :  true
   },
   phone : {
    type : Number,
    required : true
   },
   email : {
      type : String,
      require : true,
      unique : true
   },
   password : {
     type : String,
     required : true,
     minlength : 8
   },
   createdAt : {
     type : Date,
     default : Date.now
   },
   is_admin : {
      type : Boolean,
      default : false
   },
   is_block : {
      type : Boolean,
      default : false
   },
   wallet : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet' 
   },
   coupons: [{
      _id: false,
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      status: { type: String, enum: ['unused', 'used'], default: 'unused' },
      usedAt: { type: Date }
  }]
});

const User = mongoose.model("User",userSchema)

module.exports = User;