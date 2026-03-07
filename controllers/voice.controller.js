const speechService = require("../services/stt.service");
// const translateService = require("../services/translate.service");
const chatService = require("../services/llm.service");
const ttsService = require("../services/tts.service");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

exports.voiceChat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    const inputPath = req.file.path;
    const wavPath = inputPath + ".wav";

    // Convert → WAV
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .toFormat("wav")
        .on("end", resolve)
        .on("error", reject)
        .save(wavPath);
    });

    // 1️⃣ Speech → Text + Language
    const sttResult = await speechService.speechToText(wavPath);
    console.log("STT Result:", sttResult);
    const speechText = sttResult.text;

    let originalLanguage = sttResult.language;

    if (!originalLanguage || originalLanguage === "unknown") {
      originalLanguage = "hi";
    }
    console.log("Detected Language:", originalLanguage);

    // 2️⃣ LLM Response directly (multilingual)
    const aiReply = await chatService.getLLMResponse(speechText);

    // 3️⃣ Use AI reply directly
    const translatedReply = aiReply;

    // 4️⃣ Text → Speech
    const audioBuffer = await ttsService.textToSpeech(
      translatedReply,
      originalLanguage,
    );

    // Cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(wavPath);

    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": "attachment; filename=ai-response.wav",
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error("Voice processing error:", err);

    res.status(500).json({
      error: "Voice processing failed",
    });
  }
};
