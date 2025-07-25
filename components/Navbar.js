import Link from 'next/link';
import { useUser } from '../contexts/UserContext';

// A responsive navigation bar that adapts to the user's authentication state.
// It shows links to the main pages and login/logout actions. If the user is
// subscribed to the pro plan the favourites link is revealed.
export default function Navbar() {
  const { user, logout } = useUser();
  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">StockScannerAI</Link>
        <div className="flex gap-4 items-center">
          <Link href="/plans" className="hover:underline">Plans</Link>
          {user && user.isPro && (
            <Link href="/favorites" className="hover:underline">Favorites</Link>
          )}
          <Link href="/about" className="hover:underline">About Us</Link>
          {user ? (
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">Login</Link>
              <Link href="/signup" className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}