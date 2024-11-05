const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [{
        product: {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        status : {
            type : String,
            enum : ['Pending','Delivered','Cancelled'],
            default : 'Pending',
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        enum: ['COD','cash_on_delivery','Razorpay','Wallet'],
        default: 'COD',
        required: true,
    },
    couponDiscound:{
        type : Number
    },
    offerDiscound:{
        type : Number
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending',
    },
    deliveryAddress: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'addresses',
        required: true,
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;