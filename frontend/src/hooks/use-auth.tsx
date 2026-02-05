'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

/**
 * Hook to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 * 
 * Usage:
 * ```tsx
 * export default function ProtectedPage() {
 *   useAuth();
 *   // ... rest of component
 * }
 * ```
 */
export const useAuth = (redirectTo: string = '/login') => {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);
};

/**
 * Hook to redirect authenticated users away from public pages
 * Useful for login page - redirects to home if already logged in
 * 
 * Usage:
 * ```tsx
 * export default function LoginPage() {
 *   useRedirectIfAuthenticated('/');
 *   // ... rest of component
 * }
 * ```
 */
export const useRedirectIfAuthenticated = (redirectTo: string = '/') => {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);
};
