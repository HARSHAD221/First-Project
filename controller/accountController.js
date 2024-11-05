const addressModel = require('../model/userModel/addressModel');

const mongoose = require('mongoose');

const User = require('../model/userModel/registration');

const Order = require('../model/userModel/orderModel');

const Coupon = require('../model/adminModel/CouponModel');

const Wallet = require('../model/userModel/walletModel');

const loadUserAccount = async (req, res, next) => {
    try {
        console.log('reached myaccount');
        const userId = req.session.user.id;
       
        if (!userId) {
            console.log('no user')
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            })
       
        }
          
        // Fetch the user's addresses
        const userAddresses = await addressModel.findOne({ userId: userId });

        // Fetch the user's orders
        const orders = await Order.find({ user: userId }).sort({ orderDate: -1 }).exec();
        orders.forEach(order => {
            if (!order.items) {
                order.items = []; // Ensure items is an array if missing
            }
        });
         
        let wallet = await Wallet.findOne({userId : userId});

        console.log('wallet',wallet);

        if(!wallet){
            wallet = {
                balance : 0,
                transactions : [],
            };
        }

        const walletBalance = wallet ? wallet.balance : 0;

        const user = await User.findById(userId).populate({
            path: 'coupons.couponId',
            model: 'Coupon' 
        });

        // Prepare coupons to pass to the template
        const coupons = user.coupons.map(c => ({
            ...c.couponId._doc, 
            status: c.status, 
            usedAt: c.usedAt 
        }));

      

        res.render('myaccount', {
            userId,
            addresses: userAddresses ? userAddresses.addresses : [],
            orders: orders || [],
            coupons:  coupons,
            walletBalance,
            wallet,
        });
    } catch (error) {
        console.log('User account load error:', error.message);
        next(error);
    }
};


const updateProfile = async (req,res,next) => {
    try {
        let {name,phone} = req.body;
        console.log(req.body);
         
        name = name.trim();
        const nameRegex = /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/; 
        if (!name || !nameRegex.test(name)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid name. Only letters and single spaces between words are allowed."
            });
        }

        const phoneRegex = /^\d{10}$/;
        if(!phone || !phoneRegex.test(phone)){
            return res.status(404).json({
                status : "error",
                message : "Invalid phone number."
            })
        }
        const userId = req.session.user.id;

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({
                status : "error",
                message : "User not found"
            })
        }

        user.name = name;
        user.phone = phone;
       

        await user.save();

        req.session.user.name = name;
        req.session.user.phone = phone;
    

        return res.status(200).json({
            status : "success",
            message : "User profile updated successfully",
            user: { name,email : user.email, phone }
        })
    } catch (error) {
        console.log("Error while updating user profile",error.message);
        next(error)
        return res.status(500).json({
            status : "error",
            message : "An error occurred while updating the profile.Please try again"
        })
        
    }
   
}

// const addAddress = async (req,res,next) => {
//     try {
//         console.log('session',req.session);
        
//         console.log('hello');
//         console.log(req.body);

        
//         const {firstName,lastName,phone,streetAddress,city,state,zip,country} = req.body;
//         console.log('Address recieved in the back',{
//             firstName,
//             lastName,
//             phone,
//             streetAddress,
//             city,
//             state,
//             zip,
//             country
//         });

//         const userId = req.session.user.id;
//         if(!userId){
//             return res.status(401).json({status : 0,message :'Unauthorized : User not logged in'})
//         }
//         if (!firstName || !lastName || !phone || !streetAddress || !city || !state || !zip || !country) {
//             return res.status(400).json({ status: 1, message: "All fields are required" });
//         }
        
//         const existingAddress = await addressModel.findOne({ userId : userId});

//         if(!existingAddress){
//             const newAddress = new addressModel({
//                 userId : userId,
//                 address : [{firstName,lastName,phone,streetAddress,city,state,zip,country}]
//             })

//             const savedAddress = await newAddress.save();
     

//         if(savedAddress){
//             console.log('New address addedd');
//             return res.status(201).json({status : 7,message : "New address addedd successfully"})
//         }
//         }else{
//             existingAddress.addresses.push({firstName,lastName,phone,streetAddress,city,state,zip,country});

//             const updatedAddress = await existingAddress.save();
//             if (updatedAddress) {
//                 console.log("Additional address added");
//                 return res.status(200).json({ status: 7, message: "Address updated successfully" });
//             }
//         }
    
//     } catch (error) {
//         console.log('error in address adding',error.message);
//         res.status(500).send('Error in recieving address')
//         next(error)
//     }
// }

const addAddress = async (req, res, next) => {
    try {
        console.log('addAddress reached')
        const { firstName, lastName, phone, streetAddress, city, state, zip, country } = req.body;
        console.log(req.body);
        
        const userId = req.session.user?.id; 
        if (!userId) {
            return res.status(401).json({ status: 0, message: 'Unauthorized: User not logged in' });
        }

        if (!firstName || !lastName || !phone || !streetAddress || !city || !state || !zip || !country) {
            return res.status(400).json({ status: 1, message: "All fields are required" });
        }

        // Normalize input data for comparison
        const newAddressData = normalizeAddress({
            firstName,
            lastName,
            phone,
            streetAddress,
            city,
            state,
            zip,
            country,
        });

        const existingAddress = await addressModel.findOne({ userId: userId });

        if (!existingAddress) {
            // Create a new address entry
            const newAddress = new addressModel({
                userId: userId,
                addresses: [newAddressData]
            });

            await newAddress.save();
            return res.status(201).json({ status: 7, message: "New address added successfully" });
        } else {
            // Check for duplicate address
            const addressExists = existingAddress.addresses.some(addr => compareAddresses(addr, newAddressData));

            if (addressExists) {
                return res.status(409).json({ status: 0, message: "This address already exists" });
            }

            // Add the new address to the existing addresses
            existingAddress.addresses.push(newAddressData);
            await existingAddress.save();
            return res.status(200).json({ status: 7, message: "Address updated successfully" });
        }
    } catch (error) {
        console.log('Error in adding address:', error.message);
        res.status(500).send('Error in receiving address');
        next(error);
    }
};

// Function to normalize address data
const normalizeAddress = (data) => ({
    firstName: data.firstName.trim().toLowerCase(),
    lastName: data.lastName.trim().toLowerCase(),
    phone: data.phone.trim(),
    streetAddress: data.streetAddress.trim().toLowerCase(),
    city: data.city.trim().toLowerCase(),
    state: data.state.trim().toLowerCase(),
    zip: data.zip.trim(),
    country: data.country.trim().toLowerCase(),
});

// Function to compare addresses
const compareAddresses = (existingAddr, newAddr) => {
    return (
        existingAddr.firstName === newAddr.firstName &&
        existingAddr.lastName === newAddr.lastName &&
        existingAddr.phone === newAddr.phone &&
        existingAddr.streetAddress === newAddr.streetAddress &&
        existingAddr.city === newAddr.city &&
        existingAddr.state === newAddr.state &&
        existingAddr.zip === newAddr.zip &&
        existingAddr.country === newAddr.country
    );
};

// const addAddress = async (req, res, next) => {
//     console.log('addAddress controller invoked');

//     try {
//         const { firstName, lastName, phone, streetAddress, city, state, zip, country } = req.body;
//         console.log('Request Body:', req.body); 
        
//     } catch (error) {
//         console.log('Error in adding address:', error.message);
//         res.status(500).send('Error in receiving address');
//         next(error);
//     }
// };


const getAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;  
        const userId = req.session.user?.id;  

        // Check if userId exists in session
        if (!userId) {
            console.log('User is not authenticated');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        console.log('Fetching addressId:', addressId, 'for userId:', userId);
        
      
        const findAddressArray = await addressModel.findOne({ userId });

        // Check if the address array exists
        if (!findAddressArray || !findAddressArray.addresses) {
            return res.status(404).json({ success: false, message: 'Address array not found' });
        }

        // Find the correct address by its ID
        const address = findAddressArray.addresses.find(a => a._id.toString() === addressId);

        // If the address with the given ID is not found
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // Return the address if found
        res.status(200).json({ success: true, address });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const editAddress = async(req,res,next) => {
    try {
        const addressId = req.body.addAddressId;
        
        const {firstName,lastName,phone,streetAddress,city,state,zip,country} = req.body;

        const userId = req.session.user.id;

        const findAddressArray = await addressModel.findOne({userId});

        if(!findAddressArray){
            return res.status(404).send({error : "Users address array not found."})
        }

        const correctAddress = findAddressArray.addresses.find(address =>  address._id.toString() === addressId);

        if(!correctAddress){
            return res.status(404).send({error : "Address not found."})
        }

        correctAddress.firstName = firstName;
        correctAddress.lastName = lastName;
        correctAddress.phone = phone;
        correctAddress.streetAddress = streetAddress;
        correctAddress.city = city;
        correctAddress.state = state;
        correctAddress.zip = zip;
        correctAddress.country = country;

        const savedAddress = await findAddressArray.save();

        if (!savedAddress) {
            return res.status(500).send({ error: "Error saving the updated address." });
        }

        res.send({ success: true, message: "Address updated successfully!" });
        console.log('address changed successfully');
        
    } catch (error) {
        console.log('Error while editing the address',error.message);
        res.status(500).send({error : "Internal server error."});
        next(error)
    }
}


const removeAddress = async (req, res, next) => {
    const addressId = req.params.id;

    
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    try {
        
        const userId = req.session.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Perform the update to remove the address from the user's document
        const result = await addressModel.updateOne(
            { userId: userId },  // Find the document by userId
            { $pull: { addresses: { _id: addressId } } }  // Remove the address by _id
        );

        // Check if the address was actually deleted
        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found or already deleted' });
        }

        // If successful, return a success message
        return res.status(200).json({ success: true, message: 'Address removed successfully' });

    } catch (error) {
        console.error('Error removing address:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const logOut = async (req,res,next) => {
    try {
        console.log('reached logout');
        req.session.destroy((err) => {
            if(err){
                console.log(err)
                res.send("Error");
            }else{
                res.redirect('/login');
            }
        });
    } catch (error) {
        console.log('error while logout',error.message);
        next(error);
    }
}

module.exports = {
    loadUserAccount,
    updateProfile,
    addAddress,
    getAddress,
    editAddress,
    removeAddress,
    logOut
}