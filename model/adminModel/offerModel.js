
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerType : {
        type : String,
        enum : ['Products','Category'],
        required : true,
    },
    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Products',
    },
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'categories',
    },
    discount : {
        type : Number,
        required : true,
        min : 0,
        max : 100,
    },
    startDate : {
        type : Date,
        default : Date.now,
    },
    endDate : {
        type : Date,
        default : Date.now,
    }
});

const Offer = mongoose.model('Offer',offerSchema);

module.exports = Offer;