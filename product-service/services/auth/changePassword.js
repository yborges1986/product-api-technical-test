import User from '../../models/user.model.js';
import { validatePassword } from '../../utils/password.util.js';

/**
 * Cambiar contraseña del usuario
 * @param {string} userId - ID del usuario
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<boolean>} True si se cambió exitosamente
 */
export default async function changePassword(
  userId,
  currentPassword,
  newPassword
) {
  try {
    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Buscar usuario con password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('La nueva contraseña debe ser diferente a la actual');
    }

    // Actualizar contraseña
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
