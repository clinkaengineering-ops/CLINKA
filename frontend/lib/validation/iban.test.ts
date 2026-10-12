import { isValidIban, isValidSwiftBic, isValidCountryCode } from './iban';

describe('isValidIban', () => {
  it('accepts valid GB IBAN', () => {
    expect(isValidIban('GB29 NWBK 6016 1331 9268 19')).toBe(true);
  });

  it('rejects IBAN with wrong check digits', () => {
    expect(isValidIban('GB00 NWBK 6016 1331 9268 19')).toBe(false);
  });

  it('rejects too-short IBANs', () => {
    expect(isValidIban('GB29 NWBK')).toBe(false);
  });

  it('rejects non-IBAN strings', () => {
    expect(isValidIban('not-an-iban')).toBe(false);
  });
});

describe('isValidSwiftBic', () => {
  it('accepts valid 8-char BIC', () => {
    expect(isValidSwiftBic('NWBKGB2L')).toBe(true);
  });

  it('accepts valid 11-char BIC', () => {
    expect(isValidSwiftBic('NWBKGB2LXXX')).toBe(true);
  });

  it('rejects invalid BIC', () => {
    expect(isValidSwiftBic('short')).toBe(false);
  });
});

describe('isValidCountryCode', () => {
  it('accepts two-letter codes', () => {
    expect(isValidCountryCode('US')).toBe(true);
    expect(isValidCountryCode('gb')).toBe(true);
  });

  it('rejects three-letter codes', () => {
    expect(isValidCountryCode('USA')).toBe(false);
  });
});
