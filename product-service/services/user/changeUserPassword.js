import User from '../../models/user.model.js';
import { validatePassword } from '../../utils/password.util.js';
import { requirePermission } from '../../utils/permissions.util.js';

/**
 * Cambiar contraseña de cualquier usuario (solo admin)
 * @param {Object} currentUser - Usuario que hace la petición
 * @param {string} userId - ID del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<boolean>} True si se cambió exitosamente
 */
export default async function changeUserPassword(
  currentUser,
  userId,
  newPassword
) {
  try {
    // Verificar permisos
    requirePermission(currentUser, 'users', 'change_any_password');

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('Usuario no encontrado');
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
