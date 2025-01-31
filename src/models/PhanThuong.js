const mongoose = require('mongoose');

const PhanThuong_Schema = new mongoose.Schema({   
        code: { type: String},           
        phanThuong: { type: Number},           
        thoiGianHetHan: { type: String},  
        rate: { type: Number, required: true, min: 1, max: 100 },  // Tỷ lệ phần thưởng (1% đến 100%)
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);


module.exports = mongoose.model("PhanThuong", PhanThuong_Schema);