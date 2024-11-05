
const Product = require("../../model/adminModel/ProductModel");

const Category = require("../../model/adminModel/CategoryModel");

const userModel = require("../../model/userModel/registration");
const categories = require("../../model/adminModel/CategoryModel");

const loadProducts = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip  = (page - 1) * limit;
    const products = await Product.find().sort({createdAt : 1}).limit(limit).skip(skip);
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts/limit);
    res.render('products',{
          products,
          currentPage : page,
          totalPages
    })

    } catch (error) {
     console.log('error while loading products',error.message);
     next(error);
    }
}
    
const loadCreateProducts = async (req, res, next) => {
    try {
        // Fetch all categories where 'isBlock' is false
        const findAllCategories = await Category.find({ isBlock: false }, 'categoryName');  

        // Render the 'createproducts' page, passing the categories
        res.render('createproducts', { categories: findAllCategories });
    } catch (error) {
        console.log('Load create products encountered an error:', error.message);
        next(error);  // Make sure 'next' is defined
    }
};



const createProducts = async (req, res) => {
    try {
        const { productName, description, price,stock, category } = req.body;

        // Ensure inputs are cleaned
        const trimmedProductName = productName.trim().toLowerCase();
        const trimmedCategory = category.trim().toLowerCase();

        // Log the uploaded files
        console.log('Uploaded files:', req.files);

        // Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: 'No images uploaded.',
            });
        }

        // Check if a product with the same name already exists (case-insensitive)
        const existingProduct = await Product.findOne({ 
            productName: trimmedProductName 
        });

        if (existingProduct) {
            return res.status(400).json({
                message: 'Product already exists.',
            });
        }

        // Create a new product
        const newProduct = new Product({
            productName: trimmedProductName,
            description: description.trim(),
            price: parseFloat(price),
            category: trimmedCategory,
            imagePaths:  req.files.map(file => {
                // Extract relative path from the file path
                return `/admin/productImages/${file.filename}`;
            }),
            stock: parseInt(stock, 10) || 0, 
            isBlock: false,
        });

        await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully!',
            product: newProduct,
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

const unlistProducts = async (req,res) => {
    try {
        const productId = req.params.id
    console.log(productId);
    const findproduct = await Product.findOne({_id : productId });
    if(findproduct){
        findproduct.isBlock = !findproduct.isBlock;

        await findproduct.save();

        console.log(`${findproduct.productName}'s status changed to : ${findproduct.isBlock}`)

        res.send({success : true});
    }else{
        console.log(`Product id not found to list to unlist`)
        res.send({success : false});
    }
    } catch (error) {
        console.log('Error while unlisting product :',error.message);
        
        next(error)
    }
    
}

const loadEditProduct = async (req, res, next) => {
    try {
        const productId = req.query.id;

        const findProduct = await Product.findOne({ _id: productId });
        const findAllCategories = await Category.find({isBlock : false});

        if (!findProduct) {
            return res.status(400).json({
                status: "error",
                message: "Product not found",
            });
        }

        if (!findAllCategories || findAllCategories.length === 0) {
            return res.render('editproduct', {
                product: findProduct,
                categories: [],
                message: "No categories available"
            });
        }
        

        res.render('editproduct', { product: findProduct, categories: findAllCategories });
    } catch (error) {
        next(error); 
    }
};

const editProducts = async (req, res, next) => {
    try {
        console.log('reached for edit products')
        const productInfo = req.body;
        const newImageFiles = req.files || []; // Handle case where no new files are uploaded
        const findProduct = await Product.findById(productInfo.productId);

        if (!findProduct) {
            return res.status(404).send({ success: 0, message: 'Product not found' });
        }

        // Validate required fields
        const requiredFields = ['productName', 'description', 'price', 'category'];
        for (const field of requiredFields) {
            if (!productInfo[field]) {
                return res.status(400).send({ success: 0, message: `${field} is required` });
            }
        }

        // Update product details
        findProduct.productName = productInfo.productName;
        findProduct.description = productInfo.description;
        findProduct.price = productInfo.price;
        findProduct.stock = productInfo.stock;
        findProduct.category = productInfo.category;

        // Update images if new files are provided
        if (newImageFiles.length > 0) {
            // Clear existing images if new ones are uploaded
            findProduct.imagePaths = []; // Reset existing images
            newImageFiles.forEach(file => {
                findProduct.imagePaths.push(`/admin/productImages/${file.filename}`); // Add new images
            });
        }

        // Save the updated product
        const saveUpdate = await findProduct.save();
        if (saveUpdate) {
            res.send({ success: 1 });
            console.log("Successfully updated product");
        } else {
            res.status(500).send({ success: 0, message: 'Failed to update product' });
        }
    } catch (error) {
        console.error("Error updating product:", error);
        next(error);
    }
};



module.exports = {
    loadProducts,
    loadCreateProducts,
    createProducts,
    unlistProducts,
    loadEditProduct,
    editProducts
}