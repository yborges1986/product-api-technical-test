import bcrypt from 'bcryptjs';

/**
 * Hashea una contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
export const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compara una contraseña en texto plano con una hasheada
 * @param {string} plainPassword - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} True si coinciden
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Valida que una contraseña cumpla los requisitos mínimos
 * @param {string} password - Contraseña a validar
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('La contraseña es requerida');
    return { valid: false, errors };
  }

  if (typeof password !== 'string') {
    errors.push('La contraseña debe ser una cadena de texto');
    return { valid: false, errors };
  }

  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (password.length > 100) {
    errors.push('La contraseña no puede exceder 100 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Genera una contraseña temporal aleatoria
 * @param {number} length - Longitud de la contraseña (default: 12)
 * @returns {string} Contraseña generada
 */
export const generateTemporaryPassword = (length = 12) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};
