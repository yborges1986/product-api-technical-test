// Schema de GraphQL para productos
export const productSchema = `
  # Enum para unidades de peso neto
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
    # Peso neto con valor numérico y unidad
    netWeight: Float!
    netWeightUnit: NetWeightUnit!
    status: ProductStatus!
    createdBy: User!
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
    # Peso neto requerido con unidad
    netWeight: Float!
    netWeightUnit: NetWeightUnit!
  }

  input UpdateProductInput {
    name: String
    description: String
    brand: String
    manufacturer: String
    # Campos opcionales para actualización
    netWeight: Float
    netWeightUnit: NetWeightUnit
  }
`;
