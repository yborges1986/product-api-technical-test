// listeners/productCreatedListener.js

import { connect, StringCodec } from 'nats';

import { indexProduct } from '../elastic/productIndex.js';

export default async function productCreatedListener() {
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const nc = await connect({ servers: natsUrl });
  const sc = StringCodec();

  const sub = nc.subscribe('product.created');
  console.log('Esperando mensajes en product.created...');
  for await (const m of sub) {
    try {
      const data = JSON.parse(sc.decode(m.data));

      await indexProduct(data);
      console.log('Producto indexado en memoria y en Elasticsearch:', data);
    } catch (err) {
      console.error('Error al procesar mensaje NATS:', err);
    }
  }
}
