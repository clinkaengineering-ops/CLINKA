import { getApiErrorMessage } from './apiErrors';

describe('getApiErrorMessage', () => {
  it('extracts message from axios-like error response', () => {
    const err = { response: { data: { message: 'Bad request' } } };
    expect(getApiErrorMessage(err)).toBe('Bad request');
  });

  it('extracts first field error when no message', () => {
    const err = { response: { data: { errors: { email: 'Invalid email' } } } };
    expect(getApiErrorMessage(err)).toBe('Invalid email');
  });

  it('falls back to Error.message', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('ignores "Network Error" message and returns fallback', () => {
    expect(getApiErrorMessage({ message: 'Network Error' })).toBe('Request failed');
  });

  it('returns custom fallback', () => {
    expect(getApiErrorMessage(42, 'Custom fallback')).toBe('Custom fallback');
  });
});
