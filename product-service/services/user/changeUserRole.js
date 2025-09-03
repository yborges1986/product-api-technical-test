import User from '../../models/user.model.js';
import {
  isValidRole,
  requirePermission,
} from '../../utils/permissions.util.js';

/**
 * Cambiar rol de un usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario
 * @param {string} newRole - Nuevo rol
 * @returns {Promise<Object>} Usuario actualizado
 */
export default async function changeUserRole(currentUser, userId, newRole) {
  try {
    // Verificar permisos
    requirePermission(currentUser, 'users', 'change_role');

    // Validar rol
    if (!isValidRole(newRole)) {
      throw new Error('Rol inválido');
    }

    // No permitir cambiar su propio rol
    if (currentUser.id === userId || currentUser.userId === userId) {
      throw new Error('No puedes cambiar tu propio rol');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.role = newRole;
    await user.save();

    return user.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
