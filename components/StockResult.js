import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useUser } from '../contexts/UserContext';

// Dynamically import Plotly to prevent server-side rendering errors. Only the
// client can render Plotly charts because they require a browser context.
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// This component displays a single stock setup. It renders a candlestick
// chart with optional moving averages, shows an AI-generated summary, and
// allows pro users to regenerate or create a trade plan. Non-pro users see
// disabled buttons and a prompt to upgrade.
export default function StockResult({ result, onRefresh }) {
  const { user, toggleFavorite } = useUser();
  const isPro = user?.isPro;
  const [summary, setSummary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    // Fetch the summary from the server when the component mounts or the
    // underlying result changes. This only runs client-side.
    async function fetchSummary() {
      if (!result) return;
      setLoadingSummary(true);
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: result.symbol, setup: result.setup }),
        });
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSummary(false);
      }
    }
    fetchSummary();
  }, [result]);

  // Request a trade plan from the server. Only pro users may call this.
  const handlePlan = async () => {
    if (!isPro) return;
    setLoadingPlan(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: result.symbol, setup: result.setup }),
      });
      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Toggle this stock in the user's favourites list. Pro users only.
  const handleFavorite = () => {
    if (!isPro) return;
    toggleFavorite(result.symbol, result);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {result.symbol} - {result.setup}
        </h2>
        <button onClick={handleFavorite} disabled={!isPro}>
          {user?.favorites?.some((f) => f.symbol === result.symbol) ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-gray-400" />
          )}
        </button>
      </div>
      <Plot
        data={[
          {
            type: 'candlestick',
            x: result.dates,
            open: result.opens,
            high: result.highs,
            low: result.lows,
            close: result.closes,
            name: result.symbol,
          },
          {
            x: result.dates,
            y: result.sma20,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'blue' },
            name: 'SMA 20',
          },
          {
            x: result.dates,
            y: result.sma50,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'orange' },
            name: 'SMA 50',
          },
        ]}
        layout={{
          title: `${result.symbol} Price Chart`,
          xaxis: { rangeslider: { visible: false } },
          yaxis: { autorange: true },
          plot_bgcolor: '#111827',
          paper_bgcolor: '#111827',
          font: { color: '#fff' },
          height: 300,
          margin: { t: 30, b: 30, l: 40, r: 10 },
        }}
        useResizeHandler
        style={{ width: '100%', height: '300px' }}
      />
      <div className="mt-4">
        {loadingSummary ? (
          <p>Loading analysis...</p>
        ) : (
          <p
            className="whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: summary?.replace(/\n/g, '<br/>') || '' }}
          />
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onRefresh}
          disabled={!isPro}
          className={`px-3 py-1 rounded ${isPro ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'}`}
        >
          🔁 Regenerate
        </button>
        <button
          onClick={handlePlan}
          disabled={!isPro}
          className={`px-3 py-1 rounded ${isPro ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 cursor-not-allowed'}`}
        >
          📋 Trade Plan
        </button>
      </div>
      {!isPro && (
        <div className="mt-2 text-yellow-400 text-sm">
          Upgrade to Pro to unlock regenerate, favorites and trade plans.
        </div>
      )}
      {loadingPlan && <p className="mt-2">Creating trade plan...</p>}
      {plan && (
        <div className="mt-4 bg-gray-800 p-3 rounded">
          <h3 className="font-bold text-lg mb-2">📋 Trade Plan</h3>
          {plan.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}