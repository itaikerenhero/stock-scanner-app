"""
Serverless function for scanning stock setups using Python and yfinance.

This function is intended to run on Vercel’s Python runtime.  It pulls
live ticker data from the Nasdaq screener, downloads recent price
history with yfinance, calculates simple technical indicators
(SMA20/SMA50/RSI) and determines whether each symbol has a valid
breakout, pullback or bullish momentum setup.  Up to three symbols
are returned in the response.  If the screener or price history
requests fail, the function returns an empty list rather than
substituting fallback data.

To install dependencies at deploy time, include a requirements.txt
file alongside this function listing yfinance and its dependencies.
"""

import json
import re
from typing import Dict, Any

import pandas as pd  # type: ignore
import numpy as np  # type: ignore
import yfinance as yf  # type: ignore
import requests


def parse_price(price_str: str):
    """Parse price strings like "$12.34" into floats. Returns None on failure."""
    try:
        if not price_str or price_str == "N/A":
            return None
        return float(re.sub(r"[^\d.]", "", price_str))
    except Exception:
        return None


def get_all_screener_data() -> pd.DataFrame:
    """
    Fetch stock screener data from NASDAQ, NYSE and AMEX via the Nasdaq API.
    Returns a DataFrame with the combined rows.  If any exchange fails, its
    rows are skipped.
    """
    exchanges = ["nasdaq", "nyse", "amex"]
    all_rows = []
    for ex in exchanges:
        url = f"https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange={ex}"
        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            r = requests.get(url, headers=headers, timeout=10)
            r.raise_for_status()
            data = r.json()
            rows = data["data"]["table"]["rows"]
            all_rows.extend(rows)
        except Exception:
            # If an exchange fails, continue with others
            continue
    return pd.DataFrame(all_rows)


def get_tickers(price_filter: str = "all", limit: int = 300) -> list:
    """
    Load tickers from the NASDAQ screener.  Filter by price range and return
    up to ``limit`` symbols.  If the screener fails completely, return an
    empty list.  ``price_filter`` accepts 'all', 'under_50', 'over_50' and
    underscore‑less variants for backward compatibility.
    """
    try:
        df = get_all_screener_data()
        df = df.rename(columns={"symbol": "Symbol", "lastsale": "LastSale"})
        df["Price"] = df["LastSale"].apply(parse_price)
        df = df[["Symbol", "Price"]].dropna()
        df = df[df["Price"] > 0]
        price_filter = price_filter.lower()
        if price_filter in ("under_50", "under50"):
            df = df[df["Price"] < 50]
        elif price_filter in ("over_50", "over50"):
            df = df[df["Price"] >= 50]
        # Sort by price descending so we prioritise larger cap names
        df = df.sort_values("Price", ascending=False)
        return df["Symbol"].head(limit).tolist()
    except Exception:
        return []


def calculate_technicals(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Given a DataFrame with columns Open, High, Low, Close and Volume, compute
    SMA20, SMA50, RSI and determine if a valid setup exists.  Returns a
    dictionary with SMA arrays, a boolean 'valid' and a textual 'setup'.
    """
    closes = df["Close"].values
    highs = df["High"].values
    lows = df["Low"].values
    volumes = df["Volume"].values
    # SMA calculations
    sma20 = pd.Series(closes).rolling(window=20).mean().tolist()
    sma50 = pd.Series(closes).rolling(window=50).mean().tolist()
    # RSI calculation
    delta = np.diff(closes)
    up = np.where(delta > 0, delta, 0)
    down = np.where(delta < 0, -delta, 0)
    roll_up = pd.Series(up).rolling(14).mean()
    roll_down = pd.Series(down).rolling(14).mean()
    rs = roll_up / roll_down
    rsi = (100 - (100 / (1 + rs))).tolist()
    # Align lengths by padding with None
    def pad(arr, length):
        diff = length - len(arr)
        return [None] * diff + arr
    sma20 = pad(sma20, len(closes))
    sma50 = pad(sma50, len(closes))
    rsi = pad(rsi, len(closes))
    # Determine setup
    i = len(closes) - 1
    # Compute rolling 20-day high and average volume
    high20 = pd.Series(highs).rolling(window=20).max().tolist()
    avg_vol20 = pd.Series(volumes).rolling(window=20).mean().tolist()
    high20 = pad(high20, len(closes))
    avg_vol20 = pad(avg_vol20, len(closes))
    breakout = closes[i] > high20[i - 1] if i - 1 >= 0 else False
    pullback_bounce = (
        closes[i] > sma50[i] if sma50[i] is not None else False
    ) and (
        lows[i - 1] < sma20[i - 1] if i - 1 >= 0 and sma20[i - 1] is not None else False
    ) and (
        closes[i] > closes[i - 1] if i - 1 >= 0 else False
    )
    volume_spike = volumes[i] > avg_vol20[i] * 1.5 if avg_vol20[i] is not None else False
    big_green = closes[i] > df["Open"].iloc[i] and closes[i] > highs[i - 1] if i - 1 >= 0 else False
    rsi_strength = rsi[i] is not None and rsi[i] > 55
    above_sma20 = sma20[i] is not None and closes[i] > sma20[i]
    bullish_momentum = volume_spike and big_green and rsi_strength and above_sma20
    valid = breakout or pullback_bounce or bullish_momentum
    if breakout:
        setup = "Breakout setup"
    elif pullback_bounce:
        setup = "Pullback & bounce setup"
    elif bullish_momentum:
        setup = "Bullish momentum setup"
    else:
        setup = "No clear setup"
    return {
        "sma20": sma20,
        "sma50": sma50,
        "valid": valid,
        "setup": setup,
    }


def handler(request) -> Dict[str, Any]:
    """
    Vercel serverless function entrypoint.  Scans for stock setups and
    returns up to three results in JSON format.  If no setups are found or
    upstream APIs fail, returns an empty list.  The query parameter
    ``priceFilter`` controls the screener price range and accepts 'all',
    'under50'/'under_50' and 'over50'/'over_50'.
    """
    # Extract query parameters; Vercel passes them via request.args for Flask
    price_filter = request.args.get("priceFilter", "all") if hasattr(request, "args") else "all"
    tickers = get_tickers(price_filter, limit=300)
    results = []
    for symbol in tickers:
        if len(results) >= 3:
            break
        try:
            df = yf.download(symbol, period="6mo", interval="1d", progress=False)
            if df.empty or len(df) < 60:
                continue
            df = df.rename(columns=str.capitalize)  # ensure column names: Open, High, Low, Close, Volume
            tech = calculate_technicals(df)
            if not tech["valid"]:
                continue
            results.append({
                "symbol": symbol,
                "dates": [d.strftime("%Y-%m-%d") for d in df.index],
                "opens": df["Open"].tolist(),
                "highs": df["High"].tolist(),
                "lows": df["Low"].tolist(),
                "closes": df["Close"].tolist(),
                "sma20": tech["sma20"],
                "sma50": tech["sma50"],
                "setup": tech["setup"],
            })
        except Exception:
            # Skip on any error (e.g. network, data format)
            continue
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"results": results}),
    }