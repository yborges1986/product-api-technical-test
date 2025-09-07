import {
  searchProductsElastic,
  getProductById,
  createIndexIfNotExists,
} from './elastic/productIndex.js';
import { elasticClient } from './elastic/client.js';
import { syncService } from './services/index.js';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import startListeners from './listeners/index.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Función para verificar la conexión a Elasticsearch
async function checkElasticsearchConnection() {
  try {
    await elasticClient.ping();
    await createIndexIfNotExists();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Elasticsearch:', error.message);
    return false;
  }
}

// Ruta de health check
app.get('/health', async (req, res) => {
  const elasticStatus = await checkElasticsearchConnection();
  res.json({
    status: elasticStatus ? 'healthy' : 'unhealthy',
    service: 'search-service',
    uptime: process.uptime(),
    elasticsearch: elasticStatus ? 'connected' : 'disconnected',
  });
});

// Endpoint de búsqueda en Elasticsearch
app.get('/search-elastic', async (req, res) => {
  const { q } = req.query;
  try {
    const results = await searchProductsElastic(q);
    res.json({ results });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error buscando en Elasticsearch', details: err.message });
  }
});

// Endpoint para obtener producto por ID en Elasticsearch
app.get('/product/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ product });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error obteniendo producto', details: err.message });
  }
});

// Endpoint para sincronizar productos manualmente
app.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronización manual...');
    const result = await syncService.forceSyncProducts();
    res.json({
      message: 'Sincronización completada',
      ...result,
    });
  } catch (err) {
    console.error('❌ Error en sincronización manual:', err.message);
    res.status(500).json({
      error: 'Error en sincronización',
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 4002;

// Iniciar el servidor
async function startServer() {
  const elasticConnected = await checkElasticsearchConnection();
  if (!elasticConnected) {
    console.log(
      '⚠️  Iniciando sin conexión a Elasticsearch. Reintentando cada 30s...'
    );

    // Configurar reintento con sincronización automática
    const retryInterval = setInterval(async () => {
      const connected = await checkElasticsearchConnection();
      if (connected) {
        console.log('✅ Elasticsearch conectado, iniciando sincronización...');
        clearInterval(retryInterval);
        await syncService.syncExistingProducts();
        startListeners();
      }
    }, 30000);
  } else {
    // Si se conecta inmediatamente, sincronizar productos existentes
    await syncService.syncExistingProducts();
    startListeners();
  }

  app.listen(PORT, () => {
    console.log(`Search Service running on port ${PORT}`);
  });
}

startServer();
