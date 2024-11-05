
    const applyOfferToProduct = require('../offerHelper');

    const applyOffer = async(req,res,next) => {
        try {
            console.log('Reached for apply offer');
            if(req.products){
               req.products = await Promise.all(req.products.map(product => applyOfferToProduct(product)));
            }
            // For a single product, e.g., on the single product page
            if (req.product) {
                req.product = await applyOfferToProduct(req.product);
            }
           next();
        } catch (error) {
            console.error('Error while applying offer:', error.message);
    
            // Call next with the error only if headers have not been sent
            if (!res.headersSent) {
                next(error);
            } else {
                console.error("Attempted to call next(error) after headers were sent");
            }
        }
    };

    module.exports = applyOffer;