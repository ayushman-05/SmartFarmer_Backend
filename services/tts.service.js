const sdk = require("microsoft-cognitiveservices-speech-sdk");

const voiceMap = {
  en: "en-US-JennyNeural",
  hi: "hi-IN-SwaraNeural",
  ta: "ta-IN-PallaviNeural",
  te: "te-IN-ShrutiNeural",
};

async function textToSpeech(text, language) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION,
  );

  const voice = voiceMap[language] || "en-US-JennyNeural";

  speechConfig.speechSynthesisVoiceName = voice;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(Buffer.from(result.audioData));
        } else {
          reject("TTS failed");
        }
        synthesizer.close();
      },
      (err) => {
        synthesizer.close();
        reject(err);
      },
    );
  });
}

module.exports = { textToSpeech };
