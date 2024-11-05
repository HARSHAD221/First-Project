
const Offer = require('./model/adminModel/offerModel');

const Category = require('./model/adminModel/CategoryModel');

const applyOfferToProduct = async (product) => {
    const currentDate = new Date();

    // checking for product specific offer
   
    let activeOffer = await Offer.findOne({
        offerType : 'Products',
        productId : product._id,
        startDate : {$lte : currentDate},
        endDate : {$gte : currentDate},
    });
    
    if (!activeOffer) {
      // Look up the category by its name and get the ObjectId
      const category = await Category.findOne({  categoryName: product.category });

      if (category) {

          activeOffer = await Offer.findOne({
              offerType: 'Category',
              categoryId: category._id, // Use the ObjectId of the category
              startDate: { $lte: currentDate },
              endDate: { $gte: currentDate },
          });
      } else {
          console.log(`Category "${product.category}" not found`);
      }
      };


    let finalPrice = product.price;
    if(activeOffer){
        finalPrice = product.price - (product.price * (activeOffer.discount / 100));
        console.log(`Applied discount: ${activeOffer.discount}%, Final Price: ${finalPrice}`);
    } else {
        console.log('No active offer found; final price is the same as the original price.');
    }
    console.log('Final',finalPrice);
    return {
        ...product._doc, // Return the product data with updated price
        finalPrice,
        discount: activeOffer ? activeOffer.discount : 0 // Discount percentage
    };
};

module.exports = applyOfferToProduct;