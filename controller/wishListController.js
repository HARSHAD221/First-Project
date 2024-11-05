
const WishList = require('../model/userModel/wishListModel');

const Cart = require('../model/userModel/cartModel');

const applyOfferToProduct = require('../offerHelper');

const loadWishList = async (req,res,next) => {
    try {
        console.log('reached for load wishlist');
        const userId = req.session.user ? req.session.user.id : null;
        if(!userId){
            return res.status(401).json({
                success : false,
                message :"User not authenticated"
            })
        }
        

        let  wishList = await WishList.findOne({user : userId}).populate('products.productId');
        console.log('Wishlist:', wishList);
    
        const cart = await Cart.findOne({user : userId}).populate('products.product');

    
        console.log('Cart:', cart);
            if(!wishList || !wishList.products.length){
               return res.render('wishlist', {products : []}) ;
            };

        const cartProducts = cart ? cart.products.map(item => item.product._id.toString()) : [];

        const productsWithCart = await Promise.all(
            wishList.products.map(async item => {
                const productWithOffer = await applyOfferToProduct(item.productId); // Update here
                return {
                    products: productWithOffer, // Updated product with offer applied
                    isInCart: cartProducts.includes(item.productId._id.toString())
                };
            })
        );

           
        console.log('Products with Cart info:', productsWithCart);
        return  res.render('wishlist',{products : productsWithCart});
    } catch (error) {
        console.error('Error while loading wishlist',error.message);
        return res.status(500).json({
            success : false,
            message : "Cound'nt load wishlist page"
        })
    }
}

const addToWishList = async (req, res, next) => {
    try {
        const { productId } = req.body;
       
        if (!productId) {
            return res.status(404).json({
                success: false,
                message: "Could not find product to add to wishlist"
            });
        };

        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Find the wishlist of the user
        let wishList = await WishList.findOne({ user: userId });

      
        if (!wishList) {
            const newList = new WishList({
                user: userId,
                products: [{ productId }]
            });

            const saveList = await newList.save();

            if (saveList) {
                return res.status(200).json({
                    success: true,
                    message: "Product added to wishlist"
                });
            } else {
                // If saving failed, return an error response
                return res.status(500).json({
                    success: false,
                    message: "Error saving wishlist"
                });
            }
        };

        const existingProduct = wishList.products.find(product => product.productId.toString() === productId);

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "The product is already in the wishlist"
            });
        }

        wishList.products.push({ productId });
        await wishList.save();

    
        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });

    } catch (error) {
        console.error('Error while adding product to wishlist:', error.message);
        next(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot add to wishlist.'
        });
    }
};

const removeFromWishList = async (req,res,next) => {
    try {
        console.log('removed from wishlist');
        const {productId} = req.body;
        const userId = req.session.user ? req.session.user.id : null;
        if(!productId){
            return res.status(404).json({
                success : false,
                message : 'Product not found for remove from wishlist'
            })
        };

        if(!userId){
            return res.status(401).json({
                success : false,
                message : "User not authenticated."
            })
        };

        const wishList = await WishList.findOneAndUpdate({user : userId},
            {$pull : {products : {productId : productId}}},
            {new : true}
        );

        if(!wishList){
            console.log('wishList not found')
        }
        return res.status(200).json({
            success : true,
            message : 'Product remved from wishList'
        })
    } catch (error) {
        console.error('Error while removing product from wishlist');
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

module.exports = {
    loadWishList,
    addToWishList,
    removeFromWishList
}