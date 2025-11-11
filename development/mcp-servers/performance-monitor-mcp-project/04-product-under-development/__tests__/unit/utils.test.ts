import { mean, standardDeviation, percentile, zScore, errorRate, formatDuration } from '../../src/lib/utils';

describe('Statistical Utility Functions', () => {
  describe('mean', () => {
    it('should calculate mean correctly', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20, 30])).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate standard deviation', () => {
      const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(2.0, 1);
    });

    it('should return 0 for empty array', () => {
      expect(standardDeviation([])).toBe(0);
    });
  });

  describe('percentile', () => {
    it('should calculate P50 correctly', () => {
      expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    });

    it('should calculate P95 correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(percentile(values, 95)).toBeCloseTo(95, 0);
    });

    it('should return 0 for empty array', () => {
      expect(percentile([], 50)).toBe(0);
    });
  });

  describe('zScore', () => {
    it('should calculate z-score correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const zScoreResult = zScore(5, values);
      expect(zScoreResult).toBeGreaterThan(0);
    });
  });

  describe('errorRate', () => {
    it('should calculate error rate correctly', () => {
      expect(errorRate(90, 100)).toBe(10);
      expect(errorRate(95, 100)).toBe(5);
    });

    it('should return 0 for zero total', () => {
      expect(errorRate(0, 0)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(5000)).toBe('5.0s');
    });

    it('should format minutes correctly', () => {
      expect(formatDuration(120000)).toBe('2.0m');
    });
  });
});
