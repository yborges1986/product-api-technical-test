# Documentación de CORS y Comunicación entre Microservicios

## 🔄 Configuración de CORS

### Variables de Entorno

```bash
# En .env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:4000
SERVICE_TOKEN=your_service_secret_token_here
NODE_ENV=development
```

### Configuración por Entorno

#### 🛠️ Desarrollo (`NODE_ENV=development`)

- **Permite todas las peticiones** desde cualquier origen
- **No requiere token** de autenticación entre servicios
- **CORS abierto** para facilitar el desarrollo

#### 🚀 Producción (`NODE_ENV=production`)

- **Solo orígenes permitidos** definidos en `ALLOWED_ORIGINS`
- **Requiere token** de servicio en header `X-Service-Token`
- **CORS restrictivo** para seguridad

## 📡 Comunicación entre Microservicios

### Headers Requeridos en Producción

```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-Service-Token': 'your_service_secret_token_here',
  'X-Service-Origin': 'search-service', // Opcional: nombre del servicio origen
  'X-Service-Version': '1.0.0', // Opcional: versión del servicio
};
```

### Ejemplo de Consumo desde Microservicio de Búsqueda

```javascript
// search-service/services/productService.js
class ProductService {
  constructor() {
    this.baseURL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000';
    this.serviceToken = process.env.SERVICE_TOKEN;
  }

  async getAllProducts() {
    const query = `
      query {
        products {
          _id
          gtin
          name
          description
          brand
          manufacturer
          netWeight
        }
      }
    `;

    const response = await fetch(`${this.baseURL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': this.serviceToken,
        'X-Service-Origin': 'search-service',
        'X-Service-Version': '1.0.0',
      },
      body: JSON.stringify({ query }),
    });

    return response.json();
  }

  async searchProducts(searchTerm) {
    // Implementar lógica de búsqueda
    const products = await this.getAllProducts();
    // Aplicar filtros de búsqueda...
    return products;
  }
}

export default ProductService;
```

### Ejemplo de Consumo desde Frontend

```javascript
// frontend/services/api.js
class ProductAPI {
  constructor() {
    this.baseURL =
      process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:3000';
  }

  async getProducts() {
    const query = `
      query {
        products {
          _id
          gtin
          name
          brand
          manufacturer
        }
      }
    `;

    const response = await fetch(`${this.baseURL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No necesita X-Service-Token desde frontend
      },
      body: JSON.stringify({ query }),
    });

    return response.json();
  }

  async createProduct(productData) {
    const mutation = `
      mutation CreateProduct($data: ProductInput!) {
        createProduct(data: $data) {
          _id
          gtin
          name
          brand
        }
      }
    `;

    const response = await fetch(`${this.baseURL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { data: productData },
      }),
    });

    return response.json();
  }
}

export default ProductAPI;
```

## 🛡️ Seguridad

### Tokens de Servicio

- Cada microservicio debe tener su propio token
- Tokens deben ser únicos y seguros
- Rotación regular de tokens en producción

### Orígenes Permitidos

- Configurar solo los dominios necesarios
- Incluir todos los puertos de desarrollo
- En producción, usar solo dominios reales

## 🔍 Monitoreo

El servicio registra automáticamente:

- **Comunicación entre servicios**: Headers `X-Service-Origin` y `X-Service-Version`
- **Peticiones HTTP**: Usando Morgan
- **Errores**: Usando Winston

### Logs de Ejemplo

```
[SERVICE-TO-SERVICE] search-service@1.0.0 -> POST /graphql
GET /health 200 - - 0.456 ms
info: GraphQL Query ejecutado {"timestamp":"2025-09-02T21:45:51.429Z"}
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Test de CORS

```bash
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Service-Token" \
     -X OPTIONS \
     http://localhost:3000/graphql
```

### Test con Token de Servicio

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: your_service_secret_token_here" \
  -d '{"query": "{ products { name } }"}'
```
