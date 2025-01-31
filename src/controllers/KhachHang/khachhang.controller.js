const AccKH = require("../../models/AccKH");
const nodemailer = require("nodemailer");
const SePayTransaction = require("../../models/SepayTransaction");
const { default: mongoose } = require("mongoose");
const PhanThuong = require("../../models/PhanThuong");

require("dotenv").config();

module.exports = {
    getKH: async (req, res) => {
        try {
            let { page, limit, name, sort, order } = req.query;

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (name) {
                const searchKeywords = name || "";
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map((keyword) => ({
                    name: { $regex: keyword, $options: "i" }, // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }

            let sortOrder = 1; // tang dn
            if (order === "desc") {
                sortOrder = -1;
            }
            console.log("sortOrder: ", sortOrder);

            let kh = await AccKH.find(query)
                .skip(skip)
                .limit(limitNumber)
                .sort({ [sort]: sortOrder });

            const totalKH = await AccKH.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalKH / limitNumber); // Tính số trang

            if (kh) {
                return res.status(200).json({
                    message: "Đã tìm ra khách hàng",
                    errCode: 0,
                    data: kh, // Trả về các khách hàng có kèm tổng số sản phẩm
                    totalKH,
                    totalPages,
                    currentPage: pageNumber,
                });
            } else {
                return res.status(500).json({
                    message: "Tìm khách hàng thất bại!",
                    errCode: -1,
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    updateKH: async (req, res) => {
        try {
            let { _id, name, email, soDu, soTienNap, quayMayManCount } = req.body;

            console.log("soDu: ", soDu);
            console.log("soTienNap: ", soTienNap);

            let updateTL = await AccKH.updateOne(
                { _id: _id },
                { name, email, soDu, soTienNap, quayMayManCount }
            );

            if (updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Cập nhật số dư cho khách hàng thành công",
                });
            } else {
                return res.status(404).json({
                    message: "Cập nhật số dư cho khách hàng thất bại",
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    khoaAccKH: async (req, res) => {
        try {
            // const id = req.params.id
            const { id, isActive } = req.body;

            const updatedAccount = await AccKH.findByIdAndUpdate(
                id,
                { isActive },
                { new: true }
            );

            if (updatedAccount) {
                return res.status(200).json({
                    message: "Cập nhật thành công",
                    data: updatedAccount,
                });
            } else {
                return res
                    .status(404)
                    .json({ message: "Tài khoản không tìm thấy" });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    deleteKH: async (req, res) => {
        try {
            const _id = req.params.id;
            let xoaTL = await AccKH.deleteOne({ _id: _id });

            if (xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá khách hàng thành công!",
                });
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá khách hàng thất bại!",
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    getOneAccKH: async (req, res) => {
        try {
            const id = req.query.id;
            console.log("id: ", id);

            let accKH = await AccKH.find({ _id: id });

            if (accKH) {
                return res.status(200).json({
                    message: "Đã tìm ra acc kh",
                    errCode: 0,
                    data: accKH,
                });
            } else {
                return res.status(500).json({
                    message: "Tìm thể loại thất bại!",
                    errCode: -1,
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    updateCongTienKhiNap: async (req, res) => {
        const session = await mongoose.startSession();

        try {
            await session.startTransaction();

            const sePayWebhookData = {
                id: parseInt(req.body.id),
                gateway: req.body.gateway,
                transactionDate: req.body.transactionDate,
                accountNumber: req.body.accountNumber,
                subAccount: req.body.subAccount,
                code: req.body.code,
                content: req.body.content,
                transferType: req.body.transferType,
                description: req.body.description,
                transferAmount: parseFloat(req.body.transferAmount),
                referenceCode: req.body.referenceCode,
                accumulated: parseInt(req.body.accumulated),
            };

            // nếu SePayTransaction có hơn 1 giao dịch collection 
            if (await SePayTransaction.countDocuments() > 0) {
                const existingTransaction = await SePayTransaction.findOne({
                    _id: sePayWebhookData.id,
                });
                if (existingTransaction) {
                    return res.status(400).json({
                        message: "transaction này đã thực hiện giao dịch",
                    });
                }
            }

            // api chứng thực
            const pattern = process.env.SEPAY_API_KEY;
            const authorizationAPI = req.headers.authorization;
            const apiKey = authorizationAPI.split(" ")[1];

            // kiểm tra xác thực api
            if (pattern === apiKey) {
                // Tạo lịch sử giao dịch
                const newTransaction = await SePayTransaction.create({
                    _id: sePayWebhookData.id,
                    gateway: sePayWebhookData.gateway,
                    transactionDate: sePayWebhookData.transactionDate,
                    accountNumber: sePayWebhookData.accountNumber,
                    subAccount: sePayWebhookData.subAccount,
                    code: sePayWebhookData.code,
                    content: sePayWebhookData.content,
                    transferType: sePayWebhookData.transferType,
                    description: sePayWebhookData.description,
                    transferAmount: sePayWebhookData.transferAmount,
                    referenceCode: sePayWebhookData.referenceCode,
                });

                // const matchContent = sePayWebhookData.content.match(/NAP([a-f0-9]{24})/);
                const matchContent = sePayWebhookData.content.match(/NAP([a-zA-Z0-9]{6,24})/);
                console.log("matchContent: ", matchContent);                
                const idUser = matchContent[0].replace("NAP", "");
                console.log("idUser: ", idUser);                
                const updatedUser = await AccKH.findOneAndUpdate(
                    // { _id: idUser },
                    { name: idUser },
                    {
                        $inc: { soDu: sePayWebhookData.transferAmount },
                        $push: {
                            transactionHistory: {
                                date: new Date(),
                                amount: sePayWebhookData.transferAmount,
                                type: "deposit",
                                reference: sePayWebhookData.id,
                            },
                        },
                    },
                    { new: true, session }
                );

                if (!updatedUser) {
                    return res
                        .status(404)
                        .json({ message: "User account not found" });
                }
                await session.commitTransaction();

                return res.status(200).json({
                    success: true,
                    newBalance: updatedUser.soDu,
                    processedAt: new Date().toISOString(),
                    message: `Cập nhật số dư thành công`,
                });
            }
            return res.status(400).json({ message: "Invalid transaction" });
        } catch (error) {
            await session.abortTransaction(); // Hủy giao dịch nếu có lỗi
            console.error("Lỗi:", error);
            return res.status(500).json({ message: error.message || "Internal Server Error" });
        } finally {
            session.endSession();
        }
    },

    quaySoMayMan1: async (req, res) => {
        try {
            let { userId } = req.body;
            console.log("userId: ", userId);
    
            // Lấy thông tin khách hàng
            const user = await AccKH.findById(userId);
    
            // Kiểm tra xem người dùng có còn lượt quay không
            if (user.quayMayManCount <= 0) {
                return res.status(500).json({
                    message: "Bạn đã hết lượt quay số may mắn.",
                    errCode: -1,
                });
            }
    
            // Giảm số lần quay đi 1
            user.quayMayManCount -= 1;
    
            // Lấy danh sách phần thưởng từ cơ sở dữ liệu
            const prizes = await PhanThuong.find({});
    
            // Tính toán tỷ lệ trúng thưởng cho mỗi phần thưởng
            const weightedPrizes = [];
            prizes.forEach(prize => {
                const numberOfTimes = prize.rate; // Sử dụng trực tiếp tỷ lệ phần trăm (1 đến 100)
                for (let i = 0; i < numberOfTimes; i++) {
                    weightedPrizes.push(prize); // Đẩy phần thưởng vào mảng theo tỷ lệ
                }
            });
    
            // Chọn ngẫu nhiên phần thưởng từ mảng weightedPrizes
            const randomIndex = Math.floor(Math.random() * weightedPrizes.length);
            const prize = weightedPrizes[randomIndex];
    
            // Lưu lại thay đổi số lượt quay
            await user.save();
    
            return res.status(200).json({
                message: "Quay số thành công!",
                errCode: 0,
                prize,  // Trả về phần thưởng trúng
                quayMayManCount: user.quayMayManCount,
            });
        } catch (error) {
            throw new Error(error.message);
        }
    },

    quaySoMayMan: async (req, res) => {
        try {
            let { userId } = req.body;
            console.log("userId: ", userId);            
            
            // Lấy thông tin khách hàng
            const user = await AccKH.findById(userId);
    
            // Kiểm tra xem người dùng có còn lượt quay không
            if (user.quayMayManCount <= 0) {
                return res.status(500).json({
                    message: "Bạn đã hết lượt quay số may mắn.",
                    errCode: -1,
                })
            }
    
            // Giảm số lần quay đi 1
            user.quayMayManCount -= 1;
    
            // Lưu lại thay đổi
            await user.save();

            return res.status(200).json({
                message: "Quay số thành công!",
                errCode: 0,
                // prize,  // Trả về phần thưởng
                quayMayManCount: user.quayMayManCount,
            });
                           
        } catch (error) {
            throw new Error(error.message);
        }
    },

    nhanThuong: async (req, res) => {
        try {
            let { userId, prizeAmount } = req.body;  // prizeAmount là phần thưởng trúng được từ quay số
            console.log("userId: ", userId);
            console.log("Prize Amount: ", prizeAmount); // Số tiền phần thưởng
    
            // Lấy thông tin người dùng
            const user = await AccKH.findById(userId);
    
            if (!user) {
                return res.status(404).json({
                    message: "Người dùng không tồn tại.",
                    errCode: -1,
                });
            }
    
            // Cộng tiền thưởng vào số dư của người dùng
            user.soDu += prizeAmount;
    
            // Lưu lại thay đổi
            await user.save();
    
            return res.status(200).json({
                message: "Phần thưởng này đã được cộng vào số dư của bạn.",
                errCode: 0, 
                soDu: user.soDu  // Trả về số dư mới
            });
        } catch (error) {
            throw new Error(error.message);
        }
    },
    
    nhanThuong1: async (req, res) => {
        try {
            let { userId, IdPhanThuong } = req.body;
            console.log("userId: ", userId);
            console.log("IdPhanThuong: ", IdPhanThuong);
            const voucherId = new mongoose.Types.ObjectId(IdPhanThuong);

            const user = await AccKH.findById(userId);

            if (!user) {
                return res.status(404).json({
                    message: "Người dùng không tồn tại.",
                    errCode: -1,
                });
            }

            user.IdPhanThuong = [...user.IdPhanThuong, IdPhanThuong];

            // Lưu lại thay đổi
            await user.save();

            return res.status(200).json({
                message: "Đã nhận phần thưởng!",
                errCode: 0,                    
            }); 
    
            // Kiểm tra nếu `IdPhanThuong` nằm trong danh sách `IdPhanThuong` của người dùng
            // const voucherExists = user.IdPhanThuong.some(
            //     // (voucher) => voucher.toString() === IdPhanThuong
            //     (voucher) => voucher.toString() === voucherId.toString()
            // );             
    
            // if (voucherExists) {
            //     return res.status(200).json({
            //         message: "Voucher đã tồn tại trong tài khoản. Không thể nhận thêm.",
            //         errCode: -1,
            //     });
            // } else {                
            //     // user.IdPhanThuong.push(IdPhanThuong);
            //     user.IdPhanThuong = [...user.IdPhanThuong, IdPhanThuong];

            //     // Lưu lại thay đổi
            //     await user.save();

            //     return res.status(200).json({
            //         message: "Đã nhận phần thưởng!",
            //         errCode: 0,                    
            //     });               
            // }                
                           
        } catch (error) {
            throw new Error(error.message);
        }
    },
  
};
