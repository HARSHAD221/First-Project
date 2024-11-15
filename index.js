
const mongoose = require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/first-project")
.then(() => console.log("Mongodb connected..."))
.catch(err => console.log('Mongodb connection error:',err))
const express = require('express');
const dotenv = require('dotenv')
dotenv.config()
require('./passport')
const passport = require('passport');
const session = require('express-session');
const {sessionSecret} = require('./config/config');
const path = require('path')
const app = express()
const port = process.env.PORT;


app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'));

app.use(session({
    secret : sessionSecret,
    resave : false,
    saveUninitialized : false,
    cookie : {secure : false, maxAge: 1000 * 60 * 60 * 1 }
}));

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


// for user routes
const userRoute = require('./routes/userRoutes')
app.use('/',userRoute);

// for admin routes
const adminRoute = require('./routes/adminRoutes')
const bodyParser = require('body-parser')
app.use('/admin',adminRoute);


app.listen(port,()=> console.log(`server running...${port}`))