import { getProductHistory } from '../../utils/audit.util.js';
import { Product } from '../../models/index.js';

export default async function getProductHistoryService(
  gtin,
  user,
  options = {}
) {
  try {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const product = await Product.findOne({ gtin }).populate('createdBy');
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (user.role === 'provider') {
      const userId = user.id || user._id;
      if (product.createdBy._id.toString() !== userId.toString()) {
        throw new Error(
          'No tienes permisos para ver el historial de este producto'
        );
      }
    }

    return await getProductHistory(gtin, options);
  } catch (error) {
    console.error('Error in getProductHistoryService:', error);
    throw error;
  }
}
