const { default: mongoose } = require('mongoose');
const AccKH = require('../../models/AccKH');
const Order = require('../../models/Order');
const SanPham = require('../../models/SanPham');

require('dotenv').config();

module.exports = {

    muaHangTuTaiKhoan: async (req, res) => {
        try {
            let {idSP, soTienConLai, idKH, quantity} = req.body
            console.log("SP bán: ", idSP);
            console.log("idKH: ", idKH);
            console.log("quantity: ", quantity);

            let sp = await SanPham.findById(idSP);

            let giaCanThanhToan = sp?.GiamGiaSP !== 0 
            ? Math.floor(sp?.GiaBan - (sp?.GiaBan * (sp?.GiamGiaSP / 100)) )
            : sp?.GiaBan; 

            if (!sp) {
                return res.status(404).json({
                    message: "Sản phẩm không tồn tại",
                    errCode: 1
                });
            }

            if (sp.SoLuongTon < quantity) {
                return res.status(400).json({
                    message: "Tài khoản này đã bán hết, Bạn có thể tham khảo và chốt tài khoản khác!",
                    errCode: 2
                });
            }

            let check = sp.SoLuongTon - 1 >= 1; // Kiểm tra xem số lượng tồn kho có >= 1 hay không

            sp = await SanPham.findByIdAndUpdate(
                {_id: idSP},
                {
                    $inc: {SoLuongTon: -quantity, SoLuongBan: 1},
                    isActive: check
                },  // Giảm số lượng tồn kho
                {new: true}  
            ).populate('IdLoaiSP');

            let kh = await AccKH.findById(idKH);
            if (!kh) {
                return res.status(404).json({
                    message: "Khách hàng không tồn tại",
                    errCode: 3
                });
            }  
            if (kh.soDu < giaCanThanhToan) {
                return res.status(404).json({
                    message: "Số dư không đủ để mua hàng, Vui lòng nạp thêm vào tài khoản để mua hàng!",
                    errCode: 4
                });
            }    
            
            let soDuUpdate = Math.floor(kh.soDu - giaCanThanhToan);
                
            // Cập nhật số dư tài khoản của khách hàng
            kh = await AccKH.findByIdAndUpdate(
                {_id: idKH},
                {soDu: soDuUpdate},
                {new: true}
            );

            let luuCSDL = await Order.create({
                IdSP: idSP, 
                IdKH: idKH, 
            })
    
            console.log("sp: ", sp);
            console.log("kh: ", kh);
    
            let mess = `Cảm ơn bạn đã chốt dự án: ${sp.TenSP} thành công!`;
            return res.status(200).json({
                message: mess,
                errCode: 0,
                data: luuCSDL
            });            
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }   
    },

    getAllOrder: async (req, res) => {
        try {
            let {page, limit, name, sort, order, idKH} = req.query

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (idKH) {
                query.IdKH = new mongoose.Types.ObjectId(idKH);
            }

            let orderSP = await Order.find(query).populate("IdSP IdKH").skip(skip).limit(limitNumber)         
            
            const totalOrderSP = await Order.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalOrderSP / limitNumber); // Tính số trang

            if(orderSP) {
                return res.status(200).json({
                    errCode: 0,
                    data: orderSP,     
                    totalOrderSP,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm thất bại!",
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
    
    getAllOrderThongBao: async (req, res) => {
        try {
            let {page, limit, name, sort, order, idKH} = req.query

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            let timKH = await AccKH.findOne({
                $or: [
                    { name: name },    // Tìm kiếm theo tên khách hàng
                    { email: name }    // Tìm kiếm theo email khách hàng
                ]
            });
            let timSP = await SanPham.findOne({TenSP: name });
            console.log("timKH: ", timKH);
            

            // Tạo query tìm kiếm
            const query = {};    
            if(timKH)  {
                query.IdKH = new mongoose.Types.ObjectId(timKH._id);
            }
            if(timSP)  {
                query.IdSP = new mongoose.Types.ObjectId(timSP._id);
            }
            
            
            // Tạo đối tượng sắp xếp (sort)
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            let orderSP = await Order.find(query)
            .populate("IdSP IdKH")           
            .skip(skip)
            .limit(limitNumber)
            .sort({ [sort]: sortOrder })        
            
            const totalOrderSP = await Order.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalOrderSP / limitNumber); // Tính số trang

            if(orderSP) {
                return res.status(200).json({
                    errCode: 0,
                    data: orderSP,     
                    totalOrderSP,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm thất bại!",
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

    updateOrder: async (req, res) => {
        try {
            let {_id, linkDownload} = req.body

            let updateTL = await Order.updateOne({_id: _id},{linkDownload})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa linkDownload thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa linkDownload thất bại"
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

    deleteOrder: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await Order.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá đơn hàng thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá đơn hàng thất bại!"
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