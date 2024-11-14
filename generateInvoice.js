
const PDFDocument = require('pdfkit');

const Order = require('./model/userModel/orderModel');

const User = require('./model/userModel/registration');

const Address = require('./model/userModel/addressModel');

const generateInvoice = async (req,res) => {
    try {
        console.log('Reached for generate pdf');
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId).populate('user')
        console.log('order while generatePDf',order);
        
        if(!order){
            return res.status(404).json({success : false,message : 'Order not found'});
        };
        const user = order.user;
        const address = order.deliveryAddress;
        
        if(!address){
            console.log('Error : Address not found');
            return res.status(404).json({success : false, message : 'Address not found.'})
            
        }
        const invoiceNumber = `INV-${order._id}-${Date.now()}`;
        
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Disposition',`attachment; filename=${invoiceNumber}.pdf`);
        res.setHeader('Content-Type','application/pdf');

        // Pipe PDF to the response
        doc.pipe(res);

        doc.fontSize(20).text('Invoice',{align :'center'});
        doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
        doc.text(`Order Date :,${order.orderDate}`);
        doc.text(`Status: ${order.status}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.moveDown(); 
        
        // Add user details
        doc.text(`User : ${user.name}`);
        doc.text(`Email : ${user.email}`);
        doc.text(`Phone : ${user.phone}`);
        doc.moveDown();
        
         // Delivery Address
         doc.fontSize(14).text('Delivery Address').moveDown(0.5);
         doc.
       
 fontSize(12)
            .text(`First Name: ${address.firstName || 'N/A'}`)
            .text(`Last Name: ${address.lastName || 'N/A'}`)
            .text(`Phone: ${address.phone || 'N/A'}`)
            .text(`Street Address: ${address.streetAddress || 'N/A'}`)
            .
     
 text(`City: ${address.city|| 'N/A'}`)
            .text(`State: ${address.state || 'N/A'}`)
            .text(`Zip: ${address.zip || 'N/A'}`)
            .text(`Country: ${address.country || 'N/A'}`)
            .moveDown();

        doc.text('Products');
        order.products.forEach((product,index) => {
            doc.text(`\n${index + 1}. Product ID: ${product.product}`);
            doc.text(`Quantity : ${product.quantity}`)
            doc.text(`Price : ${product.price}`)
        });
        doc.moveDown();

        doc.fontSize(16).text(`Total Price: $${order.totalPrice}`, { align: 'right' });
        doc.end();
    } catch (error) {
        console.error('Error generating invoice',error.message);
        return res.status(500).json({success : false,message : 'Error generating invoice'})
    }
};

module.exports = {generateInvoice}