
const Cart = require('../model/userModel/cartModel');

const addressModel = require('../model/userModel/addressModel');

const Product = require('../model/adminModel/ProductModel');

const applyOfferToProduct = require('../offerHelper');

const loadCart = async (req,res,next) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        console.log(userId)

        if(!userId){
            return res.redirect('/login')
        };

        const cart = await Cart.findOne({user : userId}).populate('products.product');

        if(!cart){
            return res.render('cart',{
                cart : {products : [],totalPrice : 0}
            });
        }
        
        const productsWithOffers = await Promise.all(
            cart.products.map(async item => {
                const productWithOffer = await applyOfferToProduct(item.product); 
                return {
                    product: productWithOffer, // Updated product with offer applied
                    quantity: item.quantity // Keep the quantity
                };
            })
        );

        const totalPrice = productsWithOffers.reduce((total, item) => {
            if (!item.product) return total;  // Handle case where product is undefined
            return total + (item.quantity * (item.product.finalPrice || 0)); // Use finalPrice for total calculation
        }, 0);

        // const totalPrice = cart.products.reduce((total,item) => {
        //     if (!item.product) return total;  // Handle case where product is undefined
        //     return total + (item.quantity * (item.product.price || 0));
        // },0);

        res.render('cart',{
            cart : {
                products : productsWithOffers,
                totalPrice : totalPrice.toFixed(2)
            }
        });
    } catch (error) {
        console.log(error.message);
        res.render('cart',{
            cart : {products : [],totalPrice :0}
        })
        next(error)
    }
}

const addToCart = async (req,res,next) => {
    try {
        console.log('add to cart');
        
        const userId = req.session.user ? req.session.user.id : null;

        if(!userId){
            return res.status(401).json({
                success : false,
                message : "User not logged in"
            });
        }

        const {productId,quantity} = req.body;
         
        console.log('product',productId)
         // Validate quantity
         if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero."
            });
        }

        const product = await Product.findById(productId);
        // console.log(product);
        
        if(!product){
            return res.status(404).json({
                success : false,
                message : "Product not found"
            })
        }

        const MAX_QTY_PER_USER = 5;
        
        let existingCart = await Cart.findOne({user : userId});

        let newQuantity = Math.min(Number(quantity), product.stock, MAX_QTY_PER_USER);

        if(existingCart){
            const productIndex = existingCart.products.findIndex(p => p.product.toString() === productId);

            if(productIndex > -1){
             
                // Existing product in the cart
                return res.status(400).json({
                    success: false,
                    message: "Product already exists in the cart. You can update the quantity from the cart page.",
                });
                
                 newQuantity = existingCart.products[productIndex].quantity +  newQuantity;;

               // Check stock and max quantity limit
               newQuantity = Math.min(newQuantity, product.stock, MAX_QTY_PER_USER);

               existingCart.products[productIndex].quantity = newQuantity;
               existingCart.products[productIndex].product_total = newQuantity * product.price;
           } else {
               // New product to add to cart
               existingCart.products.push({ product: productId, quantity: newQuantity, product_total: newQuantity * product.price });
           }

           // Recalculate total price
           existingCart.total_price = existingCart.products.reduce((acc, curr) => acc + curr.product_total, 0);
           await existingCart.save();
       } else {
           // New cart for the user
           const newCart = new Cart({
               user: userId,
               products: [{ product: productId, quantity: newQuantity, product_total: newQuantity * product.price }],
               total_price: newQuantity * product.price
           });
           await newCart.save();
       }

       return res.json({ success: true, message: "Product added to cart" });

   } catch (error) {
       console.error('Error while adding to the cart:', error.message);
       return res.status(500).json({
           success: false,
           message: "Error adding product to cart."
       });
   }
};

const removeCart = async (req,res,next) => {
    try {
        console.log('remove product');
        const userId = req.session.user.id;
         
        console.log('userId in remove cart',userId);

        if(!userId){
            return res.redirect('/login')
        }
      
        const productId = req.params.productId;
        let cart = await Cart.findOne({user : userId});
        console.log('product id in cart',productId)
        if(!cart){
            return res.redirect('/cart') // Redirect if cart does not exist
        }
       
        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);

        if(productIndex > -1){
            // Remove the product the from the cart

            cart.products.splice(productIndex,1);

            // Recalculate the total price
            cart.total_price = cart.products.reduce((acc,curr) => acc + curr.product_total,0);

            // Save the updated cart to the database
            await cart.save();
        }
        // Redirect back to the cart page after updating
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing product from the cart',error);
        res.redirect('/cart');
        next(error);
    }
}
const updateCart = async (req, res, next) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.status(401).json({
                success: false,
                message: "User not logged in"
            });
        }

        const userId = req.session.user.id;
        const productId = req.params.productId;
        const { quantity } = req.body; 

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if the product is out of stock
        if (product.stock === 0) {
            return res.json({
                success: false,
                message: "Product is out of stock"
            });
        }

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            const productIndex = cart.products.findIndex(p => p.product.toString() === productId);

            if (productIndex > -1) {
                let newQuantity = Number(quantity);
                let stockLimitReached = false;

                // Ensure the new quantity does not exceed available stock
                if (newQuantity >= product.stock) {
                    newQuantity = product.stock; // Set to maximum available stock
                    stockLimitReached = true;    // Flag stock limit reached

                }

                if (newQuantity < 1) {
                    newQuantity = 1; // Minimum quantity is 1
                }
                

                cart.products[productIndex].quantity = newQuantity;
                cart.products[productIndex].product_total = newQuantity * product.price;

                // Recalculate cart total
                cart.total_price = cart.products.reduce((acc, curr) => {
                    if (curr.quantity > 0) {
                        return acc + curr.product_total;
                    }
                    return acc;
                }, 0);

                await cart.save();

                if (stockLimitReached) {
                    return res.json({
                        success: 'reached',
                        message: "Quantity exceeds available stock. Maximum quantity set to available stock."
                    });
                }

                return res.json({
                    success: true,
                    price: product.price,
                    total_price: cart.total_price,
                    stock:product.stock
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in cart"
                });
            }
        } else {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
    } catch (error) {
        console.error("Error in updating cart", error.message);
        return res.status(500).json({
            success: false,
            message: "Error updating cart"
        });
    }
};






module.exports = {
    loadCart,
    addToCart,
    removeCart,
    updateCart
}