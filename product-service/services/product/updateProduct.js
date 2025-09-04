// Lógica para actualizar un producto
import { Product } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function updateProduct(gtin, data, user) {
  let originalProduct = null;

  try {
    // Buscar el producto original
    originalProduct = await Product.findOne({ gtin }).populate('createdBy');
    if (!originalProduct) {
      return null;
    }

    // Validar permisos según rol y estado
    if (user.role === 'provider') {
      // Provider solo puede editar productos pending que él creó
      if (originalProduct.status !== 'pending') {
        throw new Error('Solo puedes editar productos en estado pending');
      }
      const userId = user.id || user._id;
      if (originalProduct.createdBy._id.toString() !== userId.toString()) {
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

    // Actualizar el producto usando save() para activar hooks de auditoría
    Object.assign(originalProduct, updateData);

    // Establecer usuario para auditoría
    originalProduct.setAuditUser(user.id || user._id);

    const updatedProduct = await originalProduct.save();

    // Populate campos para la respuesta
    await updatedProduct.populate('createdBy');
    if (updatedProduct.approvedBy) {
      await updatedProduct.populate('approvedBy');
    }

    // Emitir mensaje a NATS solo si el producto está published
    if (updatedProduct.status === 'published') {
      try {
        const nc = await getNatsConnection();
        await nc.publish(
          'product.updated',
          sc.encode(JSON.stringify(updatedProduct.toObject()))
        );
      } catch (natsError) {
        console.error('Error al emitir mensaje NATS:', natsError);
      }
    }

    return updatedProduct;
  } catch (error) {
    throw error;
  }
}
