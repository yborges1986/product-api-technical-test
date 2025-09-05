import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import supertest from 'supertest';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { createTestUsers, TEST_USERS, clearTestDB } from '../setup/helpers.js';
import { schema, resolvers } from '../../graphql/product.graphql.js';
import {
  authMiddleware,
  createGraphQLContext,
} from '../../middleware/auth.middleware.js';
import {
  cleanTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
} from '../setup/testCleanup.js';
import mongoose from 'mongoose';

// Crear app de prueba
const createTestApp = () => {
  const app = express();
  const mergedSchema = buildSchema(schema);

  app.use(
    '/graphql',
    authMiddleware,
    graphqlHTTP((req, res) => ({
      schema: mergedSchema,
      rootValue: resolvers,
      context: createGraphQLContext(req, res),
      graphiql: false,
    }))
  );

  return app;
};

describe('Authentication Integration Tests', () => {
  let app;
  let request;
  let users;

  beforeAll(async () => {
    const connected = await connectTestDatabase();
    if (!connected) {
      console.warn(
        '⚠️ Skipping auth integration tests - no database connection'
      );
    }
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      return; // Skip if no connection
    }

    await cleanTestDatabase();

    app = createTestApp();
    request = supertest(app);
    users = await createTestUsers();
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      const loginMutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
              email
              role
            }
          }
        }
      `;

      const variables = {
        input: {
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
        },
      };

      const response = await request
        .post('/graphql')
        .send({ query: loginMutation, variables })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(response.body.data.login).toBeTruthy();
      expect(response.body.data.login.token).toBeTruthy();
      expect(response.body.data.login.user.email).toBe(TEST_USERS.admin.email);
      expect(response.body.data.login.user.role).toBe('admin');
    });

    it('should fail login with invalid credentials', async () => {
      const loginMutation = `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
              email
            }
          }
        }
      `;

      const variables = {
        input: {
          email: TEST_USERS.admin.email,
          password: 'wrongpassword',
        },
      };

      const response = await request
        .post('/graphql')
        .send({ query: loginMutation, variables });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'Credenciales inválidas'
      );
    });

    it('should fail login with non-existent user', async () => {
      const loginMutation = `
        mutation($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              id
            }
          }
        }
      `;

      const variables = {
        input: {
          email: 'nonexistent@test.com',
          password: 'password',
        },
      };

      const response = await request
        .post('/graphql')
        .send({ query: loginMutation, variables });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'Credenciales inválidas'
      );
    });
  });

  describe('Token-based Authentication', () => {
    let adminToken;

    beforeEach(async () => {
      // Login para obtener token
      const loginMutation = `
        mutation($input: LoginInput!) {
          login(input: $input) {
            token
          }
        }
      `;

      const variables = {
        input: {
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
        },
      };

      const loginResponse = await request
        .post('/graphql')
        .send({ query: loginMutation, variables });

      adminToken = loginResponse.body.data.login.token;
    });

    it('should access protected query with valid token', async () => {
      const meQuery = `
        query {
          me {
            id
            email
            role
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: meQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(response.body.data.me.email).toBe(TEST_USERS.admin.email);
      expect(response.body.data.me.role).toBe('admin');
    });

    it('should deny access to protected query without token', async () => {
      const meQuery = `
        query {
          me {
            id
            email
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .send({ query: meQuery })
        .expect(200);

      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'No autorizado - token requerido'
      );
    });

    it('should deny access with invalid token', async () => {
      const meQuery = `
        query {
          me {
            id
            email
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', 'Bearer invalid-token')
        .send({ query: meQuery })
        .expect(200);

      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'No autorizado - token requerido'
      );
    });
  });

  describe('Role-based Access', () => {
    let adminToken, editorToken, providerToken;

    beforeEach(async () => {
      // Obtener tokens para cada rol
      const getToken = async (email, password) => {
        const loginMutation = `
          mutation($input: LoginInput!) {
            login(input: $input) {
              token
            }
          }
        `;

        const variables = {
          input: { email, password },
        };

        const response = await request
          .post('/graphql')
          .send({ query: loginMutation, variables });

        return response.body.data.login.token;
      };

      adminToken = await getToken(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
      editorToken = await getToken(
        TEST_USERS.editor.email,
        TEST_USERS.editor.password
      );
      providerToken = await getToken(
        TEST_USERS.provider.email,
        TEST_USERS.provider.password
      );
    });

    it('should allow admin to access user management', async () => {
      const usersQuery = `
        query {
          users {
            id
            email
            role
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: usersQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(response.body.data.users).toBeTruthy();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should deny provider access to user management', async () => {
      const usersQuery = `
        query {
          users {
            id
            email
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ query: usersQuery });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain('No tienes permisos');
    });
  });

  describe('Password Change', () => {
    let adminToken;

    beforeEach(async () => {
      const loginMutation = `
        mutation($input: LoginInput!) {
          login(input: $input) {
            token
          }
        }
      `;

      const variables = {
        input: {
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
        },
      };

      const loginResponse = await request
        .post('/graphql')
        .send({ query: loginMutation, variables });

      adminToken = loginResponse.body.data.login.token;
    });

    it('should change password with valid current password', async () => {
      const changePasswordMutation = `
        mutation($input: ChangePasswordInput!) {
          changePassword(input: $input) 
        }
      `;

      const variables = {
        input: {
          currentPassword: TEST_USERS.admin.password,
          newPassword: 'newpassword123',
        },
      };

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: changePasswordMutation, variables })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(response.body.data.changePassword).toBe('true');
    });

    it('should fail to change password with wrong current password', async () => {
      const changePasswordMutation = `
        mutation($input: ChangePasswordInput!) {
          changePassword(input: $input)
        }
      `;

      const variables = {
        input: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        },
      };

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: changePasswordMutation, variables });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'Contraseña actual incorrecta'
      );
    });
  });
});
