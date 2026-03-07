const express = require("express");
const router = express.Router();
const { getWeatherForecast, getCurrentWeatherData } = require("../controllers/weather.controller");

// You can add your auth middleware here later if needed
// const { protect } = require("../middlewares/authMiddleware");

router.get("/forecast", getWeatherForecast);
router.get("/current", getCurrentWeatherData);

module.exports = router;