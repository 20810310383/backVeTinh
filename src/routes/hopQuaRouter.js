const express = require("express");
const { getHopQua, createHopQua, updateHopQua, deleteHopQua, getPhanThuong, createPhanThuong, updatePhanThuong, deletePhanThuong } = require("../controllers/HopQua/hop.qua.controller");
const { quaySoMayMan, nhanThuong } = require("../controllers/KhachHang/khachhang.controller");

const router = express.Router();

// find all hop-qua
router.get("/get-hop-qua", getHopQua );
router.get("/get-phan-thuong", getPhanThuong );

// tao moi hop-qua
router.post("/create-hop-qua", createHopQua );
router.post("/create-phan-thuong", createPhanThuong );

router.post("/quay-so", quaySoMayMan );
router.post("/nhan-thuong", nhanThuong );

// update hop-qua
router.put("/update-hop-qua", updateHopQua );
router.put("/update-phan-thuong", updatePhanThuong );

// delete hop-qua
router.delete("/delete-hop-qua/:id", deleteHopQua );
router.delete("/delete-phan-thuong/:id", deletePhanThuong );

module.exports = router;