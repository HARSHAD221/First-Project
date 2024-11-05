
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();
const Order = require('./model/userModel/orderModel');

const razorpay = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET,
});



const createOrder =  async (req,res) => {
    const {amount,userId,items,} = req.body;
    console.log('amount in raz',req.body);

    const options  = {
        amount : amount * 100,  // Amount in smallest currency unit (paise)
        currency : 'INR',
        receipt : `receipt.order_${Date.now()}`,
        payment_capture : 1,
    };

    try {
        const razorpayOrder = await razorpay.orders.create(options);

        const order = new Order({
            user : userId,
            items : items,
            amount : amount,
            currency : 'INR',
            razorpayOrderId : razorpayOrder._id,
            paymentMethod : 'Razorpay',
            paymentStatus : 'Pending',
        });

        await order.save();

        // console.log('order in razorpapyyyy',order);

        res.status(200).json({
            orderId : order._id,
            razorpayOrderId  : razorpayOrder._id,
            amount : razorpayOrder.amount,
            currency : razorpayOrder.currency,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Failed to create Razorpay order" });
    }
};


module.exports = {
    createOrder,
}