import { describe, it, expect, beforeEach } from '@jest/globals';
import login from '../../services/auth/login.js';
import createProduct from '../../services/product/createProduct.js';
import approveProduct from '../../services/product/approveProduct.js';
import { getProducts } from '../../services/product/getProduct.js';
import User from '../../models/user.model.js';
import { Product } from '../../models/index.js';
import { calculateCheckDigit } from '../../utils/gtin.util.js';
import mongoose from 'mongoose';

// Tests de servicios (más simples que GraphQL completo)
describe('Service Layer Integration Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    // Conectar a base de datos de test si no está conectado
    if (mongoose.connection.readyState !== 1) {
      const testDbUri =
        process.env.MONGODB_TEST_URI ||
        'mongodb://localhost:27017/treew_test_services';
      try {
        await mongoose.connect(testDbUri);
        console.log('🧪 Connected to services test database');
      } catch (error) {
        console.warn(
          '⚠️ Could not connect to database, skipping service tests'
        );
        return;
      }
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      return; // Skip if no connection
    }

    // Limpiar datos
    await User.deleteMany({});
    await Product.deleteMany({});

    // Crear usuarios de test
    const admin = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });

    const editor = new User({
      name: 'Test Editor',
      email: 'editor@test.com',
      password: 'editor123',
      role: 'editor',
      isActive: true,
    });

    const provider = new User({
      name: 'Test Provider',
      email: 'provider@test.com',
      password: 'provider123',
      role: 'provider',
      isActive: true,
    });

    testUsers.admin = await admin.save();
    testUsers.editor = await editor.save();
    testUsers.provider = await provider.save();
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await User.deleteMany({});
        await Product.deleteMany({});
        await mongoose.disconnect();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Authentication Service', () => {
    it('should login with valid credentials', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await login('admin@test.com', 'admin123');

      expect(result).toBeTruthy();
      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      await expect(login('admin@test.com', 'wrongpassword')).rejects.toThrow();
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
      expect(result.createdBy.toString()).toBe(
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
      expect(result.approvedBy.toString()).toBe(testUsers.admin._id.toString());
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
      expect(result.approvedBy.toString()).toBe(
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
    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      // Crear productos de diferentes usuarios
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
    });

    it('should allow admin to see all products', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

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

      const products = await getProducts(testUsers.provider);

      // Provider should only see their own products
      const providerProducts = products.filter(
        (p) => p.createdBy.toString() === testUsers.provider._id.toString()
      );

      expect(providerProducts.length).toBe(1);
      expect(providerProducts[0].name).toBe('Provider Product');
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
