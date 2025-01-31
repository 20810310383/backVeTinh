const HopQua = require('../../models/HopQua');
const PhanThuong = require('../../models/PhanThuong');

require('dotenv').config();

module.exports = {

    getHopQua: async (req, res) => {
        try {
            let { page, limit, tenHopQua} = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (tenHopQua) {
                const searchKeywords = (tenHopQua || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    tenHopQua: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }           
                       
            let hopQua = await HopQua.find(query).populate('IdPhanThuong IdKH').skip(skip).limit(limitNumber)           

            const totalHopQua = await HopQua.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalHopQua / limitNumber); // Tính số trang

            if(hopQua) {
                return res.status(200).json({
                    message: "Đã tìm ra hopQua",
                    errCode: 0,
                    data: hopQua,   
                    totalHopQua,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm hopQua thất bại!",
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

    getPhanThuong: async (req, res) => {
        try {
            let { page, limit, phanThuong} = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (phanThuong) {
                const searchKeywords = (phanThuong || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    phanThuong: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }           
                       
            let hopQua = await PhanThuong.find(query).skip(skip).limit(limitNumber)           

            const totalPhanThuong = await PhanThuong.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalPhanThuong / limitNumber); // Tính số trang

            if(hopQua) {
                return res.status(200).json({
                    message: "Đã tìm ra PhanThuong",
                    errCode: 0,
                    data: hopQua,   
                    totalPhanThuong,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm PhanThuong thất bại!",
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

    createHopQua: async (req, res) => {
        try {
            let {tenHopQua, messageHopQua, IdPhanThuong, IdKH} = req.body                       

            let createHopQua = await HopQua.create({tenHopQua, messageHopQua, IdPhanThuong, IdKH})

            if(createHopQua){
                return res.status(200).json({
                    message: "Bạn đã thêm hộp quà thành công!",
                    errCode: 0,
                    data: createHopQua
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm hộp quà thất bại!",                
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

    createPhanThuong: async (req, res) => {
        try {
            let {code, phanThuong, thoiGianHetHan, rate} = req.body                       

            let createHopQua = await PhanThuong.create({code, phanThuong, thoiGianHetHan, rate})

            if(createHopQua){
                return res.status(200).json({
                    message: "Bạn đã thêm phần thưởng thành công!",
                    errCode: 0,
                    data: createHopQua
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm phần thưởng thất bại!",                
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

    updateHopQua: async (req, res) => {
        try {
            let {_id, tenHopQua, messageHopQua, IdPhanThuong, IdKH} = req.body

            let updateTL = await HopQua.updateOne({_id: _id},{tenHopQua, messageHopQua, IdPhanThuong, IdKH})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa hộp quà thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa hộp quà thất bại"
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

    updatePhanThuong: async (req, res) => {
        try {
            let {_id, code, phanThuong, thoiGianHetHan, rate} = req.body

            let updateTL = await PhanThuong.updateOne({_id: _id},{code, phanThuong, thoiGianHetHan, rate})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa phần thưởng thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa phần thưởng thất bại"
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

    deleteHopQua: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await HopQua.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá hộp quà thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá hộp quà thất bại!"
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
    
    deletePhanThuong: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await PhanThuong.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá phần thưởng thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá phần thưởng thất bại!"
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
}