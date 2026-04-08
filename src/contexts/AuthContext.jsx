import { createContext, useContext, useState, useCallback } from 'react';
import { users } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const found = users.find((u) => u.email === email);
    if (!found) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    // Mock: any password works for demo
    if (password.length < 1) {
      setIsLoading(false);
      throw new Error('Password is required');
    }

    setUser(found);
    setIsLoading(false);
    return found;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isConsultant: user?.role === 'consultant',
    isGC: user?.role === 'gc',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
