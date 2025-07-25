import Navbar from '../components/Navbar';
import Image from 'next/image';

export default function About() {
  return (
    <>
      <Navbar />
      <main className="bg-gray-100">
        {/* Intro Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">About Us</h1>
            <p className="text-gray-300 max-w-3xl">
              We built StockScannerAI to give everyday traders an edge.
             Our mission is simple: create the most powerful stock scanning tool on the market — one that spots winning setups, uncovers hidden gems, and helps you trade smarter and faster. Whether you're a beginner or a seasoned investor, StockScannerAI is built to help you outperform the market with ease.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="mb-4">
                After years of trading, our founders realized that most retail traders lack the tools and discipline used by professionals. We built a scanner that combines proven technical patterns with AI to identify high‑probability setups every day.
              </p>
              <p>
                Today, thousands of traders rely on our system to stay ahead of the market and grow their portfolios.
              </p>
            </div>
            <div>
              <Image
                src="/images/hero1.png"
                width={600}
                height={400}
                alt="Trading"
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <Image
                src="/images/hero2.png"
                width={600}
                height={400}
                alt="Technology"
                className="rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
              <p className="mb-4">
                We don't just show you charts. Our AI explains why a stock looks strong and how to trade it. We prioritize risk management and clarity so that you can trade with confidence.
              </p>
              <p>
                Our edge comes from blending data‑driven signals with human‑friendly explanations.
              </p>
            </div>
          </div>
        </section>

        {/* 🔥 Testimonials Section (Upgraded) */}
        <section className="py-16 bg-[#0f172a] text-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Real User Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center space-y-4">
                <img src="/images/user1.png" alt="User 1" className="rounded shadow-lg w-full h-48 object-cover" />
                <p className="text-green-400 text-2xl font-bold">📈 Up 24%</p>
                <p>"Caught a breakout before earnings — made 24% in 2 weeks. This scanner gave me the edge I needed."</p>
              </div>

              <div className="text-center space-y-4">
                <img src="/images/user2.png" alt="User 2" className="rounded shadow-lg w-full h-48 object-cover" />
                <p className="text-green-400 text-2xl font-bold">💎 More Confidence</p>
                <p>"I didn’t know when to buy. The summary + trade plan showed me exactly why a stock was strong."</p>
              </div>

              <div className="text-center space-y-4">
                <img src="/images/user3.png" alt="User 3" className="rounded shadow-lg w-full h-48 object-cover" />
                <p className="text-green-400 text-2xl font-bold">🚀 $430 in Month 1</p>
                <p>"Brand new to trading — made $430 in my first month using this tool. It's like a secret weapon."</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
