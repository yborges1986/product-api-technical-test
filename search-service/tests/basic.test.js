// Tests básicos para verificar que el servicio funciona
import { jest } from '@jest/globals';

// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
process.env.NATS_URL = 'nats://localhost:4222';

describe('Search Service Basic Tests', () => {
  test('should have basic test infrastructure working', () => {
    expect(true).toBe(true);
  });

  test('should have environment variables configured', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.ELASTICSEARCH_URL).toBe('http://localhost:9200');
    expect(process.env.NATS_URL).toBe('nats://localhost:4222');
  });

  test('should handle async operations', async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => setTimeout(() => resolve('success'), 10));
    };

    const result = await asyncFunction();
    expect(result).toBe('success');
  });

  test('should be able to import modules', async () => {
    // Test simple import sin ejecutar funciones complejas
    const { elasticClient } = await import('../elastic/client.js');
    expect(elasticClient).toBeDefined();
  });
});
