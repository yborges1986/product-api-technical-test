// listeners/productApprovedListener.js

import { BaseListener } from './BaseListener.js';
import { indexProduct } from '../elastic/productIndex.js';

/**
 * Listener para eventos de productos aprobados
 * Indexa productos aprobados en Elasticsearch
 */
class ProductApprovedListener extends BaseListener {
  constructor() {
    super('product.approved', 'ProductApprovedListener');
  }

  /**
   * Maneja mensajes de producto aprobado
   * @param {Object} messageData - Datos del mensaje recibido
   */
  async handleMessage(messageData) {
    const cleanProductData = this.cleanProductData(messageData);
    await indexProduct(cleanProductData);
  }
}

// Función exportada para mantener compatibilidad con la implementación anterior
export default async function productApprovedListener() {
  const listener = new ProductApprovedListener();
  await listener.start();
}
