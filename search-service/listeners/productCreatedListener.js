// listeners/productCreatedListener.js

import { connect, StringCodec } from 'nats';

import { indexProduct } from '../elastic/productIndex.js';

export default async function productCreatedListener() {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    const nc = await connect({ servers: natsUrl });
    const sc = StringCodec();

    const sub = nc.subscribe('product.created');
    console.log('Esperando mensajes en product.created...');

    for await (const m of sub) {
      try {
        const data = JSON.parse(sc.decode(m.data));
        console.log('Mensaje recibido en product.created:', data);

        await indexProduct(data);
        console.log('Producto indexado en Elasticsearch:', data.id || data._id);
      } catch (err) {
        console.error('Error al procesar mensaje product.created:', err);
        // No lanzar el error para que el listener continue funcionando
      }
    }
  } catch (error) {
    console.error('Error en productCreatedListener:', error);
    // Reintentar después de un delay
    setTimeout(() => {
      console.log('Reintentando conexión a productCreatedListener...');
      productCreatedListener();
    }, 5000);
  }
}
