
const Cart = require('../model/userModel/cartModel');

const Product = require('../model/adminModel/ProductModel');

const User = require('../model/userModel/registration');

const addressModel = require('../model/userModel/addressModel');

const Order = require('../model/userModel/orderModel');

const mongoose = require('mongoose');

const Coupon = require('../model/adminModel/CouponModel');

const wallet = require('../model/userModel/walletModel');

const applyOfferToProduct = require('../offerHelper');

const Razorpay = require('razorpay');

const dotenv = require('dotenv');
dotenv.config();

const loadCheckout = async (req, res, next) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        // Check if userId is available
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not logged in.',
            });
        }

        const addressData = await addressModel.findOne({ userId: userId });
        const addresses = addressData ? addressData.addresses : [];

        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        if (!cart || cart.products.length === 0) {
            return res.render('checkout', {
                cartItems: [],
                totalPrice: 0,
                message: 'Your cart is empty.',
                addresses
            });
        };


        // Apply offer logic to each product in the cart
        const cartItems = await Promise.all(cart.products.map(async item => {
            const productWithOffer = await applyOfferToProduct(item.product);
            const productPrice = productWithOffer.finalPrice || item.product.price;

            return {
                name: item.product.productName,
                quantity: item.quantity,
                price: productPrice,  // Use the final price if an offer is available
                totalPrice: item.quantity * productPrice  // Calculate total based on offer price
            };
        }));

        const totalPrice = cartItems.reduce((total, item) => total + item.totalPrice, 0);

        // Fetch the user and populate their coupons
        const user = await User.findById(userId).populate('coupons.couponId'); // Fetching user instead of coupon

        // Ensure user is found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Filter unused coupons
        const userCoupons = user.coupons.filter(c => c.couponId && c.status === 'unused');
        console.log('userCoupons', userCoupons);

        res.render('checkout', {
            cartItems,
            totalPrice,
            addresses,
            userCoupons: userCoupons || [],
        });

    } catch (error) {
        console.error('Error while loading checkout:', error.message);
        next(error);
    }
};

// const placeOrder = async (req,res,next) => {
//     try {
//         console.log('reached in place order')
//         const {address,paymentMethod} = req.body;

//         const validPaymentMethod = paymentMethod === 'cash_on_delivery' ? 'COD' : paymentMethod;
//         const userId = req.session.user ? req.session.user.id : null;
//         // console.log('userId of place order',userId);
//         if(!address || !paymentMethod){
//          return res.status(400).json({
//             success : false,
//             message : "Address and payment method are required"
//          });
//         }

//         if(!userId){
//             return res.status(400).json({
//                 success : false,
//                 message : "User not authenticated"
//             });
//         }
//         const cart = await Cart.findOne({user : userId}).populate('products.product');
//         // console.log('cart',cart)
//         if (!cart || cart.products.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Cart not found or empty"
//             });
//         }
//         // Calculate total price manually based on cart products
//         let totalPrice = 0;
//         const productsWithPrices = [];

//         // Check if product stock is enough and reduce stock accordingly
//         for (let cartItem of cart.products) {
//             if (!cartItem.product.price) {
//                 throw new Error(`Price not found for product ${cartItem.product.name}`);
//             }
//             const productStock = cartItem.product.stock;
//             if (productStock < cartItem.quantity) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `Insufficient stock for product: ${cartItem.product.productName}. Only ${productStock} left.`
//                 });
//             }

//             totalPrice += cartItem.quantity * cartItem.product.price;

//             productsWithPrices.push({
//                 product: cartItem.product._id,
//                 quantity: cartItem.quantity,
//                 price: cartItem.product.price
//             });
//         }

//         // Create new order
//         const newOrder = new Order({
//             user: userId,
//             products: productsWithPrices,  
//             totalPrice,
//             deliveryAddress: address,
//             paymentMethod: validPaymentMethod,
//             status: 'Pending'
//         });


//         const savedOrder = await newOrder.save();

//         for (let cartItem of cart.products) {
//             const product = await Product.findById(cartItem.product._id);
//             product.stock -= cartItem.quantity;  
//             await product.save();  
//         }

//         // Clear the cart after placing the order
//         await Cart.deleteOne({ user: userId });

//         res.status(200).json({
//             success: true,
//             orderId: savedOrder._id,
//             message: "Your order has been placed"
//         });

//     } catch (error) {
//         console.error("Error placing order", error.message);
//         return res.status(500).json({
//             success: false,
//             message: error.message || 'An error occurred while placing your order. Please try again.'
//         });
//     }
// };


// Define the Razorpay instance outside the function
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// Define `createOrder` as a separate reusable function
// const createOrder = async ({ amount, userId, items }) => {
//     const options = {
//         amount: amount * 100,  
//         currency: 'INR',
//         receipt: `receipt.order_${Date.now()}`,
//         payment_capture: 1,
//     };

//     try {
//         const razorpayOrder = await razorpay.orders.create(options);

//         const order = new Order({
//             user: userId,
//             items: items,
//             amount: amount,
//             currency: 'INR',
//             razorpayOrderId: razorpayOrder.id,
//             paymentMethod: 'Razorpay',
//             paymentStatus: 'Pending',
//         });

//         await order.save();

//         return {
//             orderId: order._id,
//             razorpayOrderId: razorpayOrder.id,
//             amount: razorpayOrder.amount,
//             currency: razorpayOrder.currency,
//         };
//     } catch (error) {
//         console.error("Error creating Razorpay order:", error);
//         throw new Error("Failed to create Razorpay order");
//     }
// };

const placeOrder = async (req, res, next) => {
    try {
        console.log('Reached placeOrder');
        const  { address,paymentMethod , couponCode} = req.body;
        console.log('req.bodyy.',req.body);
        const userId = req.session.user ? req.session.user.id : null;
        
    
        if (!address || !paymentMethod || !userId) {
            return res.status(400).json({
                success: false,
                message: "Address, payment method, and authentication are required"
            });
        }

        // Fetch user and cart details
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        if (!user || !cart || cart.products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User not found or cart is empty'
            });
        }

        let totalPrice = 0;
        const productsWithPrices = [];

        for (let cartItem of cart.products) {
            const { product, quantity } = cartItem;
            if (!product.price) {
                throw new Error(`Price not found for product ${product.name}`);
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.productName}. Only ${product.stock} left.`
                });
            }

            const productWithOffer = await applyOfferToProduct(product);
            const effectivePrice = productWithOffer.finalPrice;

            totalPrice += quantity * effectivePrice;


            productsWithPrices.push({
                product: product._id,
                quantity,
                price: effectivePrice,
                discount : productWithOffer.discount,
            });
        };

        // Step 1: Apply coupon if provided
      // Inside the placeOrder function, after calculating totalPrice from products
let discount = 0;
let appliedCoupon = null;

if (couponCode) {
    appliedCoupon = await Coupon.findOne({ _id: couponCode, status: 'active' });

    // Check if coupon exists and meets the minimum purchase requirement
    if (appliedCoupon) {
        if (appliedCoupon.minPurchaseAmount <= totalPrice) {
            // Ensure the user hasn't already used the coupon
            if (!user.coupons.some(c => c.couponId.toString() === appliedCoupon._id.toString() && c.status === 'used')) {
                // Apply the discount
                discount = appliedCoupon.discountAmount;
                totalPrice -= discount;
                
                // Mark the coupon as used for the user and save changes
                user.coupons.push({ couponId: appliedCoupon._id, status: 'used', usedAt: new Date() });
                await user.save();

                // Update the coupon to show it was used by this user
                appliedCoupon.user.push({ userId: user._id, status: 'used' });
                await appliedCoupon.save();
            } else {
                // If the coupon was already used
                return res.status(400).json({
                    success: false,
                    message: 'Coupon has already been used.'
                });
            }
        } else {
            // Minimum purchase amount not met
            return res.status(400).json({
                success: false,
                message: `This coupon requires a minimum purchase of ${appliedCoupon.minPurchaseAmount} to be applied.`
            });
        }
    } else {
        // Coupon does not exist or is inactive
        return res.status(400).json({
            success: false,
            message: 'Invalid or inactive coupon code.'
        });
    }
    }

        // Step 2: Assign a new coupon based on total price
        let assignedCoupon = null;

        if (totalPrice >= 3000 && totalPrice < 10000) {
            assignedCoupon = await Coupon.findOne({ discountAmount: 500, status: 'active' });
        } else if (totalPrice >= 10000) {
            assignedCoupon = await Coupon.findOne({ discountAmount: 1000, status: 'active' });
        }else if(totalPrice >=1000 && totalPrice<3000){
            assignedCoupon = await Coupon.findOne({discountAmount :250, status : 'active'})
        }

        if (assignedCoupon && !user.coupons.some(c => c.couponId.toString() === assignedCoupon._id.toString())) {
            user.coupons.push({ couponId: assignedCoupon._id, status: 'unused' });
            assignedCoupon.user.push({ userId: user._id, status: 'unused' });
            await user.save();
            await assignedCoupon.save();
        };

        if (totalPrice >= 1000 && (paymentMethod === 'cash_on_delivery' || paymentMethod === 'COD')) {
            return res.status(400).json({success: false,message: 'Cash on Delivery is not available for orders above ₹1000. Please choose another payment method.'
            });
        };

        if(paymentMethod== 'wallet'){
            console.log('wallettttt')
            const userWallet = await wallet.findOne({userId : userId})
            console.log('wa',wallet);
            if(!userWallet){
                return res.status(404).json({success : false,message : 'Wallet not found'})
            };
            if(userWallet.balance >= totalPrice){
                userWallet.balance -= totalPrice;
                await userWallet.save();
            }else{
                return res.status(404).json({success : false,message : 'Insufficient balance in wallet'})
            };
        }
        

        // Step 3: Create new order
        const newOrder = new Order({
            user: userId,
            products: productsWithPrices,
            totalPrice,
            discountAmount: discount,
            deliveryAddress: address,
            paymentMethod: paymentMethod === 'cash_on_delivery' ? 'COD' : paymentMethod,
            paymentStatus : paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Paid',
            status: 'Pending'
        });
        
        const savedOrder = await newOrder.save();
         
        console.log('newOrder',savedOrder);
        
        if (paymentMethod === 'Razorpay') {
            console.log('razorpay');
            try {
                const razorpayInstance = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });
        
                const options = {
                    amount: Math.round(totalPrice * 100),
                    currency: "INR",
                    receipt: `order_${userId.slice(0, 10)}_${Date.now()}`, // Slice userId to fit within 40 characters
                };
                
        
                const razorpayOrder = await razorpayInstance.orders.create(options);
                 
                for (let cartItem of cart.products) {
                    const product = await Product.findById(cartItem.product._id);
                    product.stock -= cartItem.quantity;
                    await product.save();
                };

                // Clear cart after order placement
                 await Cart.deleteOne({ user: userId });

                return res.status(200).json({
                    success: true,
                    key: process.env.RAZORPAY_KEY_ID,
                    orderId: razorpayOrder.id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                });
                
                
            } catch (error) {
                console.error("Error creating Razorpay order:", error); // Log detailed error
                return res.status(500).json({ success: false, message: "Failed to create Razorpay order." });
            }
        };

        // Reduce product stock
        for (let cartItem of cart.products) {
            const product = await Product.findById(cartItem.product._id);
            product.stock -= cartItem.quantity;
            await product.save();
        }
        
         // Clear cart after order placement
         await Cart.deleteOne({ user: userId });
   
        res.status(200).json({
            success: true,
            orderId: savedOrder._id,
            message: "Your order has been placed",
            appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
            assignedCoupon: assignedCoupon ? assignedCoupon.code : null
        });
       

    } catch (error) {
        console.error("Error placing order", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while placing your order. Please try again.'
        });
    }
};






const successPage = async (req, res, next) => {
    try {
        res.render('orderconfirmation')
    } catch (error) {
        console.error('error loading order success', error.message);
        next(error);
    }
};


const addAddressFromCheckOut = async (req,res,next) => {
    try {
        console.log('Reached for add address from checkout');
        const {firstName,lastName,phone,streetAddress,city,state,zip,country} =  req.body;
        const userId = req.session.user?req.session.user.id : null; 
        
        if(!userId){
            return res.status(401).json({success : false,message : 'Unauthorized user.Please login'})
        };

        if(!firstName || !lastName || !phone || !streetAddress || !city || !state || !zip || !country){
            return res.status(404).json({success : false,message : 'All fields are required'});
        };
        console.log('Req.body the add :',req.body);
        
        const newAddressData = {firstName,lastName,phone,streetAddress,city,state,zip,country };

         console.log('New address',newAddressData);
         
        const existingAddress = await addressModel.findOne({userId,
            addresses : {
                $elemMatch : {
                    firstName : newAddressData.firstName,
                    lastName : newAddressData.lastName,
                    phone : newAddressData.phone,
                    streetAddress : newAddressData.streetAddress,
                    city : newAddressData.city,
                    state : newAddressData.state,
                    zip : newAddressData.zip,
                    country : newAddressData.country,
                }
            }
        })
        console.log('exist',existingAddress)
        if (existingAddress) {
            return res.status(409).json({ success: false, message: 'This address already exists.' });
        }

        // Find the user's existing addresses to add the new one
        const userAddresses = await addressModel.findOne({ userId });

        if (!userAddresses) {
            const newAddress = new addressModel({
                userId,
                addresses: [newAddressData]
            });
            await newAddress.save();
            return res.status(201).json({ success: true, message: 'New address added successfully.' });
        } else {
            // Add the new address to the user's existing addresses
            userAddresses.addresses.push(newAddressData);
            await userAddresses.save();
            return res.status(200).json({ success: true, message: 'Address added successfully.' });
        }

    } catch (error) {
        console.error('Error while adding address from checkout:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server issue.' });
    }
};



const loadOrderDetails = async (req, res, next) => {
    try {
        // console.log('reached loadorderDetails');
        const orderId = req.params.orderId;
        // console.log('orderId',orderId);
        const order = await Order.findById(orderId).populate('products.product')
            .populate('deliveryAddress')

        if (!order) {
            return res.status(404).render('error', { message: "Order not found" })
        }
        // Calculate estimated delivery date
        const orderDate = new Date(order.orderDate);
        const estimatedDeliveryDate = new Date(orderDate);
        estimatedDeliveryDate.setDate(orderDate.getDate() + 4); //Add 4 days

        res.render('orderDetails', {
            order,
            estimatedDeliveryDate: estimatedDeliveryDate.toDateString(),
            basePath: '/orderDetails/assets' 
        })
    } catch (error) {
        console.error('Error while loading order details', error.message);
        return res.status(500).render('error', { message: "Error fetching order details" })
    }
};

const cancelOrder = async (req, res, next) => {
    try {
         console.log('reached for cancel full order')
        const { orderId } = req.params;
        

        const order = await Order.findById(orderId).populate('products.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check if the order status is 'Cancelled'
        if (order.status === 'Cancelled') { 
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled"
            });
        }

        // for (const item of order.products) {
        //     const product = item.product;
        //     product.stock += item.quantity;
        //     await product.save();

        //     item.status = 'Cancelled'
        // }
         
        const bulkOperations = order.products.map(item => ({
            updateOne: {
                filter: { _id: item.product._id },
                update: { $inc: { stock: item.quantity } }
            }
        }));

        await Product.bulkWrite(bulkOperations);

        // Setting all products status into cancelled

        order.products.forEach(item => {
            item.status = 'Cancelled'
        });

        if (order.paymentMethod !== 'COD') {
            const user = await User.findById(order.user).populate('wallet');
            if (user && user.wallet && user.wallet.isActive) {
                const refundAmount = order.totalPrice;

                // Update user's wallet balance and add a refund transaction
                user.wallet.balance += refundAmount;
                user.wallet.transactions.push({
                    amount: refundAmount,
                    type: 'credit',
                    description: 'Cancel Refund',
                    date: new Date(),
                });

                await user.wallet.save();
                console.log('Full order refund processed. New wallet balance:', user.wallet.balance);
            } else {
                console.error('User wallet not found or inactive');
            }
        }

        order.status = 'Cancelled';
        await order.save(); // Save the changes

        res.status(200).json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
        console.error('Error in cancelling the order:', error.message);
        next(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "An error occurred while cancelling the order"
        });
    }
}



const cancelSingleOrder = async (req, res) => {
    try {
        
        const { orderId, productId } = req.params;
        console.log('Order ID:', orderId, 'Product ID:', productId);

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'Cancelled') {
            return res.status(409).json({
                success: false,
                message: 'The entire order is already cancelled.'
            });
        }

        const productIndex = order.products.findIndex(item => item.product.toString() === productId);

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in order'
            });
        }

        // Check if the product is already cancelled
        if (order.products[productIndex].status === 'Cancelled') {
            return res.status(409).json({
                success: false,
                message: 'Product already cancelled.'
            });
        }

   
        const refundAmount = order.products[productIndex].price * order.products[productIndex].quantity;

        // Update the product's status to 'Cancelled'
        await Order.updateOne(
            { _id: orderId, 'products.product': productId },
            { $set: { 'products.$.status': 'Cancelled' } }
        );
        
        console.log('Product status updated for cancellation:', productId);

        // Refund logic for non-COD orders
        if (order.paymentMethod !== 'COD') {
            const user = await User.findById(order.user).populate('wallet');
            if (user && user.wallet && user.wallet.isActive) {
               
                await User.updateOne(
                    { _id: user._id, 'wallet._id': user.wallet._id },
                    {
                        $inc: { 'wallet.balance': refundAmount },
                        $push: {
                            'wallet.transactions': {
                                amount: refundAmount,
                                type: 'credit',
                                description: 'Cancel Refund',
                                date: new Date(),
                            }
                        }
                    }
                );
                console.log('Refund processed. Refund amount added to wallet:', refundAmount);
            } else {
                console.error('User wallet not found or inactive');
            }
        }

        // Recalculate the order's total price, excluding cancelled products
        const updatedOrder = await Order.findById(orderId);
        const updatedTotalPrice = updatedOrder.products.reduce((total, item) => {
            return item.status !== 'Cancelled' ? total + item.price * item.quantity : total;
        }, 0);

        const allProductsCancelled = updatedOrder.products.every(item => item.status === 'Cancelled');
        const newOrderStatus = allProductsCancelled ? 'Cancelled' : updatedOrder.status;

        await Order.updateOne(
            { _id: orderId },
            {
                $set: {
                    totalPrice: updatedTotalPrice,
                    status: newOrderStatus,
                }
            }
        );

        console.log("Updated Order Total:", updatedTotalPrice);
        console.log("Order Status:", newOrderStatus);

        res.status(200).json({
            success: true,
            message: 'Product cancelled successfully',
            totalPrice: updatedTotalPrice,
            orderStatus: newOrderStatus
        });
    } catch (error) {
        console.error('Error in canceling product from order:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the product'
        });
    }
};



const returnProduct = async(req,res,next) => {
    try {
        console.log('Reached for return product');
        const {orderId,productId,returnReason} = req.body;
        console.log('Req body :',req.body);
        const returnLimit = 10;
        const order = await Order.findById(orderId);
        if(!order){
            return res.status(404).json({success : false,message : 'Order not found'})
        };
        const product = order.products.find(item => item.product.toString() === productId);
        if(!product){
            return res.status(404).json({success : false,message : 'Product not found'})
        };
        if(product.status !== 'Delivered'){
            return res.status(404).json({success : false,message : 'Return is not possible.As product is not delivered'})
        };
        const deliveryDate = order.orderDate;
        const currentDate = new Date();
        const daysinceDelivery = Math.floor((currentDate - deliveryDate)/ (1000 * 60 * 60 * 24));

        if(daysinceDelivery > returnLimit){
            return res.status(404).json({success : false,message : 'Return period has expired.'})
        }

        product.returnStatus = 'returned';
        product.returnReason = returnReason;
        product.returnDate = currentDate;

        await order.save();
        return res.status(200).json({success : true,message : 'Product returned successfully.'})
    } catch (error) {
        console.error('Error while return product',error.message);
        return res.status(500).json({success : false,message : 'Internal server issue while returning product'})
    }
};

module.exports = {
    loadCheckout,
    placeOrder,
    successPage,
    loadOrderDetails,
    cancelOrder,
    cancelSingleOrder,
    addAddressFromCheckOut,
    returnProduct,
}