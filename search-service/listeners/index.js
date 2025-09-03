// listeners/index.js
import productCreatedListener from './productCreatedListener.js';

export default function startListeners() {
  productCreatedListener().catch((err) => {
    console.error('Error en productCreatedListener:', err);
  });
}
