/**
 * Authentication utility functions for managing user sessions
 * 
 * Features:
 * - JWT token management in localStorage
 * - User state persistence
 * - Logout functionality
 * - Authentication status checks
 */

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

/**
 * Get the stored JWT access token
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

/**
 * Get the stored user information
 */
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Check if user has admin role
 */
export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'admin';
};

/**
 * Clear authentication data and logout
 */
export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

/**
 * Make authenticated API request with JWT token
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
};
