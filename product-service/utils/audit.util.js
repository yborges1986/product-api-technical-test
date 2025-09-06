import ProductHistory from '../models/productHistory.model.js';

/**
 * Detecta los cambios entre dos objetos
 * @param {Object} oldObj - Objeto anterior
 * @param {Object} newObj - Objeto nuevo
 * @param {Array} excludeFields - Campos a excluir de la comparación
 * @returns {Object} - Objeto con los cambios detectados
 */
export const detectChanges = (oldObj, newObj, excludeFields = []) => {
  const changes = {};
  const defaultExcludes = ['_id', '__v', 'updatedAt', 'createdAt', 'id'];
  const fieldsToExclude = [...defaultExcludes, ...excludeFields];

  // Verificar campos modificados o nuevos
  if (newObj) {
    for (const key in newObj) {
      if (fieldsToExclude.includes(key)) continue;

      const oldValue = oldObj ? oldObj[key] : undefined;
      const newValue = newObj[key];

      // Comparar valores (manejar objetos, arrays y primitivos)
      if (!isEqual(oldValue, newValue)) {
        changes[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    }
  }

  // Verificar campos eliminados
  if (oldObj) {
    for (const key in oldObj) {
      if (fieldsToExclude.includes(key)) continue;

      if (!newObj || !(key in newObj)) {
        changes[key] = {
          from: oldObj[key],
          to: undefined,
        };
      }
    }
  }

  return changes;
};

/**
 * Compara dos valores para determinar si son iguales
 * @param {*} val1 - Primer valor
 * @param {*} val2 - Segundo valor
 * @returns {boolean} - true si son iguales
 */
const isEqual = (val1, val2) => {
  if (val1 === val2) return true;

  if (val1 instanceof Date && val2 instanceof Date) {
    return val1.getTime() === val2.getTime();
  }

  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    return val1.every((item, index) => isEqual(item, val2[index]));
  }

  if (val1 && val2 && typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);

    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) => isEqual(val1[key], val2[key]));
  }

  return false;
};

/**
 * Limpia un objeto para almacenamiento, removiendo funciones y referencias circulares
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} - Objeto limpio
 */
export const cleanObjectForStorage = (obj) => {
  if (!obj) return null;

  const cleaned = {};
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'function') continue;
    if (key.startsWith('$') || (key.startsWith('_') && key !== '_id')) continue;

    if (value && typeof value === 'object') {
      if (value instanceof Date) {
        cleaned[key] = value;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          typeof item === 'object' ? cleanObjectForStorage(item) : item
        );
      } else if (value.constructor === Object) {
        cleaned[key] = cleanObjectForStorage(value);
      } else {
        cleaned[key] = value.toString();
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

/**
 * Registra una entrada en el historial de auditoría
 * @param {Object} params - Parámetros para el registro
 * @returns {Promise<ProductHistory>} - Entrada del historial creada
 */
export const recordAuditEntry = async ({
  gtin,
  productId,
  action,
  changedBy,
  previousData = null,
  newData,
  changes = null,
  metadata = {},
}) => {
  try {
    const auditEntry = new ProductHistory({
      gtin,
      productId,
      action,
      changedBy,
      previousData: cleanObjectForStorage(previousData),
      newData: cleanObjectForStorage(newData),
      changes:
        changes || (previousData ? detectChanges(previousData, newData) : null),
      metadata: {
        source: 'graphql-api',
        timestamp: new Date(),
        ...metadata,
      },
    });

    const saved = await auditEntry.save();
    return saved;
  } catch (error) {
    console.error('❌ Error recording audit entry:', error);
    console.error('📊 Audit data:', { gtin, action, changedBy, productId });
    throw new Error(`Failed to record audit entry: ${error.message}`);
  }
};

/**
 * Obtiene el historial de un producto con paginación
 * @param {string} gtin - GTIN del producto
 * @param {Object} options - Opciones de consulta
 * @returns {Promise<Array>} - Array de entradas del historial
 */
export const getProductHistory = async (gtin, options = {}) => {
  const {
    limit = 50,
    offset = 0,
    sortBy = 'changedAt',
    sortOrder = -1,
    action = null,
  } = options;

  const query = { gtin };
  if (action) {
    query.action = action;
  }

  try {
    const history = await ProductHistory.find(query)
      .populate('changedBy')
      .sort({ [sortBy]: sortOrder })
      .skip(offset)
      .limit(limit);

    const transformedHistory = history.map((doc) => {
      const jsonDoc = doc.toJSON();
      return jsonDoc;
    });

    return transformedHistory;
  } catch (error) {
    console.error('❌ Error fetching product history:', error);
    throw new Error(`Failed to fetch product history: ${error.message}`);
  }
};

/**
 * Obtiene estadísticas del historial de un producto
 * @param {string} gtin - GTIN del producto
 * @returns {Promise<Object>} - Estadísticas del historial
 */
export const getProductHistoryStats = async (gtin) => {
  try {
    const stats = await ProductHistory.aggregate([
      { $match: { gtin } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastChange: { $max: '$changedAt' },
        },
      },
    ]);

    const totalChanges = await ProductHistory.countDocuments({ gtin });

    return {
      totalChanges,
      byAction: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          lastChange: stat.lastChange,
        };
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('Error fetching product history stats:', error);
    throw new Error(`Failed to fetch product history stats: ${error.message}`);
  }
};
