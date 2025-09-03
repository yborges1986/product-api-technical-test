export const ROLES = {
  PROVIDER: 'provider',
  EDITOR: 'editor',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  [ROLES.PROVIDER]: {
    products: ['create', 'read_own', 'update_own'],
    users: ['read_own', 'update_own', 'change_own_password'],
  },

  [ROLES.EDITOR]: {
    products: ['create', 'read_all', 'update_all', 'delete', 'approve'],
    users: ['read_own', 'update_own', 'change_own_password'],
  },

  [ROLES.ADMIN]: {
    products: ['create', 'read_all', 'update_all', 'delete', 'approve'],
    users: [
      'create',
      'read_all',
      'update_all',
      'delete',
      'change_role',
      'change_any_password',
    ],
  },
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {Object} user - Usuario objeto con role
 * @param {string} resource - Recurso (ej: 'users', 'products')
 * @param {string} action - Acción (ej: 'create', 'read_all')
 * @returns {boolean} True si tiene el permiso
 */
export const hasPermission = (user, resource, action) => {
  if (!user || !user.role) {
    return false;
  }

  const userPermissions = PERMISSIONS[user.role];
  if (!userPermissions || !userPermissions[resource]) {
    return false;
  }

  return userPermissions[resource].includes(action);
};

/**
 * Verifica si un usuario puede realizar una acción específica
 * Lanza error si no tiene permisos
 * @param {Object} user - Usuario objeto
 * @param {string} resource - Recurso
 * @param {string} action - Acción
 * @throws {Error} Si no tiene permisos
 */
export const requirePermission = (user, resource, action) => {
  if (!hasPermission(user, resource, action)) {
    throw new Error(`No tienes permisos para ${action} en ${resource}`);
  }
};

/**
 * Verifica si un usuario es admin
 * @param {Object} user - Usuario objeto
 * @returns {boolean} True si es admin
 */
export const isAdmin = (user) => {
  return user && user.role === ROLES.ADMIN;
};

/**
 * Verifica si un usuario es editor o admin
 * @param {Object} user - Usuario objeto
 * @returns {boolean} True si es editor o admin
 */
export const isEditorOrAdmin = (user) => {
  return user && (user.role === ROLES.EDITOR || user.role === ROLES.ADMIN);
};

/**
 * Verifica si un usuario puede acceder a información de otro usuario
 * @param {Object} currentUser - Usuario actual
 * @param {string} targetUserId - ID del usuario objetivo
 * @returns {boolean} True si puede acceder
 */
export const canAccessUser = (currentUser, targetUserId) => {
  // Admin puede acceder a cualquiera
  if (isAdmin(currentUser)) {
    return true;
  }

  // Los usuarios solo pueden acceder a su propia información
  return currentUser.userId === targetUserId || currentUser.id === targetUserId;
};

/**
 * Verifica si un rol es válido
 * @param {string} role - Rol a verificar
 * @returns {boolean} True si es válido
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Obtiene todos los roles disponibles
 * @returns {string[]} Array de roles
 */
export const getAllRoles = () => {
  return Object.values(ROLES);
};
