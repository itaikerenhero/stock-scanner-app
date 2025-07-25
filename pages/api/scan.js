import axios from 'axios';
import { SMA, RSI } from 'technicalindicators';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const priceFilter = req.query.priceFilter || 'all';

  async function getTickers(priceFilter) {
    try {
      const response = await axios.get(
        'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=nasdaq',
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const data = response.data?.data?.rows || [];
      const filtered = data.filter((r) => {
        const price = parseFloat(r.lastsale.replace('$', ''));
        if (priceFilter === 'under50') return price < 50;
        if (priceFilter === 'over50') return price >= 50;
        return true;
      });
      return filtered.slice(0, 300).map((r) => r.symbol);
    } catch (err) {
      console.error('Ticker fetch failed:', err.message);
      return [];
    }
  }

  async function getHistory(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
      const response = await axios.get(url);
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const prices = result.indicators.quote[0];
      return timestamps.map((t, i) => ({
        date: new Date(t * 1000),
        open: prices.open[i],
        high: prices.high[i],
        low: prices.low[i],
        close: prices.close[i],
        volume: prices.volume[i],
      }));
    } catch (err) {
      return null;
    }
  }

  const tickers = await getTickers(priceFilter);
  const winners = [];

  for (const symbol of tickers) {
    const candles = await getHistory(symbol);
    if (!candles || candles.length < 30) continue;

    const closes = candles.map(c => c.close);
    const rsi = RSI.calculate({ values: closes, period: 14 });
    const sma20 = SMA.calculate({ values: closes, period: 20 });
    const latestClose = closes[closes.length - 1];
    const latestRSI = rsi[rsi.length - 1];
    const latestSMA = sma20[sma20.length - 1];

    const breakout = latestClose > Math.max(...closes.slice(-30));
    const bullish = latestRSI > 55 && latestClose > latestSMA;

    if (breakout || bullish) {
      winners.push({ symbol, breakout, bullish });
      if (winners.length >= 3) break;
    }
  }

  // fallback
  if (winners.length === 0) {
    const filePath = path.join(process.cwd(), 'data', 'sampleData.json');
    const fallback = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    winners.push(...fallback.slice(0, 3));
  }

  res.status(200).json({ results: winners });
}
