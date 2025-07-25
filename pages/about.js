import Navbar from '../components/Navbar';
import Image from 'next/image';

// The About page tells the story of the company and alternates text with
// images. At the end it showcases three testimonials with impressive
// performance numbers. Images live in the public folder and are imported
// automatically by Next.js.
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
              We started StockScannerAI because we believe anyone can beat the
              market with the right tools. Our mission is to democratize
              sophisticated trading signals and AI‑driven insights so that
              everyday investors can trade like pros.
            </p>
          </div>
        </section>
        {/* Story Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="mb-4">
                After years of trading, our founders realized that most retail
                traders lack the tools and discipline used by professionals. We
                built a scanner that combines proven technical patterns with AI
                to identify high‑probability setups every day.
              </p>
              <p>
                Today, thousands of traders rely on our system to stay ahead of
                the market and grow their portfolios.
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
                We don't just show you charts. Our AI explains why a stock looks
                strong and how to trade it. We prioritize risk management and
                clarity so that you can trade with confidence.
              </p>
              <p>
                Our edge comes from blending data‑driven signals with
                human‑friendly explanations.
              </p>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Real User Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded shadow text-center">
                <p className="text-2xl font-bold text-green-600 mb-2">
                  UP by 20%
                </p>
                <p className="text-gray-700">
                  "I increased my portfolio by 20% in just a few months using the
                  scanner!"
                </p>
              </div>
              <div className="bg-white p-6 rounded shadow text-center">
                <p className="text-2xl font-bold text-green-600 mb-2">
                  UP by 22%
                </p>
                <p className="text-gray-700">
                  "The trade plans are so clear. I can't imagine trading
                  without it now."
                </p>
              </div>
              <div className="bg-white p-6 rounded shadow text-center">
                <p className="text-2xl font-bold text-green-600 mb-2">
                  UP by 18%
                </p>
                <p className="text-gray-700">
                  "Favorite feature? The regenerate button. Keeps serving new
                  opportunities!"
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}