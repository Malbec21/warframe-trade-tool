import { describe, expect, it } from 'vitest';
import { formatMargin, formatPlat } from '../format';

describe('format utilities', () => {
  describe('formatPlat', () => {
    it('formats platinum values', () => {
      expect(formatPlat(100)).toBe('100');
      expect(formatPlat(100.5)).toBe('100');
      expect(formatPlat(100.9)).toBe('101');
    });

    it('handles zero', () => {
      expect(formatPlat(0)).toBe('0');
    });

    it('handles negative values', () => {
      expect(formatPlat(-50)).toBe('-50');
    });
  });

  describe('formatMargin', () => {
    it('formats margin as percentage', () => {
      expect(formatMargin(0.5)).toBe('50.0%');
      expect(formatMargin(0.333)).toBe('33.3%');
      expect(formatMargin(1.0)).toBe('100.0%');
    });

    it('handles zero margin', () => {
      expect(formatMargin(0)).toBe('0.0%');
    });

    it('handles negative margin', () => {
      expect(formatMargin(-0.1)).toBe('-10.0%');
    });
  });
});

