import User from '../../models/user.model.js';
import { validatePassword } from '../../utils/password.util.js';
import {
  isValidRole,
  requirePermission,
} from '../../utils/permissions.util.js';

/**
 * Crear un nuevo usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {Object} userData - Datos del nuevo usuario
 * @returns {Promise<Object>} Usuario creado
 */
export default async function createUser(currentUser, userData) {
  try {
    // Verificar permisos
    requirePermission(currentUser, 'users', 'create');

    const { name, email, password, role = 'provider' } = userData;

    // Validaciones
    if (!name || !email || !password) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Validar rol
    if (!isValidRole(role)) {
      throw new Error('Rol inválido');
    }

    // Verificar que el email no esté en uso
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('El email ya está en uso');
    }

    // Crear usuario
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
    });

    await newUser.save();

    return newUser.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
