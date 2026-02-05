import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import PlayersInfoPage from '../src/app/(dashboard)/players-info/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample player data for testing
const mockPlayers = [
  {
    id: 1,
    name: 'LeBron James',
    position: 'Small Forward',
    team: 'Los Angeles Lakers',
    stats: {
      points: 25.3,
      rebounds: 7.4,
      assists: 7.5,
    },
  },
  {
    id: 2,
    name: 'Stephen Curry',
    position: 'Point Guard',
    team: 'Golden State Warriors',
    stats: {
      points: 29.5,
      rebounds: 6.1,
      assists: 6.3,
    },
  },
];

describe('PlayersInfoPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  describe('happy path scenarios', () => {
    test('should render players list successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Check page title
      expect(screen.getByText(/NBA Players Database/i)).toBeInTheDocument();
      
      // Wait for players to load
      expect(await screen.findByText('LeBron James')).toBeInTheDocument();
      expect(screen.getByText('Stephen Curry')).toBeInTheDocument();
      
      // Check player details are displayed
      expect(screen.getByText('Small Forward')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
      expect(screen.getByText('Point Guard')).toBeInTheDocument();
      expect(screen.getByText('Golden State Warriors')).toBeInTheDocument();
    });

    test('should display player statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Wait for players to load and check stats
      await waitFor(() => {
        expect(screen.getByText('25.3')).toBeInTheDocument(); // LeBron's points
        expect(screen.getByText('7.4')).toBeInTheDocument();  // LeBron's rebounds
        expect(screen.getByText('7.5')).toBeInTheDocument();  // LeBron's assists
      });
    });

    test('should make API call with correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/player-info');
    });
  });

  describe('loading states', () => {
    test('should show loading skeletons while fetching data', () => {
      // Mock a pending promise
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<PlayersInfoPage />);
      
      // Check for loading skeletons
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });
    });

    test('should replace skeletons with actual content after loading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Initially should have skeletons
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);
      
      // After loading, should show player names
      expect(await screen.findByText('LeBron James')).toBeInTheDocument();
      
      // Skeletons should be gone
      expect(screen.queryAllByTestId(/skeleton/i)).toHaveLength(0);
    });
  });

  describe('empty states', () => {
    test('should handle empty players list gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(<PlayersInfoPage />);
      
      // Should show empty state message
      expect(await screen.findByText(/No players found/i)).toBeInTheDocument();
      expect(screen.getByText(/database is empty/i)).toBeInTheDocument();
    });

    test('should show add players suggestion in empty state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(<PlayersInfoPage />);
      
      // Should show link to add players
      await waitFor(() => {
        expect(screen.getByText(/add some players/i)).toBeInTheDocument();
      });
    });
  });

  describe('error scenarios', () => {
    test('should display error message on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<PlayersInfoPage />);
      
      // Should show error message
      expect(await screen.findByText(/Failed to load players/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    test('should handle 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      render(<PlayersInfoPage />);
      
      expect(await screen.findByText(/API endpoint not found/i)).toBeInTheDocument();
    });

    test('should handle server error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<PlayersInfoPage />);
      
      expect(await screen.findByText(/Server error/i)).toBeInTheDocument();
    });

    test('should provide retry option on error', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlayers),
        });

      render(<PlayersInfoPage />);
      
      // Wait for error message
      expect(await screen.findByText(/Failed to load players/i)).toBeInTheDocument();
      
      // Find and click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      // Should successfully load players on retry
      expect(await screen.findByText('LeBron James')).toBeInTheDocument();
    });
  });

  describe('NBA-specific functionality', () => {
    test('should display player positions correctly', async () => {
      const playersWithPositions = [
        { ...mockPlayers[0], position: 'Point Guard' },
        { ...mockPlayers[1], position: 'Shooting Guard' },
        { id: 3, name: 'Shaquille ONeal', position: 'Center', team: 'Lakers', stats: {} },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(playersWithPositions),
      });

      render(<PlayersInfoPage />);
      
      // Check all positions are displayed
      expect(await screen.findByText('Point Guard')).toBeInTheDocument();
      expect(screen.getByText('Shooting Guard')).toBeInTheDocument();
      expect(screen.getByText('Center')).toBeInTheDocument();
    });

    test('should display team information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Check team names are displayed
      expect(await screen.findByText('Los Angeles Lakers')).toBeInTheDocument();
      expect(screen.getByText('Golden State Warriors')).toBeInTheDocument();
    });

    test('should handle player statistics display', async () => {
      const playerWithDetailedStats = [{
        id: 1,
        name: 'Michael Jordan',
        position: 'Shooting Guard',
        team: 'Chicago Bulls',
        stats: {
          points: 30.1,
          rebounds: 6.2,
          assists: 5.3,
          steals: 2.3,
          blocks: 0.8,
          fieldGoalPercentage: 0.497,
        },
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(playerWithDetailedStats),
      });

      render(<PlayersInfoPage />);
      
      // Check that stats are displayed with proper formatting
      expect(await screen.findByText('30.1')).toBeInTheDocument(); // Points
      expect(screen.getByText('6.2')).toBeInTheDocument();  // Rebounds
      expect(screen.getByText('5.3')).toBeInTheDocument();  // Assists
    });

    test('should handle missing player stats gracefully', async () => {
      const playerWithoutStats = [{
        id: 1,
        name: 'Rookie Player',
        position: 'Forward',
        team: 'Test Team',
        stats: null,
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(playerWithoutStats),
      });

      render(<PlayersInfoPage />);
      
      // Player name should still be displayed
      expect(await screen.findByText('Rookie Player')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
      
      // Should show placeholder for missing stats
      expect(screen.getByText(/No stats available/i) || screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    test('should navigate to add player page', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Wait for content to load
      await screen.findByText('LeBron James');
      
      // Find and click add player button
      const addButton = screen.getByRole('button', { name: /add player/i });
      await user.click(addButton);
      
      expect(mockPush).toHaveBeenCalledWith('/add-player-info');
    });

    test('should have working refresh functionality', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlayers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockPlayers, {
            id: 3,
            name: 'Kobe Bryant',
            position: 'Shooting Guard',
            team: 'Lakers',
            stats: {},
          }]),
        });

      render(<PlayersInfoPage />);
      
      // Wait for initial load
      expect(await screen.findByText('LeBron James')).toBeInTheDocument();
      
      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      // Should make another API call
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    test('should be accessible to screen readers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      // Check main heading is present
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Wait for content and check list structure
      await screen.findByText('LeBron James');
      
      // Check that player cards have proper structure
      const playerCards = screen.getAllByRole('article');
      expect(playerCards.length).toBe(mockPlayers.length);
    });

    test('should have proper ARIA labels for buttons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      await screen.findByText('LeBron James');
      
      // Check button accessibility
      const addButton = screen.getByRole('button', { name: /add player/i });
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      expect(addButton).toHaveAccessibleName();
      expect(refreshButton).toHaveAccessibleName();
    });

    test('should support keyboard navigation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      render(<PlayersInfoPage />);
      
      await screen.findByText('LeBron James');
      
      // Check that interactive elements are keyboard accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    test('should announce loading states to screen readers', () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<PlayersInfoPage />);
      
      // Check for loading announcement
      expect(screen.getByText(/loading players/i)).toBeInTheDocument();
      
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });
    });
  });

  describe('responsive behavior', () => {
    test('should render appropriately for different screen sizes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlayers),
      });

      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<PlayersInfoPage />);
      
      await screen.findByText('LeBron James');
      
      // Check that grid layout classes are applied
      const container = screen.getByTestId('players-grid') || document.querySelector('[class*=\"grid\"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe('performance considerations', () => {
    test('should handle large datasets efficiently', async () => {
      // Create a large dataset
      const largeMockPlayers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: 'Guard',
        team: `Team ${i + 1}`,
        stats: {
          points: Math.random() * 30,
          rebounds: Math.random() * 10,
          assists: Math.random() * 15,
        },
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeMockPlayers),
      });

      const startTime = performance.now();
      render(<PlayersInfoPage />);
      
      // Wait for content to render
      await screen.findByText('Player 1');
      const endTime = performance.now();
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});