// Schema de GraphQL para autenticación
export const authSchema = `
  type AuthPayload {
    token: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UpdateProfileInput {
    name: String
    email: String
  }
`;
