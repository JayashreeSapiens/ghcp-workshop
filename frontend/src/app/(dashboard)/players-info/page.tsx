"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, User } from "lucide-react";

// TypeScript interface for Player data
interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  height: string;
  weight: string;
}

// Loading skeleton component for better UX
const PlayerCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

// Individual player card component
const PlayerCard = ({ player }: { player: Player }) => (
  <Card className="w-full hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {player.name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            ID: #{player.id}
          </CardDescription>
        </div>
        <Badge variant="secondary" className="ml-2">
          {player.position}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-gray-500 font-medium">Height</p>
          <p className="text-gray-900 font-semibold">{player.height}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 font-medium">Weight</p>
          <p className="text-gray-900 font-semibold">{player.weight}</p>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-gray-500 font-medium text-sm">Team</p>
        <p className="text-gray-900 font-semibold">{player.team}</p>
      </div>
    </CardContent>
  </Card>
);

const PlayersInfoPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/player-info`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('No player data available');
          } else if (response.status === 500) {
            throw new Error('Server error: Failed to load player information');
          } else {
            throw new Error(`Failed to fetch players (${response.status})`);
          }
        }

        const data = await response.json();
        
        // Validate that we received an array
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }

        setPlayers(data);
      } catch (err) {
        let errorMessage = 'An unexpected error occurred';
        
        if (err instanceof Error) {
          if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:8080';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    
    // Re-fetch data without page reload
    const fetchPlayers = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/player-info`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch players (${response.status})`);
        }
        
        const data = await response.json();
        setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load players');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">NBA Players Info</h1>
        </div>
        <p className="text-gray-600">
          Browse information about NBA players including their physical stats and team affiliations.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading player information...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <PlayerCardSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error loading players:</strong> {error}
            <button
              onClick={handleRetry}
              className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State with Players Data */}
      {!loading && !error && players.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Found {players.length} player{players.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && players.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
          <p className="text-gray-600">
            There are currently no players in the database.
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayersInfoPage;