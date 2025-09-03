import User from '../models/user.model.js';

/**
 * Datos del usuario administrador inicial
 */
const ADMIN_USER_DATA = {
  name: 'Administrador Principal',
  email: 'admin@treew.com',
  password: 'admin1234',
  role: 'admin',
  isActive: true,
};

/**
 * Usuarios adicionales de prueba
 */
const TEST_USERS = [
  {
    name: 'Editor de Prueba',
    email: 'editor@test.com',
    password: 'editor123',
    role: 'editor',
    isActive: true,
  },
  {
    name: 'Proveedor de Prueba',
    email: 'provider@test.com',
    password: 'provider123',
    role: 'provider',
    isActive: true,
  },
];

/**
 * Crear usuario administrador inicial
 */
export const createAdminUser = async () => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({
      email: ADMIN_USER_DATA.email,
    });

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe:', ADMIN_USER_DATA.email);
      return existingAdmin;
    }

    // Crear usuario admin
    const adminUser = new User(ADMIN_USER_DATA);
    await adminUser.save();

    console.log('🎉 Usuario admin creado exitosamente:');
    console.log(`   Email: ${ADMIN_USER_DATA.email}`);
    console.log(`   Password: ${ADMIN_USER_DATA.password}`);
    console.log(`   Rol: ${ADMIN_USER_DATA.role}`);

    return adminUser;
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message);
    throw error;
  }
};

/**
 * Crear usuarios de prueba
 */
export const createTestUsers = async () => {
  try {
    console.log('🧪 Creando usuarios de prueba...');

    for (const userData of TEST_USERS) {
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(
          `✅ Usuario de prueba creado: ${userData.email} (${userData.role})`
        );
      } else {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
      }
    }

    console.log('🎉 Usuarios de prueba listos');
  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error.message);
    throw error;
  }
};

/**
 * Inicializar todos los usuarios (admin + prueba)
 */
export const initializeUsers = async () => {
  try {
    console.log('🚀 Inicializando usuarios del sistema...');

    // Crear admin
    await createAdminUser();

    // Crear usuarios de prueba (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await createTestUsers();
    }

    console.log('✅ Inicialización de usuarios completada');
  } catch (error) {
    console.error('❌ Error en inicialización de usuarios:', error.message);
    // No lanzar error para que la app pueda continuar
  }
};

/**
 * Limpiar usuarios de prueba (para testing)
 */
export const cleanTestUsers = async () => {
  try {
    const testEmails = TEST_USERS.map((user) => user.email);
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('🧹 Usuarios de prueba eliminados');
  } catch (error) {
    console.error('❌ Error limpiando usuarios de prueba:', error.message);
  }
};

/**
 * Verificar que el sistema tiene al menos un admin
 */
export const ensureAdminExists = async () => {
  try {
    const adminCount = await User.countDocuments({
      role: 'admin',
      isActive: true,
    });

    if (adminCount === 0) {
      console.log(
        '⚠️  No hay administradores activos, creando admin por defecto...'
      );
      await createAdminUser();
    }
  } catch (error) {
    console.error('❌ Error verificando admin:', error.message);
  }
};
