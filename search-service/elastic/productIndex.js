// elastic/productIndex.js
import { elasticClient } from './client.js';

const INDEX = 'products';

// Función para crear el índice si no existe
export async function createIndexIfNotExists() {
  try {
    const indexExists = await elasticClient.indices.exists({ index: INDEX });
    if (!indexExists) {
      await elasticClient.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            gtin: { type: 'keyword' },
            name: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            brand: { type: 'text', analyzer: 'standard' },
            manufacturer: { type: 'text', analyzer: 'standard' },
            // Peso neto con valor numérico y unidad
            netWeight: { type: 'float' },
            netWeightUnit: { type: 'keyword' },
            status: { type: 'keyword' },
            createdById: { type: 'keyword' },
            approvedById: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            approvedAt: { type: 'date' },
          },
        },
      });
    }
  } catch (error) {
    console.error('Error creando índice:', error);
  }
}

export async function indexProduct(product) {
  try {
    // Asegurar que el índice existe
    await createIndexIfNotExists();

    // Obtener el ID del producto (puede venir como _id o id)
    const productId = product._id || product.id;
    if (!productId) {
      throw new Error('No se encontró ID del producto para indexar');
    }

    // Crear una copia del producto sin los campos de metadata de MongoDB
    const { _id, __v, ...cleanProduct } = product;

    // Asegurar que el campo 'id' esté presente en el documento
    cleanProduct.id = productId;

    await elasticClient.index({
      index: INDEX,
      id: productId,
      document: cleanProduct,
    });
  } catch (error) {
    console.error('Error indexando producto:', error);
    throw error;
  }
}

export async function searchProductsElastic(query) {
  try {
    if (!query) {
      const response = await elasticClient.search({
        index: INDEX,
        query: { match_all: {} },
      });
      return response.hits.hits.map((h) => h._source);
    }
    const response = await elasticClient.search({
      index: INDEX,
      query: {
        multi_match: {
          query,
          fields: ['name', 'brand', 'description'],
          fuzziness: 'AUTO',
        },
      },
    });
    return response.hits.hits.map((h) => h._source);
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

export async function getProductById(id) {
  try {
    const response = await elasticClient.get({
      index: INDEX,
      id: id,
    });
    return response._source;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error('Error obteniendo producto por ID:', error);
    throw error;
  }
}

export async function deleteProductFromIndex(id) {
  try {
    await elasticClient.delete({
      index: INDEX,
      id: id,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return;
    }
    console.error('Error eliminando producto del índice:', error);
    throw error;
  }
}
