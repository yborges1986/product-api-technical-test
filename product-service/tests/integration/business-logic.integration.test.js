import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import { Product } from '../../models/index.js';
import { calculateCheckDigit } from '../../utils/gtin.util.js';
import {
  cleanTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from '../setup/testCleanup.js';

// Tests de integración para reglas de negocio
describe('Business Logic Integration Tests', () => {
  let testCounter = 0;

  // Helper para generar emails únicos
  const getUniqueEmail = (role) =>
    `${role}-${Date.now()}-${++testCounter}@test.com`;

  beforeAll(async () => {
    const connected = await connectTestDatabase();
    if (!connected) {
      console.warn('⚠️ Skipping business logic tests - no database connection');
    }
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // Clean collections before each test
    if (mongoose.connection.readyState !== 1) {
      return; // Skip if no connection
    }

    await cleanTestDatabase();
  });

  describe('User Model', () => {
    it('should create users with different roles', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const adminUser = new User({
        name: 'Test Admin',
        email: getUniqueEmail('admin'),
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });

      const savedAdmin = await adminUser.save();
      expect(savedAdmin.role).toBe('admin');
      expect(savedAdmin.email).toBe(adminUser.email);

      const providerUser = new User({
        name: 'Test Provider',
        email: getUniqueEmail('provider'),
        password: 'provider123',
        role: 'provider',
        isActive: true,
      });

      const savedProvider = await providerUser.save();
      expect(savedProvider.role).toBe('provider');
    });
  });

  describe('Product Creation Logic', () => {
    let testUsers = {};

    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) {
        return; // Skip if no connection
      }

      // Create test users
      const admin = new User({
        name: 'Admin',
        email: getUniqueEmail('admin'),
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });

      const provider = new User({
        name: 'Provider',
        email: getUniqueEmail('provider'),
        password: 'provider123',
        role: 'provider',
        isActive: true,
      });

      testUsers.admin = await admin.save();
      testUsers.provider = await provider.save();
    });

    it('should create product with pending status for provider', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Generate valid GTIN
      const base = '123456789012';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const product = new Product({
        gtin: validGTIN,
        name: 'Test Product',
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

      expect(savedProduct.status).toBe('pending');
      expect(savedProduct.createdBy.toString()).toBe(
        testUsers.provider._id.toString()
      );
    });

    it('should create product with published status for admin', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Generate valid GTIN
      const base = '987654321098';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const product = new Product({
        gtin: validGTIN,
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

      product.setAuditUser(testUsers.admin._id);
      const savedProduct = await product.save();

      expect(savedProduct.status).toBe('published');
      expect(savedProduct.createdBy.toString()).toBe(
        testUsers.admin._id.toString()
      );
      expect(savedProduct.approvedBy.toString()).toBe(
        testUsers.admin._id.toString()
      );
    });
  });

  describe('Product Approval Logic', () => {
    let testUsers = {};
    let pendingProduct;

    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      // Create test users
      const admin = new User({
        name: 'Admin',
        email: getUniqueEmail('admin'),
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });

      const provider = new User({
        name: 'Provider',
        email: getUniqueEmail('provider'),
        password: 'provider123',
        role: 'provider',
        isActive: true,
      });

      testUsers.admin = await admin.save();
      testUsers.provider = await provider.save();

      // Create pending product
      const base = '555666777888';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const product = new Product({
        gtin: validGTIN,
        name: 'Pending Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 150,
        netWeightUnit: 'g',
        status: 'pending',
        createdBy: testUsers.provider._id,
      });

      product.setAuditUser(testUsers.provider._id);
      pendingProduct = await product.save();
    });

    it('should approve pending product', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Approve product
      pendingProduct.status = 'published';
      pendingProduct.approvedBy = testUsers.admin._id;
      pendingProduct.approvedAt = new Date();

      pendingProduct.setAuditUser(testUsers.admin._id);
      await pendingProduct.recordApproval(testUsers.admin._id);

      const approvedProduct = await pendingProduct.save();

      expect(approvedProduct.status).toBe('published');
      expect(approvedProduct.approvedBy.toString()).toBe(
        testUsers.admin._id.toString()
      );
      expect(approvedProduct.approvedAt).toBeTruthy();
    });
  });

  describe('GTIN Validation Integration', () => {
    it('should validate GTIN during product creation', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('Skipping test - no database connection');
        return;
      }

      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123',
        role: 'admin',
        isActive: true,
      });
      const savedUser = await user.save();

      // Valid GTIN
      const validBase = '123456789012';
      const validCheckDigit = calculateCheckDigit(validBase);
      const validGTIN = validBase + validCheckDigit;

      const validProduct = new Product({
        gtin: validGTIN,
        name: 'Valid Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'published',
        createdBy: savedUser._id,
      });

      validProduct.setAuditUser(savedUser._id);
      const savedValidProduct = await validProduct.save();
      expect(savedValidProduct.gtin).toBe(validGTIN);

      // Invalid GTIN should fail
      const invalidProduct = new Product({
        gtin: '1234567890123', // Invalid check digit
        name: 'Invalid Product',
        description: 'Test Description',
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        netWeight: 100,
        netWeightUnit: 'g',
        status: 'published',
        createdBy: savedUser._id,
      });

      invalidProduct.setAuditUser(savedUser._id);

      await expect(invalidProduct.save()).rejects.toThrow();
    });
  });
});
