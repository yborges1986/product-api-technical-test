import User from '../models/user.model.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.util.js';

/**
 * Middleware para extraer y verificar JWT token
 * Agrega la información del usuario al contexto de GraphQL
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Si no hay token, continuar sin autenticación
    if (!token) {
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId).select(
      '+passwordChangedAt'
    );

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new Error('Usuario desactivado');
    }

    // Verificar si el password cambió después de emitir el token
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new Error('Token inválido - contraseña modificada');
    }

    // Agregar información del usuario al request
    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(), // Para compatibilidad
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
    req.isAuthenticated = true;

    next();
  } catch (error) {
    // En GraphQL, preferimos agregar el error al contexto en lugar de fallar
    req.user = null;
    req.isAuthenticated = false;
    req.authError = error.message;
    next();
  }
};

/**
 * Middleware que requiere autenticación obligatoria
 * Usado para endpoints REST que requieren login
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Ejecutar el middleware de auth primero
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verificar que el usuario esté autenticado
    if (!req.isAuthenticated || !req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: req.authError || 'Token de acceso requerido',
        code: 'UNAUTHORIZED',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Error de autenticación',
      message: error.message,
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware que requiere un rol específico
 * @param {string|string[]} requiredRoles - Rol o roles requeridos
 */
export const requireRole = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.isAuthenticated || !req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Autenticación requerida',
        code: 'UNAUTHORIZED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Rol requerido: ${roles.join(' o ')}`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Función helper para crear contexto de GraphQL con información de usuario
 * @param {Object} req - Request object
 * @returns {Object} Contexto de GraphQL
 */
export const createGraphQLContext = (req) => {
  return {
    user: req.user,
    isAuthenticated: req.isAuthenticated,
    authError: req.authError,
  };
};
