const express = require("express");
const { getUserMoods } = require("../controllers/moodController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/getMoods", verifyToken, getUserMoods);


module.exports = router;
