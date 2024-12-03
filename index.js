
const mongoose = require('mongoose')

const express = require('express');
const dotenv = require('dotenv')
dotenv.config()
require('./passport')
const passport = require('passport');
const session = require('express-session');
const {sessionSecret} = require('./config/config');
const path = require('path')
const flash = require('connect-flash');
const app = express()
const port = process.env.PORT;
const Wishlist = require('./model/userModel/wishListModel'); 

// mongoose.connect("mongodb://127.0.0.1:27017/first-project")
mongoose.connect('mongodb+srv://harshadharshuk:X42gzS5VaV17ymCV@cluster0.q9r38.mongodb.net/first-project?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log("Mongodb connected..."))
.catch(err => console.log('Mongodb connection error:',err))

app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'));

app.use(session({
    secret : sessionSecret,
    resave : false,
    saveUninitialized : false,
    cookie : {secure : false, maxAge: 1000 * 60 * 60 * 1 }
}));

app.use(flash());

app.use(express.json());
app.use(express.urlencoded({extended :true}));

app.use(express.static('public'));
app.use(express.static('public/admin'));


app.use('/productImages', express.static('public/productImages'));
app.use('/admin/productImages', express.static(path.join(__dirname, 'public/admin/productImages')));


// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});



app.use(async (req, res, next) => {
    try {
        if (req.session.user) {
            const wishlist = await Wishlist.findOne({ user: req.session.user.id });
            res.locals.wishlistCount = wishlist ? wishlist.products.length : 0;
        } else {
            res.locals.wishlistCount = 0; 
        }
        next();
    } catch (error) {
        console.error("Error fetching wishlist count:", error);
        res.locals.wishlistCount = 0; 
        next();
    }
});



// for user routes
const userRoute = require('./routes/userRoutes')
app.use('/',userRoute);

// for admin routes
const adminRoute = require('./routes/adminRoutes')
app.use('/admin',adminRoute);


app.listen(port,()=> console.log(`server running...${port}`))