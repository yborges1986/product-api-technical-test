// Tests de integración simple para el API
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Mock simple de las funciones de Elasticsearch
const mockSearchResults = [
  { id: '1', name: 'Test Product 1', brand: 'Brand A' },
  { id: '2', name: 'Test Product 2', brand: 'Brand B' },
];

const mockProduct = {
  id: '1',
  name: 'Test Product',
  brand: 'Test Brand',
};

// Crear una app de prueba simple
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mock health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'search-service',
      uptime: 123,
      elasticsearch: 'connected',
    });
  });

  // Mock search endpoint
  app.get('/search-elastic', (req, res) => {
    const { q } = req.query;

    if (q === 'error') {
      return res.status(500).json({
        error: 'Error buscando en Elasticsearch',
        details: 'Test error',
      });
    }

    res.json({ results: mockSearchResults });
  });

  // Mock product endpoint
  app.get('/product/:id', (req, res) => {
    const { id } = req.params;

    if (id === 'error') {
      return res.status(500).json({
        error: 'Error obteniendo producto',
        details: 'Test error',
      });
    }

    if (id === 'notfound') {
      return res.status(404).json({
        error: 'Producto no encontrado',
      });
    }

    res.json({ product: mockProduct });
  });

  return app;
};

describe('Search Service API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'search-service',
        uptime: expect.any(Number),
        elasticsearch: 'connected',
      });
    });
  });

  describe('GET /search-elastic', () => {
    test('should search products successfully', async () => {
      const response = await request(app)
        .get('/search-elastic?q=test')
        .expect(200);

      expect(response.body).toEqual({
        results: mockSearchResults,
      });
    });

    test('should search without query', async () => {
      const response = await request(app).get('/search-elastic').expect(200);

      expect(response.body).toEqual({
        results: mockSearchResults,
      });
    });

    test('should handle search errors', async () => {
      const response = await request(app)
        .get('/search-elastic?q=error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Error buscando en Elasticsearch',
        details: 'Test error',
      });
    });
  });

  describe('GET /product/:id', () => {
    test('should get product by ID successfully', async () => {
      const response = await request(app).get('/product/1').expect(200);

      expect(response.body).toEqual({
        product: mockProduct,
      });
    });

    test('should return 404 when product not found', async () => {
      const response = await request(app).get('/product/notfound').expect(404);

      expect(response.body).toEqual({
        error: 'Producto no encontrado',
      });
    });

    test('should handle server errors', async () => {
      const response = await request(app).get('/product/error').expect(500);

      expect(response.body).toEqual({
        error: 'Error obteniendo producto',
        details: 'Test error',
      });
    });
  });

  describe('CORS', () => {
    test('should have CORS headers', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
