const chatService = require("../services/llm.service");

/**
 * POST /api/chat
 * Body: { messages: [{role: 'user'|'assistant', content: string}] }
 * OR legacy: { message: string }
 *
 * Accepts full conversation history so the AI has context.
 * We intentionally do NOT persist chats — stateless by design.
 */
async function chat(req, res) {
  try {
    const { messages, message } = req.body;

    // Support both new array format and legacy single-message format
    let conversationMessages;

    if (messages && Array.isArray(messages) && messages.length > 0) {
      // Validate message format
      const isValid = messages.every(
        (m) =>
          m &&
          typeof m === "object" &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid messages format. Each message must have role ('user'|'assistant') and content (string).",
        });
      }

      // Cap history to last 20 messages to avoid token overflow
      conversationMessages = messages.slice(-20);
    } else if (message && typeof message === "string") {
      // Legacy single message support
      conversationMessages = [{ role: "user", content: message.trim() }];
    } else {
      return res.status(400).json({ error: "Either 'messages' array or 'message' string is required." });
    }
    //console.log(conversationMessages);

    const reply = await chatService.getLLMResponse(conversationMessages);

    res.json({ reply });
  } catch (err) {
    console.error("Chat controller error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { chat };
