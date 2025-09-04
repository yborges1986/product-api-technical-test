// listeners/productUpdatedListener.js

import { BaseListener } from './BaseListener.js';
import { indexProduct } from '../elastic/productIndex.js';

/**
 * Listener para eventos de productos actualizados
 * Actualiza el índice de Elasticsearch cuando un producto es modificado
 */
class ProductUpdatedListener extends BaseListener {
  constructor() {
    super('product.updated', 'ProductUpdatedListener');
  }

  /**
   * Maneja mensajes de producto actualizado
   * @param {Object} messageData - Datos del mensaje recibido
   */
  async handleMessage(messageData) {
    // Obtener los datos del producto actualizado
    const updatedProductData = messageData.newData || messageData;

    // Limpiar datos para Elasticsearch
    const cleanProductData = this.cleanProductData(updatedProductData);

    // Indexar el producto actualizado en Elasticsearch
    await indexProduct(cleanProductData);
  }
}

// Función exportada para mantener compatibilidad con la implementación anterior
export default async function productUpdatedListener() {
  const listener = new ProductUpdatedListener();
  await listener.start();
}
