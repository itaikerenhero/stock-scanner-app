import Navbar from '../components/Navbar';
import { useUser } from '../contexts/UserContext';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

// The Plans page presents the free and pro tiers. Pro subscribers gain
// unlimited access and premium features. Clicking the upgrade button
// initiates a Stripe checkout session via an API route.
export default function Plans() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div className="bg-white border rounded p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Free Plan</h2>
            <p className="mb-4">
              Access 3 stock setups per day. Regenerate button, price filter,
              favourites and trade plans are locked.
            </p>
            <p className="text-3xl font-bold mb-4">$0</p>
            {user?.isPro ? (
              <button className="bg-gray-400 text-white py-2 px-4 rounded" disabled>
                Current Plan
              </button>
            ) : (
              <button className="bg-gray-400 text-white py-2 px-4 rounded" disabled>
                Free
              </button>
            )}
          </div>
          {/* Pro Plan Card */}
          <div className="bg-white border rounded p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Pro Plan</h2>
            <p className="mb-4">
              Unlimited setups, regenerate any time, filter by price, save
              favourites and get personalised trade plans.
            </p>
            <p className="text-3xl font-bold mb-4">
              $9<span className="text-base font-normal">/month</span>
            </p>
            {user?.isPro ? (
              <button className="bg-green-400 text-white py-2 px-4 rounded" disabled>
                You're Pro!
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                {loading ? 'Processing…' : 'Upgrade Now'}
              </button>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Secure checkout powered by Stripe.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}