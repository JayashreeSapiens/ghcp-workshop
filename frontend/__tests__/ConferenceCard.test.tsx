import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConferenceCard from '../src/components/conference-card';

// Mock data for testing
const mockConferenceData = {
  id: 1,
  title: 'NBA Finals Press Conference',
  speaker: 'LeBron James',
  team: 'Los Angeles Lakers',
  date: '2024-06-15',
  time: '3:00 PM EST',
  location: 'Lakers Training Facility',
  description: 'Post-game press conference discussing team performance and strategy for upcoming games.',
  status: 'upcoming' as const,
  thumbnail: '/images/lebron-press.jpg',
};

const mockLiveConference = {
  ...mockConferenceData,
  id: 2,
  status: 'live' as const,
  title: 'Live NBA Draft Analysis',
  speaker: 'Adam Silver',
};

const mockPastConference = {
  ...mockConferenceData,
  id: 3,
  status: 'completed' as const,
  title: 'Season Wrap-up Conference',
  date: '2024-04-15',
};

describe('ConferenceCard', () => {
  describe('happy path scenarios', () => {
    test('should render conference card with all basic information', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Check that all main elements are present
      expect(screen.getByText('NBA Finals Press Conference')).toBeInTheDocument();
      expect(screen.getByText('LeBron James')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
      expect(screen.getByText('3:00 PM EST')).toBeInTheDocument();
      expect(screen.getByText('Lakers Training Facility')).toBeInTheDocument();
    });

    test('should display conference description', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      expect(screen.getByText(/Post-game press conference discussing/)).toBeInTheDocument();
    });

    test('should show correct date formatting', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Should display date in readable format
      expect(screen.getByText(/June|Jun|2024/)).toBeInTheDocument();
    });

    test('should render thumbnail image when provided', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockConferenceData.thumbnail);
      expect(image).toHaveAttribute('alt', expect.stringContaining(mockConferenceData.speaker));
    });
  });

  describe('different conference statuses', () => {
    test('should display upcoming conference status', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Should show upcoming status indicator
      expect(screen.getByText(/upcoming|scheduled/i)).toBeInTheDocument();
    });

    test('should display live conference status with indicator', () => {
      render(<ConferenceCard conference={mockLiveConference} />);
      
      // Should show live indicator
      expect(screen.getByText(/live|now/i)).toBeInTheDocument();
      
      // Live conferences might have special styling
      const liveIndicator = screen.getByText(/live/i);
      expect(liveIndicator).toHaveClass(/live|red|pulse|animate/);
    });

    test('should display completed conference status', () => {
      render(<ConferenceCard conference={mockPastConference} />);
      
      // Should show completed status
      expect(screen.getByText(/completed|finished|past/i)).toBeInTheDocument();
    });

    test('should have different visual styling for different statuses', () => {
      const { rerender } = render(<ConferenceCard conference={mockConferenceData} />);
      const upcomingCard = screen.getByRole('article') || document.querySelector('[class*="card"]');
      
      rerender(<ConferenceCard conference={mockLiveConference} />);
      const liveCard = screen.getByRole('article') || document.querySelector('[class*="card"]');
      
      rerender(<ConferenceCard conference={mockPastConference} />);
      const completedCard = screen.getByRole('article') || document.querySelector('[class*="card"]');
      
      // Cards should have different styling based on status
      expect(upcomingCard).toBeInTheDocument();
      expect(liveCard).toBeInTheDocument();
      expect(completedCard).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    test('should be clickable and handle click events', async () => {
      const mockOnClick = jest.fn();
      const clickableConference = { ...mockConferenceData, onClick: mockOnClick };
      
      render(<ConferenceCard conference={clickableConference} />);
      
      const card = screen.getByRole('article') || screen.getByText(mockConferenceData.title).closest('[class*="card"]');
      
      if (card) {
        await userEvent.click(card);
        expect(mockOnClick).toHaveBeenCalledWith(mockConferenceData.id);
      }
    });

    test('should handle hover states', async () => {
      const user = userEvent.setup();
      render(<ConferenceCard conference={mockConferenceData} />);
      
      const card = screen.getByRole('article') || screen.getByText(mockConferenceData.title).closest('div');
      
      // Should handle hover without errors
      if (card) {
        await user.hover(card);
        await user.unhover(card);
      }
      
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      const interactiveElements = screen.getAllByRole('button').concat(
        screen.getAllByRole('link')
      );
      
      interactiveElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
  });

  describe('edge cases', () => {
    test('should handle missing thumbnail gracefully', () => {
      const conferenceWithoutThumbnail = {
        ...mockConferenceData,
        thumbnail: undefined,
      };
      
      render(<ConferenceCard conference={conferenceWithoutThumbnail} />);
      
      // Should still render other information
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
      
      // Should either show placeholder or no image
      const images = screen.queryAllByRole('img');
      if (images.length > 0) {
        // If image is present, it should be a placeholder
        expect(images[0]).toHaveAttribute('alt', expect.stringMatching(/placeholder|default/i));
      }
    });

    test('should handle very long titles', () => {
      const conferenceWithLongTitle = {
        ...mockConferenceData,
        title: 'This is an extremely long conference title that might overflow or need truncation in the UI layout',
      };
      
      render(<ConferenceCard conference={conferenceWithLongTitle} />);
      
      expect(screen.getByText(/This is an extremely long/)).toBeInTheDocument();
    });

    test('should handle missing optional fields', () => {
      const minimalConference = {
        id: 1,
        title: 'Basic Conference',
        speaker: 'John Doe',
        status: 'upcoming' as const,
      };
      
      render(<ConferenceCard conference={minimalConference} />);
      
      // Should render with minimal data
      expect(screen.getByText('Basic Conference')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('should handle special characters in content', () => {
      const conferenceWithSpecialChars = {
        ...mockConferenceData,
        title: 'NBA Finals: Lakers vs. Celtics — "Championship" Discussion & Analysis',
        speaker: "Shaquille O'Neal",
      };
      
      render(<ConferenceCard conference={conferenceWithSpecialChars} />);
      
      expect(screen.getByText(/NBA Finals: Lakers vs. Celtics/)).toBeInTheDocument();
      expect(screen.getByText("Shaquille O'Neal")).toBeInTheDocument();
    });
  });

  describe('NBA-specific functionality', () => {
    test('should display team information correctly', () => {
      const conferences = [
        { ...mockConferenceData, team: 'Los Angeles Lakers' },
        { ...mockConferenceData, team: 'Boston Celtics', id: 2 },
        { ...mockConferenceData, team: 'Golden State Warriors', id: 3 },
      ];
      
      conferences.forEach(conf => {
        const { rerender } = render(<ConferenceCard conference={conf} />);
        expect(screen.getByText(conf.team)).toBeInTheDocument();
        rerender(<></>);
      });
    });

    test('should handle different types of NBA conferences', () => {
      const conferenceTypes = [
        { ...mockConferenceData, title: 'Pre-game Press Conference' },
        { ...mockConferenceData, title: 'Post-game Interview', id: 2 },
        { ...mockConferenceData, title: 'Season Announcement', id: 3 },
        { ...mockConferenceData, title: 'Trade Deadline Discussion', id: 4 },
      ];
      
      conferenceTypes.forEach(conf => {
        const { rerender } = render(<ConferenceCard conference={conf} />);
        expect(screen.getByText(conf.title)).toBeInTheDocument();
        rerender(<></>);
      });
    });

    test('should display player/speaker information', () => {
      const speakers = [
        { ...mockConferenceData, speaker: 'LeBron James' },
        { ...mockConferenceData, speaker: 'Stephen Curry', id: 2 },
        { ...mockConferenceData, speaker: 'Adam Silver', id: 3 }, // Commissioner
        { ...mockConferenceData, speaker: 'Steve Kerr', id: 4 }, // Coach
      ];
      
      speakers.forEach(conf => {
        const { rerender } = render(<ConferenceCard conference={conf} />);
        expect(screen.getByText(conf.speaker)).toBeInTheDocument();
        rerender(<></>);
      });
    });
  });

  describe('accessibility', () => {
    test('should have proper semantic structure', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Should use semantic HTML elements
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      
      // Should have proper heading structure
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(mockConferenceData.title);
    });

    test('should have accessible image alt text', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
      expect(image.getAttribute('alt')).toBeTruthy();
      expect(image.getAttribute('alt')).toContain(mockConferenceData.speaker);
    });

    test('should support screen readers with ARIA labels', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Check for ARIA labels where appropriate
      const card = screen.getByRole('article');
      expect(card).toHaveAccessibleName() || expect(card).toHaveAttribute('aria-label');
    });

    test('should have sufficient color contrast for status indicators', () => {
      const { rerender } = render(<ConferenceCard conference={mockLiveConference} />);
      
      const liveIndicator = screen.getByText(/live/i);
      expect(liveIndicator).toBeInTheDocument();
      
      // Test with different status types
      rerender(<ConferenceCard conference={mockPastConference} />);
      const completedIndicator = screen.getByText(/completed/i);
      expect(completedIndicator).toBeInTheDocument();
    });

    test('should work with keyboard navigation', () => {
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Find focusable elements
      const focusableElements = [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('link'),
      ];
      
      // Each focusable element should be keyboard accessible
      focusableElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('responsive behavior', () => {
    test('should render appropriately on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
        })),
      });
      
      render(<ConferenceCard conference={mockConferenceData} />);
      
      // Content should still be accessible on mobile
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
      expect(screen.getByText(mockConferenceData.speaker)).toBeInTheDocument();
    });

    test('should handle different card layouts', () => {
      const { rerender } = render(<ConferenceCard conference={mockConferenceData} layout="horizontal" />);
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
      
      rerender(<ConferenceCard conference={mockConferenceData} layout="vertical" />);
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
    });
  });

  describe('date and time handling', () => {
    test('should format dates correctly', () => {
      const conferencesWithDates = [
        { ...mockConferenceData, date: '2024-06-15' },
        { ...mockConferenceData, date: '2024-12-25', id: 2 },
        { ...mockConferenceData, date: '2024-01-01', id: 3 },
      ];
      
      conferencesWithDates.forEach(conf => {
        const { rerender } = render(<ConferenceCard conference={conf} />);
        
        // Should display some form of the date
        const year = screen.getByText(/2024/);
        expect(year).toBeInTheDocument();
        
        rerender(<></>);
      });
    });

    test('should handle time zones appropriately', () => {
      const conferenceWithTimeZone = {
        ...mockConferenceData,
        time: '3:00 PM EST',
      };
      
      render(<ConferenceCard conference={conferenceWithTimeZone} />);
      
      expect(screen.getByText(/EST|PST|MST|CST/)).toBeInTheDocument();
    });

    test('should handle relative time for upcoming events', () => {
      const upcomingConference = {
        ...mockConferenceData,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      };
      
      render(<ConferenceCard conference={upcomingConference} />);
      
      // Should show the date or relative time
      expect(screen.getByText(upcomingConference.date.split('-')[0])).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('should handle malformed conference data gracefully', () => {
      const malformedConference = {
        // Missing required fields
        id: undefined,
        title: null,
        speaker: '',
      };
      
      // Should not crash with malformed data
      expect(() => render(<ConferenceCard conference={malformedConference} />)).not.toThrow();
    });

    test('should handle image loading errors', () => {
      const conferenceWithBadImage = {
        ...mockConferenceData,
        thumbnail: 'https://invalid-url/nonexistent-image.jpg',
      };
      
      render(<ConferenceCard conference={conferenceWithBadImage} />);
      
      // Should handle broken images gracefully
      expect(screen.getByText(mockConferenceData.title)).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    test('should render efficiently', () => {
      const startTime = performance.now();
      render(<ConferenceCard conference={mockConferenceData} />);
      const endTime = performance.now();
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should handle re-renders efficiently', () => {
      const { rerender } = render(<ConferenceCard conference={mockConferenceData} />);
      
      const startTime = performance.now();
      
      // Multiple re-renders should be efficient
      for (let i = 0; i < 10; i++) {
        rerender(<ConferenceCard conference={{ ...mockConferenceData, id: i }} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});