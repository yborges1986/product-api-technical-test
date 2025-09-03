// elastic/productIndex.js
import { elasticClient } from './client.js';

const INDEX = 'products';

export async function indexProduct(product) {
  // Crear una copia del producto sin los campos de metadata de MongoDB
  const { _id, __v, ...cleanProduct } = product;

  await elasticClient.index({
    index: INDEX,
    id: _id,
    body: cleanProduct,
  });
}

export async function searchProductsElastic(query) {
  if (!query) {
    const { body } = await elasticClient.search({
      index: INDEX,
      body: {
        query: { match_all: {} },
      },
    });
    return body.hits.hits.map((h) => h._source);
  }
  const { body } = await elasticClient.search({
    index: INDEX,
    body: {
      query: {
        multi_match: {
          query,
          fields: ['name', 'brand', 'description'],
          fuzziness: 'AUTO',
        },
      },
    },
  });
  return body.hits.hits.map((h) => h._source);
}

export async function getProductById(id) {
  try {
    const { body } = await elasticClient.get({
      index: INDEX,
      id: id,
    });
    return body._source;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
