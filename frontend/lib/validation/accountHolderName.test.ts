import { normalizeAccountHolderName, isValidAccountHolderName } from './accountHolderName';

describe('normalizeAccountHolderName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeAccountHolderName('  John   Doe  ')).toBe('John Doe');
  });
});

describe('isValidAccountHolderName', () => {
  it('accepts valid two-word names', () => {
    expect(isValidAccountHolderName('John Doe')).toBe(true);
  });

  it('accepts names with hyphens and apostrophes', () => {
    expect(isValidAccountHolderName("Mary-Jane O'Brien")).toBe(true);
  });

  it('rejects single-word names', () => {
    expect(isValidAccountHolderName('John')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isValidAccountHolderName('')).toBe(false);
  });

  it('rejects names with numbers', () => {
    expect(isValidAccountHolderName('John Doe123')).toBe(false);
  });
});
