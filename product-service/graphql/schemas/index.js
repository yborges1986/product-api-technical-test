import { commonSchema } from './common.schema.js';
import { productSchema } from './product.schema.js';
import { userSchema } from './user.schema.js';
import { authSchema } from './auth.schema.js';

// Combinar todos los schemas en uno solo
export const schema = `
  ${commonSchema}
  ${productSchema}
  ${userSchema}
  ${authSchema}

  type Query {
    # Productos
    products: [Product!]!
    product(gtin: String!): Product
    productsByStatus(status: ProductStatus!): [Product!]!
    pendingProducts: [Product!]!
    
    # Autenticación
    me: User!
    
    # Usuarios (admin)
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    # Productos
    createProduct(input: ProductInput!): Product!
    updateProduct(gtin: String!, input: UpdateProductInput!): Product!
    deleteProduct(gtin: String!): String!
    approveProduct(gtin: String!): Product!
    
    # Autenticación
    login(input: LoginInput!): AuthPayload!
    changePassword(input: ChangePasswordInput!): Boolean!
    updateProfile(input: UpdateProfileInput!): User!
    
    # Gestión de usuarios (admin)
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    changeUserRole(id: ID!, role: UserRole!): User!
    changeUserPassword(input: AdminChangePasswordInput!): Boolean!
    activateUser(id: ID!): User!
    deactivateUser(id: ID!): User!
  }
`;
