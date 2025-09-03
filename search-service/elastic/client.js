// elastic/client.js
import { Client } from '@elastic/elasticsearch';

const ELASTIC_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const elasticClient = new Client({
  node: ELASTIC_URL,
  // Versión 8.x compatible
  auth: {
    // Sin autenticación para desarrollo local
  },
  tls: {
    // Desactivar SSL para desarrollo local
    rejectUnauthorized: false,
  },
});
