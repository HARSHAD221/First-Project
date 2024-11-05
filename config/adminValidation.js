
const {body} = require('express-validator');

const validateLoginAdmin = [
    body('loginEmail').isEmail().withMessage("Invalid Email"),
    body('loginPassword').notEmpty().withMessage("Password is required")
];

module.exports = {validateLoginAdmin}