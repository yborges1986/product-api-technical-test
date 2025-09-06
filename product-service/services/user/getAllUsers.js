import User from '../../models/user.model.js';
import { requirePermission } from '../../utils/permissions.util.js';

/**
 * Obtener todos los usuarios (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @returns {Promise<Array>} Lista de usuarios
 */
export default async function getAllUsers(currentUser) {
  try {
    // Verificar permisos
    requirePermission(currentUser, 'users', 'read_all');

    const users = await User.find({}).sort({ createdAt: -1 });

    return users.map((user) => user.publicInfo);
  } catch (error) {
    throw new Error(error.message);
  }
}
