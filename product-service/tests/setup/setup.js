import { jest } from '@jest/globals';

// Configurar variables de entorno por defecto para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10';

// Aumentar timeout para operaciones de base de datos
jest.setTimeout(30000);
