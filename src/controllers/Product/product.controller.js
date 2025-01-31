const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const { log } = require('console');
const SanPham = require('../../models/SanPham');
const { default: mongoose } = require('mongoose');
require('dotenv').config();

module.exports = {

    getProducts: async (req, res) => {
        try {
            const { page, limit, TenSP, sort, order, locTheoLoai, locTheoGia, GiamGiaSP, tu, den, isActive } = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (TenSP) {
                const searchKeywords = TenSP.trim().split(/\s+/).map(keyword => {
                    // Chuyển keyword thành regex để tìm kiếm gần đúng (không phân biệt chữ hoa chữ thường)
                    const normalizedKeyword = keyword.toLowerCase();  // Chuyển tất cả về chữ thường để không phân biệt
                    return {
                        TenSP: { $regex: normalizedKeyword, $options: 'i' } // 'i' giúp tìm kiếm không phân biệt chữ hoa chữ thường
                    };
                });
            

                query.$or = searchKeywords;
            }
            // Tìm kiếm theo IdLoaiSP nếu có
            if (locTheoLoai) {
                // Chuyển 'locTheoLoai' từ string sang mảng ObjectId
                const locTheoLoaiArray = Array.isArray(locTheoLoai) ? locTheoLoai : JSON.parse(locTheoLoai);

                query.IdLoaiSP = { $in: locTheoLoaiArray }; // Dùng toán tử $in để lọc theo mảng các ObjectId
            }
            
            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            // lọc tài khoản theo giá từ X đến Y
            if (locTheoGia) {
                let convert_string = locTheoGia.replace(/[^\d-]/g, '');
                let valuesArray = convert_string.split('-');
                let giatri1 = parseFloat(valuesArray[0]);
                let giatri2 = parseFloat(valuesArray[1]);
            
                // Lọc tài khoản có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (convert_string) {
                    query.GiaBan = {
                        $gte: giatri1, $lte: giatri2
                    };
                }
            }
           
            if(tu && den) {
                let giatri3 = parseFloat(tu);
                let giatri4 = parseFloat(den);
                console.log("giatri3: ", giatri3);
                console.log("giatri4: ", giatri4);
                // Lọc tài khoản có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (giatri3 && giatri4) {
                    query.GiaBan = {
                        $gte: giatri3, $lte: giatri4
                    };
                }
            }   
                       
            if (GiamGiaSP) {
                query.GiamGiaSP = { $gt: GiamGiaSP };  // Lọc tài khoản có GiamGiaSP lớn hơn 20
            }

            if(isActive){
                query.isActive = isActive
                let sp = await SanPham.find(query)
                .populate("IdLoaiSP")
                .skip(skip)
                .limit(limitNumber)
                .sort({ [sort]: sortOrder })           

                const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ

                const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang

                if(sp) {
                    return res.status(200).json({
                        message: "Đã tìm ra products",
                        errCode: 0,
                        data: sp,
                        totalSanPham,
                        totalPages,
                        currentPage: pageNumber,
                    })
                } else {
                    return res.status(500).json({
                        message: "Tìm products thất bại!",
                        errCode: -1,
                    })
                }
            }

            // query.isActive = isActive
            
            let sp = await SanPham.find(query)
                .populate("IdLoaiSP")
                .skip(skip)
                .limit(limitNumber)
                .sort({ [sort]: sortOrder })           

            const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang

            if(sp) {
                return res.status(200).json({
                    message: "Đã tìm ra products",
                    errCode: 0,
                    data: sp,
                    totalSanPham,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm products thất bại!",
                    errCode: -1,
                })
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }        
    },

    createProduct: async (req, res) => {
        try {
            let {TenSP, GiaBan, GiamGiaSP, urlYoutube, MoTa, ImageSlider, Image, IdLoaiSP, SoLuongTon, Note, urlDriverVideo} = req.body                                      

            let createSP = await SanPham.create({TenSP, GiaBan, GiamGiaSP, urlYoutube, MoTa, ImageSlider, Image, IdLoaiSP, SoLuongTon, Note, urlDriverVideo})

            if(createSP){
                return res.status(200).json({
                    message: "Bạn đã thêm tài khoản thành công!",
                    errCode: 0,
                    data: createSP
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm tài khoản thất bại!",                
                    errCode: -1,
                })
            }    

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }        
    },

    updateProduct: async (req, res) => {
        try {
            let {_id, TenSP, GiaBan, GiamGiaSP, urlYoutube, MoTa, ImageSlider, Image, IdLoaiSP, SoLuongTon, Note, urlDriverVideo} = req.body

            let updateTL = await SanPham.updateOne({_id: _id},{TenSP, GiaBan, GiamGiaSP, urlYoutube, MoTa, ImageSlider, Image, IdLoaiSP, SoLuongTon, Note, urlDriverVideo})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa tài khoản thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa tài khoản thất bại"
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await SanPham.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá tài khoản thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá tài khoản thất bại!"
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },   

    getDetailSP: async (req, res) => {
        try {
            const {IdAcc} = req.query
            console.log("id getDetailSP: ", IdAcc);            

            let sp = await SanPham.findById(IdAcc).populate("IdLoaiSP")
            if(sp) {
                return res.status(200).json({
                    data: sp,
                    message: "Đã có thông tin chi tiết!"
                })
            } else {
                return res.status(500).json({
                    message: "Thông tin chi tiết thất bại!"
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    getProductToCategorySPLienQuan: async (req, res) => {
        try {
            const { page, limit, TenSP, sort, order, locTheoLoai, locTheoGia, GiamGiaSP, tu, den, IdLoaiSP, isActive } = req.query; 
            console.log("id: ", IdLoaiSP);

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;
            console.log("id getProductToCategorySPLienQuan: ", IdLoaiSP);
            
            if (!IdLoaiSP) {
                return res.status(400).json({ message: "IdLoaiSP is required!" });
            }           

            // ----------------------
            // Tạo query tìm kiếm
            const query = {};
            if (TenSP) {
                const searchKeywords = (TenSP || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    TenSP: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }           

            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            // lọc tài khoản theo giá từ X đến Y
            if (locTheoGia) {
                let convert_string = locTheoGia.replace(/[^\d-]/g, '');
                let valuesArray = convert_string.split('-');
                let giatri1 = parseFloat(valuesArray[0]);
                let giatri2 = parseFloat(valuesArray[1]);
            
                // Lọc tài khoản có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (convert_string) {
                    query.GiaBan = {
                        $gte: giatri1, $lte: giatri2
                    };
                }
            }
           
            if(tu && den) {
                let giatri3 = parseFloat(tu);
                let giatri4 = parseFloat(den);
                console.log("giatri3: ", giatri3);
                console.log("giatri4: ", giatri4);
                // Lọc tài khoản có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (giatri3 && giatri4) {
                    query.GiaBan = {$gte: giatri1, $lte: giatri2};
                }
            }                                     

            // Thêm điều kiện lọc theo loại tài khoản (IdLoaiSP)
            query.IdLoaiSP = new mongoose.Types.ObjectId(IdLoaiSP);

            if(isActive){
                query.isActive = isActive
                let sp = await SanPham.find(query)
                    .collation({ locale: 'vi', strength: 1 }) 
                    .populate("IdLoaiSP")
                    .skip(skip)
                    .limit(limitNumber)
                    .sort({ [sort]: sortOrder })            
    
                const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ
    
                const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang
    
                if(sp) {
                    return res.status(200).json({
                        message: "Đã tìm ra products",
                        errCode: 0,
                        data: sp,
                        totalSanPham,
                        totalPages,
                        currentPage: pageNumber,
                    })
                } else {
                    return res.status(500).json({
                        message: "Tìm products thất bại!",
                        errCode: -1,
                    })
                }
            } 
            
            let sp = await SanPham.find(query)
                    .collation({ locale: 'vi', strength: 1 }) 
                    .populate("IdLoaiSP")
                    .skip(skip)
                    .limit(limitNumber)
                    .sort({ [sort]: sortOrder })            
    
            const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang

            if(sp) {
                return res.status(200).json({
                    message: "Đã tìm ra products",
                    errCode: 0,
                    data: sp,
                    totalSanPham,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm products thất bại!",
                    errCode: -1,
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    deleteNhieuProduct: async (req, res) => {
        // const { ids } = req.body; // ids là mảng chứa các _id của các tài khoản cần xóa
        const ids = req.query.ids ? req.query.ids.split(',') : []; // Lấy mảng ids từ query string
        console.log("ids: ", ids);
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mảng _id hợp lệ' });
        }

        try {
            // Xóa các tài khoản với các _id trong mảng ids
            const result = await SanPham.deleteMany({ _id: { $in: ids } });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy tài khoản nào để xóa' });
            }

            res.status(200).json({ message: `${result.deletedCount} tài khoản đã được xóa thành công` });
        } catch (error) {
            console.error('Error deleting products:', error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa tài khoản' });
        }
    },

    showHiddenProduct: async (req, res) => {
        try {
            // const id = req.params.id
            const { id, isActive } = req.body;

            const updatedAccount = await SanPham.findByIdAndUpdate(id, { isActive }, { new: true });

            if (updatedAccount) {
                return res.status(200).json({ message: "Cập nhật thành công", data: updatedAccount });
            } else {
                return res.status(404).json({ message: "Tài khoản không tìm thấy" });
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

}