import Navbar from '../components/Navbar';
import { useUser } from '../contexts/UserContext';

export default function Plans() {
  const { upgrade } = useUser();

  const handleUpgrade = () => {
    // If Stripe is not set up, simulate upgrade
    alert('Pro activated! You now have full access. 💎');
    upgrade();
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 text-white">
        <h1 className="text-3xl font-bold text-center mb-6">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded shadow flex flex-col">
            <h2 className="text-2xl font-semibold mb-2">Free Plan</h2>
            <ul className="mb-4 text-sm list-disc list-inside space-y-1">
              <li>3 stock setups per day</li>
              <li>No filters</li>
              <li>No save, no regenerate, no trade plans</li>
            </ul>
            <span className="text-lg font-bold">Free</span>
          </div>

          <div className="bg-gray-800 border border-yellow-500 p-6 rounded shadow flex flex-col">
            <h2 className="text-2xl font-semibold mb-2">Pro Plan</h2>
            <ul className="mb-4 text-sm list-disc list-inside space-y-1">
              <li>Unlimited stock setups</li>
              <li>Regenerate & filter by price</li>
              <li>Save favorites</li>
              <li>AI-generated trade plans</li>
            </ul>
            <span className="text-lg font-bold mb-4">$9 / month</span>
            <button
              onClick={handleUpgrade}
              className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
