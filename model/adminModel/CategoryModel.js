
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName : {
        type : String,
        required : true,
        unique : true
    },
    categoryDescription : {
        type : String,
        required : true
    },
    isBlock : {
        type : Boolean,
        default : false
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
})

const categories = mongoose.model('categories',categorySchema);

module.exports = categories;