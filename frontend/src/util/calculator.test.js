// NBA Statistics Calculator Tests
// Following modern testing practices for the GitHub Copilot Workshop
import { add, subtract, multiply, divide } from './calculator.js';

describe('NBA Statistics Calculator', () => {
  describe('add function - Player Statistics Addition', () => {
    describe('happy path scenarios', () => {
      test('should add two positive numbers (basic stats)', () => {
        expect(add(2, 3)).toBe(5);
      });

      test('should calculate total points across games', () => {
        // Player scored 25 points in game 1 and 32 points in game 2
        expect(add(25, 32)).toBe(57);
      });

      test('should handle decimal numbers (shooting percentages)', () => {
        // Adding shooting percentages: 0.456 + 0.523 = 0.979
        expect(add(0.456, 0.523)).toBeCloseTo(0.979, 3);
      });
    });

    describe('edge cases', () => {
      test('should handle zero values (games with no points)', () => {
        expect(add(0, 15)).toBe(15);
        expect(add(23, 0)).toBe(23);
        expect(add(0, 0)).toBe(0);
      });

      test('should add negative numbers (stat corrections)', () => {
        // Handling stat corrections or adjustments
        expect(add(-2, -3)).toBe(-5);
        expect(add(10, -3)).toBe(7);
      });

      test('should handle large numbers (season totals)', () => {
        // Season total points: 2000 + 1800 = 3800
        expect(add(2000, 1800)).toBe(3800);
      });
    });

    describe('NBA-specific scenarios', () => {
      test('should calculate total rebounds (offensive + defensive)', () => {
        const offensiveRebounds = 3.2;
        const defensiveRebounds = 8.5;
        expect(add(offensiveRebounds, defensiveRebounds)).toBeCloseTo(11.7, 1);
      });

      test('should calculate combined team points', () => {
        const firstHalfPoints = 58;
        const secondHalfPoints = 62;
        expect(add(firstHalfPoints, secondHalfPoints)).toBe(120);
      });
    });
  });

  describe('subtract function - Statistical Differences', () => {
    describe('happy path scenarios', () => {
      test('should subtract two positive numbers', () => {
        expect(subtract(10, 4)).toBe(6);
      });

      test('should calculate point differential', () => {
        // Team A: 110 points, Team B: 95 points
        expect(subtract(110, 95)).toBe(15);
      });
    });

    describe('edge cases', () => {
      test('should handle zero in calculations', () => {
        expect(subtract(15, 0)).toBe(15);
        expect(subtract(0, 8)).toBe(-8);
      });

      test('should handle negative results (underperformance)', () => {
        // Expected 25 points, actually scored 18
        expect(subtract(18, 25)).toBe(-7);
      });

      test('should handle decimal numbers (efficiency ratings)', () => {
        // Player efficiency rating difference
        expect(subtract(28.5, 22.3)).toBeCloseTo(6.2, 1);
      });
    });

    describe('NBA-specific scenarios', () => {
      test('should calculate improvement in shooting percentage', () => {
        const currentPercentage = 0.485;
        const previousPercentage = 0.442;
        expect(subtract(currentPercentage, previousPercentage)).toBeCloseTo(0.043, 3);
      });

      test('should calculate games behind in standings', () => {
        const leaderWins = 45;
        const teamWins = 38;
        expect(subtract(leaderWins, teamWins)).toBe(7);
      });
    });
  });

// Test suite for multiply function
describe('multiply', () => {
    test('should multiply two positive numbers', () => {
        expect(multiply(3, 4)).toBe(12);
    });

    test('should multiply two negative numbers', () => {
        expect(multiply(-3, -4)).toBe(12);
    });

    test('should multiply positive and negative numbers', () => {
        expect(multiply(3, -4)).toBe(-12);
    });

    test('should handle multiplication by zero', () => {
        expect(multiply(5, 0)).toBe(0);
        expect(multiply(0, 5)).toBe(0);
    });

    test('should handle decimal numbers', () => {
        expect(multiply(2.5, 4)).toBeCloseTo(10);
    });
});

// Test suite for divide function
describe('divide', () => {
    test('should divide two positive numbers', () => {
        expect(divide(10, 2)).toBe(5);
    });

    test('should divide two negative numbers', () => {
        expect(divide(-10, -2)).toBe(5);
    });

    test('should divide positive by negative', () => {
        expect(divide(10, -2)).toBe(-5);
    });

    test('should handle decimal division', () => {
        expect(divide(7, 2)).toBe(3.5);
    });

    test('should throw error when dividing by zero', () => {
        expect(() => divide(5, 0)).toThrow("Division by zero is not allowed.");
    });

    test('should handle zero divided by non-zero', () => {
        expect(divide(0, 5)).toBe(0);
    });
});