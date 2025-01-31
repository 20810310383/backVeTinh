const express = require("express");
const { muaHangTuTaiKhoan, getAllOrder, getAllOrderThongBao, updateOrder, deleteOrder } = require("../controllers/MuaHang/muahang.controller");

const router = express.Router();

router.post("/mua-hang", muaHangTuTaiKhoan );
router.get("/get-order", getAllOrder );
router.get("/get-all-order", getAllOrderThongBao );
router.put("/update-order", updateOrder );
router.delete("/delete-order/:id", deleteOrder);
module.exports = router;