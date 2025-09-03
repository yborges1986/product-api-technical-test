import { Product, ProductHistory } from '../models/index.js';
import { getNatsConnection, sc } from '../core/nats.js';

export default async function createProduct(data) {
  let savedProduct = null;

  try {
    // Crear el producto
    const product = new Product(data);
    savedProduct = await product.save();

    // Crear el historial
    await ProductHistory.create({
      productId: savedProduct._id,
      changeType: 'create',
      oldData: null,
      newData: savedProduct.toObject(),
    });

    // Emitir mensaje a NATS
    try {
      const nc = await getNatsConnection();
      await nc.publish(
        'product.created',
        sc.encode(JSON.stringify(savedProduct.toObject()))
      );
    } catch (natsError) {
      console.error('Error al emitir mensaje NATS:', natsError);
    }

    return savedProduct;
  } catch (error) {
    // Si hay error y el producto fue creado, eliminarlo (rollback manual)
    if (savedProduct && savedProduct._id) {
      try {
        await Product.findByIdAndDelete(savedProduct._id);
      } catch (rollbackError) {
        console.error('Error durante rollback:', rollbackError);
      }
    }
    throw error;
  }
}
