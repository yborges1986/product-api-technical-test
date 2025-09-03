const { connect, StringCodec } = require('nats');

async function listenNats() {
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const nc = await connect({ servers: natsUrl });
  const sc = StringCodec();

  const sub = nc.subscribe('product.created');
  console.log('Esperando mensajes en product.created...');
  for await (const m of sub) {
    try {
      const data = JSON.parse(sc.decode(m.data));
      console.log('Producto recibido desde NATS:', data);
    } catch (err) {
      console.error('Error al procesar mensaje NATS:', err);
    }
  }
}

listenNats().catch((err) => {
  console.error('Error al conectar a NATS:', err);
});
