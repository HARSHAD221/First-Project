const {validationResult} = require('express-validator');

const userModel = require('../../model/userModel/registration');

const Product = require("../../model/adminModel/ProductModel.js");

const Category = require('../../model/adminModel/CategoryModel.js');
const bcrypt = require('bcrypt');

const {getSalesData, topSellingProducts , topSellingCategory , getMonthlyRegistrations} = require('../../helperFunction.js/salesHelperFunction');

const loadAdminLogin = async (req,res) => {
    try {
        res.set('Cache-Control', 'no-store');
        res.render('adminlogin')
    } catch (error) {
        console.log('Login error:',error.message);
    }
}
const verifyAdminLogin = async (req,res,next) => {
    try {
        const adminValidationErrors = validationResult(req);

        if(!adminValidationErrors.isEmpty()){
           return res.status(400).json({
            errors : adminValidationErrors.array()
           });
        }

        const {loginEmail,loginPassword} = req.body;

        const findAdmin = await userModel.findOne({email : loginEmail});

        if(!findAdmin){
            return res.status(404).json({
                success : false,
                message : "Admin not found"
            })
            
        }

        // checking user had the admin  role

        if(!findAdmin.is_admin){
           return res.status(403).json({
            sucess : false,
            message : 'Unauthorized access: not an admin'
           })
        }
        const adminPass = await bcrypt.compare(loginPassword,findAdmin.password);
        
        if(!adminPass){
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        req.session.admin = true;
        req.session.email = loginEmail; 
        
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            next: 1
        });
    } catch (error) {
        next(error)
    }
};


const loadDashboard = async (req, res) => {
    try {
        const salesData = await getSalesData(req.query.filter || 'monthly');
        const topProducts = await topSellingProducts();
        const topCategories = await topSellingCategory();
        const monthlyRegistrations  = await getMonthlyRegistrations()

        const totalProducts = await Product.countDocuments({ isBlock: false });
        const totalCategories = await Category.countDocuments({ isBlock: false });

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Define all months to ensure a label for each month
        const allMonths = Array.from({ length: 12 }, (_, i) => {
            const month = String(i + 1).padStart(2, '0');
            return `${currentYear}-${month}`;
        });

        // Map sales data to ensure each month has a value
        const monthlySalesMap = salesData.reduce((acc, data) => {
            const label = `${data._id.year}-${String(data._id.month).padStart(2, '0')}`;
            acc[label] = data.totalSales;
            return acc;
        }, {});
         
         // Map registration data to ensure each month has a value
         const monthlyRegistrationsMap = monthlyRegistrations.reduce((acc, data) => {
            const label = `${currentYear}-${String(data._id.month).padStart(2, '0')}`;
            acc[label] = data.count;
            return acc;
        }, {});

        // Construct the labels and salesValues arrays
        const labels = allMonths;
        console.log('label',labels)
        const salesValues = allMonths.map(month => monthlySalesMap[month] || 0);
        console.log('salesValues',salesValues);
         const registrationValues = allMonths.map(month => monthlyRegistrationsMap[month] || 0);
         console.log('registrationValues',registrationValues);
        const totalRevenue = salesValues.reduce((acc, value) => acc + value, 0);
        const monthlyEarning = monthlySalesMap[`${currentYear}-${String(currentMonth).padStart(2, '0')}`] || 0;

        res.render('dashboard', {
            salesData,
            topProducts,
            topCategories,
            revenue: totalRevenue,
            totalOrders: salesData.length,
            totalProducts,
            totalCategories,
            monthlyEarning,
            chartData: {
                labels,        
                salesValues,
                registrationValues     
            }
        });        
    } catch (error) {
        console.log('Dashboard error:', error.message);
    }
};




module.exports = {
    loadAdminLogin,
    verifyAdminLogin,
    loadDashboard
}