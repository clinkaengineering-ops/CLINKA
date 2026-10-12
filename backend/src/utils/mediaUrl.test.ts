import { storedMediaPathSchema, optionalStoredMediaPathSchema } from './mediaUrl';

describe('storedMediaPathSchema', () => {
  it('accepts absolute URLs', () => {
    const result = storedMediaPathSchema.safeParse('https://res.cloudinary.com/img.png');
    expect(result.success).toBe(true);
  });

  it('accepts /uploads/ paths', () => {
    const result = storedMediaPathSchema.safeParse('/uploads/avatars/abc.png');
    expect(result.success).toBe(true);
  });

  it('rejects empty strings', () => {
    const result = storedMediaPathSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects relative paths without /uploads/', () => {
    const result = storedMediaPathSchema.safeParse('/images/foo.png');
    expect(result.success).toBe(false);
  });

  it('trims whitespace before validation', () => {
    const result = storedMediaPathSchema.safeParse('  https://example.com/img.png  ');
    expect(result.success).toBe(true);
  });
});

describe('optionalStoredMediaPathSchema', () => {
  it('accepts undefined', () => {
    const result = optionalStoredMediaPathSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('accepts null', () => {
    const result = optionalStoredMediaPathSchema.safeParse(null);
    expect(result.success).toBe(true);
  });
});
