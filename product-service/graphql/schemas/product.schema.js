// Schema de GraphQL para productos
export const productSchema = `
  type Product {
    id: ID!
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: String!
    status: ProductStatus
    createdBy: User
    approvedBy: User
    approvedAt: String
    createdAt: String!
    updatedAt: String!
  }

  input ProductInput {
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: String!
  }

  input UpdateProductInput {
    name: String
    description: String
    brand: String
    manufacturer: String
    netWeight: String
  }
`;
