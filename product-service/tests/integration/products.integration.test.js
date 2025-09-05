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

describe('Products Integration Tests', () => {
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

  describe('Product Creation by Role', () => {
    it('should create product as provider with pending status', async () => {
      const gtin = generateTestGTIN('123');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${gtin}"
            name: "Test Product Provider"
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
            createdBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: createProductMutation })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const product = response.body.data.createProduct;
      expect(product.gtin).toBe(gtin);
      expect(product.status).toBe('pending');
      expect(product.createdBy.role).toBe('provider');
    });

    it('should create product as editor with published status', async () => {
      const gtin = generateTestGTIN('456');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${gtin}"
            name: "Test Product Editor"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 200
            netWeightUnit: g
          }) {
            id
            gtin
            name
            status
            createdBy {
              role
            }
            approvedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: createProductMutation })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const product = response.body.data.createProduct;
      expect(product.gtin).toBe(gtin);
      expect(product.status).toBe('published');
      expect(product.createdBy.role).toBe('editor');
      expect(product.approvedBy.role).toBe('editor');
    });

    it('should create product as admin with published status', async () => {
      const gtin = generateTestGTIN('789');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${gtin}"
            name: "Test Product Admin"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 300
            netWeightUnit: g
          }) {
            id
            gtin
            name
            status
            createdBy {
              role
            }
            approvedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: createProductMutation })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const product = response.body.data.createProduct;
      expect(product.gtin).toBe(gtin);
      expect(product.status).toBe('published');
      expect(product.createdBy.role).toBe('admin');
      expect(product.approvedBy.role).toBe('admin');
    });
  });

  describe('Product Approval Flow', () => {
    let pendingProductGtin;

    beforeEach(async () => {
      // Crear producto como provider (pending)
      pendingProductGtin = generateTestGTIN('999');
      const createProductMutation = `
        mutation {
          createProduct(input: {
            gtin: "${pendingProductGtin}"
            name: "Product to Approve"
            description: "Test description"
            brand: "Test Brand"
            manufacturer: "Test Manufacturer"
            netWeight: 100
            netWeightUnit: g
          }) {
            id
            gtin
            status
          }
        }
      `;

      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: createProductMutation });
    });

    it('should allow editor to approve pending product', async () => {
      const approveProductMutation = `
        mutation {
          approveProduct(gtin: "${pendingProductGtin}") {
            gtin
            status
            approvedBy {
              role
            }
            approvedAt
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: approveProductMutation })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const product = response.body.data.approveProduct;
      expect(product.gtin).toBe(pendingProductGtin);
      expect(product.status).toBe('published');
      expect(product.approvedBy.role).toBe('editor');
      expect(product.approvedAt).toBeTruthy();
    });

    it('should allow admin to approve pending product', async () => {
      const approveProductMutation = `
        mutation {
          approveProduct(gtin: "${pendingProductGtin}") {
            gtin
            status
            approvedBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: approveProductMutation })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const product = response.body.data.approveProduct;
      expect(product.status).toBe('published');
      expect(product.approvedBy.role).toBe('admin');
    });

    it('should deny provider from approving products', async () => {
      const approveProductMutation = `
        mutation {
          approveProduct(gtin: "${pendingProductGtin}") {
            gtin
            status
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: approveProductMutation });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain(
        'No tienes permisos para aprobar productos'
      );
    });
  });

  describe('Product Visibility by Role', () => {
    let providerProductGtin, editorProductGtin;

    beforeEach(async () => {
      // Crear producto como provider (pending)
      providerProductGtin = generateTestGTIN('111');
      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({
          query: `
            mutation {
              createProduct(input: {
                gtin: "${providerProductGtin}"
                name: "Provider Product"
                description: "Test description"
                brand: "Test Brand"
                manufacturer: "Test Manufacturer"
                netWeight: 100
                netWeightUnit: g
              }) {
                id
              }
            }
          `,
        });

      // Crear producto como editor (published)
      editorProductGtin = generateTestGTIN('222');
      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({
          query: `
            mutation {
              createProduct(input: {
                gtin: "${editorProductGtin}"
                name: "Editor Product"
                description: "Test description"
                brand: "Test Brand"
                manufacturer: "Test Manufacturer"
                netWeight: 200
                netWeightUnit: g
              }) {
                id
              }
            }
          `,
        });
    });

    it('should allow provider to see only their own products', async () => {
      const productsQuery = `
        query {
          products {
            gtin
            name
            status
            createdBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: productsQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const products = response.body.data.products;

      // Provider should only see their own product
      const providerProducts = products.filter(
        (p) => p.createdBy.role === 'provider'
      );
      expect(providerProducts).toHaveLength(1);
      expect(providerProducts[0].gtin).toBe(providerProductGtin);
    });

    it('should allow editor to see all products', async () => {
      const productsQuery = `
        query {
          products {
            gtin
            name
            status
            createdBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: productsQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const products = response.body.data.products;

      // Editor should see both products
      expect(products.length).toBeGreaterThanOrEqual(2);
      const gtins = products.map((p) => p.gtin);
      expect(gtins).toContain(providerProductGtin);
      expect(gtins).toContain(editorProductGtin);
    });

    it('should allow admin to see all products', async () => {
      const productsQuery = `
        query {
          products {
            gtin
            name
            status
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: productsQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const products = response.body.data.products;

      // Admin should see both products
      expect(products.length).toBeGreaterThanOrEqual(2);
      const gtins = products.map((p) => p.gtin);
      expect(gtins).toContain(providerProductGtin);
      expect(gtins).toContain(editorProductGtin);
    });
  });

  describe('Product Filtering by Status', () => {
    beforeEach(async () => {
      // Crear un producto pending
      const pendingGtin = generateTestGTIN('333');
      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({
          query: `
            mutation {
              createProduct(input: {
                gtin: "${pendingGtin}"
                name: "Pending Product"
                description: "Test description"
                brand: "Test Brand"
                manufacturer: "Test Manufacturer"
                netWeight: 100
                netWeightUnit: g
              }) {
                id
              }
            }
          `,
        });

      // Crear un producto published
      const publishedGtin = generateTestGTIN('444');
      await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({
          query: `
            mutation {
              createProduct(input: {
                gtin: "${publishedGtin}"
                name: "Published Product"
                description: "Test description"
                brand: "Test Brand"
                manufacturer: "Test Manufacturer"
                netWeight: 200
                netWeightUnit: g
              }) {
                id
              }
            }
          `,
        });
    });

    it('should allow editor to filter products by pending status', async () => {
      const pendingProductsQuery = `
        query {
          productsByStatus(status: pending) {
            gtin
            status
            name
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.editor}`)
        .send({ query: pendingProductsQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const products = response.body.data.productsByStatus;
      expect(Array.isArray(products)).toBe(true);

      // Todos los productos devueltos deben estar en pending
      products.forEach((product) => {
        expect(product.status).toBe('pending');
      });
    });

    it('should allow admin to see pending products', async () => {
      const pendingProductsQuery = `
        query {
          pendingProducts {
            gtin
            status
            createdBy {
              role
            }
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ query: pendingProductsQuery })
        .expect(200);

      expect(response.body.data).toBeTruthy();
      const products = response.body.data.pendingProducts;
      expect(Array.isArray(products)).toBe(true);

      // Todos deben estar pending
      products.forEach((product) => {
        expect(product.status).toBe('pending');
      });
    });

    it('should deny provider from seeing pending products query', async () => {
      const pendingProductsQuery = `
        query {
          pendingProducts {
            gtin
            status
          }
        }
      `;

      const response = await request
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.provider}`)
        .send({ query: pendingProductsQuery });

      // GraphQL puede devolver errores con status 200 o 500 dependiendo de la implementación
      expect([200, 500]).toContain(response.status);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].message).toContain('No tienes permisos');
    });
  });
});
