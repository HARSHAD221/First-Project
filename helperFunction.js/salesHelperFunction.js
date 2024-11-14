const Order = require("../model/userModel/orderModel");

const User = require('../model/userModel/registration');

const getSalesData = async (filter) => {
    const matchStage = { status: 'Delivered' };
    const groupStage = {};

    if (filter === 'yearly') {
        groupStage._id = { year: { $year: "$orderDate" } };
    } else if (filter === 'monthly') {
        groupStage._id = {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
        };
    }

    groupStage.totalSales = { $sum: "$totalPrice" };

    const salesData = await Order.aggregate([
        { $match: matchStage },
        { $group: groupStage },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    if (filter === 'monthly') {
        // Initialize all months with zero sales
        const allMonths = Array.from({ length: 12 }, (_, i) => ({ _id: { month: i + 1 }, totalSales: 0 }));

        salesData.forEach(data => {
            const monthIndex = data._id.month - 1;
            allMonths[monthIndex] = data;
        });

        return allMonths;
    }

    return salesData;
};


const topSellingProducts = async () => {
    try {
        return await Order.aggregate([
            { $unwind: "$products" },
            { 
                $lookup: {
                    from: "products",
                    localField: "products.product",   // Should match the product ID in "Order"
                    foreignField: "_id",             
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },            // Flatten the productInfo array
            { $match: { "productInfo.isBlock": false , "status" : "Delivered"} },
            { 
                $group: {
                    _id: "$products.product",                  
                    productName: { $first: "$productInfo.productName" },  // Use the correct field name
                    totalSales: { $sum: "$products.quantity" } 
                }
            },
            { $sort: { totalSales: -1 } },         
            { $limit: 10 }                           
        ]);
    } catch (error) {
        console.error("Error in topSellingProducts:", error.message);
        return [];  // Return an empty array in case of error
    }
};


const topSellingCategory = async () => {
    try {
        const results = await Order.aggregate([
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            { $match: { "productInfo.isBlock": false , "status" : "Delivered"} }, 
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.category", // This must match categoryName in categories
                    foreignField: "categoryName",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            { $match: { "categoryInfo.isBlock": false } }, // This should exclude blocked categories
            {
                $group: {
                    _id: "$categoryInfo.categoryName",
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);
        return results;
    } catch (error) {
        console.error("Error in topSellingCategory:", error.message);
        return [];  // Return an empty array in case of error
    }
};



const getMonthlyRegistrations = async () => {
    try {
        const monthlyRegistrations = await User.aggregate([
            {$group : {
                _id : {
                    year : {$year : "$createdAt"},
                    month : {$month : "$createdAt"}
                },
                count : {$sum : 1}
            }},
            {$sort : { "_id.year": 1, "_id.month": 1}}
        ]);

        const allMonths = Array.from({ length: 12 }, (_, i) => ({ _id: { month: i + 1 }, count: 0 }));

        monthlyRegistrations.forEach(data => {
            const monthIndex = data._id.month - 1;
            allMonths[monthIndex] = data;
        });

        return allMonths;
    } catch (error) {
        console.error("Error in getMonthlyRegistrations:", error.message);
        return [];
    }
};

module.exports = {
    getSalesData,
    topSellingProducts,
    topSellingCategory,
    getMonthlyRegistrations,
}