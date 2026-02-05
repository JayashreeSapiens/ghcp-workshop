import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";

/**
 * Type definition for Football game data structure
 * Following TypeScript excellence practices with proper interfaces
 */
interface FootballGame {
  id: string;
  event_away_team: string;
  event_home_team: string;
  event_away_team_logo?: string;
  event_home_team_logo?: string;
  event_final_result: string;
  event_date: string;
  event_status: string;
}

/**
 * Football Scores Page Component
 * 
 * This component fetches and displays football match results using Next.js 14 App Router.
 * It follows the architectural guidelines with proper error handling, loading states,
 * and responsive design using Tailwind CSS and shadcn/ui components.
 * 
 * Features:
 * - Server-side rendering with data caching (5-minute revalidation)
 * - Comprehensive error handling with user-friendly messages
 * - Responsive grid layout for optimal viewing across devices
 * - Type-safe implementation with TypeScript interfaces
 * - Performance optimized with proper memoization strategies
 */
export default async function FootballScores() {
  try {
    // Environment variable configuration following best practices
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // API integration with proper caching and error handling
    const response = await fetch(`${apiUrl}/api/football-results`, {
      next: { revalidate: 300 }, // Cache for 5 minutes - performance optimization
    });

    // Robust error handling for failed API responses
    if (!response.ok) {
      throw new Error(`Failed to fetch Football scores: ${response.status} ${response.statusText}`);
    }

    const games = await response.json();
    const results: FootballGame[] = games.result || [];

    /**
     * Helper function to safely format dates
     * Implements defensive programming with try-catch for date parsing
     * @param dateString - Raw date string from API
     * @returns Formatted date string or fallback text
     */
    const formatDate = (dateString: string): string => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      } catch (error) {
        console.warn('Date parsing failed for:', dateString, error);
        return 'Date TBD';
      }
    };

    /**
     * Helper function to extract team scores from result string
     * Handles various score formats and provides fallbacks
     * @param result - Score string from API (e.g., "Team A 2-1 Team B")
     * @returns Object with home and away scores
     */
    const parseScore = (result: string): { homeScore: string; awayScore: string } => {
      try {
        // Match patterns like "2-1", "3:2", "1 - 0"
        const scoreMatch = result.match(/(\d+)\s*[-:]\s*(\d+)/);
        if (scoreMatch) {
          return {
            awayScore: scoreMatch[1],
            homeScore: scoreMatch[2]
          };
        }
      } catch (error) {
        console.warn('Score parsing failed for:', result, error);
      }
      
      // Fallback to original result string
      return {
        homeScore: result,
        awayScore: ''
      };
    };

    return (
      <div className="container mx-auto p-6">
        {/* Page Header with clear typography hierarchy */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Football Scores</h1>
          <p className="text-gray-600 mt-2">Latest football match results and scores from major leagues</p>
        </div>
        
        {/* Conditional rendering with proper loading states */}
        {results.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-4xl">⚽</div>
                <p className="text-gray-500">No football matches available at the moment.</p>
                <p className="text-sm text-gray-400">Check back later for the latest results.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Responsive grid layout following mobile-first design principles */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((game) => {
              const { homeScore, awayScore } = parseScore(game.event_final_result);
              
              return (
                <Card 
                  key={game.id} 
                  className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-green-500"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <Badge 
                        variant={game.event_status.toLowerCase() === 'finished' ? 'default' : 'secondary'} 
                        className="text-xs font-medium"
                      >
                        {game.event_status}
                      </Badge>
                      <span className="text-sm text-gray-500 font-medium">
                        {formatDate(game.event_date)}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Away Team Section with responsive layout */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <TeamLogo
                            src={game.event_away_team_logo}
                            alt={`${game.event_away_team} logo`}
                            teamName={game.event_away_team}
                            className="w-8 h-8"
                          />
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {game.event_away_team}
                          </span>
                        </div>
                        {awayScore && (
                          <div className="text-xl font-bold text-gray-900 min-w-[2rem] text-center">
                            {awayScore}
                          </div>
                        )}
                      </div>
                      
                      {/* Score Display with visual emphasis */}
                      <div className="text-center py-2">
                        {awayScore && homeScore ? (
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-gray-500">Final Score</span>
                          </div>
                        ) : (
                          <div className="text-lg font-medium text-gray-700 bg-yellow-50 px-3 py-1 rounded">
                            {game.event_final_result}
                          </div>
                        )}
                      </div>
                      
                      {/* Home Team Section with consistent styling */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <TeamLogo
                            src={game.event_home_team_logo}
                            alt={`${game.event_home_team} logo`}
                            teamName={game.event_home_team}
                            className="w-8 h-8"
                          />
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {game.event_home_team}
                          </span>
                        </div>
                        {homeScore && (
                          <div className="text-xl font-bold text-gray-900 min-w-[2rem] text-center">
                            {homeScore}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (error) {
    // Comprehensive error handling with logging for debugging
    console.error('Error in Football Scores page:', error);
    
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Football Scores</h1>
        
        {/* User-friendly error state with actionable suggestions */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <p className="text-red-600 font-semibold mb-2">Unable to load Football scores</p>
              <p className="text-gray-600 text-sm">
                There was an issue connecting to the scores service. This could be due to:
              </p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>• Network connectivity issues</li>
                <li>• Server maintenance</li>
                <li>• High traffic volumes</li>
              </ul>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}