# Search Service - Microservicio de Búsqueda de Productos

Microservicio REST API simple para búsqueda de productos.

## 🚀 Características

- API REST simple
- Ruta "Hola mundo"
- Health check endpoint

## 📋 Prerequisitos

- Node.js 18+
- npm

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

## 🏃‍♂️ Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🔌 API Endpoints

### GET /

Ruta principal que devuelve "Hola mundo"

**Response:**

```json
{
  "message": "Hola mundo",
  "service": "Search Service",
  "status": "OK",
  "timestamp": "2025-09-02T10:30:00.000Z"
}
```

### GET /health

Health check del servicio

**Response:**

```json
{
  "status": "healthy",
  "service": "search-service",
  "uptime": 125.456
}
```

## 🏗️ Arquitectura

```
search-service/
├── .env                 # Variables de entorno
├── .env.example        # Ejemplo de variables
├── Dockerfile         # Contenedor Docker
├── index.js          # Punto de entrada
├── package.json      # Dependencias
└── README.md        # Documentación
```

## 🚢 Docker

```bash
# Construir imagen
docker build -t search-service .

# Ejecutar contenedor
docker run -p 4002:4002 search-service
```
