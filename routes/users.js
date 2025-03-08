const express = require("express");
const { registerUser, deleteUser, getUser, updateUser, storeMood } = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", verifyToken, registerUser);
router.post("/delete", verifyToken, deleteUser);
router.get("/me", verifyToken, getUser);
router.put("/update", verifyToken, updateUser);
router.post("/store-mood", verifyToken, storeMood);

module.exports = router;
