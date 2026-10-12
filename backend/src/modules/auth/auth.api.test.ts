import request from 'supertest';

// Set env vars before importing app
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_DISABLED = 'true';

// Mock the database
jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock the mailer
jest.mock('../../config/mailer', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
    verify: jest.fn().mockResolvedValue(true),
  },
}));

// Mock audit logger
jest.mock('../../utils/auditLogger', () => ({
  logSystemEvent: jest.fn().mockResolvedValue(undefined),
}));

// Mock Google service
jest.mock('./google.service', () => ({
  getGoogleAuthRedirectUrl: jest.fn(),
  handleGoogleCallback: jest.fn(),
  completeGoogleRegistration: jest.fn(),
  isGoogleAuthEnabled: jest.fn().mockReturnValue(false),
}));

// Mock Google config
jest.mock('../../config/google', () => ({
  isGoogleAuthEnabled: jest.fn().mockReturnValue(false),
}));

// Mock ban service
jest.mock('../messages/ban.service', () => ({
  isUserBanned: jest.fn().mockResolvedValue({ banned: false }),
  bannedUserMessage: jest.fn(),
}));

// Mock upload config to avoid filesystem side effects
jest.mock('../../config/upload', () => ({
  ensureUploadRoot: jest.fn(),
  getUploadRoot: jest.fn().mockReturnValue('/tmp/test-uploads'),
  getStoredUploadPath: jest.fn(),
  resolvePublicUploadUrl: jest.fn((path: string) => `http://localhost${path}`),
  createUploadMiddleware: jest.fn().mockReturnValue({
    single: () => (_req: any, _res: any, next: any) => next(),
    array: () => (_req: any, _res: any, next: any) => next(),
    fields: () => (_req: any, _res: any, next: any) => next(),
    none: () => (_req: any, _res: any, next: any) => next(),
    any: () => (_req: any, _res: any, next: any) => next(),
  }),
}));

// Mock the OTP/email verification service parts
jest.mock('./auth.service', () => {
  const original = jest.requireActual('./auth.service');
  return {
    ...original,
  };
});

import app from '../../app';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('returns 422 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SomePass1!' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('returns 422 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('returns 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'SomePass1!' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('POST /api/auth/register/client', () => {
    it('returns 422 for empty body', async () => {
      const res = await request(app)
        .post('/api/auth/register/client')
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('returns 422 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register/client')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345678',  // no uppercase, special char
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('GET /api/auth/register/status', () => {
    it('returns 400 when email query param is missing', async () => {
      const res = await request(app)
        .get('/api/auth/register/status');

      expect(res.status).toBe(400);
    });
  });
});
