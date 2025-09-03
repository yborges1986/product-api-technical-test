// Lógica para actualizar un producto
import { Product, ProductHistory } from '../models/index.js';
import { getNatsConnection, sc } from '../core/nats.js';

export default async function updateProduct(gtin, data) {
  let oldProduct = null;
  let updatedProduct = null;

  try {
    // Buscar el producto original
    oldProduct = await Product.findOne({ gtin });
    if (!oldProduct) {
      return null;
    }

    // Actualizar el producto
    updatedProduct = await Product.findOneAndUpdate({ gtin }, data, {
      new: true,
      runValidators: true,
    });

    // Registrar historial
    await ProductHistory.create({
      productId: updatedProduct._id,
      changeType: 'update',
      oldData: oldProduct.toObject(),
      newData: updatedProduct.toObject(),
    });

    // Emitir mensaje a NATS
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
