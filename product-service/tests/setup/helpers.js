import User from '../../models/user.model.js';
import { Product } from '../../models/index.js';
import { calculateCheckDigit } from '../../utils/gtin.util.js';

/**
 * Usuarios de prueba para testing
 */
export const TEST_USERS = {
  admin: {
    name: 'Test Admin',
    email: 'test-admin@test.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  },
  editor: {
    name: 'Test Editor',
    email: 'test-editor@test.com',
    password: 'editor123',
    role: 'editor',
    isActive: true,
  },
  provider: {
    name: 'Test Provider',
    email: 'test-provider@test.com',
    password: 'provider123',
    role: 'provider',
    isActive: true,
  },
};

/**
 * Crear usuarios de prueba en la base de datos
 */
export async function createTestUsers() {
  const users = {};

  for (const [key, userData] of Object.entries(TEST_USERS)) {
    const user = new User(userData);
    await user.save();
    users[key] = user;
  }

  return users;
}

/**
 * Generar GTIN válido para tests
 */
export function generateTestGTIN(prefix = '123') {
  // Generar GTIN-13 simple para tests
  const base =
    prefix +
    Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, '0');

  // Calcular check digit manualmente para tests
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const digit = parseInt(base[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit.toString();
}

/**
 * Crear producto de prueba
 */
export async function createTestProduct(userData, productData = {}) {
  const defaultProduct = {
    gtin: generateTestGTIN(),
    name: 'Test Product',
    description: 'Test Description',
    brand: 'Test Brand',
    manufacturer: 'Test Manufacturer',
    netWeight: 100,
    netWeightUnit: 'g',
  };

  const product = new Product({
    ...defaultProduct,
    ...productData,
    status: userData.role === 'provider' ? 'pending' : 'published',
    createdBy: userData.id || userData._id,
  });

  product.setAuditUser(userData.id || userData._id);
  return await product.save();
}

/**
 * Limpiar base de datos de test
 */
export async function clearTestDB() {
  await User.deleteMany({});
  await Product.deleteMany({});
}

/**
 * Helper para generar token JWT de test
 */
export function generateTestJWT(user) {
  // Simplificado para tests - en producción usar jwt.util.js
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
