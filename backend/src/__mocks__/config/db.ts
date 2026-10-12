const mockPrisma: any = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  project: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  bid: { findMany: jest.fn(), create: jest.fn() },
  payment: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  engineerProfile: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  wallet: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
  dispute: { findMany: jest.fn(), create: jest.fn() },
  notification: { create: jest.fn() },
  walletTransaction: { findFirst: jest.fn() },
  withdrawalRequest: { findMany: jest.fn() },
  systemAuditLog: { create: jest.fn() },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((fn: any): any => fn(mockPrisma)),
};

export default mockPrisma;
