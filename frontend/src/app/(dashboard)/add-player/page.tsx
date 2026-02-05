"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";

const AddPlayerPage = () => {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [playerTeam, setPlayerTeam] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage("");
    
    try {
      // Use backend API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playerName,
          position: playerPosition,
          team: playerTeam,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setStatusMessage(`Error ${response.status}: API endpoint not found. The /api/player route does not exist.`);
        } else {
          setStatusMessage(`Error ${response.status}: Failed to create player`);
        }
      } else {
        console.log("Player created successfully");
        // Reset form after successful creation
        setPlayerName("");
        setPlayerPosition("");
        setPlayerTeam("");
        setStatusMessage("Player created successfully!");
      }
    } catch (error) {
      setStatusMessage("Network error: Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New NBA Player</CardTitle>
          <CardDescription>
            Create a new player profile for the NBA roster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  placeholder="Enter player's full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  id="position"
                  value={playerPosition}
                  onChange={(e) => setPlayerPosition(e.target.value)}
                  required
                  placeholder="e.g., Point Guard, Center"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="team" className="block text-sm font-medium mb-2">
                  Team *
                </label>
                <input
                  type="text"
                  id="team"
                  value={playerTeam}
                  onChange={(e) => setPlayerTeam(e.target.value)}
                  required
                  placeholder="e.g., Los Angeles Lakers"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {statusMessage && (
                <div className={`p-3 rounded-md ${statusMessage.includes('successfully') 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'}`}>
                  {statusMessage}
                </div>
              )}
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-md font-medium ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors duration-200`}>
                {isLoading ? 'Adding Player...' : 'Add Player'}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-600 text-center">
            All fields marked with * are required
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Back to Dashboard
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddPlayerPage;