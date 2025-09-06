import {
  createProduct,
  getProduct,
  getProducts,
  getProductsByStatus,
  getPendingProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
  getProductHistoryService,
  getAuditHistory,
} from '../../services/product/index.js';

export const productResolvers = {
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

  productHistory: async ({ gtin, limit = 50, offset = 0, action }, context) => {
    const { user } = context;
    const options = { limit: Math.min(limit, 100), offset, action };
    return await getProductHistoryService(gtin, user, options);
  },

  auditHistory: async (args, context) => {
    const { user } = context;
    return await getAuditHistory(args, user);
  },

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
    return await deleteProduct(gtin, user);
  },

  approveProduct: async ({ gtin }, context) => {
    const { user } = context;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return await approveProduct(gtin, user);
  },
};
