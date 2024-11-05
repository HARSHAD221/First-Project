const express = require('express');
const admin_route = express();
admin_route.set('views','./views/admin');
const adminValidation = require('../config/adminValidation');
const adminController = require('../controller/adminController/authController');
const userlistController = require('../controller/adminController/userlist');
const categoryController = require('../controller/adminController/categoryController');
const productController = require('../controller/adminController/productController');
// const upload = require('../config/multer');
const adminOrderController = require('../controller/adminController/adOrderController');
const couponController = require('../controller/adminController/couponController');
const offerController = require('../controller/adminController/offerController');
const salesController = require('../controller/adminController/salesReportController');
const adminauth = require('../middleware/adAuthenticationMiddleware');
const uploadAndCrop = require('../config/multer');

admin_route.get('/',adminauth.adminLoggedOut,adminController.loadAdminLogin);
admin_route.get('/login',adminauth.adminLoggedOut,adminController.loadAdminLogin);
admin_route.get('/dashboard',adminauth.adminLoggedIn,adminController.loadDashboard);
admin_route.get('/users',adminauth.adminLoggedIn,userlistController.loadUsers);
admin_route.get('/search',adminauth.adminLoggedIn,userlistController.searchUsers);
admin_route.get('/createCategory',adminauth.adminLoggedIn,categoryController.CategoryCreatePageRender);
admin_route.get('/categories',adminauth.adminLoggedIn,categoryController.loadCategory);
admin_route.get('/products',adminauth.adminLoggedIn,productController.loadProducts);
admin_route.get('/createproducts',adminauth.adminLoggedIn,productController.loadCreateProducts);
admin_route.get('/editproducts',adminauth.adminLoggedIn,productController.loadEditProduct);
admin_route.get('/orders',adminauth.adminLoggedIn,adminOrderController.adOrderLoad);
admin_route.get('/order-details/:id',adminauth.adminLoggedIn,adminOrderController.adOrderDetails);
admin_route.get('/coupons',adminauth.adminLoggedIn,couponController.loadCouponPage);
admin_route.get('/createCoupon',adminauth.adminLoggedIn,couponController.loadCreateCoupon);
admin_route.get('/offers',adminauth.adminLoggedIn,offerController.offerPageLoad);
admin_route.get('/createOffer',adminauth.adminLoggedIn,offerController.createOfferPage);
admin_route.get('/salesReport',salesController.salesReportLoad);

admin_route.post('/login',adminValidation.validateLoginAdmin,adminController.verifyAdminLogin);
admin_route.post('/blockuser/:id',adminauth.adminLoggedIn, userlistController.blockUser);
admin_route.post('/category',adminauth.adminLoggedIn,categoryController.getCategoryDetails);
admin_route.post('/categories/:id',adminauth.adminLoggedIn,categoryController.unlistCategory);
admin_route.post('/updateCategory/:categoryId',adminauth.adminLoggedIn,categoryController.updateCategory);
admin_route.post('/createproducts', adminauth.adminLoggedIn,uploadAndCrop, productController.createProducts);

admin_route.post('/products/:id',adminauth.adminLoggedIn,productController.unlistProducts);
admin_route.post('/editproducts',adminauth.adminLoggedIn, uploadAndCrop, productController.editProducts);

admin_route.post('/updateorder',adminauth.adminLoggedIn,adminOrderController.updateOrder);
admin_route.post('/updateStatus/:id',adminauth.adminLoggedIn,adminOrderController.updateOrderStatus);
admin_route.post('/addCoupon',adminauth.adminLoggedIn,couponController.createCoupon);
admin_route.post('/editCoupon/:id',adminauth.adminLoggedIn,couponController.editCouponController);
admin_route.post('/removeCoupon/:id',adminauth.adminLoggedIn,couponController.removeCoupon);
admin_route.post('/offersCreate',adminauth.adminLoggedIn,offerController.addOffer);
admin_route.post('/deleteOffer/:id',adminauth.adminLoggedIn,offerController.deleteOffer);


module.exports = admin_route;
