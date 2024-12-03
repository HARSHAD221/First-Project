
const User = require('../model/userModel/registration');

const OTP = require('../model/userModel/otp');

const Products = require('../model/adminModel/ProductModel');

const mongoose = require('mongoose');

const Cart = require('../model/userModel/cartModel');

const Category = require('../model/adminModel/CategoryModel');

const WishList = require('../model/userModel/wishListModel');

const Coupon = require('../model/adminModel/CouponModel');

const Wallet = require('../model/userModel/walletModel');

const flash = require('connect-flash');

const applyoffer = require('../middleware/applyOfferMiddleware');

const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const { successPage } = require('./orderController');
const categories = require('../model/adminModel/CategoryModel');
const applyOfferToProduct = require('../offerHelper');

const loadHomePage = async (req, res, next) => {
    try {
        
      const { user, userId } = req.session;
      const categories = await Category.find({ isBlock: false });
      // Fetch products from the database that are not blocked
      let findAllProducts = await Products.find({ isBlock: false })
        .sort({ createdAt: -1 }) 
        .limit(4)             
          
        req.products = findAllProducts;

        // Apply offers
        await  applyoffer(req, res,next);

        const showCoupon = req.session.showCoupon || false;
          console.log('showCoup',showCoupon);
      
        
    //   if (user) {
    //     res.render("home", { products: findAllProducts, user: userId, user : user,categories,showWelcomePopup :showCoupon });
    //   } else {
    //     res.render("home", { products: findAllProducts,categories});
    //   }

    // if (user) {
    //     res.render('home', {
    //         products: req.products,
    //         user: userId,
    //         user : user,
    //         categories,
    //         showWelcomePopup: showCoupon   // Pass this to the template
    //     });
    // } else {
    //     res.render("home", {
    //         products: req.products,
    //         categories
    //     });
    // };
        
    res.render('home', {
        products: req.products,
        user: userId,
        categories,
        showWelcomePopup: showCoupon,
        user: user || undefined
    });

    if (req.session.showCoupon) {
        req.session.showCoupon = false; // Reset it only after use
    }
    console.log('showcou',showCoupon)
    } catch (error) {
      console.log("Error loading home:", error.message);
      next(error);
    }
  };
  

const loginLoad = async(req,res) => {
    try {
        console.log('Login load have issue')
        res.render('login',{error : req.flash('error')});
    } catch (error) {
        console.log("login error:",error.message)
    }
}


const LoadRegister = async(req,res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log('Register Error:',error.message)
    }
}

const sendOTpEmail = async(email,otp) => {
    try {
        const transporter = nodemailer.createTransport({
        //     service : 'Gmail',
        //     auth : {
        //         user : 'harshadweb1@gmail.com',
        //         pass : 'mgva cdbd kvae mbrm',
        //     }
        // });
        host: 'smtp.gmail.com',
    port: 465, 
    secure: true, 
    auth : {
        user: 'harshadweb1@gmail.com',
        pass: 'mgva cdbd kvae mbrm',
    },
});
        const mailOptions = {
            from : 'harshadweb1@gmail.com',
            to : email,
            subject : "Your OTP code",
            text : `Your OTP code is ${otp}.It is valid for 2 minutes`
        };
        await transporter.sendMail(mailOptions);
    
    } catch (error) {
        console.error(`Failed to send OTP to ${email} :`,error.message);

    }
};
    
const RegisterUser = async (req,res) => {
    try{ 
        console.log("Registration is triggering")
        console.log(req.body);
        const {name,phone,email,password} = req.body;
        console.log(req.body);
        // checking user already exists
         

        // validation on backend

        const nameRegex = /^[a-zA-Z\s]+$/;
     if (!name || !name.trim() || !nameRegex.test(name)) {
     return res.status(400).json({
        status: "error",
        message: "Name should contain only letters and spaces"
    });
    }

        const phoneRegex = /^\d{10}$/
        if(!phone || !phoneRegex.test(phone)){
            return res.status(400).json({
                status : "error",
                message : "Phone number must be 10 digits"
            });
        }

        const emailRegex =  /^[\w-\.]+@([\w-]+\.)+[a-zA-Z]{2,}$/;
        if(!email || !emailRegex.test(email)){
            return res.status(400).json({
                status : "error",
                message : "Please enter a valid email"
            })
        }

        if(!password || password.length < 6){
            return res.status(400).json({
                status : "error",
                message : "Password must be atleast 6 characters long"
            });
        }


        const existingUser = await User.findOne({email});
        console.log(existingUser);
        
        if(existingUser){
            console.log("User already exists:", existingUser);
          return  res.status(400).json({
            status : 'error',
            message : "user already exists with this email"});
        }

        
           
         const otp = Math.floor(100000 + Math.random() * 900000 );
         const newotp = new OTP ({email : email,otp : otp});
         await newotp.save();
         console.log(newotp);
         

         await sendOTpEmail(email,otp);
      
        
        req.session.userData = {name,phone,email,password};
        console.log('sessionData',req.session.userData)

         res.status(200).json({
            status :'success',
            message : "User registered successfully"});


    }catch(error){
        console.log("User registering error:",error.message);
        res.status(500).json({
            status : "error",
            message : 'Something went wrong.Please try again'});
    }
}
const verifyEmail = async(req,res) => {
    try {
        const email = req.session.userData ? req.session.userData.email : '';
        res.render('verifyemail',{email : email});
        // const email = req.query.email || '';
        // res.render('verifyemail', { email });
    } catch (error) {
        console.log('Email verification having error',error.message);
    }
}

const OTPverification = async(req,res) => {
    try {
        
        const {otp} = req.body;
        const email = req.session.userData.email;
        const userOtp = parseInt(otp, 10);
        const storedOtpRecord = await OTP.findOne({email});
  
        if(!storedOtpRecord){
            return res.status(400).json({
               status : "error",
               message : "OTP not found for this email"
            })
        }

        const storedOtp = storedOtpRecord.otp;
        console.log('storedOTP',storedOtp)
        if(userOtp === storedOtp){
            const hashedPassword =  await bcrypt.hash(req.session.userData.password,8);
         
        
            const newUser = new User({
                name : req.session.userData.name,
                phone : req.session.userData.phone,
                email : req.session.userData.email,
                password : hashedPassword,
            })
             
            const welcomeCoupon = await Coupon.findOne({code : 'WELCOMEUSER1'});
            console.log('welcome coupn',welcomeCoupon);
            if(welcomeCoupon){
                newUser.coupons.push({couponId : welcomeCoupon._id});
            }else{
                console.error('Welcome not found.')
            }
            
            await newUser.save();   

            const wallet = new Wallet({
                userId: newUser._id, // Link the wallet to the user
                balance: 0, 
            });

            await wallet.save(); 

            // Optionally, link the wallet to the user (if the User model has a wallet field)
            newUser.wallet = wallet._id;
            await newUser.save();
             console.log('wallet saved when otp entered',wallet);
            // await OTP.deleteOne({email})  

            req.session.userData = null;
            req.session.showCoupon = true; 

      return  res.status(200).json({ status: 'success', message: "User registered successfully" });
    } else {
      return  res.status(400).json({ status: "error", message: "Invalid OTP. Please try again" });
    }
}catch (error) {
    console.log("OTP verification error:", error.message);
    res.status(500).json({ status: "error", message: "An error occurred while verifying your OTP." });
}
};

const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                status : "error",
                message : "Invalid email or password"
            });
        }
        if (user.is_block) {
            return res.status(403).json({
                status: "error",
                message: "Your account is blocked. Please contact support.",
            });
        }
        const passwordMatch = await bcrypt.compare(password,user.password)
        if(!passwordMatch){
            return res.status(400).json({
                status : "error",
                message : "Invalid email or password"
            });
        }
        
      const wishlist = await WishList.findOne({user : user._id})
      const wishlistCount = wishlist ? wishlist.products.length : 0
      console.log('wishlistCount',wishlistCount);

        req.session.user = {
            id : user._id,
            email : user.email,
            name : user.name,
            phone : user.phone,
            wishlistCount
        };

     
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Session could not be saved. Please try again.',
                });
            }
            console.log('Session saved successfully:', req.session.user); 
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    wishlistCount
                },
        
            });
        });
       
    } catch (error) {
        console.log('Login have error:',error.message);
        res.status(500).json({
            status : 'error',
            message : "Something went wrong.Please try again"
        })
    }
}

const resendOTP = async (req, res) => {
    try {
     
        console.log('Session at resend OTP:', req.session);  
        

        const email = req.session.userData ? req.session.userData.email : null;
        console.log('Email:', email);

        // Check if email exists in the session
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'No registered email found. Please register or login.'
            });
        }

        // Generate a new OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Update or create the OTP in the database
        const updatedOtp = await OTP.findOneAndUpdate(
            { email: email },
            { otp: otp, createdAt: Date.now() },
            { new: true, upsert: true }
        );
          
        console.log('otp updated',updatedOtp)
        // Send the OTP to the user's email
        await sendOTpEmail(email, otp);

        // Send a success response back to the client
        res.status(200).json({
            status: 'success',
            message: 'OTP has been resent successfully'
        });
    } catch (error) {
        console.error("Error resending OTP:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again.'
        });
    }
};
 
const forgotPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        console.log('email, password:', req.body);
        
        const user = await User.findOne({ email });
        console.log(user);
        
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        if (user.is_block) {
            return res.status(403).json({
                status: "error",
                message: "Your account is blocked"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Password has been successfully reset. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Error resetting password", error.message);
        res.status(500).json({
            status: "error",
            message: "Something went wrong. Please try again."
        });
    }
};


const { ObjectId } = require('mongoose').Types;

const loadSingleProduct = async (req, res, next) => {
    try {
      
        const productId = new ObjectId(req.query.id); 
        console.log("Current product ID: ", productId);

        let findProduct = await Products.findOne({ _id: productId });
        if (!findProduct) {
            throw new Error('Product not found');
        }
        
        const { user, userId } = req.session;   
     
        
        let isInWishlist = false;
        let isInCart = false;

        if (user && user.WishList) {
            isInWishlist = user.WishList.some(wishlistItem => String(wishlistItem) === String(productId));
            console.log('isInWishlist', isInWishlist);
        }
        if (user) {
            const userCart = await Cart.findOne({ user: userId });

        if (userCart && userCart.products) {
                // Ensure both productId and cart products are strings for comparison
                isInCart = userCart.products.some(item => String(item.product) === String(productId));

                console.log("isInCart check result: ", isInCart); // Debugging
                console.log("User Cart Product IDs: ", userCart.products.map(item => String(item.product))); // Log all product IDs in cart
            }
        }

        // Breadcrumbs setup
        const breadcrumbs = [
            { name: 'Home', url: '/' },
            { name: findProduct.category, url: `/category/${findProduct.category.toLowerCase()}` },
            { name: findProduct.productName, url: `/product?id=${findProduct._id}` }
        ];
         
        const productWithOffer = await applyOfferToProduct(findProduct);
        
        const relatedProducts = await Products.find({
            category : findProduct.category,
            _id :  {$ne : productId}
        }).limit(4)
         
        const relatedProductsWithOffers = await Promise.all(relatedProducts.map(applyOfferToProduct));
        //   console.log('relatedProductsWithOffers',relatedProductsWithOffers);
        res.render('singleProduct', { 
            product: productWithOffer, 
            breadcrumbs: breadcrumbs,  
            user: req.session.user,
            isInCart: isInCart,
            isInWishlist : isInWishlist,
            relatedProducts : relatedProductsWithOffers,
        });

    } catch (error) {
       console.error('Error while rendering single product page')
       return res.status(500).json({ success : false ,message :'Internal server issue while loading single product page'})
    }
};


const userLoginGoogle = async (req, res, next) => {
    try {
        console.log('Google callback reached here');
        
        if (req.user) {
            console.log('reached i');

            // Store the user's email and ID in session
            if (req.user.is_block) {
                console.log('reached for blocked google');
                
                const user = await User.findById(req.user.id);

                if (user && user.is_block) {
                    console.log('Blocked user attempted to login', req.user.email);
                   console.log('setting flash message :Your account has been blocked by the admin')
                    // Use req.flash before destroying the session
                    req.flash('error', 'Your account has been blocked by the admin.');

                    // Destroy the session after setting flash message
                    req.session.destroy((err) => {
                        if (err) {
                            console.log('Error destroying session for blocked user', err.message);
                        } else {
                            // After destroying the session, redirect to the login page
                            return res.redirect('/login');
                        }
                    });
                    return;
                }
            };
            
            const wallet = await Wallet.findOne({userId : req.user.id});
            if(!wallet){
                console.log('Not wallet for user :',req.user.id);
            }
            req.session.user = {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                phone: req.user.phone,
                wallet : wallet ? wallet.balance : 0,   
            };

            req.session.userId = req.user.id;

            console.log('session details with google :', req.session);
            res.redirect('/');
        } else {
            // Redirect to login page if there's an issue
            res.redirect('/login');
        }
    } catch (error) {
        console.log('Error in Google login:', error.message);
        next(error);
    }
};

 

const searchAndFilterProducts = async (req, res, next) => {
    try {
        console.log('reached for search and filter')
        const { category, sortBy } = req.query;
          
 
        let query = { isBlock: false };
        let sortCriteria = {};

       
        if (category) {
            query.category = category;
        }

        // Sort based on the sortBy parameter
        switch (sortBy) {
            case 'popularity':
                sortCriteria = { popularity: -1 };
                break;
            case 'priceLowToHigh':
                sortCriteria = { price: 1 };
                break;
            case 'priceHighToLow':
                sortCriteria = { price: -1 };
                break;
            case 'newArrivals':
                sortCriteria = { createdAt: -1 };
                break;
            case 'nameAsc':
                sortCriteria = { productName: 1 };
                break;
            case 'nameDesc':
                sortCriteria = { productName: -1 };
                break;
            default:
                sortCriteria = {};
                break;
        }

        // Fetch products based on the combined filter and sort criteria
        const products = await Products.find(query).sort(sortCriteria).exec();
        
         // Map through the products to apply offers and calculate final price
         const productsWithPrice = await Promise.all(products.map(applyOfferToProduct));
         console.log('products with pricee',productsWithPrice);
         
           // Check if products exist
        if (!productsWithPrice.length) {
            return res.status(404).json({ message: "No products found for this criteria" });
        };
        // Return the filtered and sorted products
        return res.json({ success: true, products :productsWithPrice });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const productsPage = async (req,res,next) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
         
        const page = parseInt(req.query.page) || 1;

        const  limit = 12;
        const skip = (page - 1) * limit
        const products = await Products.find({isBlock : false})
        .sort({createdAt : -1})
        .skip(skip)
        .limit(limit);

        const totalProducts = await Products.countDocuments({isBlock : false});

        const totalPages = Math.ceil(totalProducts/limit)
        
        
        const categories = await Category.find({isBlock : false})
        
        const productsWithOffers = await Promise.all(products.map(async (product) => {
            return await applyOfferToProduct(product);
        }));
        
        let cartProducts = [];
        if(userId){
            const cart = await Cart.findOne({user : userId}).select('products.product')
            if(cart){
                cartProducts = cart.products.map(item => item.product.toString());
            }
        };

        res.render('products',{products : productsWithOffers,userId,categories,cartProducts : cartProducts ? cartProducts: [] ,
            currentPage : page,totalPages,
        });
    } catch (error) {
        console.error('Error while loading products page',error.message);
        next(error);
    }
}

const errorPage = async (req,res,next) => {
    try {
        res.render('error',{
            success : false,
            message : "You are forbidden"
        })
    } catch (error) {
        console.error('Error while loading error page',error.message);
        next(error)
    }
}

const searchProducts = async (req, res,next) => {
    try {
        console.log('reached for searchingggg')
        const searchTerm = req.query.q || ''; // Get the search query
        console.log('search term',searchTerm)
        let products = [];
        if (searchTerm) {
            // Perform a search using case-insensitive regex
            products = await Products.find({
                productName: { $regex: searchTerm.split(' ').join('|'), $options: 'i' },
                isBlock : false
            });
            
            console.log('Found products:', products);
        }

        res.json({ products });
    } catch (error) {
        console.log('Search error:', error.message);
        next()
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    loadHomePage,
    loginLoad,
    LoadRegister,
    RegisterUser,
    verifyEmail,
    OTPverification,
    resendOTP,
    forgotPassword,
    loginUser,
    loadSingleProduct,
    userLoginGoogle,
    searchAndFilterProducts,
    productsPage,
    errorPage,
    searchProducts
}