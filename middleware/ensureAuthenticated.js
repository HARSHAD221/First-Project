
const ensureAuthenticated = (req,res,next) => {
    if(req.session && req.session.user) {
        console.log('user')
        return next()
    }else{
        res.redirect('/login')
        console.log('no user');
        
    }
}


module.exports = ensureAuthenticated;