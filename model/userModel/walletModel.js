
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    balance : {
        type : Number,
        required : true,
        default : 0,
        min : [0,'Balance cannot be negative']
    },
    transactions : [{
        amount : {
            type : Number,
            required : true,
            min : [0,'Amount must be greater than zero']
        },
        data : {
            type : Date,
            default : Date.now
        },
        type : {
            type : String,
            enum : ['debit','credit'],
            required : true
        },
        description : {
            type : String,
            required : true,
            enum : ['Return Refund','Cancel Refund','Referral Bonus','Welcome Bonus','Product Order','Other'],
            default : 'Other'
        }
    }],
    isActive : {
           type : Boolean,
           default : true   
    },

},{timestamps : true});

const Wallet = mongoose.model('Wallet',walletSchema);

module.exports = Wallet;