import User from '../../models/user.model.js';
import { generateToken } from '../../utils/jwt.util.js';

/**
 * Login de usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Token y información del usuario
 */
export default async function login(email, password) {
  try {
    // Validar que se proporcionen email y password
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    // Buscar usuario por email (incluyendo password)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +passwordChangedAt'
    );

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generar token
    const token = generateToken(user);

    return {
      token,
      user: user.publicInfo,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
