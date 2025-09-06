export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setup.js'],
  // Permitir paralelismo pero con bases de datos separadas por worker
  maxWorkers: '50%', // Usar la mitad de los CPUs disponibles
  // Prevenir fugas de memoria
  forceExit: true,
  detectOpenHandles: false,
};
