const express = require("express");
const router = express.Router();
const multiModalController = require("../controllers/multiModalController");
const verifyToken = require("../middlewares/authMiddleware");


router.post("/analyze-text",verifyToken, multiModalController.analyzeTextMood);
router.post("/analyze-audio",verifyToken, multiModalController.upload.single("audio"), multiModalController.analyzeAudioMood);
router.post("/analyze-image",verifyToken, multiModalController.upload.single("file"), multiModalController.analyzeImageMood);

module.exports = router;
