// listeners/productDeletedListener.js

import { BaseListener } from './BaseListener.js';
import { deleteProductFromIndex } from '../elastic/productIndex.js';

/**
 * Listener para eventos de productos eliminados
 * Elimina productos del índice de Elasticsearch
 */
class ProductDeletedListener extends BaseListener {
  constructor() {
    super('product.deleted', 'ProductDeletedListener');
  }

  /**
   * Maneja mensajes de producto eliminado
   * @param {Object} messageData - Datos del mensaje recibido (producto eliminado)
   */
  async handleMessage(messageData) {
    const productId = messageData._id || messageData.id;

    if (!productId) {
      throw new Error(
        'No se encontró ID del producto en el mensaje de eliminación'
      );
    }

    await deleteProductFromIndex(productId);
  }
}

export default async function productDeletedListener() {
  const listener = new ProductDeletedListener();
  await listener.start();
}
