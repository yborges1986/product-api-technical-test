export const productSchema = `
  enum NetWeightUnit {
    g
    kg
    ml
    l
    oz
    lb
  }

  type Product {
    id: ID!
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: Float!
    netWeightUnit: NetWeightUnit!
    status: ProductStatus!
    createdBy: User!
    approvedBy: User
    approvedAt: String
    createdAt: String!
    updatedAt: String!
    history: [ProductHistoryEntry!]
  }

  type ProductHistoryEntry {
    id: ID!
    gtin: String!
    productId: ID!
    action: String!
    changedBy: User!
    changedAt: String!
    changes: String
    previousData: String
    newData: String
    metadata: String
  }

  input ProductInput {
    gtin: String!
    name: String!
    description: String!
    brand: String!
    manufacturer: String!
    netWeight: Float!
    netWeightUnit: NetWeightUnit!
  }

  input UpdateProductInput {
    name: String
    description: String
    brand: String
    manufacturer: String
    netWeight: Float
    netWeightUnit: NetWeightUnit
  }
`;
