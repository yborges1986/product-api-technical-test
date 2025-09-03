import {
  searchProductsElastic,
  getProductById,
} from './elastic/productIndex.js';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import startListeners from './listeners/index.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'search-service',
    uptime: process.uptime(),
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

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`🔍 Search Service running on port ${PORT}`);
  console.log(`🚀 API endpoint: http://localhost:${PORT}`);
  // Iniciar listeners de NATS
  startListeners();
});
