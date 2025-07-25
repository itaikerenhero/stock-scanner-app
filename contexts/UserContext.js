import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isPro, setIsPro] = useState(false);

  // Automatically unlock Pro if no Stripe keys are set
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setIsPro(true);
    }
  }, []);

  const upgrade = () => {
    setIsPro(true);
  };

  return (
    <UserContext.Provider value={{ isPro, upgrade }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
