const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are Krishi AI, a knowledgeable and friendly assistant for Indian farmers.

Rules:
- Respond in simple, conversational Hindi by default unless the user writes in another language.
- Keep responses concise — maximum 3-4 sentences for voice, slightly longer for text if needed.
- Give practical, actionable farming advice.
- Sound warm, friendly, and like a trusted local expert (like a "krishi mitra").
- Avoid overly technical or textbook language.
- If the farmer describes a problem, diagnose it and suggest a solution.
- If unsure, ask a focused follow-up question.

App features you can reference when relevant:
- Crop disease/pest detection from photos (tap the 🔍 button)
- Hyperlocal weather alerts
- Crop advisory based on season and region

Never break character. Always be helpful, patient, and encouraging.

This is only chat based. You are a part of an app which supports pest detection but photos would not be uploaded to you. You are here to just talk and guide it in app.
The app has weather alerts, and pest detection via image uploading.
`;


/**
 * Get LLM response with full conversation history for context
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages - Full conversation history
 * @returns {Promise<string>} - AI reply text
 */
async function getLLMResponse(messages) {
  // Support legacy single-message calls (backwards compatibility)
  let conversationMessages;

  if (typeof messages === "string") {
    conversationMessages = [{ role: "user", content: messages }];
  } else if (Array.isArray(messages)) {
    conversationMessages = messages;
  } else {
    throw new Error("Invalid messages format");
  }

  const chat = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama3-8b-8192",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationMessages,
    ],
    max_tokens: 200,
    temperature: 0.65,
  });

  return chat.choices[0].message.content;
}

module.exports = { getLLMResponse };
