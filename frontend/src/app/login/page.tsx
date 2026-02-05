'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, User, Eye, EyeOff } from 'lucide-react';
import { FaBasketball } from 'react-icons/fa6';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';
import { useAuthContext } from '@/components/auth-provider';

/**
 * Login Page Component
 * 
 * Features:
 * - JWT authentication with backend API
 * - Form validation for username and password
 * - Secure password input with toggle visibility
 * - Error handling with user-friendly messages
 * - Loading states during authentication
 * - Professional UI with shadcn/ui components
 * - Responsive design with Tailwind CSS
 * 
 * Backend Integration:
 * - POST /api/auth/login with username and password
 * - Stores JWT token in localStorage
 * - Redirects to home page on successful login
 */
export default function LoginPage() {
  // Redirect to home if already authenticated
  useRedirectIfAuthenticated('/');

  const router = useRouter();
  const { refreshAuth } = useAuthContext();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  /**
   * Validate form inputs before submission
   */
  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission and authentication
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store JWT token in localStorage
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Refresh authentication context
        refreshAuth();
        
        // Redirect to home page
        router.push('/');
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input changes with validation reset
   */
  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        {/* Header */}
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <FaBasketball className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to access your NBA dashboard
          </CardDescription>
        </CardHeader>

        {/* Form */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`pl-10 ${validationErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {validationErrors.username && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 ${validationErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Demo Credentials Info */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Demo Credentials:
              </p>
              <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p>
                  <span className="font-semibold">Admin:</span> admin / admin123
                </p>
                <p>
                  <span className="font-semibold">User:</span> user / user123
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
