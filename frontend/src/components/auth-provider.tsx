'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser, getAccessToken, logout as authLogout, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Manages authentication state across the application
 * Provides user information and authentication status to all child components
 * 
 * Usage:
 * Wrap your app or layout with this provider:
 * ```tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = () => {
    const token = getAccessToken();
    const userData = getUser();
    setIsAuthenticated(!!token);
    setUser(userData);
  };

  useEffect(() => {
    refreshAuth();
    setIsLoading(false);

    // Listen for storage events (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    authLogout();
    refreshAuth();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * 
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, refreshAuth, logout } = useAuthContext();
 * ```
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
