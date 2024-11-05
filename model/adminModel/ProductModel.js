
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName : {
        type : String,
        required : true,
        trim : true
    },
    description : {
        type : String,
        required : false,
        trim : true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    imagePaths: {
        type: [String],
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    isBlock: {
        type: Boolean,
        default: false
    },
    popularity : {
        type : Number,
        default : 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Products = mongoose.model('Products',productSchema)

module.exports = Products;