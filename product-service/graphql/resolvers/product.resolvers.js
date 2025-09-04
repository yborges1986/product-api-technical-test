import {
  createProduct,
  getProduct,
  getProducts,
  getProductsByStatus,
  getPendingProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
} from '../../services/product/index.js';

// Resolvers para productos
export const productResolvers = {
  // Queries
  products: async (args, context) => {
    const { user } = context;
    return await getProducts(user);
  },

  product: async ({ gtin }, context) => {
    const { user } = context;
    return await getProduct(gtin, user);
  },

  productsByStatus: async ({ status }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await getProductsByStatus(status, user);
  },

  pendingProducts: async (args, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await getPendingProducts(user);
  },

  // Mutations
  createProduct: async ({ input }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await createProduct(input, user);
  },

  updateProduct: async ({ gtin, input }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await updateProduct(gtin, input, user);
  },

  deleteProduct: async ({ gtin }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await deleteProduct(gtin);
  },

  approveProduct: async ({ gtin }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await approveProduct(gtin, user);
  },
};
