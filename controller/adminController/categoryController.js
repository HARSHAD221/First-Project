
const Category = require('../../model/adminModel/CategoryModel');

const loadCategory = async (req, res, next) => {
    try {
        let page = parseInt(req.query.page) || 1; 
        const limit = 5;
        
        const totalCategory = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategory / limit);
        
        // Ensure the page does not exceed totalPages
        if (page > totalPages) page = totalPages;
        
        const skip = (page - 1) * limit;

        const findAllCategories = await Category.find({})
            .sort({ createdAt: 1 })
            .limit(limit)
            .skip(skip);

        res.render('category', {
            categories: findAllCategories,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error in the category loading:', error.message);
        next(error);
    }
};


const CategoryCreatePageRender = async(req,res,next) => {
    try {
        res.render('createCategory');
    } catch (error) {
        console.log('rendering issue',error.message);
        next()
    }
}


const getCategoryDetails =  async (req,res,next) =>{
    try {
        console.log('reached for category add');
        const categoryDetails = req.body;
        console.log('categorydetails',categoryDetails)
        const categoryNameLower = categoryDetails.categoryName.toLowerCase();
        const existingCategory = await Category.findOne({categoryName : categoryNameLower});
    
        if (existingCategory) {
            // If the category already exists, send an error response
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        // Create a new category if it doesn't exist
        const newCategory = new Category({
            categoryName: categoryNameLower,
            categoryDescription: categoryDetails.categoryDescription, // Assuming description is passed as 'categoryDescription'
        });

        // Save the new category to the database
        await newCategory.save();

        console.log('Category details stored in db',newCategory);

        // Send a success response
        return res.status(200).json({
            success: true,
            message: "Category added successfully",
            category : newCategory
        });

    } catch (error) {
        console.log('Error storing category details:', error.message);
        next(error); 
        return res.status(500).json({
            success : false,
            message : "Something went wrong.Please try again"
        })
       
    }
};

const unlistCategory = async(req,res,next) => {
    try {
       
        const categoryId = req.params.id;
        console.log('categoryId',categoryId);
        const findCategory = await Category.findOne({_id : categoryId});
        if (!findCategory) {
            console.log("Category not found");
            return res.json({ success: false, message: "Category not found" });
        }

        // Toggle the 'isBlock' status
        findCategory.isBlock = !findCategory.isBlock;

        // Save the updated category
        await findCategory.save();
        console.log(`${findCategory.categoryName} is now: ${findCategory.isBlock ? 'Unlisted' : 'Listed'}`);

        // Respond with success
// Respond with success and include isBlock status
res.status(200).json({ success: true, isBlock: findCategory.isBlock, message: `Category ${findCategory.isBlock ? 'unlisted' : 'listed'} successfully` });
        
    } catch (error) {
        console.log('Category listing has an error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
        next(error);  // Optionally, call next() if you use an error handler
    }
};

const updateCategory = async (req, res, next) => {
    try {
        console.log('Reached for category update.');
        console.log('Request body:', req.body);
        const categoryId = req.params.categoryId;
        console.log('categoryId',categoryId);
        const { categoryName, categoryDescription } = req.body;
        if (!categoryId || !categoryName) {
            return res.status(400).json({success: false, message: "Category ID and name are required" });
        }

        const NormalcategoryName = categoryName.trim().toLowerCase();

        // Checking category already exists
        const findCategory = await Category.findById(categoryId);
        if (!findCategory) {
            return res.status(404).json({success : false, message: "Category not found" });
        }

        const existingCategory = await Category.findOne({ categoryName: NormalcategoryName });
        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.status(409).json({success :false, message: "Category Name already exists." });
        }

        // Update the category details
        findCategory.categoryName = NormalcategoryName;
        findCategory.categoryDescription = categoryDescription !== undefined ? categoryDescription : findCategory.categoryDescription;
    
        await findCategory.save();
        console.log('category updated successfully');
        
        return res.status(200).send({success: true,  message: "Category updated successfully" });
    } catch (error) {
        console.error("Error while updating category", error.message);
        next(error);
    }
}



  module.exports = {
    loadCategory,
    CategoryCreatePageRender, 
    getCategoryDetails,
    unlistCategory,
    updateCategory
  }