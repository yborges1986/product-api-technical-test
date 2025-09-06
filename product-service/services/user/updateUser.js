import User from '../../models/user.model.js';
import {
  requirePermission,
  canAccessUser,
} from '../../utils/permissions.util.js';

/**
 * Actualizar un usuario
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario a actualizar
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export default async function updateUser(currentUser, userId, updateData) {
  try {
    // Verificar permisos
    if (!canAccessUser(currentUser, userId)) {
      requirePermission(currentUser, 'users', 'update_all');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Campos permitidos para actualizar
    const allowedFields = ['name', 'email', 'isActive'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Validar email si se está actualizando
    if (filteredData.email) {
      filteredData.email = filteredData.email.toLowerCase();

      const existingUser = await User.findOne({
        email: filteredData.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new Error('El email ya está en uso');
      }
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    });

    return updatedUser.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
