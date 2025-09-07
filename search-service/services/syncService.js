// services/syncService.js
import { elasticClient } from '../elastic/client.js';
import { createIndexIfNotExists } from '../elastic/productIndex.js';

/**
 * Servicio para sincronizar productos existentes desde MongoDB cuando Elasticsearch se conecta
 */
export class SyncService {
  constructor() {
    this.PRODUCT_SERVICE_URL =
      process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000';
    this.SERVICE_TOKEN =
      process.env.SERVICE_TOKEN || 'treew-internal-secret-2024';
    this.PRODUCTS_INDEX = 'products';
  }

  /**
   * Sincroniza productos existentes cuando se conecta por primera vez
   */
  async syncExistingProducts() {
    try {
      // Verificar si ya hay productos indexados
      const indexExists = await this._checkIndexExists();
      if (!indexExists) {
        console.log('📝 Creando índice de productos...');
        await createIndexIfNotExists();
      }

      const indexStats = await elasticClient.count({
        index: this.PRODUCTS_INDEX,
      });

      if (indexStats.count > 0) {
        console.log(
          `ℹ️  Ya hay ${indexStats.count} productos indexados, omitiendo sincronización inicial`
        );
        return { skipped: true, count: indexStats.count };
      }

      console.log('🔄 Sincronizando productos existentes desde MongoDB...');

      // Esperar a que product-service esté listo
      const isProductServiceReady = await this._waitForProductService();
      if (!isProductServiceReady) {
        console.log(
          '⚠️  Product-service no está listo, omitiendo sincronización inicial'
        );
        return { error: 'Product service not ready' };
      }

      // Obtener productos desde MongoDB
      const products = await this._fetchProductsFromService();
      if (!products || products.length === 0) {
        console.log('ℹ️  No hay productos para sincronizar');
        return { indexed: 0 };
      }

      // Indexar solo productos publicados
      const result = await this._indexProducts(products);
      console.log(
        `✅ Sincronización inicial completada: ${result.indexed} productos indexados`
      );

      return result;
    } catch (error) {
      console.error('❌ Error en sincronización inicial:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Verifica si el índice de productos existe
   */
  async _checkIndexExists() {
    try {
      return await elasticClient.indices.exists({ index: this.PRODUCTS_INDEX });
    } catch (error) {
      console.error('Error verificando existencia del índice:', error.message);
      return false;
    }
  }

  /**
   * Espera a que el product-service esté listo
   */
  async _waitForProductService(maxAttempts = 10, delay = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.PRODUCT_SERVICE_URL}/health`);
        if (response.ok) {
          console.log('✅ Product-service está listo');
          return true;
        }
      } catch (error) {
        // Servicio no está listo aún
      }

      if (attempt < maxAttempts) {
        console.log(
          `⏳ Esperando product-service (intento ${attempt}/${maxAttempts})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  /**
   * Obtiene productos desde el product-service vía GraphQL
   */
  async _fetchProductsFromService() {
    try {
      const query = `
        query {
          products {
            id
            gtin
            name
            description
            brand
            manufacturer
            netWeight
            netWeightUnit
            status
            createdAt
            updatedAt
            approvedAt
            createdBy { id name email role }
            approvedBy { id name email role }
          }
        }
      `;

      const response = await fetch(`${this.PRODUCT_SERVICE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': this.SERVICE_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data?.products || [];
    } catch (error) {
      console.error('Error obteniendo productos del servicio:', error.message);
      throw error;
    }
  }

  /**
   * Indexa productos en Elasticsearch
   */
  async _indexProducts(products) {
    // Filtrar solo productos publicados
    const publishedProducts = products.filter((p) => p.status === 'published');
    let indexed = 0;
    let errors = 0;

    for (const product of publishedProducts) {
      try {
        // Convertir formato para indexación
        const productForIndex = this._transformProductForIndex(product);

        await elasticClient.index({
          index: this.PRODUCTS_INDEX,
          id: product.id,
          document: productForIndex,
        });

        indexed++;
        console.log(`✅ Indexado: ${product.name} (${product.gtin})`);
      } catch (error) {
        errors++;
        console.error(
          `❌ Error indexando producto ${product.name}:`,
          error.message
        );
      }
    }

    return {
      indexed,
      errors,
      total: publishedProducts.length,
      filtered: products.length - publishedProducts.length,
    };
  }

  /**
   * Transforma un producto del formato GraphQL al formato de indexación
   */
  _transformProductForIndex(product) {
    return {
      id: product.id,
      gtin: product.gtin,
      name: product.name,
      description: product.description,
      brand: product.brand,
      manufacturer: product.manufacturer,
      netWeight: product.netWeight,
      netWeightUnit: product.netWeightUnit,
      status: product.status,
      createdById: product.createdBy?.id,
      approvedById: product.approvedBy?.id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      approvedAt: product.approvedAt,
    };
  }

  /**
   * Forzar re-sincronización (útil para endpoints manuales)
   */
  async forceSyncProducts() {
    try {
      console.log('🔄 Forzando re-sincronización de productos...');

      // Borrar todos los documentos existentes
      await elasticClient.deleteByQuery({
        index: this.PRODUCTS_INDEX,
        body: {
          query: { match_all: {} },
        },
      });

      // Sincronizar de nuevo
      return await this.syncExistingProducts();
    } catch (error) {
      console.error('❌ Error en re-sincronización forzada:', error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const syncService = new SyncService();
