// Schema de GraphQL para gestión de usuarios
export const userSchema = `
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    isActive: Boolean!
    lastLogin: String
    createdAt: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: UserRole = provider
  }

  input UpdateUserInput {
    name: String
    email: String
    isActive: Boolean
  }

  input AdminChangePasswordInput {
    userId: ID!
    newPassword: String!
  }
`;
