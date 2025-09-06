export const commonSchema = `
  enum UserRole {
    provider
    editor
    admin
  }
  
  enum ProductStatus {
    pending
    published
  }

  enum AuditAction {
    created
    updated
    approved
    deleted
  }

  type Query {
    products: [Product!]!
    product(gtin: String!): Product
    productsByStatus(status: ProductStatus!): [Product!]!
    pendingProducts: [Product!]!
    
    productHistory(
      gtin: String!
      limit: Int = 50
      offset: Int = 0
      action: String
    ): [ProductHistoryEntry!]!
    
    auditHistory(
      gtin: String
      name: String
      action: AuditAction
      changedBy: String
      dateFrom: String
      dateTo: String
      limit: Int = 10
      offset: Int = 0
    ): [ProductHistoryEntry!]!

    me: User
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(gtin: String!, input: UpdateProductInput!): Product!
    deleteProduct(gtin: String!): String!
    approveProduct(gtin: String!): Product!

    login(input: LoginInput!): AuthPayload!
    changePassword(input: ChangePasswordInput!): String!
    updateProfile(input: UpdateProfileInput!): User!
    
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): String!
    activateUser(id: ID!): User!
    deactivateUser(id: ID!): User!
    changeUserRole(id: ID!, role: UserRole!): User!
    changeUserPassword(id: ID!, newPassword: String!): String!
  }
`;
