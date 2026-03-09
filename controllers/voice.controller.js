const speechService = require("../services/stt.service");
const chatService = require("../services/llm.service");
const ttsService = require("../services/tts.service");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * POST /api/voice-chat
 * Multipart form: audio (file) + history (optional JSON string of [{role, content}])
 *
 * Returns: audio/wav buffer of AI spoken response
 * Also returns headers:
 *   X-Reply-Text: the AI text reply (for display in UI)
 *   X-User-Text: the recognized speech text (for display in UI)
 */
exports.voiceChat = async (req, res) => {
  let inputPath = null;
  let wavPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    inputPath = req.file.path;
    wavPath = inputPath + ".wav";

    // Convert uploaded audio → 16kHz mono WAV (Azure STT requirement)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .toFormat("wav")
        .on("end", resolve)
        .on("error", reject)
        .save(wavPath);
    });

    // 1. Speech → Text
    const sttResult = await speechService.speechToText(wavPath);
    const speechText = sttResult.text;

    let detectedLanguage = sttResult.language;
    if (!detectedLanguage || detectedLanguage === "unknown") {
      detectedLanguage = "hi";
    }

    // 2. Parse conversation history from form data (optional)
    let conversationHistory = [];
    if (req.body.history) {
      try {
        const parsed = JSON.parse(req.body.history);
        if (Array.isArray(parsed)) {
          // Cap at 18 messages, leaving room for the new user message
          conversationHistory = parsed.slice(-18);
        }
      } catch (_) {
        // Ignore malformed history, proceed without it
      }
    }

    // 3. Build full messages array: history + new user message
    const messages = [
      ...conversationHistory,
      { role: "user", content: speechText },
    ];

    // 4. LLM Response with context
    const aiReply = await chatService.getLLMResponse(messages);

    // 5. Text → Speech in detected language
    const audioBuffer = await ttsService.textToSpeech(aiReply, detectedLanguage);

    // Cleanup temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(wavPath);
    inputPath = null;
    wavPath = null;

    // Return audio + text via headers (so frontend can update chat UI)
    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": "attachment; filename=ai-response.wav",
      "X-Reply-Text": Buffer.from(aiReply).toString("base64"),
      "X-User-Text": Buffer.from(speechText).toString("base64"),
      "X-Detected-Language": detectedLanguage,
      "Access-Control-Expose-Headers": "X-Reply-Text, X-User-Text, X-Detected-Language",
    });

    res.send(audioBuffer);
  } catch (err) {
    console.error("Voice processing error:", err);

    // Cleanup on error
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);

    res.status(500).json({ error: "Voice processing failed. Please try again." });
  }
};
