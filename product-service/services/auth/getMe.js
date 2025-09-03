import User from '../../models/user.model.js';

/**
 * Obtener información del usuario autenticado
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Información del usuario
 */
export default async function getMe(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    return user.publicInfo;
  } catch (error) {
    throw new Error(error.message);
  }
}
