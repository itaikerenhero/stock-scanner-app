import { useUser } from '../contexts/UserContext';
import { useState } from 'react';

export default function StockResult({ symbol, setup }) {
  const { isPro } = useUser();
  const [summary, setSummary] = useState('');
  const [plan, setPlan] = useState(null);

  const getSummary = async () => {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, setup }),
    });
    const data = await res.json();
    setSummary(data.summary);
  };

  const getPlan = async () => {
    if (!isPro) return alert('Upgrade to Pro to unlock trade plans!');
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const data = await res.json();
    setPlan(data.plan);
  };

  return (
    <div className="bg-gray-800 text-white rounded p-4 shadow-md flex flex-col gap-2 border border-gray-700">
      <h2 className="text-2xl font-bold">{symbol}</h2>
      <p>
        {setup.breakout && '🚀 Breakout setup '}
        {setup.bullish && '📈 Bullish momentum'}
      </p>
      <button
        className="bg-blue-600 px-3 py-1 rounded mt-2 hover:bg-blue-700"
        onClick={getSummary}
      >
        AI Summary
      </button>
      {summary && <p className="text-sm mt-2">{summary}</p>}

      <button
        className={`mt-2 px-3 py-1 rounded ${
          isPro ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 cursor-not-allowed'
        }`}
        onClick={getPlan}
      >
        Generate Trade Plan
      </button>

      {plan && (
        <div className="text-sm mt-2 space-y-1">
          <p>🎯 Entry: {plan.entry}</p>
          <p>🛑 Stop Loss: {plan.stopLoss}</p>
          <p>💰 Take Profit: {plan.takeProfit}</p>
          <p>📝 {plan.notes}</p>
        </div>
      )}
    </div>
  );
}
