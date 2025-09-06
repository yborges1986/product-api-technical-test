// Lógica para eliminar un producto
import { Product } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function deleteProduct(gtin, user) {
  try {
    // Buscar el producto
    const product = await Product.findOne({ gtin });
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Establecer usuario para auditoría antes de eliminar
    product.setAuditUser(user.id || user._id);

    // Usar el método deleteOne del documento para activar hooks
    await product.deleteOne();

    // Emitir mensaje a NATS
    try {
      const nc = await getNatsConnection();
      await nc.publish(
        'product.deleted',
        sc.encode(JSON.stringify(product.toObject()))
      );
    } catch (natsError) {
      console.error('Error al emitir mensaje NATS:', natsError);
    }

    return 'Producto eliminado';
  } catch (error) {
    throw error;
  }
}
