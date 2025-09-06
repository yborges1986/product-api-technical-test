import User from '../../models/user.model.js';
import { requirePermission } from '../../utils/permissions.util.js';

/**
 * Eliminar un usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario a eliminar
 * @returns {Promise<boolean>} True si se eliminó exitosamente
 */
export default async function deleteUser(currentUser, userId) {
  try {
    // Verificar permisos
    requirePermission(currentUser, 'users', 'delete');

    // No permitir auto-eliminación
    if (currentUser.id === userId || currentUser.userId === userId) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await User.findByIdAndDelete(userId);

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
