import User from '../../models/user.model.js';
import { requirePermission } from '../../utils/permissions.util.js';

/**
 * Desactivar un usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Usuario actualizado
 */
export default async function deactivateUser(currentUser, userId) {
  try {
    requirePermission(currentUser, 'users', 'update_all');

    // No permitir auto-desactivación
    if (currentUser.id === userId || currentUser.userId === userId) {
      throw new Error('No puedes desactivar tu propia cuenta');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
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
