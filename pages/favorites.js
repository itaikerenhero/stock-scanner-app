import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';
import StockResult from '../components/StockResult';

// This page lists the user's saved stock setups. Only pro subscribers can
// save favourites; non‑pro users are prompted to upgrade.  The design
// follows the same dark, Wall Street inspired aesthetic used elsewhere.
export default function Favorites() {
  const { user } = useUser();

  // Require login
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="p-8 text-center bg-[#0f172a] min-h-screen text-white">
          <h1 className="text-3xl font-bold mb-4">Please Log In</h1>
          <p className="mb-4">You need to be signed in to view your favourite setups.</p>
          <Link href="/login" className="text-blue-400 underline">
            Go to Login
          </Link>
        </main>
      </>
    );
  }

  // Require pro subscription
  if (!user.isPro) {
    return (
      <>
        <Navbar />
        <main className="p-8 text-center bg-[#0f172a] min-h-screen text-white">
          <h1 className="text-3xl font-bold mb-4">Unlock Favourites</h1>
          <p className="mb-4">
            Saving and viewing favourite setups is a Pro feature. Upgrade now to
            access unlimited setups, regeneration and personalised plans.
          </p>
          <Link
            href="/plans"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Upgrade to Pro
          </Link>
        </main>
      </>
    );
  }

  // Render favourites for pro users
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 bg-[#0f172a] min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Favourite Setups</h1>
        {user.favorites && user.favorites.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.favorites.map((fav, idx) => (
              <StockResult
                key={idx}
                result={fav.result}
                onRefresh={() => {}}
              />
            ))}
          </div>
        ) : (
          <p className="text-center">You have no favourites yet.</p>
        )}
      </main>
    </>
  );
}