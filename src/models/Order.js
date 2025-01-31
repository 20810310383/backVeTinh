const mongoose = require('mongoose')

const Order_Schema = new mongoose.Schema(
    {
        IdSP: {ref: "SanPham", type: mongoose.SchemaTypes.ObjectId},    
        IdKH: {ref: "AccKH", type: mongoose.SchemaTypes.ObjectId},  
        linkDownload: { type: String, default: "" },  
    },
    { 
        timestamps: true,   // createAt, updateAt
    },
);

const Order = mongoose.model('Order', Order_Schema);

module.exports = Order;