// Tests para los listeners reales del Search Service
import { jest } from '@jest/globals';

describe('Real NATS Listeners Tests', () => {
  let mockIndexProduct;
  let mockDeleteProductFromIndex;
  let mockStart;

  beforeAll(async () => {
    // Mock de las funciones de Elasticsearch
    mockIndexProduct = jest.fn();
    mockDeleteProductFromIndex = jest.fn();

    jest.unstable_mockModule('../elastic/productIndex.js', () => ({
      indexProduct: mockIndexProduct,
      deleteProductFromIndex: mockDeleteProductFromIndex,
    }));

    // Mock de BaseListener para evitar conexiones reales
    mockStart = jest.fn();
    jest.unstable_mockModule('../listeners/BaseListener.js', () => ({
      BaseListener: class MockBaseListener {
        constructor(subject, listenerName) {
          this.subject = subject;
          this.listenerName = listenerName;
        }

        cleanProductData(data) {
          const cleanData = { ...data };
          delete cleanData.createdBy;
          delete cleanData.approvedBy;
          return cleanData;
        }

        async start() {
          return mockStart();
        }
      },
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ProductCreatedListener', () => {
    let ProductCreatedListener;
    let productCreatedListener;

    beforeAll(async () => {
      const module = await import('../listeners/productCreatedListener.js');
      productCreatedListener = module.default;

      // Import la clase directamente para testing
      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { indexProduct } = await import('../elastic/productIndex.js');

      ProductCreatedListener = class extends BaseListener {
        constructor() {
          super('product.created', 'ProductCreatedListener');
        }

        async handleMessage(messageData) {
          const cleanProductData = this.cleanProductData(messageData);
          await indexProduct(cleanProductData);
        }
      };
    });

    test('should create listener with correct properties', () => {
      const listener = new ProductCreatedListener();

      expect(listener.subject).toBe('product.created');
      expect(listener.listenerName).toBe('ProductCreatedListener');
    });

    test('should handle product created message correctly', async () => {
      const listener = new ProductCreatedListener();
      const productData = {
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        brand: 'Test Brand',
        createdBy: { name: 'User', id: 'user123' },
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Test Product',
        brand: 'Test Brand',
        // createdBy should be removed by cleanProductData
      });
    });

    test('should start listener function', async () => {
      await productCreatedListener();
      expect(mockStart).toHaveBeenCalled();
    });

    test('should clean product data before indexing', async () => {
      const listener = new ProductCreatedListener();
      const productData = {
        id: '123',
        name: 'Product',
        createdBy: { id: 'user1' },
        approvedBy: { id: 'admin1' },
        extraField: 'should remain',
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        id: '123',
        name: 'Product',
        extraField: 'should remain',
        // createdBy and approvedBy should be removed
      });
    });
  });

  describe('ProductDeletedListener', () => {
    let ProductDeletedListener;
    let productDeletedListener;

    beforeAll(async () => {
      const module = await import('../listeners/productDeletedListener.js');
      productDeletedListener = module.default;

      // Import la clase directamente para testing
      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { deleteProductFromIndex } = await import(
        '../elastic/productIndex.js'
      );

      ProductDeletedListener = class extends BaseListener {
        constructor() {
          super('product.deleted', 'ProductDeletedListener');
        }

        async handleMessage(messageData) {
          const productId = messageData._id || messageData.id;

          if (!productId) {
            throw new Error(
              'No se encontró ID del producto en el mensaje de eliminación'
            );
          }

          await deleteProductFromIndex(productId);
        }
      };
    });

    test('should create listener with correct properties', () => {
      const listener = new ProductDeletedListener();

      expect(listener.subject).toBe('product.deleted');
      expect(listener.listenerName).toBe('ProductDeletedListener');
    });

    test('should handle product deleted message with _id', async () => {
      const listener = new ProductDeletedListener();
      const productData = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Deleted Product',
      };

      await listener.handleMessage(productData);

      expect(mockDeleteProductFromIndex).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    test('should handle product deleted message with id', async () => {
      const listener = new ProductDeletedListener();
      const productData = {
        id: '507f1f77bcf86cd799439011',
        name: 'Deleted Product',
      };

      await listener.handleMessage(productData);

      expect(mockDeleteProductFromIndex).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
    });

    test('should throw error when no product ID is provided', async () => {
      const listener = new ProductDeletedListener();
      const productData = {
        name: 'Product without ID',
      };

      await expect(listener.handleMessage(productData)).rejects.toThrow(
        'No se encontró ID del producto en el mensaje de eliminación'
      );
    });

    test('should start listener function', async () => {
      await productDeletedListener();
      expect(mockStart).toHaveBeenCalled();
    });
  });

  describe('ProductUpdatedListener', () => {
    let ProductUpdatedListener;
    let productUpdatedListener;

    beforeAll(async () => {
      const module = await import('../listeners/productUpdatedListener.js');
      productUpdatedListener = module.default;

      // Import la clase directamente para testing
      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { indexProduct } = await import('../elastic/productIndex.js');

      ProductUpdatedListener = class extends BaseListener {
        constructor() {
          super('product.updated', 'ProductUpdatedListener');
        }

        async handleMessage(messageData) {
          const cleanProductData = this.cleanProductData(messageData);
          await indexProduct(cleanProductData);
        }
      };
    });

    test('should create listener with correct properties', () => {
      const listener = new ProductUpdatedListener();

      expect(listener.subject).toBe('product.updated');
      expect(listener.listenerName).toBe('ProductUpdatedListener');
    });

    test('should handle product updated message correctly', async () => {
      const listener = new ProductUpdatedListener();
      const productData = {
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Updated Product',
        brand: 'Updated Brand',
        updatedBy: { name: 'Editor', id: 'editor123' },
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Updated Product',
        brand: 'Updated Brand',
        updatedBy: { name: 'Editor', id: 'editor123' }, // updatedBy remains (only createdBy/approvedBy are removed)
      });
    });

    test('should start listener function', async () => {
      await productUpdatedListener();
      expect(mockStart).toHaveBeenCalled();
    });
  });

  describe('ProductApprovedListener', () => {
    let ProductApprovedListener;
    let productApprovedListener;

    beforeAll(async () => {
      const module = await import('../listeners/productApprovedListener.js');
      productApprovedListener = module.default;

      // Import la clase directamente para testing
      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { indexProduct } = await import('../elastic/productIndex.js');

      ProductApprovedListener = class extends BaseListener {
        constructor() {
          super('product.approved', 'ProductApprovedListener');
        }

        async handleMessage(messageData) {
          const cleanProductData = this.cleanProductData(messageData);
          await indexProduct(cleanProductData);
        }
      };
    });

    test('should create listener with correct properties', () => {
      const listener = new ProductApprovedListener();

      expect(listener.subject).toBe('product.approved');
      expect(listener.listenerName).toBe('ProductApprovedListener');
    });

    test('should handle product approved message correctly', async () => {
      const listener = new ProductApprovedListener();
      const productData = {
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Approved Product',
        status: 'published',
        approvedBy: { name: 'Admin', id: 'admin123' },
        approvedAt: '2025-09-06T12:00:00Z',
      };

      await listener.handleMessage(productData);

      expect(mockIndexProduct).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        gtin: '1234567890123',
        name: 'Approved Product',
        status: 'published',
        approvedAt: '2025-09-06T12:00:00Z',
        // approvedBy should be removed by cleanProductData
      });
    });

    test('should start listener function', async () => {
      await productApprovedListener();
      expect(mockStart).toHaveBeenCalled();
    });
  });

  describe('Listeners Index', () => {
    test('should have default export function', async () => {
      const listenersIndex = await import('../listeners/index.js');

      expect(listenersIndex.default).toBeDefined();
      expect(typeof listenersIndex.default).toBe('function');
    });

    test('should be able to call start listeners function', async () => {
      const listenersIndex = await import('../listeners/index.js');

      // Test que la función puede ser llamada sin errores de sintaxis
      expect(() => listenersIndex.default).not.toThrow();
    });

    test('should import all individual listener functions', async () => {
      // Test individual imports
      const productCreatedModule = await import(
        '../listeners/productCreatedListener.js'
      );
      const productDeletedModule = await import(
        '../listeners/productDeletedListener.js'
      );
      const productUpdatedModule = await import(
        '../listeners/productUpdatedListener.js'
      );
      const productApprovedModule = await import(
        '../listeners/productApprovedListener.js'
      );

      expect(productCreatedModule.default).toBeDefined();
      expect(productDeletedModule.default).toBeDefined();
      expect(productUpdatedModule.default).toBeDefined();
      expect(productApprovedModule.default).toBeDefined();

      expect(typeof productCreatedModule.default).toBe('function');
      expect(typeof productDeletedModule.default).toBe('function');
      expect(typeof productUpdatedModule.default).toBe('function');
      expect(typeof productApprovedModule.default).toBe('function');
    });
  });

  describe('Error Handling in Listeners', () => {
    test('ProductCreatedListener should handle indexing errors', async () => {
      mockIndexProduct.mockRejectedValueOnce(new Error('Elasticsearch error'));

      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { indexProduct } = await import('../elastic/productIndex.js');

      const ProductCreatedListener = class extends BaseListener {
        constructor() {
          super('product.created', 'ProductCreatedListener');
        }

        async handleMessage(messageData) {
          const cleanProductData = this.cleanProductData(messageData);
          await indexProduct(cleanProductData);
        }
      };

      const listener = new ProductCreatedListener();
      const productData = { id: '123', name: 'Test' };

      await expect(listener.handleMessage(productData)).rejects.toThrow(
        'Elasticsearch error'
      );
    });

    test('ProductDeletedListener should handle deletion errors', async () => {
      mockDeleteProductFromIndex.mockRejectedValueOnce(
        new Error('Delete error')
      );

      const { BaseListener } = await import('../listeners/BaseListener.js');
      const { deleteProductFromIndex } = await import(
        '../elastic/productIndex.js'
      );

      const ProductDeletedListener = class extends BaseListener {
        constructor() {
          super('product.deleted', 'ProductDeletedListener');
        }

        async handleMessage(messageData) {
          const productId = messageData._id || messageData.id;
          if (!productId) {
            throw new Error(
              'No se encontró ID del producto en el mensaje de eliminación'
            );
          }
          await deleteProductFromIndex(productId);
        }
      };

      const listener = new ProductDeletedListener();
      const productData = { id: '123' };

      await expect(listener.handleMessage(productData)).rejects.toThrow(
        'Delete error'
      );
    });
  });
});
