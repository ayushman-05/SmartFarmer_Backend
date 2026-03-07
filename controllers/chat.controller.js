const chatService = require("../services/llm.service");

async function chat(req, res) {
  try {
    const { message } = req.body;

    const reply = await chatService.getLLMResponse(message);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { chat };
