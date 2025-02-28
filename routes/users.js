const express = require("express");
const { registerUser, getUser, updateUser, storeMood } = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", verifyToken, registerUser);
router.get("/me", verifyToken, getUser);
router.put("/update", verifyToken, updateUser);
router.post("/store-mood", verifyToken, storeMood);

module.exports = router;
