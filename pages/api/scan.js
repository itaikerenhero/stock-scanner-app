import axios from 'axios';
import { SMA, RSI } from 'technicalindicators';

/*
 * REST API endpoint for scanning stocks and identifying bullish setups.
 *
 * This handler replicates the original scanner logic using Node and the
 * NASDAQ screener for ticker discovery. It fetches recent price history
 * from Yahoo Finance, calculates moving averages and RSI, and detects
 * breakout, pullback and bullish momentum conditions. Up to three
 * qualifying tickers are returned. If no valid setups are found the
 * API responds with an empty results array. All errors are caught
 * and logged to prevent server crashes.
 */

export default async function handler(req, res) {
  try {
    // Determine the price filter from query parameters. Accept both
    // under50/over50 and under_50/over_50 variants. Default to 'all'.
    const filterRaw = req.query.priceFilter || 'all';
    const filter = String(filterRaw).toLowerCase();

    // Fetch screener data from NASDAQ for multiple exchanges. Use a
    // User‑Agent header to avoid being blocked. Each request returns
    // up to 5,000 rows; we concatenate them and then filter by price.
    async function fetchExchange(exchange) {
      const url = `https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=${exchange}`;
      const headers = { 'User-Agent': 'Mozilla/5.0' };
      const response = await axios.get(url, { headers, timeout: 10000 });
      const rows = response.data?.data?.table?.rows || [];
      return rows;
    }

    const exchanges = ['nasdaq', 'nyse', 'amex'];
    let allRows = [];
    for (const ex of exchanges) {
      try {
        const rows = await fetchExchange(ex);
        allRows = allRows.concat(rows);
      } catch (err) {
        console.error(`Error fetching screener for ${ex}:`, err);
      }
    }

    // Parse the screener rows into an array of { symbol, price } and
    // filter based on the priceFilter. Remove any rows with missing
    // or non‑numeric prices.
    function parsePrice(str) {
      if (!str || str === 'N/A') return null;
      const match = String(str).replace(/[^\d.]/g, '');
      const val = parseFloat(match);
      return isNaN(val) ? null : val;
    }

    const tickers = allRows
      .map((row) => {
        const symbol = row.symbol || row.Symbol;
        const priceStr = row.lastsale || row.LastSale;
        const price = parsePrice(priceStr);
        return { symbol, price };
      })
      .filter((r) => r.symbol && r.price)
      .filter((r) => {
        if (filter === 'under50' || filter === 'under_50') return r.price < 50;
        if (filter === 'over50' || filter === 'over_50') return r.price >= 50;
        return true;
      })
      .sort((a, b) => b.price - a.price)
      .slice(0, 300)
      .map((r) => r.symbol);

    // Helper to compute technical indicators using technicalindicators.
    function computeTech(prices) {
      const close = prices.close;
      const high = prices.high;
      const low = prices.low;
      const volume = prices.volume;
      const sma20 = SMA.calculate({ period: 20, values: close });
      const sma50 = SMA.calculate({ period: 50, values: close });
      const rsi14 = RSI.calculate({ period: 14, values: close });
      // Pad arrays to match length of price series
      const pad = (arr, len) => Array(len - arr.length).fill(null).concat(arr);
      const sma20Padded = pad(sma20, close.length);
      const sma50Padded = pad(sma50, close.length);
      const rsiPadded = pad(rsi14, close.length);
      // Rolling 20‑day high and average volume
      const rollingHigh = [];
      const rollingVol = [];
      for (let i = 0; i < close.length; i++) {
        const start = Math.max(0, i - 19);
        const highs = high.slice(start, i + 1);
        const vols = volume.slice(start, i + 1);
        rollingHigh.push(Math.max(...highs));
        const avgVol = vols.reduce((sum, v) => sum + v, 0) / vols.length;
        rollingVol.push(avgVol);
      }
      return { sma20: sma20Padded, sma50: sma50Padded, rsi: rsiPadded, rollingHigh, rollingVol };
    }

    // Function to determine if the latest bar triggers a valid setup
    function detectSetup(prices, tech) {
      const len = prices.close.length;
      const i = len - 1;
      const close = prices.close[i];
      const open = prices.open[i];
      const prevHigh = prices.high[i - 1] || 0;
      const lowPrev = prices.low[i - 1] || 0;
      const sma20 = tech.sma20[i];
      const sma50 = tech.sma50[i];
      const rsi = tech.rsi[i];
      const high20 = tech.rollingHigh[i - 1] || 0;
      const avgVol20 = tech.rollingVol[i] || 0;
      const breakout = close > high20;
      const pullback = sma50 && close > sma50 && sma20 && lowPrev < sma20 && close > prices.close[i - 1];
      const volumeSpike = avgVol20 && prices.volume[i] > avgVol20 * 1.5;
      const bigGreen = close > open && close > prevHigh;
      const bullish = volumeSpike && bigGreen && rsi && rsi > 55 && sma20 && close > sma20;
      let setup = 'No clear setup';
      if (breakout) setup = 'Breakout setup';
      else if (pullback) setup = 'Pullback & bounce setup';
      else if (bullish) setup = 'Bullish momentum setup';
      return { valid: breakout || pullback || bullish, setup };
    }

    // Fetch historical data and compute setups for each symbol. Stop
    // after collecting three valid results. Use try/catch around each
    // network call so that errors don’t abort the entire loop.
    const results = [];
    for (const symbol of tickers) {
      if (results.length >= 3) break;
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d&includePrePost=false`;
        const resp = await axios.get(url, { timeout: 15000 });
        const data = resp.data?.chart?.result?.[0];
        if (!data || !data.timestamp || !data.indicators?.quote?.[0]) continue;
        const timestamps = data.timestamp;
        const quote = data.indicators.quote[0];
        const prices = {
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume,
        };
        if (!prices.close || prices.close.length < 40) continue;
        const tech = computeTech(prices);
        const setup = detectSetup(prices, tech);
        if (setup.valid) {
          // Format dates as YYYY-MM-DD
          const dates = timestamps.map((t) => new Date(t * 1000).toISOString().slice(0, 10));
          results.push({
            symbol,
            dates,
            opens: prices.open,
            highs: prices.high,
            lows: prices.low,
            closes: prices.close,
            sma20: tech.sma20,
            sma50: tech.sma50,
            setup: setup.setup,
          });
        }
      } catch (err) {
        console.error(`Error processing ${symbol}:`, err);
        continue;
      }
    }

    // Respond with the results array (may be empty) as JSON.
    res.status(200).json({ results });
  } catch (err) {
    console.error('Unhandled error in scan handler:', err);
    res.status(200).json({ results: [] });
  }
}