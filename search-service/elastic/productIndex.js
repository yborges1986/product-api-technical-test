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
            netWeight: { type: 'float' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      });
      console.log(`Índice ${INDEX} creado exitosamente`);
    } else {
      console.log(`Índice ${INDEX} ya existe`);
    }
  } catch (error) {
    console.error('Error creando índice:', error);
  }
}

export async function indexProduct(product) {
  try {
    // Asegurar que el índice existe
    await createIndexIfNotExists();

    // Crear una copia del producto sin los campos de metadata de MongoDB
    const { _id, __v, ...cleanProduct } = product;

    await elasticClient.index({
      index: INDEX,
      id: _id,
      document: cleanProduct, // Cambié 'body' por 'document' para ES 8.x
    });
    console.log(`Producto indexado: ${_id}`);
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
    console.log(`Producto con ID ${id} eliminado del índice`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`Producto con ID ${id} no encontrado en el índice`);
      return;
    }
    console.error('Error eliminando producto del índice:', error);
    throw error;
  }
}
