export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setup.js'],
};
