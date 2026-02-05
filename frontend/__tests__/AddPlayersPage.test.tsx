import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AddPlayersPage from '../src/app/(dashboard)/add-player-info/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AddPlayersPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  describe('happy path scenarios', () => {
    test('should render the form with all required fields', () => {
      render(<AddPlayersPage />);
      
      // Check page title and description
      expect(screen.getByText('Add NBA Players')).toBeInTheDocument();
      expect(screen.getByText(/Expand your NBA roster/)).toBeInTheDocument();
      
      // Check form fields are present
      expect(screen.getByLabelText(/Player Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Playing Position/)).toBeInTheDocument();
      expect(screen.getByLabelText(/NBA Team/)).toBeInTheDocument();
      
      // Check submit button
      expect(screen.getByRole('button', { name: /Add Player to NBA Roster/ })).toBeInTheDocument();
    });

    test('should successfully submit form with valid data', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Player created successfully' }),
      });

      render(<AddPlayersPage />);
      
      // Fill out the form
      await user.type(screen.getByLabelText(/Player Full Name/), 'LeBron James');
      await user.type(screen.getByLabelText(/Playing Position/), 'Small Forward');
      await user.type(screen.getByLabelText(/NBA Team/), 'Los Angeles Lakers');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/player',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'LeBron James',
              position: 'Small Forward',
              team: 'Los Angeles Lakers',
            }),
          })
        );
      });

      // Check success message
      expect(await screen.findByText(/LeBron James has been successfully added/)).toBeInTheDocument();
    });

    test('should provide position and team suggestions', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      const positionInput = screen.getByLabelText(/Playing Position/);
      const teamInput = screen.getByLabelText(/NBA Team/);
      
      // Check datalist attributes exist
      expect(positionInput).toHaveAttribute('list', 'positions-list');
      expect(teamInput).toHaveAttribute('list', 'teams-list');
      
      // Check that datalist elements exist in the document
      expect(document.querySelector('#positions-list')).toBeInTheDocument();
      expect(document.querySelector('#teams-list')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    test('should disable submit button when form is empty', () => {
      render(<AddPlayersPage />);
      
      const submitButton = screen.getByRole('button', { name: /Add Player to NBA Roster/ });
      expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when all fields are filled', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      const submitButton = screen.getByRole('button', { name: /Add Player to NBA Roster/ });
      
      // Initially disabled
      expect(submitButton).toBeDisabled();
      
      // Fill all fields
      await user.type(screen.getByLabelText(/Player Full Name/), 'Stephen Curry');
      await user.type(screen.getByLabelText(/Playing Position/), 'Point Guard');
      await user.type(screen.getByLabelText(/NBA Team/), 'Golden State Warriors');
      
      // Should be enabled
      expect(submitButton).not.toBeDisabled();
    });

    test('should show validation error for incomplete form', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      // Try to submit with empty form
      const submitButton = screen.getByRole('button', { name: /Add Player to NBA Roster/ });
      
      // Fill only name field
      await user.type(screen.getByLabelText(/Player Full Name/), 'S');
      
      // Button should still be disabled due to incomplete form
      expect(submitButton).toBeDisabled();
    });

    test('should validate minimum character requirements', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      // Fill with too short values
      await user.type(screen.getByLabelText(/Player Full Name/), 'X');
      await user.type(screen.getByLabelText(/Playing Position/), 'Guard');
      await user.type(screen.getByLabelText(/NBA Team/), 'Y');
      
      // Force submit by clicking (should trigger validation)
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Should show validation error
      expect(await screen.findByText(/Player name must be at least 2 characters/)).toBeInTheDocument();
    });
  });

  describe('error scenarios', () => {
    test('should display error message on API failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddPlayersPage />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Should show error message
      expect(await screen.findByText(/Network error: Unable to connect to the server/)).toBeInTheDocument();
    });

    test('should handle 404 API response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found'),
      });

      render(<AddPlayersPage />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Should show 404 specific error
      expect(await screen.findByText(/API endpoint not found/)).toBeInTheDocument();
    });

    test('should handle server error responses', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      render(<AddPlayersPage />);
      
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      expect(await screen.findByText(/Server error \(500\)/)).toBeInTheDocument();
    });

    test('should handle request timeout', async () => {
      const user = userEvent.setup();
      const abortError = new Error('Request timed out');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      render(<AddPlayersPage />);
      
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      expect(await screen.findByText(/Request timed out/)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    test('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<AddPlayersPage />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Should show loading state
      expect(screen.getByText(/Adding Player to Roster.../)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Adding Player to Roster.../ })).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });
    });

    test('should disable navigation buttons during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<AddPlayersPage />);
      
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Navigation buttons should be disabled
      expect(screen.getByRole('button', { name: /Back to Home/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /View All Players/ })).toBeDisabled();
      
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });
    });
  });

  describe('navigation', () => {
    test('should navigate to home page when Back to Home is clicked', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      await user.click(screen.getByRole('button', { name: /Back to Home/ }));
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    test('should navigate to players info page when View All Players is clicked', async () => {
      const user = userEvent.setup();
      render(<AddPlayersPage />);
      
      await user.click(screen.getByRole('button', { name: /View All Players/ }));
      
      expect(mockPush).toHaveBeenCalledWith('/players-info');
    });

    test('should auto-redirect after successful form submission', async () => {
      const user = userEvent.setup();
      jest.useFakeTimers();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<AddPlayersPage />);
      
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Test Player has been successfully added/)).toBeInTheDocument();
      });
      
      // Fast-forward time to trigger redirect
      jest.advanceTimersByTime(2500);
      
      expect(mockPush).toHaveBeenCalledWith('/');
      
      jest.useRealTimers();
    });
  });

  describe('accessibility', () => {
    test('should be accessible to screen readers', () => {
      render(<AddPlayersPage />);
      
      // Check form elements have proper labels
      expect(screen.getByLabelText(/Player Full Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Playing Position/)).toBeInTheDocument();
      expect(screen.getByLabelText(/NBA Team/)).toBeInTheDocument();
      
      // Check buttons have accessible names
      expect(screen.getByRole('button', { name: /Add Player to NBA Roster/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Home/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View All Players/ })).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<AddPlayersPage />);
      
      // Check required fields are marked
      const nameInput = screen.getByLabelText(/Player Full Name/);
      const positionInput = screen.getByLabelText(/Playing Position/);
      const teamInput = screen.getByLabelText(/NBA Team/);
      
      expect(nameInput).toHaveAttribute('required');
      expect(positionInput).toHaveAttribute('required');
      expect(teamInput).toHaveAttribute('required');
      
      // Check aria-describedby attributes exist
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-hint');
      expect(positionInput).toHaveAttribute('aria-describedby', 'position-hint');
      expect(teamInput).toHaveAttribute('aria-describedby', 'team-hint');
    });

    test('should announce status messages to screen readers', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<AddPlayersPage />);
      
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test Player');
      await user.type(screen.getByLabelText(/Playing Position/), 'Center');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveTextContent(/Test Player has been successfully added/);
    });

    test('should support keyboard navigation', () => {
      render(<AddPlayersPage />);
      
      const nameInput = screen.getByLabelText(/Player Full Name/);
      const positionInput = screen.getByLabelText(/Playing Position/);
      const teamInput = screen.getByLabelText(/NBA Team/);
      const submitButton = screen.getByRole('button', { name: /Add Player to NBA Roster/ });
      
      // Check tab order
      expect(nameInput).toHaveAttribute('tabIndex');
      expect(positionInput).toHaveAttribute('tabIndex');
      expect(teamInput).toHaveAttribute('tabIndex');
      
      // Check buttons are focusable
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });

  describe('form state management', () => {
    test('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddPlayersPage />);
      
      // Trigger an error first
      await user.type(screen.getByLabelText(/Player Full Name/), 'Test');
      await user.type(screen.getByLabelText(/Playing Position/), 'Guard');
      await user.type(screen.getByLabelText(/NBA Team/), 'Test Team');
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Wait for error message
      expect(await screen.findByText(/Network error/)).toBeInTheDocument();
      
      // Start typing in name field
      await user.type(screen.getByLabelText(/Player Full Name/), 'ing');
      
      // Error message should be cleared
      expect(screen.queryByText(/Network error/)).not.toBeInTheDocument();
    });

    test('should reset form fields after successful submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<AddPlayersPage />);
      
      const nameInput = screen.getByLabelText(/Player Full Name/) as HTMLInputElement;
      const positionInput = screen.getByLabelText(/Playing Position/) as HTMLInputElement;
      const teamInput = screen.getByLabelText(/NBA Team/) as HTMLInputElement;
      
      // Fill form
      await user.type(nameInput, 'Test Player');
      await user.type(positionInput, 'Center');
      await user.type(teamInput, 'Test Team');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /Add Player to NBA Roster/ }));
      
      // Wait for success and check fields are cleared
      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(positionInput.value).toBe('');
        expect(teamInput.value).toBe('');
      });
    });
  });
});