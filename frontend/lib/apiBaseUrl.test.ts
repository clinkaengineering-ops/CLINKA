import { resolveApiBaseUrl, resolveBackendOrigin, resolveSocketBaseUrl } from './apiBaseUrl';

describe('apiBaseUrl', () => {
  const originalEnv = { ...process.env };
  const originalLocation = window.location;

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('resolves /api for local hostname in browser', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('http://localhost:3000'),
    });
    expect(resolveApiBaseUrl()).toBe('/api');
  });

  it('resolves dev tunnel api and backend origin', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('https://test-3000.euw.devtunnels.ms'),
    });
    expect(resolveApiBaseUrl()).toBe('https://test-5000.euw.devtunnels.ms/api');
    expect(resolveBackendOrigin()).toBe('https://test-5000.euw.devtunnels.ms');
  });

  it('resolves production api base url when on custom domain', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.clinkaeng.com/api';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('https://app.clinkaeng.com'),
    });
    expect(resolveApiBaseUrl()).toBe('https://api.clinkaeng.com/api');
    expect(resolveSocketBaseUrl()).toBe('https://api.clinkaeng.com');
  });
});
