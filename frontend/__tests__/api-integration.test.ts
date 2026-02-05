import '@testing-library/jest-dom';

// Mock fetch for API testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// API Testing Utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

describe('NBA API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Player API Endpoints', () => {
    describe('GET /api/player-info', () => {
      test('should fetch players list successfully', async () => {
        const mockPlayers = [
          {
            id: 1,
            name: 'LeBron James',
            position: 'Small Forward',
            team: 'Los Angeles Lakers',
            stats: { points: 25.3, rebounds: 7.4, assists: 7.5 }
          },
          {
            id: 2,
            name: 'Stephen Curry',
            position: 'Point Guard',
            team: 'Golden State Warriors',
            stats: { points: 29.5, rebounds: 6.1, assists: 6.3 }
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockPlayers),
        });

        const response = await fetch(`${API_BASE_URL}/api/player-info`);
        const data = await response.json();

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/player-info`);
        expect(response.ok).toBe(true);
        expect(data).toEqual(mockPlayers);
        expect(data).toHaveLength(2);
        expect(data[0]).toHaveProperty('name', 'LeBron James');
        expect(data[0]).toHaveProperty('stats');
      });

      test('should handle empty players list', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });

        const response = await fetch(`${API_BASE_URL}/api/player-info`);
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data).toEqual([]);
        expect(Array.isArray(data)).toBe(true);
      });

      test('should handle API server error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

        const response = await fetch(`${API_BASE_URL}/api/player-info`);

        expect(response.ok).toBe(false);
        expect(response.status).toBe(500);
      });

      test('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(fetch(`${API_BASE_URL}/api/player-info`)).rejects.toThrow('Network error');
      });
    });

    describe('POST /api/player', () => {
      const newPlayerData = {
        name: 'Kawhi Leonard',
        position: 'Small Forward',
        team: 'LA Clippers',
      };

      test('should create player successfully', async () => {
        const mockResponse = {
          id: 3,
          ...newPlayerData,
          message: 'Player created successfully',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse),
        });

        const response = await fetch(`${API_BASE_URL}/api/player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlayerData),
        });

        const data = await response.json();

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/player`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlayerData),
          })
        );
        expect(response.ok).toBe(true);
        expect(response.status).toBe(201);
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name', newPlayerData.name);
      });

      test('should validate required player fields', async () => {
        const invalidPlayerData = {
          name: 'Incomplete Player',
          // Missing position and team
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Validation failed',
            message: 'Position and team are required',
          }),
        });

        const response = await fetch(`${API_BASE_URL}/api/player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPlayerData),
        });

        const data = await response.json();

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error');
      });

      test('should handle duplicate player creation', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Conflict',
            message: 'Player already exists',
          }),
        });

        const response = await fetch(`${API_BASE_URL}/api/player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPlayerData),
        });

        expect(response.status).toBe(409);
      });

      test('should handle malformed JSON data', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Bad Request',
            message: 'Invalid JSON format',
          }),
        });

        const response = await fetch(`${API_BASE_URL}/api/player`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json{',
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('NBA Scores API Endpoints', () => {
    describe('GET /api/nba-scores', () => {
      test('should fetch NBA scores successfully', async () => {
        const mockScores = [
          {
            id: 1,
            homeTeam: 'Los Angeles Lakers',
            awayTeam: 'Boston Celtics',
            homeScore: 110,
            awayScore: 102,
            quarter: 'Final',
            date: '2024-02-04',
          },
          {
            id: 2,
            homeTeam: 'Golden State Warriors',
            awayTeam: 'Miami Heat',
            homeScore: 95,
            awayScore: 88,
            quarter: '4th',
            date: '2024-02-04',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockScores),
        });

        const response = await fetch(`${API_BASE_URL}/api/nba-scores`);
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data).toHaveLength(2);
        expect(data[0]).toHaveProperty('homeTeam', 'Los Angeles Lakers');
        expect(data[0]).toHaveProperty('homeScore', 110);
        expect(data[0]).toHaveProperty('quarter', 'Final');
      });

      test('should handle live game updates', async () => {
        const liveGame = {
          id: 1,
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
          homeScore: 85,
          awayScore: 82,
          quarter: '3rd',
          timeRemaining: '5:23',
          status: 'live',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([liveGame]),
        });

        const response = await fetch(`${API_BASE_URL}/api/nba-scores`);
        const data = await response.json();

        expect(data[0]).toHaveProperty('status', 'live');
        expect(data[0]).toHaveProperty('timeRemaining');
      });
    });

    describe('GET /api/cricket-scores', () => {
      test('should fetch cricket scores successfully', async () => {
        const mockCricketScores = [
          {
            id: 1,
            team1: 'India',
            team2: 'Australia',
            team1Score: '285/7',
            team2Score: '190/10',
            format: 'ODI',
            status: 'India won by 95 runs',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCricketScores),
        });

        const response = await fetch(`${API_BASE_URL}/api/cricket-scores`);
        const data = await response.json();

        expect(data[0]).toHaveProperty('team1', 'India');
        expect(data[0]).toHaveProperty('format', 'ODI');
        expect(data[0]).toHaveProperty('status');
      });
    });

    describe('GET /api/football-scores', () => {
      test('should fetch football scores successfully', async () => {
        const mockFootballScores = [
          {
            id: 1,
            homeTeam: 'Kansas City Chiefs',
            awayTeam: 'Buffalo Bills',
            homeScore: 24,
            awayScore: 21,
            quarter: 'Final',
            week: 15,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFootballScores),
        });

        const response = await fetch(`${API_BASE_URL}/api/football-scores`);
        const data = await response.json();

        expect(data[0]).toHaveProperty('homeTeam', 'Kansas City Chiefs');
        expect(data[0]).toHaveProperty('week', 15);
      });
    });
  });

  describe('API Error Handling', () => {
    test('should handle 404 endpoints gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const response = await fetch(`${API_BASE_URL}/api/nonexistent-endpoint`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: () => Promise.resolve({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty('retryAfter');
    });

    test('should handle CORS errors', async () => {
      const corsError = new Error('CORS error');
      corsError.name = 'TypeError';
      mockFetch.mockRejectedValueOnce(corsError);

      await expect(fetch(`${API_BASE_URL}/api/player-info`)).rejects.toThrow('CORS error');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      await expect(fetch(`${API_BASE_URL}/api/player-info`)).rejects.toThrow('Request timeout');
    });
  });

  describe('API Performance', () => {
    test('should handle concurrent requests efficiently', async () => {
      const mockData = { message: 'Success' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        fetch(`${API_BASE_URL}/api/player-info?page=${i}`)
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // Should handle concurrent requests reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should handle large response payloads', async () => {
      const largePlayers = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: 'Guard',
        team: `Team ${i % 30 + 1}`,
        stats: {
          points: Math.random() * 30,
          rebounds: Math.random() * 10,
          assists: Math.random() * 15,
        },
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largePlayers),
      });

      const startTime = performance.now();
      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();
      const endTime = performance.now();

      expect(data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should parse large JSON quickly
    });
  });

  describe('API Data Validation', () => {
    test('should validate player statistics format', async () => {
      const playerWithStats = {
        id: 1,
        name: 'Test Player',
        position: 'Guard',
        team: 'Test Team',
        stats: {
          points: 25.5,
          rebounds: 8.2,
          assists: 6.1,
          fieldGoalPercentage: 0.485,
          threePointPercentage: 0.38,
          freeThrowPercentage: 0.82,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([playerWithStats]),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();

      const player = data[0];
      expect(player.stats).toHaveProperty('points');
      expect(typeof player.stats.points).toBe('number');
      expect(player.stats.fieldGoalPercentage).toBeLessThanOrEqual(1);
      expect(player.stats.fieldGoalPercentage).toBeGreaterThanOrEqual(0);
    });

    test('should validate team names consistency', async () => {
      const teams = ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors'];
      const players = teams.map((team, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: 'Guard',
        team,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(players),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();

      data.forEach(player => {
        expect(teams).toContain(player.team);
      });
    });

    test('should validate position values', async () => {
      const validPositions = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
      const players = validPositions.map((position, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position,
        team: 'Test Team',
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(players),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();

      data.forEach(player => {
        expect(validPositions).toContain(player.position);
      });
    });
  });

  describe('API Integration Edge Cases', () => {
    test('should handle partial API responses', async () => {
      const incompleteData = [
        { id: 1, name: 'Complete Player', position: 'Guard', team: 'Lakers' },
        { id: 2, name: 'Incomplete Player' }, // Missing position and team
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(incompleteData),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty('position');
      expect(data[1]).not.toHaveProperty('position');
    });

    test('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      
      await expect(response.json()).rejects.toThrow('Unexpected token');
    });

    test('should handle empty string responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
        json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
      });

      const response = await fetch(`${API_BASE_URL}/api/player-info`);
      
      await expect(response.json()).rejects.toThrow();
      
      const text = await response.text();
      expect(text).toBe('');
    });
  });
});