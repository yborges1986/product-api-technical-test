import { productResolvers } from './product.resolvers.js';
import { authResolvers } from './auth.resolvers.js';
import { userResolvers } from './user.resolvers.js';

// Combinar todos los resolvers en formato root para buildSchema()
export const resolvers = {
  // Queries - productos
  products: productResolvers.products,
  product: productResolvers.product,
  productsByStatus: productResolvers.productsByStatus,
  pendingProducts: productResolvers.pendingProducts,
  productHistory: productResolvers.productHistory,
  auditHistory: productResolvers.auditHistory, // Nuevo resolver de auditoría

  // Queries - autenticación
  me: authResolvers.me,

  // Queries - usuarios
  users: userResolvers.users,
  user: userResolvers.user,

  // Mutations - autenticación
  login: authResolvers.login,
  changePassword: authResolvers.changePassword,
  updateProfile: authResolvers.updateProfile,

  // Mutations - productos
  createProduct: productResolvers.createProduct,
  updateProduct: productResolvers.updateProduct,
  deleteProduct: productResolvers.deleteProduct,
  approveProduct: productResolvers.approveProduct,

  // Mutations - usuarios
  createUser: userResolvers.createUser,
  updateUser: userResolvers.updateUser,
  deleteUser: userResolvers.deleteUser,
  changeUserRole: userResolvers.changeUserRole,
  changeUserPassword: userResolvers.changeUserPassword,
  activateUser: userResolvers.activateUser,
  deactivateUser: userResolvers.deactivateUser,
};
