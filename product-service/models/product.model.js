import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  gtin: {
    // Identificador único conforme a GS1
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  netWeight: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model('Product', productSchema);
export default Product;
