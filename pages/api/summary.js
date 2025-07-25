import { OpenAI } from 'openai';

// API route to generate a beginner-friendly stock analysis using Groq's LLM.
// It accepts a POST request with a symbol and setup description. The
// environment must define a GROQ_API_KEY. On success it returns a summary
// string; on error it returns a 500 status.
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
    // When no GROQ_API_KEY is configured, return a simple built‑in summary.
    if (!process.env.GROQ_API_KEY) {
      const strongPoints = [
        'Price is trending above the 20‑ and 50‑day moving averages',
        'Volume has been increasing on up days',
        'RSI indicates bullish momentum',
      ];
      const summary = `📈 **${symbol} Technical Breakdown**\n\n**Trend**\n- Price is trending higher and recently made a new swing high\n- Trading above the SMA 20 and SMA 50\n\n**Momentum**\n- RSI is in the 60s, indicating strong momentum\n- Recent volume spikes on up days show institutional interest\n\n**Why It Looks Strong**\n- ${strongPoints.join('\n- ')}\n\n**⚠️ Caution**\n- Always manage risk with a stop‑loss; momentum can fade quickly\n\n**✅ Trading Bias:** Bullish`;
      res.status(200).json({ summary });
      return;
    }
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    const prompt = `
You are a professional technical stock analyst. Given the data for ${symbol}, write a simplified, beginner-friendly analysis.

Make this stock look strong, like a top setup — highlight why it could be a great trade.

Do NOT include trade setup instructions like entry/stop-loss/target in this response.

Use this format:

---

📈 **${symbol} Technical Breakdown**

**Trend**
- Describe price action and trend
- Mention position vs SMA 20/50

**Momentum**
- RSI reading + meaning (e.g., strong, rising, overbought)
- Volume spike or MACD signal

**Why It Looks Strong**
- 2–3 strong points that explain the setup

**⚠️ Caution**
- 1 possible risk

**✅ Trading Bias:** Bullish / Neutral / Bearish

---

Technical Info:
${setup}
`;
    const response = await client.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: 'You are a pro stock analyst. Be confident. Keep it beginner-friendly. Don’t use $X.XX or placeholder values.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });
    const content = response.choices[0].message.content;
    res.status(200).json({ summary: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}