const Coupon = require("../../model/adminModel/CouponModel");

const loadCouponPage = async(req,res,next) => {
    try {        
        console.log('Reaached for coupon load');
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const coupons = await Coupon.find({}).sort({createdAt : 1}).limit(limit).skip(skip);
        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons/limit)
        res.render('coupon',{coupons,currentPage : page,totalPages});
    } catch (error) {
        console.error('Error while loading coupon page',error.message);
        next()
    }
};

const loadCreateCoupon = async(req,res,next) => {
    try {
        res.render('createCoupon',{message : "Create coupon loaded"})
    } catch (error) {
        console.error('Error in loading creating coupon page',error.message);
        next()
    }
};

const createCoupon = async(req,res,next) => {
    try {
        console.log('reached for coupon creating');
        const { name, code, amount, startdate, enddate, minpurchaseamount, description } = req.body;
         console.log('req.bo',req.body)
        if (!name || !code || !amount || !startdate || !enddate ||  !minpurchaseamount || !description) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if(new Date(startdate) >= new Date(enddate)){
            return res.status(400).json({
                success : false,
                message : "End date must be later than start date"
            });
        }

        const existingCoupon = await Coupon.findOne({code});

        if(existingCoupon){
            return res.status(400).json({
                success : false,
                message : "Coupon already existed.Please create another one"
            });
        }

        const newCoupon = new Coupon({
            name,
            code,
            description,
            discountAmount: amount, 
            startDate: new Date(startdate),
            endDate: new Date(enddate),
            minPurchaseAmount: minpurchaseamount 
        });
          
        await newCoupon.save();
      

        return res.status(200).json({
            success : true,
            message : 'Coupon added successfully.'
        })
    } catch (error) {
        console.error('Error while creating coupon',error.message);
        return res.status(500).json({
            success : false,
            message : 'Server error.Try again'
        });
    }
};

const editCouponController  = async (req,res,next) => {
    try {
       
        const {id} = req.params;
        const { editCouponName, editCouponCode, editDiscountAmount, editStartDate, editEndDate, editMinPurchaseAmount} = req.body;
     
        if(!editCouponName || !editCouponCode || !editDiscountAmount || !editStartDate || !editEndDate || !editMinPurchaseAmount ){
            return res.status(400).json({
                success : false,
                message : "All fields are required."
            })
        };
        const coupon = await Coupon.findByIdAndUpdate(id,
            { name :editCouponName,
              code : editCouponCode,
              discountAmount : editDiscountAmount,
              startDate : editStartDate,
              endDate : editEndDate,
              minPurchaseAmount : editMinPurchaseAmount
            }
        );
        if(!coupon){
            return res.status(400).json({
                success : false,
                message : "Coupon not found for update"
            })
        };


        return res.status(200).json({
            success : true,
            message : 'Coupon edited successfully.'
        });

    } catch (error) {
        console.error('Error while editing coupon',error.message);
        return res.status(500).json({
            success : false,
            message : 'Internal server issue while editing coupon'
        });
    }
}

const removeCoupon = async(req,res,next) => {
    try {
        const  couponId = req.params.id;
    
        if(!couponId){
            return res.status(400).json({
                success : false,
                message : 'Coupon id not found for remove the coupon '
            })
        };

        const coupon  = await Coupon.findByIdAndDelete(couponId);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }
        return res.status(200).json({
            success : true,
            message : 'Coupon removed successfully'
        })
    } catch (error) {
        console.error('Error while removing coupon',error.message);
        return res.status(500).json({
            success : false,
            message : 'Server issue while removing the coupon.'
        });
    }
};


module.exports = {
    loadCouponPage,
    loadCreateCoupon,
    createCoupon,
    editCouponController,
    removeCoupon,
}