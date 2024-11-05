
const Offer = require('../../model/adminModel/offerModel');

const Category = require('../../model/adminModel/CategoryModel');

const Products = require('../../model/adminModel/ProductModel');
const { query } = require('express');

const offerPageLoad = async (req,res,next) => {
    try {
        // console.log('reached for offer page load');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        const skip = (page -1) * limit;

        const offers = await Offer.find({})
        .populate({ path: 'categoryId', select: 'categoryName' }) // Populate categoryName
        .populate({ path: 'productId', select: 'productName' }) // Populate productName
        .skip(skip)
        .limit(limit);

        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers/limit);

        res.render('offer',{
            offers,
            currentPage : page,
            totalPages,
            limit,
            message : 'Offer page loaded'
        })
    } catch (error) {
        console.error('Error while loading offer page',error.message);
        return res.status(500).json({
            success : false,
            message : 'Error while loading offer page.'
        })
    }
};


const createOfferPage = async(req,res,next) => {
    try {

        const products = await Products.find({isBlock : false});
        const categories = await Category.find({isBlock : false});
     
        const productOptions = products.map(p => ({
            id : p._id,
            name : p.productName
        }));
         
        const categoryOptions = categories.map(c => ({
            id: c._id, 
            name: c.categoryName
        }));

        res.render('createOffer',{
            products : productOptions,
            categories : categoryOptions,
        })
    } catch (error) {
        console.error('Error while rendering create offer Page',error.message);  
    }
}

const addOffer = async (req,res,next) => {
    try {

        const {offerType,offerAmount,startDate,endDate,productId,categoryId} = req.body;

        if(!offerType || !offerAmount || !startDate || !endDate ){
            return res.status(400).json({
                success : false,
                message : 'All fields are required'
            });
        }
        
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be earlier than end date'
            });
        };

        const offerData = {
            offerType,
            discount : offerAmount,
            startDate,
            endDate
        };

        if(offerType=='Products'){
            offerData.productId = productId;
        }else if(offerType==='Category'){
            offerData.categoryId = categoryId;
        }
        
        const newOffer = new Offer(offerData);

         await newOffer.save();

        return res.status(200).json({success : true,message : 'Offer created successfully'})
    } catch (error) {
        console.error('Error while creating  offer',error.message);
        return res.status(500).json({success : false,message : 'Internal server issue while creating offer'})
    }
};

const deleteOffer = async (req,res,next) => {
    try {
        console.log('reached for delete offer');

        const offerId = req.params.id;

        if(!offerId){
            return res.status(400).json({success : false,message : 'Offer not found'});
        }

        const offer = await Offer.findByIdAndDelete(offerId);
       

        return res.status(200).json({success : true,message : 'Offer successfully deleted'});
    } catch (error) {
        console.error('Error while deleting offer',error.message);
        return res.status(500).json({success : false,message : 'Internal server issue while deleting offer'});
    }
}

module.exports = {
    offerPageLoad,
    createOfferPage,
    addOffer,
    deleteOffer,
}