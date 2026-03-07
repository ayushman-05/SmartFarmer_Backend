const { getFarmWeatherForecast, getCurrentWeather } = require("../services/weatherService");

// GET /api/weather/forecast?location=Hyderabad&days=7
const getWeatherForecast = async (req, res) => {
  try {
    const { location, days } = req.query;

    if (!location) {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    const data = await getFarmWeatherForecast(location, days || 7);

    // Shape the response for farming use
    const forecast = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        localtime: data.location.localtime,
      },
      current: {
        temp_c: data.current.temp_c,
        feelslike_c: data.current.feelslike_c,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        wind_dir: data.current.wind_dir,
        precip_mm: data.current.precip_mm,
        uv: data.current.uv,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
      },
      forecast: data.forecast.forecastday.map((day) => ({
        date: day.date,
        max_temp_c: day.day.maxtemp_c,
        min_temp_c: day.day.mintemp_c,
        avg_temp_c: day.day.avgtemp_c,
        total_precip_mm: day.day.totalprecip_mm,
        avg_humidity: day.day.avghumidity,
        max_wind_kph: day.day.maxwind_kph,
        uv: day.day.uv,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset,
        // Hourly breakdown (useful for irrigation timing)
        hourly: day.hour.map((h) => ({
          time: h.time,
          temp_c: h.temp_c,
          precip_mm: h.precip_mm,
          humidity: h.humidity,
          wind_kph: h.wind_kph,
          condition: h.condition.text,
        })),
      })),
      alerts: data.alerts?.alert || [],
    };

    res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    console.error("Weather forecast error:", error.message);

    if (error.response?.status === 400) {
      return res.status(400).json({ success: false, message: "Invalid location provided" });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({ success: false, message: "Invalid or missing Weather API key" });
    }

    res.status(500).json({ success: false, message: "Failed to fetch weather data" });
  }
};

// GET /api/weather/current?location=Hyderabad
const getCurrentWeatherData = async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    const data = await getCurrentWeather(location);

    res.status(200).json({
      success: true,
      data: {
        location: data.location.name,
        region: data.location.region,
        temp_c: data.current.temp_c,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        precip_mm: data.current.precip_mm,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        uv: data.current.uv,
        localtime: data.location.localtime,
      },
    });
  } catch (error) {
    console.error("Current weather error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch current weather" });
  }
};

module.exports = { getWeatherForecast, getCurrentWeatherData };