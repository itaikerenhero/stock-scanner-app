import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import FeatureCard from '../components/FeatureCard';
import StockResult from '../components/StockResult';
import { useUser } from '../contexts/UserContext';
import { FaRocket, FaChartLine, FaBullseye } from 'react-icons/fa';

const ComparisonChart = dynamic(() => import('../components/ComparisonChart'), { ssr: false });

export default function Home() {
  const { user, isPro } = useUser();
  const [results, setResults] = useState([]);
  const [priceFilter, setPriceFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchResults = async (filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scan?priceFilter=${filter}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(priceFilter);
  }, []);

  const handleRefresh = () => {
    if (!isPro) return;
    fetchResults(priceFilter);
  };

  return (
    <>
      <Navbar />
      <main className="bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gray-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unlock Winning Stock Setups
            </h1>
            <p className="text-gray-300 mb-8">
              Our AI‑powered scanner finds high‑probability trades that beat the market.
            </p>
            {!isPro && (
              <div className="inline-block bg-yellow-500 text-black px-4 py-2 rounded">
                Free users only see 3 stocks per day.
              </div>
            )}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Why We Beat the S&P 500
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                title="Smart Entries & Exits"
                description="Our signals use momentum, breakouts and pullbacks to time entries and exits for maximum profit."
                icon={<FaRocket />}
              />
              <FeatureCard
                title="AI‑Powered Insights"
                description="Our Groq LLM summarizes each setup into simple bullet points so you know exactly why it’s strong."
                icon={<FaChartLine />}
              />
              <FeatureCard
                title="Risk Management"
                description="Trade plans include stop‑loss and position sizing guidelines to manage risk like a pro."
                icon={<FaBullseye />}
              />
            </div>
          </div>
        </section>

        {/* Backtest Comparison Chart */}
        <section className="py-12 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Strategy vs S&P 500
            </h2>
            <ComparisonChart />
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
              <h2 className="text-3xl font-bold">Today's Stock Setups</h2>
              <div className="flex items-center gap-2">
                <select
                  value={priceFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPriceFilter(val);
                    if (isPro) {
                      fetchResults(val);
                    }
                  }}
                  disabled={!isPro}
                  className={`px-3 py-1 rounded bg-white border ${!isPro && 'cursor-not-allowed text-gray-400'}`}
                >
                  <option value="all">All Prices</option>
                  <option value="under50">Under $50</option>
                  <option value="over50">Over $50</option>
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={!isPro}
                  className={`px-3 py-1 rounded ${
                    isPro
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  🔁 Regenerate
                </button>
              </div>
            </div>
            {loading ? (
              <p className="text-center">Scanning market for setups…</p>
            ) : (
              <div>
                {results.length === 0 && (
                  <p>No strong setups found today. Try again later.</p>
                )}
                {results.map((res, idx) => (
                  <StockResult
                    key={idx}
                    symbol={res.symbol}
                    setup={res}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
