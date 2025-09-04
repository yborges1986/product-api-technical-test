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
    // Limpiar datos para Elasticsearch
    const cleanProductData = this.cleanProductData(messageData);

    // Al aprobar un producto, lo indexamos en Elasticsearch
    await indexProduct(cleanProductData);

    console.log(
      '✅ Producto aprobado indexado en Elasticsearch:',
      cleanProductData.id || cleanProductData._id
    );
  }
}

// Función exportada para mantener compatibilidad con la implementación anterior
export default async function productApprovedListener() {
  const listener = new ProductApprovedListener();
  await listener.start();
}
