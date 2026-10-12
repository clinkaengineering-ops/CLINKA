import { vi } from 'vitest';

// Mock the formatMoney import so we don't depend on the escrow feature module
vi.mock('@/features/escrow/utils/formatMoney', () => ({
  formatMoney: (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: Math.abs(amount % 1) > 0.001 ? 2 : 0,
      minimumFractionDigits: Math.abs(amount % 1) > 0.001 ? 2 : 0,
    }).format(amount);
  },
}));

import { formatCurrency, formatDate } from './formatters';

describe('formatCurrency', () => {
  it('formats a number as USD', () => {
    const result = formatCurrency(1234);
    expect(result).toContain('1,234');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles decimal amounts', () => {
    const result = formatCurrency(99.99);
    expect(result).toContain('99');
  });
});

describe('formatDate', () => {
  it('formats an ISO string', () => {
    const result = formatDate('2024-01-15T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-06-01'));
    expect(result).toContain('2024');
  });
});
