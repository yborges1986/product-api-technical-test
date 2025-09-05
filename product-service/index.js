import 'dotenv/config';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import winston from 'winston';

import connectDB from './core/database/mongo.js';

// Importar schemas y resolvers modulares
import { schema, resolvers } from './graphql/product.graphql.js';

// Importar middleware
import { serviceAuth, serviceLogger } from './middleware/serviceAuth.js';
import {
  authMiddleware,
  createGraphQLContext,
} from './middleware/auth.middleware.js';

// Importar seeds
import { initializeUsers } from './seeds/users.seed.js';
import { initializeSampleProducts } from './seeds/products.seed.js';

// Usar schemas y resolvers modulares
const mergedSchema = buildSchema(schema);

// Usar resolvers modulares
const mergedResolvers = resolvers;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = 'Product Management Service';

// Configuración de CORS para microservicio
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones desde cualquier origen en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // En producción, definir orígenes permitidos
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:4002', // Microservicio de búsqueda
    ];

    // Permitir peticiones sin origin (ej: aplicaciones móviles, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());

app.use(serviceLogger);

app.use('/graphql', authMiddleware);

// Mantener autenticación de servicio solo para comunicación entre microservicios en producción
if (process.env.NODE_ENV === 'production') {
  app.use('/graphql', serviceAuth);
}

// Conexión a MongoDB e inicialización
connectDB()
  .then(async () => {
    logger.info('Conectado a MongoDB');
    // Inicializar usuarios del sistema
    await initializeUsers();

    // Inicializar productos de ejemplo (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await initializeSampleProducts();
    }
  })
  .catch((err) => logger.error('Error conectando a MongoDB:', err));

// Health check endpoint para microservicios
app.get('/health', (req, res) => {
  res.status(200).json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

// Endpoint de información del servicio
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    description: 'Microservicio de gestión de productos con GraphQL',
    endpoints: {
      graphql: '/graphql',
      health: '/health',
    },
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.use(
  '/graphql',
  graphqlHTTP((req) => ({
    schema: mergedSchema,
    rootValue: mergedResolvers,
    context: createGraphQLContext(req),
    graphiql: process.env.NODE_ENV !== 'production', // GraphiQL solo en desarrollo
    customFormatErrorFn: (err) => {
      logger.error(`[GraphQL Error] ${err.message}\n${err.stack}`);
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      };
    },
  }))
);

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    details:
      process.env.NODE_ENV === 'production' ? 'Contact support' : err.message,
    service: SERVICE_NAME,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 ${SERVICE_NAME} escuchando en http://localhost:${PORT}`);
  logger.info(`📊 GraphQL Playground: http://localhost:${PORT}/graphql`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/health`);
});
