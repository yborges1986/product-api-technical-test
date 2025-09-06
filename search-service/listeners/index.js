// listeners/index.js
import productCreatedListener from './productCreatedListener.js';
import productUpdatedListener from './productUpdatedListener.js';
import productDeletedListener from './productDeletedListener.js';
import productApprovedListener from './productApprovedListener.js';

export default function startListeners() {
  productCreatedListener().catch((err) => {
    console.error('Error en productCreatedListener:', err);
  });

  productUpdatedListener().catch((err) => {
    console.error('Error en productUpdatedListener:', err);
  });

  productDeletedListener().catch((err) => {
    console.error('Error en productDeletedListener:', err);
  });

  productApprovedListener().catch((err) => {
    console.error('Error en productApprovedListener:', err);
  });
}
