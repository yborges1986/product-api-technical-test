// Lógica para actualizar un producto
import { Product, ProductHistory } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function updateProduct(gtin, data, user) {
  let oldProduct = null;
  let updatedProduct = null;

  try {
    // Buscar el producto original
    oldProduct = await Product.findOne({ gtin }).populate('createdBy');
    if (!oldProduct) {
      return null;
    }

    // Validar permisos según rol y estado
    if (user.role === 'provider') {
      // Provider solo puede editar productos pending que él creó
      if (oldProduct.status !== 'pending') {
        throw new Error('Solo puedes editar productos en estado pending');
      }
      const userId = user.id || user._id;
      if (oldProduct.createdBy._id.toString() !== userId.toString()) {
        throw new Error('Solo puedes editar productos que tú creaste');
      }
    }
    // Editor y admin pueden editar cualquier producto en cualquier estado

    // Preparar datos de actualización (sin permitir cambiar campos de control)
    const updateData = { ...data };
    delete updateData.status; // No permitir cambio directo de status
    delete updateData.createdBy; // No permitir cambio de creador
    delete updateData.approvedBy; // No permitir cambio de aprobador
    delete updateData.approvedAt; // No permitir cambio de fecha de aprobación

    // Actualizar el producto
    updatedProduct = await Product.findOneAndUpdate({ gtin }, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy')
      .populate('approvedBy');

    // Registrar historial
    await ProductHistory.create({
      productId: updatedProduct._id,
      changeType: 'update',
      oldData: oldProduct.toObject(),
      newData: updatedProduct.toObject(),
    });

    // Emitir mensaje a NATS solo si el producto está published
    if (updatedProduct.status === 'published') {
      try {
        const nc = await getNatsConnection();
        await nc.publish(
          'product.updated',
          sc.encode(
            JSON.stringify({
              oldData: oldProduct.toObject(),
              newData: updatedProduct.toObject(),
            })
          )
        );
      } catch (natsError) {
        console.error('Error al emitir mensaje NATS:', natsError);
      }
    }

    return updatedProduct;
  } catch (error) {
    // Si hay error y el producto fue actualizado, restaurar datos originales
    if (oldProduct && updatedProduct) {
      try {
        await Product.findByIdAndUpdate(
          updatedProduct._id,
          oldProduct.toObject()
        );
      } catch (rollbackError) {
        console.error('Error durante rollback:', rollbackError);
      }
    }
    throw error;
  }
}
