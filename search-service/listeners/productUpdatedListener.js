// listeners/productUpdatedListener.js

import { connect, StringCodec } from 'nats';
import { indexProduct } from '../elastic/productIndex.js';

export default async function productUpdatedListener() {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    const nc = await connect({ servers: natsUrl });
    const sc = StringCodec();

    const sub = nc.subscribe('product.updated');
    console.log('Esperando mensajes en product.updated...');

    for await (const m of sub) {
      try {
        const data = JSON.parse(sc.decode(m.data));
        console.log('Mensaje recibido en product.updated:', data);

        // Indexar el producto actualizado
        const productToIndex = data.newData || data;
        await indexProduct(productToIndex);
        console.log(
          'Producto actualizado en Elasticsearch:',
          productToIndex.id || productToIndex._id
        );
      } catch (err) {
        console.error('Error al procesar mensaje product.updated:', err);
        // No lanzar el error para que el listener continue funcionando
      }
    }
  } catch (error) {
    console.error('Error en productUpdatedListener:', error);
    // Reintentar después de un delay
    setTimeout(() => {
      console.log('Reintentando conexión a productUpdatedListener...');
      productUpdatedListener();
    }, 5000);
  }
}
