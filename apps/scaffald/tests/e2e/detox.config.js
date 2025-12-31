/**
 * Jest configuration for Detox E2E tests
 */

module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/tests/e2e/**/*.detox.{js,ts}'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/detox-setup.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
};
