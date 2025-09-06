// Tests de integración para el Search Service
import { jest } from '@jest/globals';

describe('Search Service Integration Tests', () => {
  let productIndexModule;
  let mockElasticClient;

  beforeAll(async () => {
    // Mock del cliente de Elasticsearch
    mockElasticClient = {
      indices: {
        exists: jest.fn(),
        create: jest.fn(),
      },
      index: jest.fn(),
      search: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      ping: jest.fn(),
    };

    // Mock del módulo client.js
    jest.unstable_mockModule('../elastic/client.js', () => ({
      elasticClient: mockElasticClient,
      default: mockElasticClient,
    }));

    // Import dinámico después del mock
    productIndexModule = await import('../elastic/productIndex.js');
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createIndexIfNotExists', () => {
    test('should create index when it does not exist', async () => {
      mockElasticClient.indices.exists.mockResolvedValue(false);
      mockElasticClient.indices.create.mockResolvedValue({
        acknowledged: true,
      });

      await productIndexModule.createIndexIfNotExists();

      expect(mockElasticClient.indices.exists).toHaveBeenCalledWith({
        index: 'products',
      });
      expect(mockElasticClient.indices.create).toHaveBeenCalledWith({
        index: 'products',
        mappings: expect.objectContaining({
          properties: expect.objectContaining({
            id: { type: 'keyword' },
            gtin: { type: 'keyword' },
            name: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            brand: { type: 'text', analyzer: 'standard' },
            manufacturer: { type: 'text', analyzer: 'standard' },
            netWeight: { type: 'float' },
            netWeightUnit: { type: 'keyword' },
            status: { type: 'keyword' },
            createdById: { type: 'keyword' },
            approvedById: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            approvedAt: { type: 'date' },
          }),
        }),
      });
    });

    test('should not create index when it already exists', async () => {
      mockElasticClient.indices.exists.mockResolvedValue(true);

      await productIndexModule.createIndexIfNotExists();

      expect(mockElasticClient.indices.exists).toHaveBeenCalled();
      expect(mockElasticClient.indices.create).not.toHaveBeenCalled();
    });

    test('should handle errors when creating index', async () => {
      mockElasticClient.indices.exists.mockResolvedValue(false);
      mockElasticClient.indices.create.mockRejectedValue(
        new Error('Elasticsearch error')
      );

      // Should not throw, just log error (función maneja errores internamente)
      await expect(
        productIndexModule.createIndexIfNotExists()
      ).resolves.not.toThrow();
    });
  });

  describe('indexProduct', () => {
    test('should index a product successfully', async () => {
      const testProduct = {
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 500,
        netWeightUnit: 'g',
        status: 'published',
        __v: 0,
      };

      mockElasticClient.indices.exists.mockResolvedValue(true);
      mockElasticClient.index.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        _index: 'products',
        result: 'created',
      });

      await productIndexModule.indexProduct(testProduct);

      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'products',
        id: '507f1f77bcf86cd799439011',
        document: {
          id: '507f1f77bcf86cd799439011',
          gtin: '1234567890123',
          name: 'Test Product',
          description: 'Test Description',
          brand: 'Test Brand',
          manufacturer: 'Test Manufacturer',
          netWeight: 500,
          netWeightUnit: 'g',
          status: 'published',
        },
      });
    });

    test('should handle product with id field instead of _id', async () => {
      const testProduct = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
      };

      mockElasticClient.indices.exists.mockResolvedValue(true);
      mockElasticClient.index.mockResolvedValue({ result: 'created' });

      await productIndexModule.indexProduct(testProduct);

      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: 'products',
        id: '507f1f77bcf86cd799439011',
        document: expect.objectContaining({
          id: '507f1f77bcf86cd799439011',
          gtin: '1234567890123',
          name: 'Test Product',
        }),
      });
    });

    test('should throw error when product has no ID', async () => {
      const testProduct = {
        gtin: '1234567890123',
        name: 'Test Product',
      };

      await expect(
        productIndexModule.indexProduct(testProduct)
      ).rejects.toThrow('No se encontró ID del producto para indexar');
    });

    test('should handle indexing errors', async () => {
      const testProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
      };

      mockElasticClient.indices.exists.mockResolvedValue(true);
      mockElasticClient.index.mockRejectedValue(
        new Error('Elasticsearch indexing error')
      );

      await expect(
        productIndexModule.indexProduct(testProduct)
      ).rejects.toThrow('Elasticsearch indexing error');
    });
  });

  describe('searchProductsElastic', () => {
    test('should search products with query', async () => {
      const mockResponse = {
        hits: {
          hits: [
            {
              _source: {
                id: '1',
                gtin: '1234567890123',
                name: 'Test Product 1',
                brand: 'Brand A',
              },
            },
            {
              _source: {
                id: '2',
                gtin: '1234567890124',
                name: 'Test Product 2',
                brand: 'Brand B',
              },
            },
          ],
        },
      };

      mockElasticClient.search.mockResolvedValue(mockResponse);

      const results = await productIndexModule.searchProductsElastic(
        'test product'
      );

      expect(mockElasticClient.search).toHaveBeenCalledWith({
        index: 'products',
        query: {
          multi_match: {
            query: 'test product',
            fields: ['name', 'brand', 'description'],
            fuzziness: 'AUTO',
          },
        },
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: '1',
        gtin: '1234567890123',
        name: 'Test Product 1',
        brand: 'Brand A',
      });
    });

    test('should return all products when no query provided', async () => {
      const mockResponse = {
        hits: {
          hits: [
            {
              _source: {
                id: '1',
                name: 'Product 1',
              },
            },
          ],
        },
      };

      mockElasticClient.search.mockResolvedValue(mockResponse);

      const results = await productIndexModule.searchProductsElastic();

      expect(mockElasticClient.search).toHaveBeenCalledWith({
        index: 'products',
        query: { match_all: {} },
      });

      expect(results).toHaveLength(1);
    });

    test('should return empty array on search error', async () => {
      mockElasticClient.search.mockRejectedValue(
        new Error('Elasticsearch search error')
      );

      const results = await productIndexModule.searchProductsElastic('test');

      expect(results).toEqual([]);
    });

    test('should handle special characters in search', async () => {
      const mockResponse = {
        hits: {
          hits: [],
        },
      };

      mockElasticClient.search.mockResolvedValue(mockResponse);

      const results = await productIndexModule.searchProductsElastic(
        'test-product & special/chars'
      );

      expect(mockElasticClient.search).toHaveBeenCalled();
      expect(results).toEqual([]);
    });
  });

  describe('getProductById', () => {
    test('should get product by ID successfully', async () => {
      const mockProduct = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        brand: 'Test Brand',
      };

      mockElasticClient.get.mockResolvedValue({
        _source: mockProduct,
      });

      const result = await productIndexModule.getProductById(
        '507f1f77bcf86cd799439011'
      );

      expect(mockElasticClient.get).toHaveBeenCalledWith({
        index: 'products',
        id: '507f1f77bcf86cd799439011',
      });

      expect(result).toEqual(mockProduct);
    });

    test('should return null when product not found', async () => {
      mockElasticClient.get.mockRejectedValue({
        statusCode: 404,
      });

      const result = await productIndexModule.getProductById('nonexistent');

      expect(result).toBeNull();
    });

    test('should throw error for other elasticsearch errors', async () => {
      mockElasticClient.get.mockRejectedValue(
        new Error('Elasticsearch connection error')
      );

      await expect(
        productIndexModule.getProductById('some-id')
      ).rejects.toThrow('Elasticsearch connection error');
    });
  });

  describe('deleteProductFromIndex', () => {
    test('should delete product from index successfully', async () => {
      mockElasticClient.delete.mockResolvedValue({
        result: 'deleted',
      });

      await productIndexModule.deleteProductFromIndex(
        '507f1f77bcf86cd799439011'
      );

      expect(mockElasticClient.delete).toHaveBeenCalledWith({
        index: 'products',
        id: '507f1f77bcf86cd799439011',
      });
    });

    test('should handle when product to delete does not exist', async () => {
      mockElasticClient.delete.mockRejectedValue({
        statusCode: 404,
      });

      // Should not throw and should not return anything
      await expect(
        productIndexModule.deleteProductFromIndex('nonexistent')
      ).resolves.toBeUndefined();
    });

    test('should throw error for other elasticsearch errors', async () => {
      mockElasticClient.delete.mockRejectedValue(
        new Error('Elasticsearch delete error')
      );

      await expect(
        productIndexModule.deleteProductFromIndex('some-id')
      ).rejects.toThrow('Elasticsearch delete error');
    });
  });

  describe('Elasticsearch Connection Health', () => {
    test('should verify connection is healthy', async () => {
      mockElasticClient.ping.mockResolvedValue({});

      const isHealthy = await new Promise((resolve) => {
        mockElasticClient
          .ping()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });

      expect(mockElasticClient.ping).toHaveBeenCalled();
      expect(isHealthy).toBe(true);
    });

    test('should handle connection failures', async () => {
      const error = new Error('Connection failed');
      mockElasticClient.ping.mockRejectedValue(error);

      const isHealthy = await new Promise((resolve) => {
        mockElasticClient
          .ping()
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });

      expect(isHealthy).toBe(false);
    });
  });

  describe('Advanced Integration Scenarios', () => {
    test('should handle concurrent operations', async () => {
      const products = [
        { id: '1', name: 'Product 1', gtin: '1111111111111' },
        { id: '2', name: 'Product 2', gtin: '2222222222222' },
        { id: '3', name: 'Product 3', gtin: '3333333333333' },
      ];

      mockElasticClient.indices.exists.mockResolvedValue(true);
      mockElasticClient.index.mockResolvedValue({ result: 'created' });

      const promises = products.map((product) =>
        productIndexModule.indexProduct(product)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockElasticClient.index).toHaveBeenCalledTimes(3);
    });

    test('should handle bulk operations gracefully', async () => {
      const searchQueries = ['product', 'test', 'brand'];
      const mockResponse = {
        hits: {
          hits: [{ _source: { id: '1', name: 'Test Product' } }],
        },
      };

      mockElasticClient.search.mockResolvedValue(mockResponse);

      const promises = searchQueries.map((query) =>
        productIndexModule.searchProductsElastic(query)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockElasticClient.search).toHaveBeenCalledTimes(3);
      results.forEach((result) => {
        expect(result).toHaveLength(1);
      });
    });
  });
});
