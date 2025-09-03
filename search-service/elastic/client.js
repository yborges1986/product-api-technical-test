// elastic/client.js
import { Client } from '@elastic/elasticsearch';

const ELASTIC_URL = process.env.ELASTIC_URL || 'http://localhost:9200';

export const elasticClient = new Client({
  node: ELASTIC_URL,
  apiVersion: '7.x',
});
