const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");

async function speechToText(filePath) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION,
  );

  speechConfig.speechRecognitionLanguage = "en-US"; // fallback

  const audioBuffer = fs.readFileSync(filePath);
  const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);

  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          resolve({
            text: result.text,
            language: result.language || "unknown",
          });
        } else {
          reject("Speech not recognized");
        }
      },
      (err) => reject(err),
    );
  });
}

module.exports = { speechToText };
