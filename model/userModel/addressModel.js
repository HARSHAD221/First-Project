
const mongoose  = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        unique : true,
        ref : 'User'
    },
    addresses : [
        {
            firstName : {type : String,required : true},
            lastName : {type : String,required : true},
            phone : {type : String,required : true},
            streetAddress : {type : String,required : true},
            city : {type : String,required : true},
            state : {type : String,required : true},
            zip : {type : String,required : true},
            country : {type : String,required : true}
        }
    ]
})


const address = mongoose.model('addresses',addressSchema)

module.exports = address;