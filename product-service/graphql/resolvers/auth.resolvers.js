import {
  login,
  getMe,
  changePassword,
  updateProfile,
} from '../../services/auth/index.js';

// Resolvers para autenticación
export const authResolvers = {
  // Queries
  me: async (args, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const user = await getMe(context.user.id);
      return user;
    } catch (error) {
      throw new Error(`Error obteniendo perfil: ${error.message}`);
    }
  },

  // Mutations
  login: async ({ input }, context) => {
    try {
      const { email, password } = input;
      const result = await login(email, password);
      return result;
    } catch (error) {
      throw new Error(`Error en login: ${error.message}`);
    }
  },

  changePassword: async ({ input }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const { currentPassword, newPassword } = input;
      await changePassword(context.user.id, currentPassword, newPassword);
      return true;
    } catch (error) {
      throw new Error(`Error cambiando contraseña: ${error.message}`);
    }
  },

  updateProfile: async ({ input }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const updatedUser = await updateProfile(context.user.id, input);
      return updatedUser;
    } catch (error) {
      throw new Error(`Error actualizando perfil: ${error.message}`);
    }
  },
};
