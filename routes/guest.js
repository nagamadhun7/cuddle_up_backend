const express = require("express");
const router = express.Router();
const multiModalController = require("../controllers/multiModalController");


router.post("/analyze-text", multiModalController.analyzeTextMood);
router.post("/analyze-audio", multiModalController.upload.single("audio"), multiModalController.analyzeAudioMood);
router.post("/analyze-image", multiModalController.upload.single("file"), multiModalController.analyzeImageMood);

module.exports = router;
