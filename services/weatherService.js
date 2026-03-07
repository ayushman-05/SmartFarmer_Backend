const axios = require("axios");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = "http://api.weatherapi.com/v1";

// Get current weather + 7-day forecast for a location
const getFarmWeatherForecast = async (location, days = 7) => {
  const response = await axios.get(`${BASE_URL}/forecast.json`, {
    params: {
      key: WEATHER_API_KEY,
      q: location,       // can be "city name", "lat,lon", or zip code
      days: days,
      aqi: "no",
      alerts: "yes",     // weather alerts useful for farmers!
    },
  });
  return response.data;
};

// Get current weather only
const getCurrentWeather = async (location) => {
  const response = await axios.get(`${BASE_URL}/current.json`, {
    params: {
      key: WEATHER_API_KEY,
      q: location,
      aqi: "no",
    },
  });
  return response.data;
};

module.exports = { getFarmWeatherForecast, getCurrentWeather };