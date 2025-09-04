import { Product, ProductHistory } from '../../models/index.js';
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

    // Guardar estado anterior para historial
    const oldData = product.toObject();

    // Actualizar el producto
    product.status = 'published';
    product.approvedBy = user.id || user._id;
    product.approvedAt = new Date();

    const savedProduct = await product.save();

    // Populate los campos de usuario para la respuesta de GraphQL
    await savedProduct.populate('createdBy');
    await savedProduct.populate('approvedBy');

    // Crear registro en historial
    await ProductHistory.create({
      productId: savedProduct._id,
      changeType: 'approve',
      oldData,
      newData: savedProduct.toObject(),
    });

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
