"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  ArrowLeft,
  Users
} from "lucide-react";

// Types
interface Player {
  name: string;
  position: string;
  team: string;
}

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

// Constants
const NBA_POSITIONS = [
  'Point Guard',
  'Shooting Guard', 
  'Small Forward',
  'Power Forward',
  'Center'
] as const;

const COMMON_NBA_TEAMS = [
  'Los Angeles Lakers',
  'Boston Celtics',
  'Golden State Warriors',
  'Chicago Bulls',
  'Miami Heat',
  'Brooklyn Nets',
  'Phoenix Suns',
  'Milwaukee Bucks'
] as const;

const AddPlayersPage = () => {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<Player>({
    name: "",
    position: "",
    team: "",
  });
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized validation
  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => value.trim().length > 0);
  }, [formData]);

  // Optimized form field updates
  const updateFormField = useCallback((field: keyof Player, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error message when user starts typing
    if (statusMessage?.type === 'error') {
      setStatusMessage(null);
    }
  }, [statusMessage?.type]);

  // Enhanced form validation
  const validateFormData = useCallback((): string | null => {
    const { name, position, team } = formData;
    
    if (!name.trim()) return 'Player name is required';
    if (name.trim().length < 2) return 'Player name must be at least 2 characters';
    if (!position.trim()) return 'Player position is required';
    if (!team.trim()) return 'Team name is required';
    if (team.trim().length < 2) return 'Team name must be at least 2 characters';
    
    return null;
  }, [formData]);

  // Enhanced API call with better error handling
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationError = validateFormData();
    if (validationError) {
      setStatusMessage({ type: 'error', text: validationError });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`${apiUrl}/api/player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        if (response.status === 404) {
          setStatusMessage({ 
            type: 'error', 
            text: `API endpoint not found. Please ensure the backend server is running.`
          });
        } else if (response.status === 400) {
          setStatusMessage({ 
            type: 'error', 
            text: `Invalid player data: ${errorText}`
          });
        } else if (response.status >= 500) {
          setStatusMessage({ 
            type: 'error', 
            text: `Server error (${response.status}). Please try again later.`
          });
        } else {
          setStatusMessage({ 
            type: 'error', 
            text: `Failed to create player (Error ${response.status}). Please try again.`
          });
        }
      } else {
        const result = await response.json().catch(() => null);
        
        setStatusMessage({ 
          type: 'success', 
          text: `${formData.name} has been successfully added to the ${formData.team} roster!`
        });
        
        // Reset form after successful creation
        setFormData({ name: "", position: "", team: "" });
        
        // Auto redirect after success
        const redirectTimer = setTimeout(() => {
          router.push('/');
        }, 2500);
        
        // Cleanup timer if component unmounts
        return () => clearTimeout(redirectTimer);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatusMessage({ 
          type: 'error', 
          text: "Request timed out. Please check your connection and try again."
        });
      } else {
        console.error('Network error:', error);
        setStatusMessage({ 
          type: 'error', 
          text: "Network error: Unable to connect to the server. Please check your connection."
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateFormData, router]);

  // Navigation handlers
  const handleBackToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleViewPlayers = useCallback(() => {
    router.push('/players-info');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 rounded-full p-3 mr-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Add NBA Players</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Expand your NBA roster by adding new talented players to the league database.
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-3">
              <UserPlus className="h-6 w-6 text-blue-600 mr-2" />
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Player Registration
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 text-base">
              Enter the player's information below to add them to the NBA database
            </CardDescription>
            <Separator className="mt-4" />
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Player Name Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="name" 
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  <span className="mr-1" aria-hidden="true">👤</span>
                  Player Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., LeBron James, Stephen Curry"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  required
                  aria-describedby="name-hint"
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                  disabled={isLoading}
                  autoComplete="name"
                />
                <div id="name-hint" className="sr-only">
                  Enter the player's full name as it should appear in the roster
                </div>
              </div>

              {/* Position Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="position" 
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  <span className="mr-1" aria-hidden="true">🏀</span>
                  Playing Position *
                </Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  placeholder="e.g., Point Guard, Shooting Guard, Center"
                  value={formData.position}
                  onChange={(e) => updateFormField('position', e.target.value)}
                  required
                  aria-describedby="position-hint"
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                  disabled={isLoading}
                  autoComplete="organization-title"
                  list="positions-list"
                />
                <datalist id="positions-list">
                  {NBA_POSITIONS.map((position) => (
                    <option key={position} value={position} />
                  ))}
                </datalist>
                <div id="position-hint" className="sr-only">
                  Select or enter the player's primary playing position
                </div>
              </div>

              {/* Team Field */}
              <div className="space-y-2">
                <Label 
                  htmlFor="team" 
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  <span className="mr-1" aria-hidden="true">🏆</span>
                  NBA Team *
                </Label>
                <Input
                  id="team"
                  name="team"
                  type="text"
                  placeholder="e.g., Los Angeles Lakers, Boston Celtics"
                  value={formData.team}
                  onChange={(e) => updateFormField('team', e.target.value)}
                  required
                  aria-describedby="team-hint"
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-colors"
                  disabled={isLoading}
                  autoComplete="organization"
                  list="teams-list"
                />
                <datalist id="teams-list">
                  {COMMON_NBA_TEAMS.map((team) => (
                    <option key={team} value={team} />
                  ))}
                </datalist>
                <div id="team-hint" className="sr-only">
                  Enter the NBA team name the player will join
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <Alert 
                  className={`${
                    statusMessage.type === 'success' 
                      ? 'border-green-200 bg-green-50/80' 
                      : 'border-red-200 bg-red-50/80'
                  } backdrop-blur-sm transition-all duration-200`}
                  role="alert"
                  aria-live="polite"
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                  )}
                  <AlertDescription className={`font-medium ${
                    statusMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {statusMessage.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-blue-300"
                size="lg"
                aria-describedby="submit-hint"
              >
                {isLoading && (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
                )}
                {isLoading ? 'Adding Player to Roster...' : 'Add Player to NBA Roster'}
              </Button>
              <div id="submit-hint" className="sr-only">
                Click to submit the player registration form
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="bg-gray-50/50 rounded-b-lg border-t flex flex-col space-y-4 pt-6">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>All fields marked with * are required</span>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleBackToHome}
                disabled={isLoading}
                className="flex-1 border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300"
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleViewPlayers}
                disabled={isLoading}
                className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-300"
                type="button"
              >
                <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                View All Players
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Players will be immediately available in the NBA database after successful registration
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddPlayersPage;
