const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define your storage strategy
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/admin/productImages');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Middleware to handle image upload
const uploadImages = upload.array('images', 3);  // Allow up to 3 image files

const handleImagePaths = (req, res, next) => {
    if (req.files) {
        // Create an array to hold relative paths
        const imagePaths = req.files.map(file => {
            // Create relative path from '/public'
            return `/admin/productImages/${file.filename}`;
        });
        req.body.imagePaths = imagePaths; 
    }
    next();
};

module.exports = uploadImages;
