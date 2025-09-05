import User from '../../models/user.model.js';
import { Product, ProductHistory } from '../../models/index.js';
import mongoose from 'mongoose';

/**
 * Limpia completamente la base de datos de test
 */
export async function cleanTestDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      // Limpiar colecciones en orden para evitar conflictos de referencia
      await ProductHistory.deleteMany({});
      await Product.deleteMany({});
      await User.deleteMany({});

      console.log('🧹 Base de datos de test limpiada');
    }
  } catch (error) {
    console.warn('⚠️ Error limpiando base de datos:', error.message);
  }
}

/**
 * Conecta a la base de datos de test de forma segura
 */
export async function connectTestDatabase(dbName) {
  try {
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    // Usar ID del worker de Jest para evitar conflictos entre procesos paralelos
    const workerId = process.env.JEST_WORKER_ID || '1';
    const uniqueDbName = dbName || `treew_test_worker_${workerId}`;

    const testDbUri =
      process.env.MONGODB_TEST_URI ||
      `mongodb://localhost:27017/${uniqueDbName}`;

    await mongoose.connect(testDbUri, {
      serverSelectionTimeoutMS: 5000, // 5 segundos timeout
      socketTimeoutMS: 10000, // 10 segundos socket timeout
    });

    console.log(
      `🧪 Conectado a base de datos de test: ${uniqueDbName} (Worker ${workerId})`
    );
    return true;
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a la base de datos:', error.message);
    return false;
  }
}

/**
 * Desconecta de la base de datos de test de forma segura
 */
export async function disconnectTestDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de base de datos de test');
    }
  } catch (error) {
    console.warn('⚠️ Error desconectando base de datos:', error.message);
  }
}

/**
 * Crea usuarios de test únicos usando timestamp
 */
export async function createTestUsers(suffix = Date.now()) {
  const testUsers = {};

  const admin = new User({
    name: 'Test Admin',
    email: `admin-${suffix}@test.com`,
    password: 'admin123',
    role: 'admin',
    isActive: true,
  });

  const editor = new User({
    name: 'Test Editor',
    email: `editor-${suffix}@test.com`,
    password: 'editor123',
    role: 'editor',
    isActive: true,
  });

  const provider = new User({
    name: 'Test Provider',
    email: `provider-${suffix}@test.com`,
    password: 'provider123',
    role: 'provider',
    isActive: true,
  });

  testUsers.admin = await admin.save();
  testUsers.editor = await editor.save();
  testUsers.provider = await provider.save();

  // Guardar emails para uso en tests
  testUsers.adminEmail = admin.email;
  testUsers.editorEmail = editor.email;
  testUsers.providerEmail = provider.email;

  return testUsers;
}
