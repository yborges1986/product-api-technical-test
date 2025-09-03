// Lógica para obtener productos
import Product from '../../models/product.model.js';

export default async function getProduct(gtin) {
  return await Product.findOne({ gtin });
}
