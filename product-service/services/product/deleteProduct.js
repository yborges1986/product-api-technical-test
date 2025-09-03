// Lógica para eliminar un producto
import { Product, ProductHistory } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function deleteProduct(gtin) {
  let deletedProduct = null;

  try {
    // Buscar y eliminar el producto
    deletedProduct = await Product.findOneAndDelete({ gtin });
    if (!deletedProduct) {
      throw new Error('Producto no encontrado');
    }

    // Registrar historial
    await ProductHistory.create({
      productId: deletedProduct._id,
      changeType: 'delete',
      oldData: deletedProduct.toObject(),
      newData: null,
    });

    // Emitir mensaje a NATS
    try {
      const nc = await getNatsConnection();
      await nc.publish(
        'product.deleted',
        sc.encode(JSON.stringify(deletedProduct.toObject()))
      );
    } catch (natsError) {
      console.error('Error al emitir mensaje NATS:', natsError);
    }

    return 'Producto eliminado';
  } catch (error) {
    // Si hay error y el producto fue eliminado, restaurarlo
    if (deletedProduct) {
      try {
        const restoredProduct = new Product(deletedProduct.toObject());
        await restoredProduct.save();
      } catch (rollbackError) {
        console.error('Error durante rollback:', rollbackError);
      }
    }
    throw error;
  }
}
