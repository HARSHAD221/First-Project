
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name : {type : String,required : true},
    code : {type : String,required : true,unique : true},
    description : {type : String,required : true},
    discountAmount : {type : Number,required : true},
    startDate : {type : Date,default : Date.now},
    endDate : {type : Date, 
        validate : {
            validator : function(value){
                return value > this.startDate;
            },
            message : 'End date must be later than start date'
        }
    },
    minPurchaseAmount : {type : Number,required : true},
    user: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['unused', 'used'], default: 'unused' },
        assignedAt: { type: Date, default: Date.now }
    }],
    status : {type : String, enum : ['active','expired','used'], default : 'active'},
    createdAt : {type : Date, default : Date.now}
})

const Coupon = mongoose.model('Coupon',couponSchema);

module.exports = Coupon;