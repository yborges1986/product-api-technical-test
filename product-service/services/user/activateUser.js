import User from '../../models/user.model.js';
import { requirePermission } from '../../utils/permissions.util.js';

/**
 * Activar un usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Usuario actualizado
 */
export default async function activateUser(currentUser, userId) {
  try {
    requirePermission(currentUser, 'users', 'update_all');

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
