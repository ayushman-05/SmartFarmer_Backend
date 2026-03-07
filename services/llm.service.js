const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are Krishi AI, a voice assistant helping Indian farmers.

Rules:
- Speak in simple conversational Hindi.
- Maximum 3 sentences.
- Avoid textbook explanations.
- Give practical farming advice.
- Sound friendly and natural.

App features you can mention if useful:
- crop disease detection from photos
- weather alerts
- fertilizer recommendations
- mandi price updates

If the farmer needs more help, ask a follow-up question.
`;

async function getLLMResponse(userMessage) {
  const chat = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: 120,
    temperature: 0.6,
  });

  return chat.choices[0].message.content;
}

module.exports = { getLLMResponse };
