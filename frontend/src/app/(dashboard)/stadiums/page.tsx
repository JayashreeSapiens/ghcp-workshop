'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, MapPin, Users, Calendar, AlertCircle } from 'lucide-react';

/**
 * Stadium interface matching the backend API response structure
 */
interface Stadium {
  id: number;
  name: string;
  team: string;
  location: string;
  capacity: number;
  opened: number;
  imageUrl?: string;
}

/**
 * API response structure from backend
 */
interface StadiumsResponse {
  stadiums: Stadium[];
}

/**
 * NBA Stadiums Page Component
 * 
 * Displays a grid of NBA stadium cards with information including:
 * - Stadium name and location
 * - Team information
 * - Capacity and year opened
 * - Stadium images
 * 
 * Features:
 * - Fetches data from Flask backend API
 * - Responsive grid layout with Tailwind CSS
 * - Loading states with skeleton placeholders
 * - Error handling with user-friendly messages
 * - Optimized images with fallback handling
 */
export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStadiums();
  }, []);

  /**
   * Fetch stadiums data from the backend API
   * Implements proper error handling and loading states
   */
  const fetchStadiums = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/stadiums`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stadiums: ${response.status} ${response.statusText}`);
      }

      const data: StadiumsResponse = await response.json();
      
      if (!data.stadiums || !Array.isArray(data.stadiums)) {
        throw new Error('Invalid data format received from server');
      }

      setStadiums(data.stadiums);
    } catch (err) {
      console.error('Error fetching stadiums:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stadiums data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format capacity number with thousands separator
   */
  const formatCapacity = (capacity: number): string => {
    return capacity.toLocaleString('en-US');
  };

  /**
   * Loading state with skeleton placeholders
   */
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Error state with retry option
   */
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
            <button
              onClick={fetchStadiums}
              className="ml-4 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (stadiums.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            No stadiums data available at this time.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /**
   * Main content with stadium cards
   */
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          NBA Stadiums
        </h1>
        <p className="text-muted-foreground">
          Explore the iconic venues that host NBA games across the country
        </p>
      </div>

      {/* Stadium Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stadiums.map((stadium) => (
          <Card
            key={stadium.id}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            {/* Stadium Image */}
            {stadium.imageUrl && (
              <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                <img
                  src={stadium.imageUrl}
                  alt={`${stadium.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Card Header */}
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl flex items-start justify-between gap-2">
                <span className="line-clamp-2">{stadium.name}</span>
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {stadium.location}
              </CardDescription>
            </CardHeader>

            {/* Card Content */}
            <CardContent className="space-y-3 flex-grow">
              {/* Team Badge */}
              <div>
                <Badge variant="secondary" className="font-semibold">
                  {stadium.team}
                </Badge>
              </div>

              {/* Stadium Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    <span className="font-medium text-foreground">
                      {formatCapacity(stadium.capacity)}
                    </span>{' '}
                    capacity
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Opened in{' '}
                    <span className="font-medium text-foreground">
                      {stadium.opened}
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        Showing {stadiums.length} NBA stadium{stadiums.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
