import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_DISABLED = 'true';

jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../config/mailer', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn(),
    verify: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  logSystemEvent: jest.fn(),
}));

jest.mock('../../config/google', () => ({
  isGoogleAuthEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock('../messages/ban.service', () => ({
  isUserBanned: jest.fn().mockResolvedValue({ banned: false }),
  bannedUserMessage: jest.fn(),
}));

jest.mock('../../config/upload', () => ({
  ensureUploadRoot: jest.fn(),
  getUploadRoot: jest.fn().mockReturnValue('/tmp/test-uploads'),
  getStoredUploadPath: jest.fn(),
  resolvePublicUploadUrl: jest.fn((p: string) => `http://localhost${p}`),
  createUploadMiddleware: jest.fn().mockReturnValue({
    single: () => (_req: any, _res: any, next: any) => next(),
    array: () => (_req: any, _res: any, next: any) => next(),
    fields: () => (_req: any, _res: any, next: any) => next(),
    none: () => (_req: any, _res: any, next: any) => next(),
    any: () => (_req: any, _res: any, next: any) => next(),
  }),
}));

import app from '../../app';

describe('Protected routes', () => {
  it('GET /api/users/me returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/users/me returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });

  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'API is running');
  });
});
