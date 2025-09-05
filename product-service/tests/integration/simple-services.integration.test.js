import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from '@jest/globals';
import login from '../../services/auth/login.js';
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

describe('Simple Service Integration Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    const connected = await connectTestDatabase();
    if (!connected) {
      console.warn(
        '⚠️ Skipping simple services tests - no database connection'
      );
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      return;
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

    it('should reject login for inactive user', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Desactivar usuario
      await User.updateOne(
        { email: testUsers.adminEmail },
        { isActive: false }
      );

      await expect(login(testUsers.adminEmail, 'admin123')).rejects.toThrow(
        'Usuario desactivado'
      );
    });
  });

  describe('Direct Product Creation (No Service Layer)', () => {
    it('should create product directly with valid GTIN', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const base = '123456789012';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const product = new Product({
        gtin: validGTIN,
        name: 'Direct Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.provider._id,
      });

      product.setAuditUser(testUsers.provider._id);
      const savedProduct = await product.save();

      expect(savedProduct.gtin).toBe(validGTIN);
      expect(savedProduct.status).toBe('pending');
      expect(savedProduct.createdBy.toString()).toBe(
        testUsers.provider._id.toString()
      );
    });

    it('should reject duplicate GTIN', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const base = '987654321098';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      // Crear primer producto
      const product1 = new Product({
        gtin: validGTIN,
        name: 'First Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.provider._id,
      });

      product1.setAuditUser(testUsers.provider._id);
      await product1.save();

      // Intentar crear segundo producto con mismo GTIN
      const product2 = new Product({
        gtin: validGTIN,
        name: 'Second Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 200,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.admin._id,
      });

      product2.setAuditUser(testUsers.admin._id);
      await expect(product2.save()).rejects.toThrow();
    });

    it('should reject invalid GTIN', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const product = new Product({
        gtin: '1234567890123', // Invalid check digit
        name: 'Invalid Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.provider._id,
      });

      product.setAuditUser(testUsers.provider._id);
      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Product Queries', () => {
    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      // Crear productos de prueba
      const providerGTIN = '111222333444' + calculateCheckDigit('111222333444');
      const adminGTIN = '444555666777' + calculateCheckDigit('444555666777');

      const providerProduct = new Product({
        gtin: providerGTIN,
        name: 'Provider Product',
        description: 'Provider Description',
        brand: 'Provider Brand',
        manufacturer: 'Provider Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.provider._id,
      });

      const adminProduct = new Product({
        gtin: adminGTIN,
        name: 'Admin Product',
        description: 'Admin Description',
        brand: 'Admin Brand',
        manufacturer: 'Admin Manufacturer',
        netWeight: 200,
        netWeightUnit: 'g',
        status: 'published',
        createdBy: testUsers.admin._id,
        approvedBy: testUsers.admin._id,
        approvedAt: new Date(),
      });

      providerProduct.setAuditUser(testUsers.provider._id);
      adminProduct.setAuditUser(testUsers.admin._id);

      await providerProduct.save();
      await adminProduct.save();
    });

    it('should find products by status', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const pendingProducts = await Product.find({ status: 'pending' });
      const publishedProducts = await Product.find({ status: 'published' });

      expect(pendingProducts.length).toBe(1);
      expect(publishedProducts.length).toBe(1);

      expect(pendingProducts[0].name).toBe('Provider Product');
      expect(publishedProducts[0].name).toBe('Admin Product');
    });

    it('should find products by creator', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const providerProducts = await Product.find({
        createdBy: testUsers.provider._id,
      });
      const adminProducts = await Product.find({
        createdBy: testUsers.admin._id,
      });

      expect(providerProducts.length).toBe(1);
      expect(adminProducts.length).toBe(1);

      expect(providerProducts[0].name).toBe('Provider Product');
      expect(adminProducts[0].name).toBe('Admin Product');
    });

    it('should populate creator information', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const products = await Product.find({}).populate('createdBy');

      expect(products.length).toBe(2);

      products.forEach((product) => {
        expect(product.createdBy.name).toBeTruthy();
        expect(product.createdBy.email).toBeTruthy();
        expect(product.createdBy.role).toBeTruthy();
      });
    });
  });

  describe('User Role Validation', () => {
    it('should validate user roles correctly', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      expect(testUsers.admin.role).toBe('admin');
      expect(testUsers.editor.role).toBe('editor');
      expect(testUsers.provider.role).toBe('provider');

      // Verificar que todos están activos
      expect(testUsers.admin.isActive).toBe(true);
      expect(testUsers.editor.isActive).toBe(true);
      expect(testUsers.provider.isActive).toBe(true);
    });

    it('should hash passwords correctly', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Verificar que se pueden obtener usuarios desde la BD con contraseñas hasheadas
      const adminFromDB = await User.findById(testUsers.admin._id).select(
        '+password'
      );
      const editorFromDB = await User.findById(testUsers.editor._id).select(
        '+password'
      );
      const providerFromDB = await User.findById(testUsers.provider._id).select(
        '+password'
      );

      expect(adminFromDB.password).not.toBe('admin123');
      expect(editorFromDB.password).not.toBe('editor123');
      expect(providerFromDB.password).not.toBe('provider123'); // Verificar que la comparación funciona
      const isAdminPasswordValid = await adminFromDB.comparePassword(
        'admin123'
      );
      const isEditorPasswordValid = await editorFromDB.comparePassword(
        'editor123'
      );
      const isProviderPasswordValid = await providerFromDB.comparePassword(
        'provider123'
      );

      expect(isAdminPasswordValid).toBe(true);
      expect(isEditorPasswordValid).toBe(true);
      expect(isProviderPasswordValid).toBe(true);
    });
  });
});
