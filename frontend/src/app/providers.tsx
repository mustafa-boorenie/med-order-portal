'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { CartProvider } from '@/contexts/CartContext';

interface User {
  sub: string;
  name: string;
  email: string;
  picture: string;
  'https://medportal.com/roles'?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

export function useUser() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();

    // Listen for focus events to refresh auth state when user returns to the app
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, refreshUser }}>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthContext.Provider>
  );
}