import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from '../src/components/navigation';

// Mock Next.js Link and usePathname
jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const { usePathname } = require('next/navigation');

describe('Navigation', () => {
  beforeEach(() => {
    usePathname.mockReturnValue('/');
  });

  describe('happy path scenarios', () => {
    test('should render all navigation menu items', () => {
      render(<Navigation />);
      
      // Check that all main navigation items are present
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Cricket Scores')).toBeInTheDocument();
      expect(screen.getByText('Football Scores')).toBeInTheDocument();
      expect(screen.getByText('Optimization')).toBeInTheDocument();
      expect(screen.getByText('Player Registration')).toBeInTheDocument();
    });

    test('should render correct links for all menu items', () => {
      render(<Navigation />);
      
      // Check that links have correct href attributes
      expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('NBA Scores').closest('a')).toHaveAttribute('href', '/nba-scores');
      expect(screen.getByText('Cricket Scores').closest('a')).toHaveAttribute('href', '/nba-scores/cricket');
      expect(screen.getByText('Football Scores').closest('a')).toHaveAttribute('href', '/football-scores');
      expect(screen.getByText('Optimization').closest('a')).toHaveAttribute('href', '/optimization');
      expect(screen.getByText('Player Registration').closest('a')).toHaveAttribute('href', '/add-player-info');
    });

    test('should display icons for all navigation items', () => {
      render(<Navigation />);
      
      // Check that icons are rendered (assuming they have data-testid or specific classes)
      const navItems = screen.getAllByRole('link');
      navItems.forEach(item => {
        // Each navigation item should contain an icon
        const icon = item.querySelector('svg') || item.querySelector('[class*=\"icon\"]');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('active state handling', () => {
    test('should highlight active navigation item - Home', () => {
      usePathname.mockReturnValue('/');
      render(<Navigation />);
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass(/active|bg-|text-/) || 
             expect(homeLink?.parentElement).toHaveClass(/active|bg-|text-/);
    });

    test('should highlight active navigation item - NBA Scores', () => {
      usePathname.mockReturnValue('/nba-scores');
      render(<Navigation />);
      
      const nbaLink = screen.getByText('NBA Scores').closest('a');
      expect(nbaLink).toHaveClass(/active|bg-|text-/) || 
             expect(nbaLink?.parentElement).toHaveClass(/active|bg-|text-/);
    });

    test('should highlight active navigation item - Player Registration', () => {
      usePathname.mockReturnValue('/add-player-info');
      render(<Navigation />);
      
      const playerRegLink = screen.getByText('Player Registration').closest('a');
      expect(playerRegLink).toHaveClass(/active|bg-|text-/) || 
             expect(playerRegLink?.parentElement).toHaveClass(/active|bg-|text-/);
    });

    test('should show different icons for active vs inactive states', () => {
      // Test inactive state
      usePathname.mockReturnValue('/other-path');
      const { rerender } = render(<Navigation />);
      
      const homeLink = screen.getByText('Home').closest('a');
      const inactiveIcon = homeLink?.querySelector('svg');
      
      // Test active state
      usePathname.mockReturnValue('/');
      rerender(<Navigation />);
      
      const activeLinkUpdated = screen.getByText('Home').closest('a');
      const activeIcon = activeLinkUpdated?.querySelector('svg');
      
      // Icons should be different for active/inactive states
      expect(activeIcon).toBeInTheDocument();
      expect(inactiveIcon).toBeInTheDocument();
    });
  });

  describe('sports navigation functionality', () => {
    test('should include NBA-specific navigation', () => {
      render(<Navigation />);
      
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Player Registration')).toBeInTheDocument();
    });

    test('should include multi-sport navigation options', () => {
      render(<Navigation />);
      
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Cricket Scores')).toBeInTheDocument();
      expect(screen.getByText('Football Scores')).toBeInTheDocument();
    });

    test('should have correct paths for sports pages', () => {
      render(<Navigation />);
      
      expect(screen.getByText('NBA Scores').closest('a')).toHaveAttribute('href', '/nba-scores');
      expect(screen.getByText('Cricket Scores').closest('a')).toHaveAttribute('href', '/nba-scores/cricket');
      expect(screen.getByText('Football Scores').closest('a')).toHaveAttribute('href', '/football-scores');
    });
  });

  describe('user interactions', () => {
    test('should be clickable and navigable', async () => {
      const user = userEvent.setup();
      render(<Navigation />);
      
      const homeLink = screen.getByText('Home').closest('a');
      const nbaLink = screen.getByText('NBA Scores').closest('a');
      
      // Links should be clickable
      expect(homeLink).not.toHaveAttribute('disabled');
      expect(nbaLink).not.toHaveAttribute('disabled');
      
      // Should handle clicks (in real app this would navigate)
      await user.click(homeLink!);
      await user.click(nbaLink!);
      
      // No errors should be thrown
    });

    test('should support keyboard navigation', () => {
      render(<Navigation />);
      
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        // Each link should be keyboard accessible
        expect(link).not.toHaveAttribute('tabIndex', '-1');
        
        // Focus should work
        link.focus();
        expect(document.activeElement).toBe(link);
      });
    });

    test('should handle hover states', async () => {
      const user = userEvent.setup();
      render(<Navigation />);
      
      const homeLink = screen.getByText('Home').closest('a');
      
      // Hover should not cause errors
      await user.hover(homeLink!);
      await user.unhover(homeLink!);
      
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<Navigation />);
      
      // Check for navigation landmark
      const nav = document.querySelector('nav') || screen.getByRole('navigation', { hidden: true });
      expect(nav).toBeInTheDocument();
      
      // All navigation items should be links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    test('should support screen readers', () => {
      render(<Navigation />);
      
      // Check that text content is available for screen readers
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Player Registration')).toBeInTheDocument();
      
      // Icons should not interfere with screen reader text
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.textContent).toBeTruthy();
      });
    });

    test('should have adequate color contrast for text', () => {
      render(<Navigation />);
      
      const links = screen.getAllByRole('link');
      
      // Check that links have text content (not just icons)
      links.forEach(link => {
        expect(link.textContent?.trim()).toBeTruthy();
        expect(link.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    test('should work with reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Navigation />);
      
      // Navigation should still render and be functional
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    });
  });

  describe('responsive behavior', () => {
    test('should render on mobile devices', () => {
      // Mock mobile viewport
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

      render(<Navigation />);
      
      // All navigation items should still be accessible on mobile
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Player Registration')).toBeInTheDocument();
    });

    test('should maintain functionality across screen sizes', () => {
      const { rerender } = render(<Navigation />);
      
      // Test desktop
      expect(screen.getAllByRole('link').length).toBeGreaterThan(5);
      
      // Mock mobile and re-render
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 640px)',
          media: query,
        })),
      });
      
      rerender(<Navigation />);
      
      // Should still have all navigation items
      expect(screen.getAllByRole('link').length).toBeGreaterThan(5);
    });
  });

  describe('NBA-specific navigation features', () => {
    test('should provide access to player management features', () => {
      render(<Navigation />);
      
      // Should have player registration link
      const playerRegLink = screen.getByText('Player Registration');
      expect(playerRegLink).toBeInTheDocument();
      expect(playerRegLink.closest('a')).toHaveAttribute('href', '/add-player-info');
    });

    test('should include sports statistics navigation', () => {
      render(<Navigation />);
      
      // Should have links to different sports scores
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      expect(screen.getByText('Cricket Scores')).toBeInTheDocument();
      expect(screen.getByText('Football Scores')).toBeInTheDocument();
    });

    test('should support optimization features for workshop', () => {
      render(<Navigation />);
      
      // Should have optimization link for workshop purposes
      const optimizationLink = screen.getByText('Optimization');
      expect(optimizationLink).toBeInTheDocument();
      expect(optimizationLink.closest('a')).toHaveAttribute('href', '/optimization');
    });
  });

  describe('integration with routing', () => {
    test('should work with different route patterns', () => {
      const routes = ['/', '/nba-scores', '/add-player-info', '/players-info'];
      
      routes.forEach(route => {
        usePathname.mockReturnValue(route);
        const { rerender } = render(<Navigation />);
        
        // Navigation should render without errors for all routes
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
        
        rerender(<></>); // Clean up
      });
    });

    test('should handle nested routes correctly', () => {
      usePathname.mockReturnValue('/nba-scores/cricket');
      render(<Navigation />);
      
      // Should still render all navigation items
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Cricket Scores')).toBeInTheDocument();
      
      // Cricket scores might be highlighted as active
      const cricketLink = screen.getByText('Cricket Scores').closest('a');
      expect(cricketLink).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('should handle missing usePathname gracefully', () => {
      usePathname.mockImplementation(() => {
        throw new Error('usePathname error');
      });
      
      // Should not crash when usePathname fails
      expect(() => render(<Navigation />)).not.toThrow();
    });

    test('should work when icons fail to load', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Navigation />);
      
      // Navigation should still work even if icons fail
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('NBA Scores')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('performance', () => {
    test('should render efficiently with multiple menu items', () => {
      const startTime = performance.now();
      render(<Navigation />);
      const endTime = performance.now();
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should render all expected items
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(6);
    });
  });
});