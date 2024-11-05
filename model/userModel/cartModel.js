
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    
    user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "User"
    },
    products : [
        {
            product : {
                type : mongoose.Schema.Types.ObjectId,
                required : true,
                ref : "Products"
            },
            quantity : {
                type : Number,
                required : true
            },
            product_total : {
                type : Number,
                required : true
            }
        }
    ],
    total_price : {
        type : Number,
        required : true
    }
   },
    {
        timestamps: true 
    });

const Cart = mongoose.model('Cart',cartSchema);

module.exports = Cart;
