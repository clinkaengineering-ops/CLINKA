import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  // Exclude integration tests — they need a real DB and run in a separate CI job
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.test\\.ts$'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  forceExit: true,
  // Coverage settings: focus on tested units, utilities, middlewares, and modules
  collectCoverageFrom: [
    'src/utils/slug.ts',
    'src/utils/ranking.ts',
    'src/utils/fieldEncryption.ts',
    'src/utils/accountHolderName.ts',
    'src/utils/zodErrors.ts',
    'src/utils/mediaUrl.ts',
    'src/utils/serializeMediaUrls.ts',
    'src/utils/uploadErrors.ts',
    'src/modules/payouts/payout.validation.ts',
    'src/modules/payouts/payout.state.ts',
    'src/modules/projects/project.editlock.ts',
    'src/modules/auth/engineerVerification.ts',
    'src/config/env.ts',
    'src/config/upload.ts',
    'src/middlewares/rateLimit.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  // Handle Prisma generated client and always mock database in unit tests
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
    '^.*[\\/\\\\]config[\\/\\\\]db(\\.[jt]s)?$': '<rootDir>/src/__mocks__/config/db.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};

export default config;
