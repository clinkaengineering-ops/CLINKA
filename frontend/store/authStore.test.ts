import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock the axios module
vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({}),
  },
}));

import useAuthStore from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset zustand store
    useAuthStore.setState({
      user: null,
      sessionReady: false,
    });
  });

  it('starts with null user and sessionReady false', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.sessionReady).toBe(false);
  });

  it('setUser sets user and marks session ready', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Test',
      email: 'test@test.com',
      role: 'CLIENT',
      isVerified: true,
      createdAt: '2024-01-01',
    });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('test@test.com');
    expect(state.sessionReady).toBe(true);
  });

  it('logout clears user', async () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Test',
      email: 'test@test.com',
      role: 'CLIENT',
      isVerified: true,
      createdAt: '2024-01-01',
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.sessionReady).toBe(true);
  });

  it('setSessionReady updates the flag', () => {
    useAuthStore.getState().setSessionReady(true);
    expect(useAuthStore.getState().sessionReady).toBe(true);
  });
});
