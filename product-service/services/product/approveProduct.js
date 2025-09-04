import { Product } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function approveProduct(gtin, user) {
  try {
    // Verificar que el usuario tenga permisos (admin o editor)
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new Error('No tienes permisos para aprobar productos');
    }

    // Buscar el producto
    const product = await Product.findOne({ gtin });
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Verificar que el producto esté en estado pending
    if (product.status !== 'pending') {
      throw new Error('Solo se pueden aprobar productos en estado pending');
    }

    // Actualizar el producto
    product.status = 'published';
    product.approvedBy = user.id || user._id;
    product.approvedAt = new Date();

    // Establecer usuario para auditoría y registrar la aprobación
    product.setAuditUser(user.id || user._id);
    await product.recordApproval(user.id || user._id);

    const savedProduct = await product.save();

    // Populate los campos de usuario para la respuesta de GraphQL
    await savedProduct.populate('createdBy');
    await savedProduct.populate('approvedBy');

    // Emitir mensaje a NATS para sincronizar con search-service
    try {
      const nc = await getNatsConnection();
      await nc.publish(
        'product.approved',
        sc.encode(
          JSON.stringify({
            ...savedProduct.toObject(),
            action: 'approved',
          })
        )
      );
    } catch (natsError) {
      console.error('Error al emitir mensaje NATS:', natsError);
    }

    return savedProduct;
  } catch (error) {
    throw error;
  }
}
