
const User = require('../model/userModel/registration');

const isLogin=(req,res,next)=>{
    try {
        if(!req.session.user){
            res.redirect('/login')
        }else{
            next()
        } 
    } catch (error) {
        console.log(error.message);
    }
   
}


const isLogOut=(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect('/')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
    
}

const entryRestrict = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.user.id);
    
        if (!user) {
        
            return res.redirect('/login');
        }

        // console.log("User block status in middleware:", user.is_block); 

        if (user.is_block) {
           
            req.session.destroy((err) => {
                if (err) {
                    console.log('Error destroying session:', err);
                }
                return res.redirect('/login');
            });
        } else {
            // User is not blocked, proceed to the next middleware/controller
            next();
        }
    } catch (error) {
        console.log("Error in entryRestrict middleware:", error.message);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    isLogin,
    isLogOut,
    entryRestrict
}