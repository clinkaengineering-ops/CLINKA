import { normalizeAccountHolderName, isValidAccountHolderName } from './accountHolderName';

describe('normalizeAccountHolderName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeAccountHolderName('  John   Doe  ')).toBe('John Doe');
  });

  it('preserves single spaces', () => {
    expect(normalizeAccountHolderName('Jane Smith')).toBe('Jane Smith');
  });
});

describe('isValidAccountHolderName', () => {
  it('accepts valid full names', () => {
    expect(isValidAccountHolderName('John Doe')).toBe(true);
  });

  it('accepts names with hyphens and apostrophes', () => {
    expect(isValidAccountHolderName("Mary-Jane O'Brien")).toBe(true);
  });

  it('rejects single-word names (need first and last)', () => {
    expect(isValidAccountHolderName('John')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isValidAccountHolderName('')).toBe(false);
    expect(isValidAccountHolderName('   ')).toBe(false);
  });

  it('rejects names over 100 characters', () => {
    expect(isValidAccountHolderName('A'.repeat(101) + ' B')).toBe(false);
  });

  it('rejects names with numbers or special chars', () => {
    expect(isValidAccountHolderName('John Doe123')).toBe(false);
    expect(isValidAccountHolderName('John @Doe')).toBe(false);
  });
});
