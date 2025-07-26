"""
Vercel serverless function for scanning stock setups.

This module defines a single entrypoint function `handler(request)` that
fetches a list of tickers from the NASDAQ screener (filtered by
`priceFilter`), downloads recent price history with `yfinance`, and
computes basic technical indicators (SMA20, SMA50, RSI) to determine
whether each symbol forms a breakout, pullback or bullish momentum setup.
Up to three qualifying setups are returned.  All logic is contained
inside the handler and helper functions; there is **no top‑level code**
executed at import time.  Any unexpected exception is caught and
logged, and the function returns an empty results list rather than
propagating a 500 error.
"""

import json
import re

import pandas as pd
import numpy as np
import yfinance as yf
import requests


def parse_price(price_str):
    """
    Convert a price string like "$12.34" into a float.  Returns None if the
    string is blank or cannot be parsed.
    """
    try:
        if not price_str or price_str == "N/A":
            return None
        return float(re.sub(r"[^\d.]", "", price_str))
    except Exception:
        return None


def get_all_screener_data():
    """
    Fetch stock screener rows from the NASDAQ API for NASDAQ, NYSE and AMEX.

    Each exchange is queried independently.  If a request fails (due to
    network issues or unexpected payloads), the error is logged and the
    exchange is skipped.  The concatenated rows are returned as a
    pandas DataFrame.
    """
    exchanges = ["nasdaq", "nyse", "amex"]
    all_rows = []
    for ex in exchanges:
        try:
            url = (
                "https://api.nasdaq.com/api/screener/stocks?tableonly=true"
                f"&limit=5000&exchange={ex}"
            )
            headers = {"User-Agent": "Mozilla/5.0"}
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            rows = data.get("data", {}).get("table", {}).get("rows", [])
            all_rows.extend(rows)
        except Exception as err:
            print(f"Error fetching screener for {ex}: {err}", flush=True)
            continue
    return pd.DataFrame(all_rows)


def get_tickers(price_filter="all", limit=300):
    """
    Construct a list of ticker symbols from the screener with an optional
    price filter.

    Parameters
    ----------
    price_filter : str
        One of 'all', 'under_50', 'under50', 'over_50', 'over50'.  The
        underscores are optional.  Filters are case‑insensitive.  If
        filtering by price, tickers below $50 or above $50 are selected.
    limit : int
        Maximum number of tickers to return.  The result is sorted by
        descending price to favour higher‑capitalization names.
    """
    try:
        df = get_all_screener_data()
        df = df.rename(columns={"symbol": "Symbol", "lastsale": "LastSale"})
        df["Price"] = df["LastSale"].apply(parse_price)
        # Remove rows with missing or non‑positive prices
        df = df[["Symbol", "Price"]].dropna()
        df = df[df["Price"] > 0]
        f = price_filter.lower() if price_filter else "all"
        if f in ("under_50", "under50"):
            df = df[df["Price"] < 50]
        elif f in ("over_50", "over50"):
            df = df[df["Price"] >= 50]
        df = df.sort_values("Price", ascending=False)
        return df["Symbol"].head(limit).tolist()
    except Exception as err:
        print(f"Error loading tickers: {err}", flush=True)
        return []


def calculate_technicals(df):
    """
    Compute SMA20, SMA50 and RSI arrays and determine if the
    latest bar triggers a breakout, pullback or bullish momentum setup.

    The returned dictionary contains the SMA arrays, a boolean flag
    `valid` indicating whether a setup was detected, and a `setup`
    description.
    """
    closes = df["Close"].values
    highs = df["High"].values
    lows = df["Low"].values
    volumes = df["Volume"].values

    # Calculate SMAs
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

    def pad(arr, length):
        diff = length - len(arr)
        return [None] * diff + arr

    sma20 = pad(sma20, len(closes))
    sma50 = pad(sma50, len(closes))
    rsi = pad(rsi, len(closes))

    # Determine setup on the most recent bar
    i = len(closes) - 1
    high20 = pd.Series(highs).rolling(window=20).max().tolist()
    avg_vol20 = pd.Series(volumes).rolling(window=20).mean().tolist()
    high20 = pad(high20, len(closes))
    avg_vol20 = pad(avg_vol20, len(closes))
    breakout = closes[i] > high20[i - 1] if i - 1 >= 0 else False
    pullback = (
        sma50[i] is not None and closes[i] > sma50[i]
        and i - 1 >= 0
        and sma20[i - 1] is not None and lows[i - 1] < sma20[i - 1]
        and closes[i] > closes[i - 1]
    )
    volume_spike = avg_vol20[i] is not None and volumes[i] > avg_vol20[i] * 1.5
    big_green = i - 1 >= 0 and closes[i] > df["Open"].iloc[i] and closes[i] > highs[i - 1]
    rsi_strength = rsi[i] is not None and rsi[i] > 55
    above_sma20 = sma20[i] is not None and closes[i] > sma20[i]
    bullish = volume_spike and big_green and rsi_strength and above_sma20
    valid = breakout or pullback or bullish
    if breakout:
        setup_desc = "Breakout setup"
    elif pullback:
        setup_desc = "Pullback & bounce setup"
    elif bullish:
        setup_desc = "Bullish momentum setup"
    else:
        setup_desc = "No clear setup"
    return {
        "sma20": sma20,
        "sma50": sma50,
        "valid": valid,
        "setup": setup_desc,
    }


def handler(request):
    """
    Vercel entrypoint for the stock scanner.

    Accepts an optional query parameter `priceFilter` (via `request.args`
    on Flask‑like objects or `request.get("query")` on the raw event).
    Returns a JSON response with a `results` array.  Any unexpected
    exception is caught and logged, and the response body will contain
    an empty list instead of raising a server error.
    """
    try:
        # Extract the price filter from the incoming request.  Vercel’s
        # Python runtime passes a flask-like `Request` object, but in some
        # cases it may be a simple dict.  Be defensive when reading it.
        price_filter = "all"
        try:
            # For Flask-style objects
            if hasattr(request, "args") and request.args:
                price_filter = request.args.get("priceFilter", "all")
            # For Vercel raw event dicts
            elif isinstance(request, dict):
                query = request.get("query", {}) or request.get("args", {})
                price_filter = query.get("priceFilter", "all")
        except Exception:
            pass

        tickers = get_tickers(price_filter, limit=300)
        results = []
        for symbol in tickers:
            if len(results) >= 3:
                break
            try:
                df = yf.download(symbol, period="6mo", interval="1d", progress=False)
                if df.empty or len(df) < 60:
                    continue
                df = df.rename(columns=str.capitalize)
                tech = calculate_technicals(df)
                if not tech.get("valid"):
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
            except Exception as err:
                # Skip this symbol on any error; log for debugging
                print(f"Error processing {symbol}: {err}", flush=True)
                continue

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"results": results}),
        }
    except Exception as err:
        # Catch any unexpected failure to avoid a 500 error
        print(f"Unhandled exception in scan handler: {err}", flush=True)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"results": []}),
        }
