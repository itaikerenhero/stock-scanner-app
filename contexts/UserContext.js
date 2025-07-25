import { createContext, useContext, useEffect, useState } from 'react';

// A React context to hold user information, including subscription status and favorites.
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load the user from localStorage when the provider mounts. This allows session
  // persistence across page refreshes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('stockScannerUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Save the user back into localStorage whenever it changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('stockScannerUser', JSON.stringify(user));
    }
  }, [user]);

  // Log in a user with an optional pro flag. This resets any existing favorites.
  const login = (username, isPro = false) => {
    const newUser = { username, isPro, favorites: [] };
    setUser(newUser);
  };

  // Remove the user from state and storage on logout.
  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stockScannerUser');
    }
  };

  // Upgrade the current user to a pro subscription. Does nothing if no user.
  const upgrade = () => {
    if (!user) return;
    setUser({ ...user, isPro: true });
  };

  // Add or remove a stock from the user's favorites list. When a stock is
  // already present it will be removed; otherwise it is appended.
  const toggleFavorite = (symbol, result) => {
    if (!user) return;
    let favorites = user.favorites || [];
    const exists = favorites.find((f) => f.symbol === symbol);
    if (exists) {
      favorites = favorites.filter((f) => f.symbol !== symbol);
    } else {
      favorites = [...favorites, { symbol, result }];
    }
    setUser({ ...user, favorites });
  };

  return (
    <UserContext.Provider value={{ user, login, logout, upgrade, toggleFavorite }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to access the user context. Components can call `useUser()` to
// get the current user and helper functions.
export const useUser = () => useContext(UserContext);