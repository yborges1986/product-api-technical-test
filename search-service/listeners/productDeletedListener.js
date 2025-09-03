// listeners/productDeletedListener.js

import { connect, StringCodec } from 'nats';
import { deleteProductFromIndex } from '../elastic/productIndex.js';

export default async function productDeletedListener() {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    const nc = await connect({ servers: natsUrl });
    const sc = StringCodec();

    const sub = nc.subscribe('product.deleted');
    console.log('Esperando mensajes en product.deleted...');

    for await (const m of sub) {
      try {
        const deletedProduct = JSON.parse(sc.decode(m.data));
        console.log('Mensaje recibido en product.deleted:', deletedProduct);

        // Eliminar el producto del índice de Elasticsearch
        await deleteProductFromIndex(deletedProduct._id || deletedProduct.id);
        console.log(
          'Producto eliminado de Elasticsearch:',
          deletedProduct._id || deletedProduct.id
        );
      } catch (err) {
        console.error('Error al procesar mensaje product.deleted:', err);
        // No lanzar el error para que el listener continue funcionando
      }
    }
  } catch (error) {
    console.error('Error en productDeletedListener:', error);
    // Reintentar después de un delay
    setTimeout(() => {
      console.log('Reintentando conexión a productDeletedListener...');
      productDeletedListener();
    }, 5000);
  }
}
