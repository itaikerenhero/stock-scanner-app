import { OpenAI } from 'openai';

// API route to generate a simple trade plan using Groq's LLM. Accepts
// symbol and setup, and returns a formatted plan. Requires GROQ_API_KEY.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { symbol, setup } = req.body || {};
  if (!symbol || !setup) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }
  try {
    // When no GROQ_API_KEY is configured, return a simple built‑in plan.
    if (!process.env.GROQ_API_KEY) {
      const plan = `📋 Trade Plan for ${symbol}\n\n- **Entry:** Wait for a break above recent resistance with strong volume. Consider entering on a pullback toward the breakout level.\n- **Stop‑Loss:** Place a stop just below the 20‑day moving average or the most recent swing low.\n- **Risk Management:** Risk no more than 1–2% of your account on this trade. Adjust position size accordingly.`;
      res.status(200).json({ plan });
      return;
    }
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    const prompt = `
You are a trading assistant helping beginners.
The user is considering a trade on ${symbol}, which shows a ${setup.toLowerCase()}.

Based on this setup, write a simple and beginner-friendly trade plan that includes:
- Entry strategy (price action or trigger)
- Stop-loss logic (with rough price if possible)
- Risk % suggestions (position size guidelines)

Use short bullet points, emojis, and keep it super clear.
`;
    const response = await client.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: 'You are a pro trading assistant. Be concise.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });
    const content = response.choices[0].message.content;
    res.status(200).json({ plan: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
}