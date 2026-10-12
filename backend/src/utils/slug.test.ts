jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    engineerProfile: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

import { generateProfileSlug } from './slug';

describe('generateProfileSlug', () => {
  it('converts name to lowercase kebab-case', async () => {
    expect(await generateProfileSlug('John Doe', 'user-1')).toBe('john-doe');
  });

  it('removes special characters', async () => {
    expect(await generateProfileSlug('John@Doe!', 'user-1')).toBe('johndoe');
  });

  it('trims leading/trailing hyphens', async () => {
    expect(await generateProfileSlug('--hello--', 'user-1')).toBe('hello');
  });

  it('falls back to engineer-userId for empty names', async () => {
    expect(await generateProfileSlug('!!!', 'abc-123')).toBe('engineer-abc-123');
  });

  it('appends userId when base slug exists', async () => {
    const db = require('../config/db').default;
    db.engineerProfile.findUnique
      .mockResolvedValueOnce({ id: 1 })  // base slug exists
      .mockResolvedValueOnce(null);       // slug-userId doesn't exist
    expect(await generateProfileSlug('John Doe', 'user-1')).toBe('john-doe-user-1');
  });
});
