
const Order = require('../../model/userModel/orderModel');

const adOrderLoad = async (req,res,next) => {
    try {
        const page =  parseInt(req.query.page) || 1;
        const limit = 5;


        const totalOrders = await Order.countDocuments();


        const totalPages = Math.ceil(totalOrders / limit);
        

        const orders = await Order.find()
        .populate('user','name email')
        .populate('products.product','name')
        .populate('deliveryAddress')
        .skip((page - 1) * limit) // Skip the orders of previous pages
        .limit(limit); 

        res.render('order',{orders,currentPage : page,totalPages});
    } catch (error) {
        console.error('Error loading adOrderLoad',error.message);
        next(error)
        res.status(500).send('Internal server error')
    }
}

const adOrderDetails = async (req, res, next) => {
    try {
       
        const order = await Order.findById(req.params.id)
            .populate('user') // Populate user details
            .populate('products.product')
            .populate('deliveryAddress') // Populate address details if needed
            .exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Render the EJS template with order data
        res.render('orderDetails', {
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        next(error);
        res.status(500).send('Server Error');
    }
};


const updateOrder = async (req, res, next) => {
    try {
        console.log('Reached for update order');
        const orderId = req.body.orderId;
        const { status } = req.body;

        // Validate the status
        const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the current order
        const order = await Order.findById(orderId);
        
        // Check if the order exists
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order is already cancelled
        if (order.status === 'cancelled' && status === 'cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        // Update the order status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (updatedOrder) {
            return res.status(200).json({ message: 'Order successfully updated', order: updatedOrder });
        }

    } catch (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateOrderStatus = async (req,res,next) => {
    try {
        console.log('reached for order status updation');
        const {status } = req.body;
         console.log('status',status);
         const orderId = req.params.id;

         const updateOrder = await Order.findByIdAndUpdate(orderId, {status : status},{new : true});

         if(updateOrder){
            res.json({success : true,message : "Order status updated successfully"})
         }else{
            res.json({success : false,message : 'Order not found'})
         }
    } catch (error) {
        console.error("Error while updating order status",error.message);
        next();
        res.json({success : false,message : 'Failed to update order status'})
        
    }
}

module.exports = {
    adOrderLoad,
    adOrderDetails,
    updateOrder,
    updateOrderStatus
}