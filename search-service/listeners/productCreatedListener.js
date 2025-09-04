// listeners/productCreatedListener.js

import { BaseListener } from './BaseListener.js';
import { indexProduct } from '../elastic/productIndex.js';

/**
 * Listener para eventos de productos creados
 * Indexa nuevos productos en Elasticsearch
 */
class ProductCreatedListener extends BaseListener {
  constructor() {
    super('product.created', 'ProductCreatedListener');
  }

  /**
   * Maneja mensajes de producto creado
   * @param {Object} messageData - Datos del mensaje recibido
   */
  async handleMessage(messageData) {
    const cleanProductData = this.cleanProductData(messageData);
    await indexProduct(cleanProductData);
  }
}

// Función exportada para mantener compatibilidad con la implementación anterior
export default async function productCreatedListener() {
  const listener = new ProductCreatedListener();
  await listener.start();
}
