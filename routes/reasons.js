const express = require("express");
const { getReasons, addCustomReason } = require("../controllers/reasonsController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/getReasons", verifyToken, getReasons);
router.post("/addReason", verifyToken, addCustomReason)

module.exports = router;
