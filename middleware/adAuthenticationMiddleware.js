
const adminLoggedIn = async (req,res,next) => {
    try {
        if(!req.session.admin){
            return res.redirect('/admin/login')
        }else{
            next()
        }
    } catch (error) {
        console.log('Error in admin authentication',error.message);
        next()
    }
}

const adminLoggedOut = async (req,res,next) => {
    try {
        if(req.session.admin){
          return   res.redirect('/admin/dashboard')
        }else{
            next()
        }
    } catch (error) {
        console.error("Error while admin logging out",error.message);
        next()
    }
}

module.exports = {
    adminLoggedIn,
    adminLoggedOut
}