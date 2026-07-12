/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@infinity-realms/shared/(.*)$': '<rootDir>/../shared/$1',
    '^@infinity-realms/ai$': '<rootDir>/../ai/index.ts',
  },
};
