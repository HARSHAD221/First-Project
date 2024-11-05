
const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
        unique : true
    },
    products : [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Products',
            required : true
        } }],
        createdAt : {
          type : Date,
          default : Date.now()
        }
 
});

const WishList = mongoose.model('WishList',wishListSchema);

module.exports = WishList;