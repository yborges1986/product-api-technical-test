import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import login from '../../services/auth/login.js';
import createProduct from '../../services/product/createProduct.js';
import approveProduct from '../../services/product/approveProduct.js';
import { getProducts } from '../../services/product/getProduct.js';
import User from '../../models/user.model.js';
import { Product } from '../../models/index.js';
import { calculateCheckDigit } from '../../utils/gtin.util.js';
import mongoose from 'mongoose';
import {
  cleanTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
  createTestUsers,
} from '../setup/testCleanup.js';

// Tests de servicios (más simples que GraphQL completo)
describe('Service Layer Integration Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    const connected = await connectTestDatabase();
    if (!connected) {
      console.warn('⚠️ Skipping service tests - no database connection');
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      return; // Skip if no connection
    }

    // Limpiar datos antes de cada test
    await cleanTestDatabase();

    // Crear usuarios de test únicos para este test
    testUsers = await createTestUsers();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await disconnectTestDatabase();
  });

  describe('Authentication Service', () => {
    it('should login with valid credentials', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await login(testUsers.adminEmail, 'admin123');

      expect(result).toBeTruthy();
      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe(testUsers.adminEmail);
      expect(result.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      await expect(
        login(testUsers.adminEmail, 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('Product Service - Creation', () => {
    it('should create product as provider with pending status', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const base = '123456789012';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const productData = {
        gtin: validGTIN,
        name: 'Provider Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
      };

      const result = await createProduct(productData, testUsers.provider);

      expect(result.status).toBe('pending');
      expect(result.gtin).toBe(validGTIN);
      // El servicio devuelve el objeto usuario completo, no solo el ID
      expect(result.createdBy.id || result.createdBy._id.toString()).toBe(
        testUsers.provider._id.toString()
      );
    });

    it('should create product as admin with published status', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const base = '987654321098';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const productData = {
        gtin: validGTIN,
        name: 'Admin Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 200,
        netWeightUnit: 'g',
      };

      const result = await createProduct(productData, testUsers.admin);

      expect(result.status).toBe('published');
      // El servicio devuelve el objeto usuario completo, no solo el ID
      expect(result.approvedBy.id || result.approvedBy._id.toString()).toBe(
        testUsers.admin._id.toString()
      );
    });
  });

  describe('Product Service - Approval', () => {
    let pendingProductGTIN;

    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      // Crear producto pendiente
      const base = '555666777888';
      const checkDigit = calculateCheckDigit(base);
      pendingProductGTIN = base + checkDigit;

      const productData = {
        gtin: pendingProductGTIN,
        name: 'Pending Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 150,
        netWeightUnit: 'g',
      };

      await createProduct(productData, testUsers.provider);
    });

    it('should allow editor to approve pending product', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await approveProduct(pendingProductGTIN, testUsers.editor);

      expect(result.status).toBe('published');
      // El servicio devuelve el objeto usuario completo, no solo el ID
      expect(result.approvedBy.id || result.approvedBy._id.toString()).toBe(
        testUsers.editor._id.toString()
      );
      expect(result.approvedAt).toBeTruthy();
    });

    it('should deny provider from approving products', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      await expect(
        approveProduct(pendingProductGTIN, testUsers.provider)
      ).rejects.toThrow('No tienes permisos para aprobar productos');
    });
  });

  describe('Product Service - Visibility', () => {
    it('should allow admin to see all products', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Crear productos de diferentes usuarios para este test
      const providerGTIN = '111222333444' + calculateCheckDigit('111222333444');
      const editorGTIN = '444555666777' + calculateCheckDigit('444555666777');

      await createProduct(
        {
          gtin: providerGTIN,
          name: 'Provider Product',
          description: 'Provider Description',
          brand: 'Provider Brand',
          manufacturer: 'Provider Manufacturer',
          netWeight: 100,
          netWeightUnit: 'g',
        },
        testUsers.provider
      );

      await createProduct(
        {
          gtin: editorGTIN,
          name: 'Editor Product',
          description: 'Editor Description',
          brand: 'Editor Brand',
          manufacturer: 'Editor Manufacturer',
          netWeight: 200,
          netWeightUnit: 'g',
        },
        testUsers.editor
      );

      const products = await getProducts(testUsers.admin);

      expect(products.length).toBeGreaterThanOrEqual(2);
      // Admin should see both products
      const names = products.map((p) => p.name);
      expect(names).toContain('Provider Product');
      expect(names).toContain('Editor Product');
    });

    it('should allow provider to see only their products', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Crear productos de diferentes usuarios para este test
      const providerGTIN = '111222333444' + calculateCheckDigit('111222333444');
      const editorGTIN = '444555666777' + calculateCheckDigit('444555666777');

      await createProduct(
        {
          gtin: providerGTIN,
          name: 'Provider Product',
          description: 'Provider Description',
          brand: 'Provider Brand',
          manufacturer: 'Provider Manufacturer',
          netWeight: 100,
          netWeightUnit: 'g',
        },
        testUsers.provider
      );

      await createProduct(
        {
          gtin: editorGTIN,
          name: 'Editor Product',
          description: 'Editor Description',
          brand: 'Editor Brand',
          manufacturer: 'Editor Manufacturer',
          netWeight: 200,
          netWeightUnit: 'g',
        },
        testUsers.editor
      );

      const products = await getProducts(testUsers.provider);

      // Provider should see:
      // 1. Their own products (both pending and published)
      // 2. Published products from other users
      // In this case: 1 pending (provider) + 1 published (editor) = 2 products
      expect(products.length).toBe(2);

      // Verify the provider can see their own pending product
      const providerProduct = products.find(
        (p) => p.name === 'Provider Product'
      );
      expect(providerProduct).toBeTruthy();
      expect(providerProduct.status).toBe('pending');

      // Verify the provider can see the published product from editor
      const publishedProduct = products.find(
        (p) => p.name === 'Editor Product'
      );
      expect(publishedProduct).toBeTruthy();
      expect(publishedProduct.status).toBe('published');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate GTIN error', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const base = '999888777666';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const productData = {
        gtin: validGTIN,
        name: 'First Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
      };

      // Crear primer producto
      await createProduct(productData, testUsers.admin);

      // Intentar crear segundo producto con mismo GTIN
      await expect(
        createProduct(productData, testUsers.admin)
      ).rejects.toThrow();
    });

    it('should handle invalid GTIN during creation', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const productData = {
        gtin: '1234567890123', // Invalid check digit
        name: 'Invalid Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
      };

      await expect(
        createProduct(productData, testUsers.admin)
      ).rejects.toThrow();
    });
  });
});
