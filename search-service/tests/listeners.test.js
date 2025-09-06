// Tests para los event listeners de NATS
import { jest } from '@jest/globals';

describe('NATS Event Listeners Tests', () => {
  let BaseListener;
  let testListener;

  beforeAll(async () => {
    // Mock de NATS
    const mockNatsConnection = {
      subscribe: jest.fn(),
      close: jest.fn(),
    };

    const mockConnect = jest.fn().mockResolvedValue(mockNatsConnection);
    const mockStringCodec = jest.fn(() => ({
      decode: jest.fn(),
    }));

    // Mock del módulo NATS
    jest.unstable_mockModule('nats', () => ({
      connect: mockConnect,
      StringCodec: mockStringCodec,
    }));

    // Mock de las funciones de Elasticsearch
    const mockIndexProduct = jest.fn();
    const mockDeleteProductFromIndex = jest.fn();

    jest.unstable_mockModule('../elastic/productIndex.js', () => ({
      indexProduct: mockIndexProduct,
      deleteProductFromIndex: mockDeleteProductFromIndex,
    }));

    // Import dinámico después de configurar los mocks
    const baseListenerModule = await import('../listeners/BaseListener.js');
    BaseListener = baseListenerModule.BaseListener;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    testListener = new BaseListener('test.subject', 'TestListener');
  });

  describe('BaseListener', () => {
    test('should initialize with correct properties', () => {
      expect(testListener.subject).toBe('test.subject');
      expect(testListener.listenerName).toBe('TestListener');
      expect(testListener.natsUrl).toBe('nats://localhost:4222');
      expect(testListener.reconnectDelay).toBe(5000);
      expect(testListener.maxReconnectAttempts).toBe(10);
    });

    test('should use NATS_URL from environment', () => {
      process.env.NATS_URL = 'nats://test-server:4222';
      const listener = new BaseListener('test.subject', 'TestListener');
      expect(listener.natsUrl).toBe('nats://test-server:4222');

      // Limpiar variable de entorno
      delete process.env.NATS_URL;
    });

    test('should clean product data correctly', () => {
      const productData = {
        id: '123',
        name: 'Test Product',
        createdBy: { name: 'User', id: 'user123' },
        approvedBy: { name: 'Admin', id: 'admin123' },
        brand: 'Test Brand',
      };

      const cleaned = testListener.cleanProductData(productData);

      expect(cleaned).toEqual({
        id: '123',
        name: 'Test Product',
        brand: 'Test Brand',
      });
      expect(cleaned.createdBy).toBeUndefined();
      expect(cleaned.approvedBy).toBeUndefined();
    });

    test('should throw error when handleMessage is not implemented', async () => {
      await expect(testListener.handleMessage({})).rejects.toThrow(
        'handleMessage debe ser implementado por la clase hija'
      );
    });

    test('should close NATS connection', async () => {
      const mockConnection = { close: jest.fn() };
      testListener.natsConnection = mockConnection;

      await testListener.close();

      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('should handle close when no connection exists', async () => {
      testListener.natsConnection = null;

      // Should not throw error
      await expect(testListener.close()).resolves.not.toThrow();
    });

    test('should handle reconnection attempts', async () => {
      testListener.reconnectAttempts = 5;
      testListener.maxReconnectAttempts = 10;

      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        // Execute callback immediately for testing
        callback();
        return 'timeout-id';
      });

      testListener.start = jest.fn();

      await testListener.handleReconnection();

      expect(testListener.reconnectAttempts).toBe(6);
      expect(global.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        5000
      );

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    test('should stop reconnection after max attempts', async () => {
      testListener.reconnectAttempts = 10;
      testListener.maxReconnectAttempts = 10;

      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn();

      await testListener.handleReconnection();

      expect(global.setTimeout).not.toHaveBeenCalled();

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Event Listener Message Handling', () => {
    let mockIndexProduct;
    let mockDeleteProductFromIndex;

    beforeAll(async () => {
      // Setup mocks for this describe block
      mockIndexProduct = jest.fn();
      mockDeleteProductFromIndex = jest.fn();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle product created events', async () => {
      const productData = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        brand: 'Test Brand',
        createdBy: { name: 'User', id: 'user123' },
      };

      // Simular manejo de mensaje de ProductCreatedListener
      const listener = new BaseListener(
        'product.created',
        'ProductCreatedListener'
      );

      // Override handleMessage para simular ProductCreatedListener
      listener.handleMessage = async (messageData) => {
        const cleanData = listener.cleanProductData(messageData);
        await mockIndexProduct(cleanData);
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        brand: 'Test Brand',
        // createdBy should be removed
      });
    });

    test('should handle product deleted events', async () => {
      const productData = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
      };

      // Simular manejo de mensaje de ProductDeletedListener
      const listener = new BaseListener(
        'product.deleted',
        'ProductDeletedListener'
      );

      // Override handleMessage para simular ProductDeletedListener
      listener.handleMessage = async (messageData) => {
        await mockDeleteProductFromIndex(messageData.id);
      };

      await listener.handleMessage(productData);

      expect(mockDeleteProductFromIndex).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    test('should handle product updated events', async () => {
      const productData = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Updated Test Product',
        brand: 'Updated Brand',
        updatedBy: { name: 'Editor', id: 'editor123' },
      };

      // Simular manejo de mensaje de ProductUpdatedListener
      const listener = new BaseListener(
        'product.updated',
        'ProductUpdatedListener'
      );

      // Override handleMessage para simular ProductUpdatedListener
      listener.handleMessage = async (messageData) => {
        const cleanData = listener.cleanProductData(messageData);
        await mockIndexProduct(cleanData);
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Updated Test Product',
        brand: 'Updated Brand',
        updatedBy: { name: 'Editor', id: 'editor123' },
        // cleanProductData solo elimina createdBy y approvedBy, no updatedBy
      });
    });

    test('should handle product approved events', async () => {
      const productData = {
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Approved Test Product',
        status: 'published',
        approvedBy: { name: 'Admin', id: 'admin123' },
        approvedAt: new Date().toISOString(),
      };

      // Simular manejo de mensaje de ProductApprovedListener
      const listener = new BaseListener(
        'product.approved',
        'ProductApprovedListener'
      );

      // Override handleMessage para simular ProductApprovedListener
      listener.handleMessage = async (messageData) => {
        const cleanData = listener.cleanProductData(messageData);
        await mockIndexProduct(cleanData);
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Approved Test Product',
        status: 'published',
        approvedAt: productData.approvedAt,
        // approvedBy should be removed
      });
    });
  });
});
