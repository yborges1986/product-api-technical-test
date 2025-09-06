import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  changeUserPassword,
  activateUser,
  deactivateUser,
} from '../../services/user/index.js';

// Resolvers para gestión de usuarios
export const userResolvers = {
  // Queries
  users: async (args, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const users = await getAllUsers(context.user);
      return users;
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  },

  user: async ({ id }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const user = await getUserById(context.user, id);
      return user;
    } catch (error) {
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }
  },

  // Mutations
  createUser: async ({ input }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const newUser = await createUser(context.user, input);
      return newUser;
    } catch (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  },

  updateUser: async ({ id, input }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const updatedUser = await updateUser(context.user, id, input);
      return updatedUser;
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  },

  deleteUser: async ({ id }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      await deleteUser(context.user, id);
      return true;
    } catch (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  },

  changeUserRole: async ({ id, role }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const updatedUser = await changeUserRole(context.user, id, role);
      return updatedUser;
    } catch (error) {
      throw new Error(`Error cambiando rol: ${error.message}`);
    }
  },

  changeUserPassword: async ({ input }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const { userId, newPassword } = input;
      await changeUserPassword(context.user, userId, newPassword);
      return true;
    } catch (error) {
      throw new Error(`Error cambiando contraseña: ${error.message}`);
    }
  },

  activateUser: async ({ id }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const activatedUser = await activateUser(context.user, id);
      return activatedUser;
    } catch (error) {
      throw new Error(`Error activando usuario: ${error.message}`);
    }
  },

  deactivateUser: async ({ id }, context) => {
    // Verificar autenticación
    if (!context.isAuthenticated || !context.user) {
      throw new Error('No autorizado - token requerido');
    }

    try {
      const deactivatedUser = await deactivateUser(context.user, id);
      return deactivatedUser;
    } catch (error) {
      throw new Error(`Error desactivando usuario: ${error.message}`);
    }
  },
};
