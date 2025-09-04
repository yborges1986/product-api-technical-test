import { Product, ProductHistory } from '../../models/index.js';
import { getNatsConnection, sc } from '../../core/nats.js';

export default async function createProduct(data, user) {
  let savedProduct = null;

  try {
    // Determinar estado inicial según rol del usuario
    const status =
      user.role === 'admin' || user.role === 'editor' ? 'published' : 'pending';

    // Preparar datos del producto con campos de estado
    const productData = {
      ...data,
      status,
      createdBy: user.id || user._id, // Usar id o _id del usuario
      // Si es admin/editor, auto-aprobar
      ...(status === 'published' && {
        approvedBy: user.id || user._id,
        approvedAt: new Date(),
      }),
    };

    // Crear el producto
    const product = new Product(productData);
    savedProduct = await product.save();

    // Populate los campos de usuario para la respuesta de GraphQL
    await savedProduct.populate('createdBy');
    if (savedProduct.approvedBy) {
      await savedProduct.populate('approvedBy');
    }

    // Crear el historial
    await ProductHistory.create({
      productId: savedProduct._id,
      changeType: 'create',
      oldData: null,
      newData: savedProduct.toObject(),
    });

    // Emitir mensaje a NATS solo si está published
    if (savedProduct.status === 'published') {
      try {
        const nc = await getNatsConnection();
        await nc.publish(
          'product.created',
          sc.encode(JSON.stringify(savedProduct.toObject()))
        );
      } catch (natsError) {
        console.error('Error al emitir mensaje NATS:', natsError);
      }
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
