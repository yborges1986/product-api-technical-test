import { connect, StringCodec } from 'nats';

let nc = null;
let sc = StringCodec();

export async function getNatsConnection() {
  if (!nc) {
    nc = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
    });
  }
  return nc;
}

export { sc };
