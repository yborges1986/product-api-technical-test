import User from '../../models/user.model.js';
import {
  requirePermission,
  canAccessUser,
} from '../../utils/permissions.util.js';

/**
 * Obtener un usuario por ID
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario a obtener
 * @returns {Promise<Object>} Usuario encontrado
 */
export default async function getUserById(currentUser, userId) {
  try {
    // Verificar si puede acceder a este usuario
    if (!canAccessUser(currentUser, userId)) {
      requirePermission(currentUser, 'users', 'read_all');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
