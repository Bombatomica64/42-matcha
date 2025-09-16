/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      useESM: true, 
      tsconfig: '<rootDir>/tsconfig.jest.json' 
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude main entry point
    '!src/database.ts', // Exclude database connection
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@generated/typescript/api$': '<rootDir>/src/generated/typescript/api.ts',
    '^@generated/types$': '<rootDir>/src/generated/backend/types.ts',
    '^@generated/validators$': '<rootDir>/src/generated/backend/validators.ts',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@orm/(.*)$': '<rootDir>/src/orm/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@mappers/(.*)$': '<rootDir>/src/mappers/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@generated/(.*)$': '<rootDir>/src/generated/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially for database consistency
};
