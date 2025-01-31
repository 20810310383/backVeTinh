// routes/uploadRoutes.js
const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const { uploadFile, uploadFiles, uploadExcelFile } = require('../controllers/Upload/upload.controller');
// import uploadFile, { uploadExcel, uploadExcelFile } from '../controllers/Upload/upload.controller';
const router = express.Router();

// // Tạo route upload
// router.post('/upload', uploadFile.uploadFile);
// router.post('/multiple', uploadFile.uploadFiles);
// router.post('/upload-excel', uploadExcelFile);

router.post('/upload', uploadFile);
router.post('/multiple', uploadFiles);
router.post('/upload-excel', uploadExcelFile);
// router.post('/upload-excel', uploadExcel, (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'Không tìm thấy file Excel để tải lên.' });
//     }

//     // Đường dẫn file từ server
//     const filePath = `/public/excel/${req.file.filename}`;
//     console.log('File path:', filePath); // Kiểm tra đường dẫn file

//     // Đọc file Excel và xử lý dữ liệu
//     try {
//         // Đọc file Excel đã được upload
//         const workbook = xlsx.readFile(path.join(__dirname, '../../public/excel/', req.file.filename));
//         console.log('workbook:', workbook);
//         const sheetName = workbook.SheetNames[0];  // Lấy tên sheet đầu tiên
//         const worksheet = workbook.Sheets[sheetName];
//         const data = xlsx.utils.sheet_to_json(worksheet);  // Chuyển dữ liệu từ sheet thành JSON

//         // Trả về dữ liệu và đường dẫn file
//         res.status(200).json({
//             success: true,
//             message: 'File uploaded successfully!',
//             filePath: filePath,  // Trả về đường dẫn file có thể truy cập qua HTTP
//             data: data  // Trả về dữ liệu từ file Excel
//         });

//         // Xóa file sau khi xử lý (nếu không cần giữ lại)
//         // fs.unlinkSync(path.join(__dirname, '../../public/excel/', req.file.filename));
//     } catch (error) {
//         console.error('Error processing Excel file:', error);
//         return res.status(500).json({ message: 'Có lỗi khi xử lý file Excel', error: error.message });
//     }
// });

module.exports = router;
