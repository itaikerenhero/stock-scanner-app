import axios from 'axios';
import { SMA, RSI } from 'technicalindicators';

// Parse price strings like "$12.34" into floats. Returns null on failure.
function parsePrice(priceStr) {
  try {
    if (!priceStr || priceStr === 'N/A') return null;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  } catch {
    return null;
  }
}

// Fetch ticker symbols from the NASDAQ screener API. Filters by price range
// ('all', 'under50', 'over50') and returns up to 300 tickers. On error
// returns a fallback list of liquid tickers.  Note: the optional underscore
// variants (e.g. under_50) are also supported for backward compatibility.
async function getTickers(priceFilter) {
  try {
    const exchanges = ['nasdaq', 'nyse', 'amex'];
    let allRows = [];
    for (const ex of exchanges) {
      const res = await axios.get(
        `https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=${ex}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json, text/plain, */*',
          },
        },
      );
      const rows = res.data.data.table.rows;
      allRows = allRows.concat(rows);
    }
    let data = allRows
      .map((r) => ({ symbol: r.symbol, price: parsePrice(r.lastsale) }))
      .filter((r) => r.price);
    // Normalize filter values. Accept both "under50"/"over50" and
    // underscore variants (e.g. under_50) for compatibility with the UI.
    const filter = priceFilter?.toLowerCase() || 'all';
    if (filter === 'under50' || filter === 'under_50') {
      data = data.filter((r) => r.price < 50);
    } else if (filter === 'over50' || filter === 'over_50') {
      data = data.filter((r) => r.price >= 50);
    }
    data.sort((a, b) => b.price - a.price);
    // Return the top 300 symbols by price. More symbols increases the
    // likelihood of finding valid setups each day.
    return data.slice(0, 300).map((r) => r.symbol);
  } catch (err) {
    // Provide a fallback list if the screener fails.  These liquid
    // mega‑cap names ensure the scanner still returns results when the
    // external API is unreachable.
    return ['AAPL', 'MSFT', 'NVDA'];
  }
}

// Retrieve historical OHLCV data for a ticker from Yahoo Finance. Returns
// arrays of timestamps and corresponding price and volume series. Throws on
// failure.
async function fetchHistory(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=6mo&interval=1d`;
  const res = await axios.get(url);
  const result = res.data.chart.result && res.data.chart.result[0];
  if (!result) throw new Error('No data');
  const timestamps = result.timestamp;
  const quotes = result.indicators.quote[0];
  return {
    dates: timestamps.map((ts) => new Date(ts * 1000).toISOString().split('T')[0]),
    opens: quotes.open,
    highs: quotes.high,
    lows: quotes.low,
    closes: quotes.close,
    volumes: quotes.volume,
  };
}

// Compute technical indicators and determine whether a valid setup exists. The
// algorithm mirrors the Python implementation in the provided backend.
function calculateTechnicals(data) {
  const { opens, highs, lows, closes, volumes } = data;
  const sma20 = SMA.calculate({ values: closes, period: 20 });
  const sma50 = SMA.calculate({ values: closes, period: 50 });
  const rsi = RSI.calculate({ values: closes, period: 14 });
  // Rolling 20‑day high and average volume
  const avgVolume20 = [];
  const high20 = [];
  for (let i = 0; i < volumes.length; i++) {
    const volSlice = volumes.slice(Math.max(0, i - 19), i + 1);
    const volSum = volSlice.reduce((acc, v) => acc + (v || 0), 0);
    avgVolume20.push(volSum / volSlice.length);
    const highSlice = highs.slice(Math.max(0, i - 19), i + 1);
    high20.push(Math.max(...highSlice));
  }
  // Pad shorter arrays with nulls so they align with the length of closes
  const pad = (arr, len) => {
    const diff = len - arr.length;
    return Array(diff).fill(null).concat(arr);
  };
  const fullSma20 = pad(sma20, closes.length);
  const fullSma50 = pad(sma50, closes.length);
  const fullRsi = pad(rsi, closes.length);
  const i = closes.length - 1;
  const breakout = closes[i] > high20[i - 1];
  const pullbackBounce =
    closes[i] > fullSma50[i] &&
    lows[i - 1] < fullSma20[i - 1] &&
    closes[i] > closes[i - 1];
  const volumeSpike = volumes[i] > avgVolume20[i] * 1.5;
  const bigGreen = closes[i] > opens[i] && closes[i] > highs[i - 1];
  const rsiStrength = fullRsi[i] > 55;
  const aboveSma20 = closes[i] > fullSma20[i];
  const bullishMomentum = volumeSpike && bigGreen && rsiStrength && aboveSma20;
  const valid = breakout || pullbackBounce || bullishMomentum;
  let setup;
  if (breakout) setup = 'Breakout setup';
  else if (pullbackBounce) setup = 'Pullback & bounce setup';
  else if (bullishMomentum) setup = 'Bullish momentum setup';
  else setup = 'No clear setup';
  return { sma20: fullSma20, sma50: fullSma50, valid, setup };
}

// The API route handler. It runs on the server and returns up to three
// qualifying stock setups. Errors are caught and returned as status 500.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const priceFilter = req.query.priceFilter || 'all';
  try {
    const tickers = await getTickers(priceFilter);
    const results = [];
    // Helper to scan a list of tickers and append valid setups to results.
    async function scanList(list) {
      for (const ticker of list) {
        if (results.length >= 3) break;
        try {
          const history = await fetchHistory(ticker);
          if (history.closes.length < 60) continue;
          const { sma20, sma50, valid, setup } = calculateTechnicals(history);
          if (!valid) continue;
          results.push({
            symbol: ticker,
            dates: history.dates,
            opens: history.opens,
            highs: history.highs,
            lows: history.lows,
            closes: history.closes,
            sma20,
            sma50,
            setup,
          });
        } catch (err) {
          // Ignore individual ticker failures and continue scanning.
          continue;
        }
      }
    }
    // First attempt: scan the tickers returned by the screener.
    await scanList(tickers);
    // If no valid setups were found, fall back to a fixed set of liquid names.
    if (results.length === 0) {
      const fallbackList = ['AAPL', 'MSFT', 'NVDA'];
      await scanList(fallbackList);
    }
    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scan' });
  }
}