const axios = require("axios");

async function translate(text, targetLang) {
  const response = await axios({
    baseURL: process.env.AZURE_TRANSLATOR_ENDPOINT,
    url: "/translate",
    method: "post",
    params: {
      "api-version": "3.0",
      to: targetLang,
    },
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
      "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
      "Content-Type": "application/json",
    },
    data: [{ text }],
  });

  return response.data[0].translations[0].text;
}

async function translateToEnglish(text) {
  return translate(text, "en");
}

async function translateFromEnglish(text, targetLang) {
  return translate(text, targetLang);
}

module.exports = {
  translate,
  translateToEnglish,
  translateFromEnglish,
};
