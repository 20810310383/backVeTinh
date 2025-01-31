const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Secret key cho JWT
const JWT_SECRET = process.env.JWT_SECRET; 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const AccKH = require('../../models/AccKH');

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


module.exports = {

    loginAccKH: async (req, res) => {
        const {name, password} = req.body

        try {
            // Tìm admin bằng email
            const admin = await AccKH.findOne({ name });
            if (!admin) {
                return res.status(401).json({ message: 'Tài khoản không tồn tại' });
            }

            if (!admin.isActive) {
                return res.status(400).json({
                    message: "Tài khoản vi phạm bị khóa hoặc Tài khoản chưa được xác thực. Vui lòng kiểm tra mã OTP."
                });
            }

            let messError = `Tài khoản này vi phạm quy định của trang và đang bị khóa! ` + '\n' + `Vui lòng liên hệ Admin!`
            if(admin.isActive === false) {
                return res.status(401).json({ message: messError });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            console.log("admin.password: ",admin.password);
            console.log("password: ",password);
            console.log("hashedPassword: ",hashedPassword);
            console.log('EXPIRESIN:', process.env.EXPIRESIN);


            // So sánh mật khẩu với bcrypt
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Mật khẩu không chính xác' });
            }            

            // Tạo token JWT
            const token = jwt.sign(
                { adminId: admin._id, email: admin.email },
                JWT_SECRET,
                { expiresIn: '1m' } // Token hết hạn sau 10 phút
            );

             // Lưu token vào cookie
            res.cookie('token', token, {
                httpOnly: true, // Bảo mật hơn khi chỉ có server mới có thể truy cập cookie này
                secure: process.env.NODE_ENV === 'production', // Chỉ cho phép cookie qua HTTPS nếu là production
                maxAge: 1 * 60 * 1000, // Cookie hết hạn sau 10 phút (10 phút x 60 giây x 1000ms)
            });

            // Trả về thông tin admin (có thể trả về thông tin khác tùy nhu cầu)
            res.json({ message: 'Đăng nhập thành công', access_token: token, data: admin });
            console.log(`Đăng nhập thành công với token: ${token}`);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi máy chủ' });
        }
    },

    logoutKH: async (req, res) => {
        try {
            // Xóa cookie chứa token
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Bảo đảm chỉ xóa cookie qua HTTPS nếu là production
            });
    
            // Trả về phản hồi thành công
            res.status(200).json({ message: 'Bạn đã đăng xuất thành công' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi máy chủ' });
        }
    },

    registerAccKH: async (req, res) => {
        const { email, password, name } = req.body;
            
        try {
            // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
            let check = await AccKH.findOne({ email: email });
    
            if (check) {
                if (check.name !== name) {
                    return res.status(400).json({
                        success: false,
                        message: `Email ${email} đã được đăng ký với tài khoản khác. Bạn không thể đăng ký lại với tài khoản này!`
                    });
                }
                if (check.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tài khoản đã tồn tại và đã được kích hoạt. Bạn không thể đăng ký lại!'
                    });
                } else {
                    // Nếu tài khoản tồn tại nhưng chưa kích hoạt, xóa OTP cũ (nếu có) trước khi tạo mã OTP mới
                    check.otp = null;  // Xóa OTP cũ
                    check.otpExpires = null;  // Xóa thời gian hết hạn OTP cũ
                    await check.save();
    
                    console.log("Xóa mã OTP cũ, tạo mã OTP mới");
                }
            } else {
                // Kiểm tra nếu tên đã tồn tại trong cơ sở dữ liệu
                let checkName = await AccKH.findOne({ name: name });
                
                if (checkName) {
                    // Nếu tên đã tồn tại và email khác, trả về lỗi
                    if (checkName.email !== email) {
                        return res.status(400).json({
                            success: false,
                            message: `Tài khoản "${name}" đã được đăng ký với email khác. Bạn không thể đăng ký Tài khoản này với email khác!`
                        });
                    }
                }

                // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
                const hashedPassword = await bcrypt.hash(password, 10);
    
                // Tạo tài khoản mới
                check = await AccKH.create({
                    email, password: hashedPassword, name
                });
            }
    
            // Tạo mã OTP ngẫu nhiên
            const otp = crypto.randomInt(100000, 999999);  // Mã OTP có 6 chữ số
    
            // Lưu OTP và thời gian hết hạn vào cơ sở dữ liệu của tài khoản
            check.otp = otp;
            check.otpExpires = Date.now() + 300000; // Mã OTP có hiệu lực trong 5 phút
            await check.save();
    
            // Gửi OTP qua email
            const mailOptions = {
                from: 'Khắc Tú',  // Đổi thành tên người gửi nếu cần
                to: email,  // Gửi tới email người dùng đăng ký
                subject: 'Mã OTP Đăng ký tài khoản',
                text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi khi gửi email OTP: ', error);
                    return res.status(500).json({
                        success: false,
                        message: "Lỗi khi gửi email OTP!"
                    });
                }
                // Phản hồi khi gửi thành công
                return res.status(200).json({
                    success: true,
                    message: "Mã OTP đã được gửi đến email của bạn. Vui lòng xác nhận OTP để xác nhận đăng ký tài khoản!"
                });
            });
        } catch (error) {
            console.error('Lỗi trong quá trình đăng ký tài khoản: ', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
       
    xacThucOTP: async (req, res) => {
        const { otp, email } = req.body;
    
        console.log("otp, email: ", otp, email);
        
        try {
            const user = await AccKH.findOne({ email: email });
    
            if (!user) {
                return res.status(400).json({success: false, message: "Người dùng không tồn tại!" });
            }
    
            // Kiểm tra mã OTP và thời gian hết hạn
            if (user.otp !== otp) {
                return res.status(400).json({success: false, message: "Mã OTP không đúng!" });
            }
    
            if (Date.now() > user.otpExpires) {
                return res.status(400).json({success: false, message: "Mã OTP đã hết hạn!" });
            }
    
            // Nếu OTP hợp lệ, kích hoạt tài khoản
            user.isActive = true;
            user.otp = null;  // Xóa mã OTP sau khi xác thực
            user.otpExpires = null;  // Xóa thời gian hết hạn OTP
            await user.save();
    
            res.status(200).json({success: true, message: "Xác thực OTP thành công! Bạn có thể đăng nhập." });
    
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    quenMatKhauKH: async (req, res) => {
        const { email_doimk } = req.body;
        console.log("email đổi mk: ", email_doimk);
    
        try {
            // Kiểm tra xem tài khoản có tồn tại không
            let tk_doimk = await AccKH.findOne({ email: email_doimk });
            
            if (!tk_doimk) {
                console.log("Không tồn tại tài khoản");
                return res.status(404).json({ message: 'Không tồn tại tài khoản! Vui lòng kiểm tra lại email của bạn.', data: false });
            }
    
            // Tạo mật khẩu ngẫu nhiên
            const newPassword = Math.random().toString(36).slice(-6);
    
            // Mã hóa mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);
    
            // Lưu mật khẩu đã mã hóa vào cơ sở dữ liệu
            tk_doimk.password = hashedPassword;
            await tk_doimk.save();
    
            // Tạo transporter để gửi email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
    
            // Cấu hình email
            const mailOptions = {
                from: 'Admin', 
                to: email_doimk,
                subject: 'Yêu cầu lấy lại mật khẩu',
                text: `Mật khẩu mới của bạn là: ${newPassword}`,
                html: `
                    <p style="color: green;">Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                    <p>Vui lòng đăng nhập với mật khẩu mới này để tiếp tục sử dụng dịch vụ.</p>
                `
            };
    
            // Gửi email với async/await thay vì callback
            await transporter.sendMail(mailOptions);
    
            console.log('Email sent');
            return res.status(200).json({
                data: true,
                message: `Mật khẩu mới đã được gửi tới email của bạn. Vui lòng kiểm tra email ${email_doimk} để lấy lại mật khẩu!`
            });
    
        } catch (error) {
            // Xử lý lỗi khi có lỗi xảy ra trong bất kỳ bước nào
            console.error('Lỗi trong quá trình xử lý:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.', data: false });
        }
    },
}