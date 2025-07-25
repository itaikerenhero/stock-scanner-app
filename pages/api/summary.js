export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { symbol, setup } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      summary: `📝 *${symbol}* shows a ${setup.breakout ? "breakout" : "bullish"} setup. Price is pushing higher, momentum is picking up, and technical indicators support continuation. Looks like a winning stock.`,
    });
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = `Summarize the stock ${symbol}'s technical setup in a bold, energetic tone. It has ${
      setup.breakout ? "broken out recently" : "bullish momentum"
    }. Mention RSI and trend if relevant. Format it for beginners using emojis and 2–3 sentences max.`;

    const response = await client.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({ summary: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "LLM failed", detail: err.message });
  }
}
