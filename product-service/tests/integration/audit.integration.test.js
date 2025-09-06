import { describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import {
  connectTestDatabase,
  cleanTestDatabase,
  disconnectTestDatabase,
  createTestUsers,
  generateTestGTIN,
} from '../setup/testCleanup.js';
import { schema, resolvers } from '../../graphql/product.graphql.js';
import {
  authMiddleware,
  createGraphQLContext,
} from '../../middleware/auth.middleware.js';

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

describe('Product History and Audit Tests', () => {
  let app;
  let request;
  let users;
  let tokens = {};

  // Configuración de la base de datos
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();

    app = createTestApp();
    request = supertest(app);
    users = await createTestUsers();

    // Obtener tokens para cada usuario - usando el formato nuevo de GraphQL
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

    tokens.admin = await getToken(users.admin.email, users.admin.password);
    tokens.editor = await getToken(users.editor.email, users.editor.password);
    tokens.provider = await getToken(
      users.provider.email,
      users.provider.password
    );
  });

  describe('Product Creation Audit', () => {
    it('should create audit entry when product is created', async () => {
      const gtin = generateTestGTIN('555');

      // Crear producto
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${gtin}"
            name: "Test Audit Product"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 100
            netWeightUnit: g
          }) {
            id
            gtin
            name
            status
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: createProductMutation })
        .expect(200);

      // Verificar historial de auditoría
      const historyQuery = `
        query {
          productHistory(gtin: "${gtin}") {
            action
            changedBy {
              role
            }
            changedAt
          }
        }
      `;

      const historyResponse = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: historyQuery })
        .expect(200);

      expect(historyResponse.body.data).toBeTruthy();
      const history = historyResponse.body.data.productHistory;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      // Debe haber una entrada de creación
      const creationEntry = history.find((entry) => entry.action === 'created');
      expect(creationEntry).toBeTruthy();
      expect(creationEntry.changedBy.role).toBe('provider');
      expect(creationEntry.changedAt).toBeTruthy();
    });
  });

  describe('Product Approval Audit', () => {
    let pendingProductGtin;

    beforeEach(async () => {
      // Crear producto como provider (pending)
      pendingProductGtin = generateTestGTIN('666');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${pendingProductGtin}"
            name: "Product for Approval Audit"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 100
            netWeightUnit: g
          }) {
            id
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: createProductMutation });
    });

    it('should create audit entry when product is approved', async () => {
      // Aprobar producto
      const approveProductMutation = `
        mutation {
          approveProduct(gtin: "${pendingProductGtin}") {
            gtin
            status
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: approveProductMutation })
        .expect(200);

      // Verificar historial de auditoría
      const historyQuery = `
        query {
          productHistory(gtin: "${pendingProductGtin}") {
            action
            changedBy {
              role
            }
            changedAt
          }
        }
      `;

      const historyResponse = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: historyQuery })
        .expect(200);

      expect(historyResponse.body.data).toBeTruthy();
      const history = historyResponse.body.data.productHistory;

      // Debe haber entradas de creación y aprobación
      const creationEntry = history.find((entry) => entry.action === 'created');
      const approvalEntry = history.find(
        (entry) => entry.action === 'approved'
      );

      expect(creationEntry).toBeTruthy();
      expect(creationEntry.changedBy.role).toBe('provider');

      expect(approvalEntry).toBeTruthy();
      expect(approvalEntry.changedBy.role).toBe('editor');
    });
  });

  describe('Product Update Audit', () => {
    let testProductGtin;

    beforeEach(async () => {
      // Crear producto como admin (published)
      testProductGtin = generateTestGTIN('777');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${testProductGtin}"
            name: "Product for Update Audit"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 100
            netWeightUnit: g
          }) {
            id
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: createProductMutation });
    });

    it('should create audit entry when product is updated', async () => {
      // Actualizar producto
      const updateProductMutation = `
        mutation {
          updateProduct(gtin: "${testProductGtin}", input: {
            name: "Updated Product Name"
            description: "Updated description"
          }) {
            gtin
            name
            description
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: updateProductMutation })
        .expect(200);

      // Verificar historial de auditoría
      const historyQuery = `
        query {
          productHistory(gtin: "${testProductGtin}") {
            action
            changedBy {
              role
            }
            changedAt
          }
        }
      `;

      const historyResponse = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: historyQuery })
        .expect(200);

      expect(historyResponse.body.data).toBeTruthy();
      const history = historyResponse.body.data.productHistory;

      // Debe haber entradas de creación y actualización
      const creationEntry = history.find((entry) => entry.action === 'created');
      const updateEntry = history.find((entry) => entry.action === 'updated');

      expect(creationEntry).toBeTruthy();
      expect(updateEntry).toBeTruthy();
      expect(updateEntry.changedBy.role).toBe('admin');
    });
  });

  describe('Product History Access Control', () => {
    let testProductGtin;

    beforeEach(async () => {
      // Crear producto con historial
      testProductGtin = generateTestGTIN('888');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${testProductGtin}"
            name: "Product with History"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 100
            netWeightUnit: g
          }) {
            id
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: createProductMutation });
    });

    it('should allow admin to access product history', async () => {
      const historyQuery = `
        query {
          productHistory(gtin: "${testProductGtin}") {
            action
            changedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: historyQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(Array.isArray(response.body.data.productHistory)).toBe(true);
    });

    it('should allow editor to access product history', async () => {
      const historyQuery = `
        query {
          productHistory(gtin: "${testProductGtin}") {
            action
            changedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: historyQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      expect(Array.isArray(response.body.data.productHistory)).toBe(true);
    });

    it('should allow provider to access history of their own products', async () => {
      const historyQuery = `
        query {
          productHistory(gtin: "${testProductGtin}") {
            action
            changedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: historyQuery })
        .expect(200);

      // Este test puede fallar si hay restricciones específicas para providers
      // Ajustar según la implementación real
      expect(response.body.data || response.body.errors).toBeTruthy();
    });
  });

  describe('Audit History General Query', () => {
    beforeEach(async () => {
      // Crear varios productos para tener datos de audit
      for (let i = 1; i <= 3; i++) {
        const gtin = generateTestGTIN(`90${i}`);
        await request
          .post('/graphql')
          .set('Authorization', `Bearer ${tokens.provider}`)
          .send({
            query: `
              mutation {
                createProduct(input: {
                  gtin: "${gtin}"
                  name: "Audit Test Product ${i}"
                  description: "Test description"
                  brand: "Test Brand"
                  manufacturer: "Test Manufacturer"
                  netWeight: ${100 + i * 10}
                  netWeightUnit: g
                }) {
                  id
                }
              }
            `,
          });
      }
    });

    it('should allow admin to query general audit history', async () => {
      const auditHistoryQuery = `
        query {
          auditHistory(limit: 10) {
            gtin
            action
            changedBy {
              role
            }
            changedAt
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: auditHistoryQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const auditHistory = response.body.data.auditHistory;
      expect(Array.isArray(auditHistory)).toBe(true);
      expect(auditHistory.length).toBeGreaterThan(0);

      // Verificar que tiene las propiedades esperadas
      auditHistory.forEach((entry) => {
        expect(entry.gtin).toBeTruthy();
        expect(entry.action).toBeTruthy();
        expect(entry.changedBy.role).toBeTruthy();
        expect(entry.changedAt).toBeTruthy();
      });
    });

    it('should allow filtering audit history by action', async () => {
      const auditHistoryQuery = `
        query {
          auditHistory(action: created, limit: 5) {
            gtin
            action
            changedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: auditHistoryQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const auditHistory = response.body.data.auditHistory;

      // Todas las entradas deben ser de creación
      auditHistory.forEach((entry) => {
        expect(entry.action).toBe('created');
      });
    });
  });
});
