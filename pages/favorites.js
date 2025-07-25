import Navbar from '../components/Navbar';
import { useUser } from '../contexts/UserContext';
import StockResult from '../components/StockResult';

// This page lists the user's saved stock setups. Favourites only work for
// pro subscribers. The StockResult component is reused here but the
// regenerate button is disabled by passing an empty handler.
export default function Favorites() {
  const { user } = useUser();

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="p-4">
          <p>Please log in to view your favourites.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Your Favourite Setups</h1>
        {user.favorites && user.favorites.length ? (
          user.favorites.map((fav, idx) => (
            <StockResult
              key={idx}
              result={fav.result}
              onRefresh={() => {}}
            />
          ))
        ) : (
          <p>You have no favourites yet.</p>
        )}
      </main>
    </>
  );
}