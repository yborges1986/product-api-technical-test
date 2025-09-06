import User from '../../models/user.model.js';

/**
 * Actualizar perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export default async function updateProfile(userId, updateData) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    // Solo permitir actualizar ciertos campos
    const allowedFields = ['name', 'email'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Validar email si se está actualizando
    if (filteredData.email) {
      filteredData.email = filteredData.email.toLowerCase();

      // Verificar que el email no esté en uso por otro usuario
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
