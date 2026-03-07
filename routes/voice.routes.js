const express = require("express");
const router = express.Router();
const multer = require("multer");

const voiceController = require("../controllers/voice.controller");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
console.log("Voice routes loaded");
router.post("/", upload.single("audio"), voiceController.voiceChat);

module.exports = router;
