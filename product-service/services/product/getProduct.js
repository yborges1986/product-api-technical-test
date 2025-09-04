// Lógica para obtener productos con permisos por rol
import Product from '../../models/product.model.js';

// Obtener un producto específico por GTIN
export async function getProduct(gtin, user) {
  const product = await Product.findOne({ gtin })
    .populate('createdBy')
    .populate('approvedBy')
    .populate('history');

  if (!product) {
    return null;
  }

  // Validar permisos según rol (solo si hay usuario autenticado)
  if (user && user.role === 'provider') {
    // Provider solo puede ver productos published o sus propios productos pending
    const userId = user.id || user._id;
    if (
      product.status === 'pending' &&
      product.createdBy._id.toString() !== userId.toString()
    ) {
      throw new Error('No tienes permisos para ver este producto');
    }
  }

  // Convertir el producto a objeto plano
  const productObj = product.toObject();

  // Convertir campos del historial a JSON strings si es necesario
  if (productObj.history && Array.isArray(productObj.history)) {
    productObj.history = productObj.history.map((entry) => {
      const historyEntry = { ...entry };

      if (historyEntry.changes && typeof historyEntry.changes === 'object') {
        historyEntry.changes = JSON.stringify(historyEntry.changes);
      }
      if (
        historyEntry.previousData &&
        typeof historyEntry.previousData === 'object'
      ) {
        historyEntry.previousData = JSON.stringify(historyEntry.previousData);
      }
      if (historyEntry.newData && typeof historyEntry.newData === 'object') {
        historyEntry.newData = JSON.stringify(historyEntry.newData);
      }
      if (historyEntry.metadata && typeof historyEntry.metadata === 'object') {
        historyEntry.metadata = JSON.stringify(historyEntry.metadata);
      }

      return historyEntry;
    });
  }

  return productObj;
}

// Obtener todos los productos con filtros por rol
export async function getProducts(user, filters = {}) {
  let query = {};

  // Aplicar filtros según rol del usuario (solo si hay usuario autenticado)
  if (user && user.role === 'provider') {
    // Provider solo ve productos published o sus propios productos
    const userId = user.id || user._id;
    query = {
      $or: [{ status: 'published' }, { status: 'pending', createdBy: userId }],
    };
  } else if (user && (user.role === 'editor' || user.role === 'admin')) {
    // Editor y admin ven todos los productos
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }
  } else {
    // Sin autenticación, solo productos published
    query.status = 'published';
  }

  return await Product.find(query)
    .populate('createdBy')
    .populate('approvedBy')
    .sort({ createdAt: -1 });
}

// Obtener productos por estado (solo editor/admin)
export async function getProductsByStatus(status, user) {
  if (user.role !== 'admin' && user.role !== 'editor') {
    throw new Error('No tienes permisos para filtrar por estado');
  }

  return await Product.find({ status })
    .populate('createdBy')
    .populate('approvedBy')
    .sort({ createdAt: -1 });
}

// Obtener productos pendientes (solo editor/admin)
export async function getPendingProducts(user) {
  if (user.role !== 'admin' && user.role !== 'editor') {
    throw new Error('No tienes permisos para ver productos pendientes');
  }

  return await Product.find({ status: 'pending' })
    .populate('createdBy')
    .sort({ createdAt: -1 });
}

// Mantener compatibilidad con la función original
export default getProduct;
