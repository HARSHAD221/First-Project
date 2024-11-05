
const express = require('express')
const user_route = express()
user_route.set('views','./views/user')
user_route.use(express.json())
user_route.use(express.urlencoded({extended : true}))
const userController = require('../controller/userController');
const authenticated = require('../middleware/ensureAuthenticated');
const authmiddleware = require('../middleware/authMiddleware')
const accountController = require('../controller/accountController');
const passport = require('passport');
const paymentController = require('../paymentController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const wishListController = require('../controller/wishListController');
const applyOffer = require('../middleware/applyOfferMiddleware');

// user_route.get('/',userController.loadHomePage)
user_route.get('/', userController.loadHomePage, applyOffer);

user_route.get('/login', authmiddleware.isLogOut, (req, res) => {
    res.set('Cache-Control', 'no-store'); // Prevent caching of this page
    userController.loginLoad(req, res);
});
    user_route.get('/register',authmiddleware.isLogOut,userController.LoadRegister)
user_route.post('/register',authmiddleware.isLogOut,userController.RegisterUser);
user_route.get('/verifyemail',userController.verifyEmail);
user_route.post('/verifyemail',userController.OTPverification);
user_route.post('/login',authmiddleware.isLogOut,userController.loginUser);
user_route.post('/resendOtp',userController.resendOTP);
user_route.post('/forgotpassword',userController.forgotPassword);
user_route.get('/productsPage', userController.productsPage, applyOffer, (req, res) => {
    res.render('productsPage', { products: req.products });
});
user_route.get('/product',userController.loadSingleProduct,applyOffer);
// user_route.get('/product', userController.loadSingleProduct, applyOffer, (req, res) => {
//     res.render('singleProduct', { product: req.product });
// });
user_route.get('/myaccount',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.loadUserAccount);
user_route.post('/editprofile',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.updateProfile);
user_route.post('/myaccount/addAddress',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.addAddress);
user_route.get('/myaccount/:addressId',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.getAddress);
user_route.post('/myaccount/editAddress',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.editAddress);
user_route.delete('/myaccount/:id',authmiddleware.isLogin,authmiddleware.entryRestrict,accountController.removeAddress);
user_route.get('/cart',authmiddleware.isLogin,authmiddleware.entryRestrict,cartController.loadCart);
user_route.post('/addToCart',authenticated,cartController.addToCart);
user_route.post('/remove/:productId',authmiddleware.isLogin,authmiddleware.entryRestrict,cartController.removeCart);
user_route.post('/updatecart/:productId',authmiddleware.isLogin,authmiddleware.entryRestrict,cartController.updateCart);
user_route.get('/checkout',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.loadCheckout);
user_route.post('/placeOrder',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.placeOrder);
user_route.get('/ordersuccess',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.successPage);
user_route.get('/orderDetails/:orderId',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.loadOrderDetails);
user_route.post('/order/cancel/:orderId',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.cancelOrder);
user_route.post('/order/cancel-product/:orderId/:productId',authmiddleware.isLogin,authmiddleware.entryRestrict,orderController.cancelSingleOrder);
user_route.get('/searchAndFilterProducts',userController.searchAndFilterProducts);
user_route.get('/error',userController.errorPage);
user_route.get('/searchproducts',userController.searchProducts);
user_route.get('/wishlist',authmiddleware.isLogin,authmiddleware.isLogin,wishListController.loadWishList);
user_route.post('/addToWishList',authmiddleware.isLogin,wishListController.addToWishList);
user_route.post('/removeWishList',authmiddleware.isLogin,wishListController.removeFromWishList);

user_route.post('/logout',authmiddleware.isLogin,accountController.logOut);


user_route.get('/auth/google',passport.authenticate('google',{scope : ['profile','email']}));
user_route.get('/auth/google/callback',passport.authenticate('google',{ failureRedirect: '/login' }), userController.userLoginGoogle);


module.exports = user_route;