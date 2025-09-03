import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../../services/product/index.js';
import { Product } from '../../models/index.js';

// Resolvers para productos
export const productResolvers = {
  // Queries
  products: async () => await Product.find(),
  product: async ({ gtin }) => await getProduct(gtin),

  // TODO: Implementar en Fase 2
  productsByStatus: async ({ status }) => {
    // Placeholder - implementar cuando tengamos el modelo actualizado
    return await Product.find({ status });
  },

  // TODO: Implementar en Fase 2
  pendingProducts: async (args, context) => {
    // Verificar que sea editor o admin
    // Placeholder - implementar cuando tengamos el modelo actualizado
    return await Product.find({ status: 'pending' });
  },

  // Mutations
  createProduct: async ({ input }) => await createProduct(input),
  updateProduct: async ({ gtin, input }) => await updateProduct(gtin, input),
  deleteProduct: async ({ gtin }) => await deleteProduct(gtin),

  // TODO: Implementar en Fase 2
  approveProduct: async ({ gtin }, context) => {
    // Verificar que sea editor o admin
    // Cambiar status de pending a published
    // Placeholder - implementar cuando tengamos el modelo actualizado
    throw new Error('approveProduct no implementado aún');
  },
};
