const {
  GROQ_API_KEY,
  GROQ_API_BASE_URL,
  GROQ_MODEL,
} = require('./env');

const isGroqEnabled = () => Boolean(GROQ_API_KEY);

const createGroqRequest = async ({ messages, temperature = 0.3 }) => {
  if (!isGroqEnabled()) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq request failed with ${response.status}: ${detail}`);
  }

  return response.json();
};

module.exports = {
  GROQ_MODEL,
  isGroqEnabled,
  createGroqRequest,
};
