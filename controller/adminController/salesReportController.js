const Order = require('../../model/userModel/orderModel');

const salesReportLoad = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const filter = req.query.filter; // Get the filter type
        const today = new Date(); // Current date
        let startDate, endDate;

        console.log('Filterasdasd:', filter);

        if (filter) {
            switch (filter) {
                case 'Daily':
                    startDate = new Date(today.setHours(0, 0, 0, 0));
                    endDate = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case 'Weekly':
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(today.setDate(weekStart.getDate() + 6));
                    weekEnd.setHours(23, 59, 59, 999);
                    startDate = weekStart;
                    endDate = weekEnd;
                    break;
                case 'Monthly':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case 'Yearly':
                    startDate = new Date(today.getFullYear(), 0, 1);
                    endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
                // case 'Custom':
                //     // Validate and set custom dates
                //     startDate = new Date(req.query.startDate);
                //     endDate = new Date(req.query.endDate);
                //     endDate.setHours(23, 59, 59, 999); // Inclusive of the end date
                //     console.log('Start Date:', startDate);
                //     console.log('End Date:', endDate);
                //     break;
                case 'Custom' :
                    startDate = new Date(req.query.startDate)
                    endDate = new Date(req.query.endDate);

                    if(startDate > today || endDate > today){
                        startDate = null;
                        endDate = null;

                        res.render('salesReport',{message : 'No data available for future dates',
                            orders : [],
                            totalOrders : 0,
                            totalPrice : 0,
                            currentPage : 1,
                            totalPages :1,
                        })
                        return
                    }else{
                        endDate.setHours(23,59,59,999);
                        console.log('Start Date :',startDate);
                        console.log('End Date :',endDate)
                    }
                    break;
                default:
                    startDate = null;
                    endDate = null;
            }
        }

        // Build the query object for the database
        const query = { status: 'Delivered' }; // Assuming "status" is a field in your Order model
        if (startDate && endDate) {
            query.orderDate = { $gte: startDate, $lte: endDate }; // Assuming "orderDate" is the field to filter
        }

        // Fetch orders based on the constructed query
        const orders = await Order.find(query)
            .populate('user') // Adjust as needed for your schema
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(query); 
        const totalPages = Math.ceil(totalOrders / limit);
        const totalPrice = orders.reduce((sum, order) => sum + order.totalPrice, 0); // Assuming totalPrice is a field in your Order model

       
        res.render('salesReport', {
            orders,         // Pass orders to the view
            totalOrders,
            totalPrice,
            currentPage: page,
            totalPages,
        });

    } catch (error) {
        console.error('Error while rendering salesReport page:', error);
        next(error);
    }
};



module.exports = {
    salesReportLoad,
}