import { describe, it, expect } from 'vitest';
import { sparkline } from '@/lib/data';

describe('sparkline', () => {
  it('returns array of correct length', () => {
    const result = sparkline(12345);
    expect(result).toHaveLength(40);
  });

  it('returns array with custom length', () => {
    const result = sparkline(12345, 20);
    expect(result).toHaveLength(20);
  });

  it('returns array of numbers', () => {
    const result = sparkline(12345);
    expect(result.every(v => typeof v === 'number')).toBe(true);
  });

  it('generates consistent values for same seed', () => {
    const result1 = sparkline(12345);
    const result2 = sparkline(12345);
    expect(result1).toEqual(result2);
  });

  it('applies trend to generated values', () => {
    const noTrend = sparkline(12345, 40, 0);
    const withTrend = sparkline(12345, 40, 1);
    
    // With trend, the average should be higher
    const avgNoTrend = noTrend.reduce((a, b) => a + b) / noTrend.length;
    const avgTrend = withTrend.reduce((a, b) => a + b) / withTrend.length;
    
    expect(avgTrend).toBeGreaterThan(avgNoTrend);
  });

  it('produces different results for different seeds', () => {
    const result1 = sparkline(12345);
    const result2 = sparkline(54321);
    expect(result1).not.toEqual(result2);
  });

  it('starts close to 100', () => {
    const result = sparkline(12345);
    expect(Math.abs(result[0] - 100)).toBeLessThan(5);
  });
});
