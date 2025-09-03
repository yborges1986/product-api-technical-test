import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../service/index.js';
import { Product } from '../models/index.js';
import { buildSchema } from 'graphql';

const schema = buildSchema(`
  type Product {
    id: ID!
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: String!
  }

  input ProductInput {
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: String!
  }

  type Query {
    products: [Product]
    product(gtin: String!): Product
  }

  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(gtin: String!, input: ProductInput!): Product
    deleteProduct(gtin: String!): String
  }
`);

const root = {
  products: async () => await Product.find(),
  product: async ({ gtin }) => await getProduct(gtin),
  createProduct: async ({ input }) => await createProduct(input),
  updateProduct: async ({ gtin, input }) => await updateProduct(gtin, input),
  deleteProduct: async ({ gtin }) => await deleteProduct(gtin),
};

export { schema, root };
