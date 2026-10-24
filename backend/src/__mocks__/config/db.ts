const mockPrisma: any = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  project: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  projectDeliverable: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
  manualPaymentSubmission: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  portfolioProject: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  bid: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  payment: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  engineerProfile: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  wallet: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
  dispute: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  conversation: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  message: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  ban: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  notification: { create: jest.fn() },
  walletTransaction: { findFirst: jest.fn() },
  withdrawalRequest: { findMany: jest.fn() },
  systemAuditLog: { create: jest.fn() },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((fn: any): any => fn(mockPrisma)),
};

export default mockPrisma;

