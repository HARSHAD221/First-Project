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
            enum : ['Pending','Delivered','Cancelled','Returned'],
            default : 'Pending',
        },
        deliveryDate : Date,
        returnStatus : {
            type : String,
            enum : ['none','requested','approved','returned'],
            default : 'none',
        },
        returnReason : String,
        returnDate : Date,
        cancellationDetails : {
            isCancelled : {
                type : Boolean,
                default : false,
        },
        refundAmount : {
            type : Number,
            default : 0,
        },
        refundStatus : {
            type : String,
            enum : ['Pending','Refunded','Not Applicable'],
            default : 'Not Applicable'
        },
        cancellationReason : String,
        cancelledAt : Date,
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
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Partially Cancelled'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        enum: ['COD','cash_on_delivery','Razorpay','wallet'],
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
        firstName: String,
        lastName: String,
        phone: String,
        streetAddress: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;