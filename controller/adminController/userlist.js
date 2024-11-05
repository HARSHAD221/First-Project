
const { query } = require('express');
const User = require('../../model/userModel/registration');

const mongoose = require('mongoose');

const bcrypt = require('bcrypt');

const loadUsers = async(req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page -1) * limit;
    
        const users = await User.find({}).sort({createdAt : 1}).limit(limit).skip(skip);
        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers/limit);
    
        res.render('userlist',{
            users,
            currentPage : page,
            totalPages
        });
    } catch (error) {
        console.log('User list having error :',error.message);
    }
   
}

const blockUser = async (req,res,next) => {
    try {
        const userId = req.params.id;
        const { action } = req.body;

        if (!userId || !action) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        // Perform the block or unblock operation based on the action
        const isBlock = action === 'Block';
        const updateStatus = await User.findByIdAndUpdate(userId, { is_block: isBlock });

        if (updateStatus) {
            res.status(200).json({ success: true, message: `User ${isBlock ? 'blocked' : 'unblocked'}` });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

const searchUsers = async (req,res) => {
    const searchQuery = req.query.search || "";
    console.log('search reqyuest recieved',searchQuery)
    try {
       let users;
       if(searchQuery){
        users = await User.find({
            $or : [
            {name : {$regex : searchQuery,$options : "i"}},
             {email : {$regex :searchQuery,$options : "i"}}
            ]
          });
       }else {
        // If the search query is empty, return all users
        users = await User.find({});
    }
        res.status(200).json({
            status : "success",
            users
        });

    } catch (error) {
        console.log('Search users have an error',error.message);
        return res.status(500).json({
            status : "error",
            message : "Something went wrong.Please try again."
        })
    }
}
module.exports = {
    loadUsers,
    blockUser,
    searchUsers
}