// Middleware para autenticación entre microservicios
export function serviceAuth(req, res, next) {
  // Si no está en producción, permitir todas las peticiones
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const serviceToken = req.headers['x-service-token'];
  const expectedToken = process.env.SERVICE_TOKEN;

  // Si no hay token configurado, saltarse la validación
  if (!expectedToken) {
    return next();
  }

  // Validar token de servicio
  if (!serviceToken || serviceToken !== expectedToken) {
    return res.status(401).json({
      error: 'Token de servicio inválido',
      service: 'Product Management Service',
    });
  }

  next();
}

export function serviceLogger(req, res, next) {
  const serviceOrigin = req.headers['x-service-origin'] || 'unknown';
  const serviceVersion = req.headers['x-service-version'] || 'unknown';

  // Log service-to-service communication for monitoring
  // console.log(`[SERVICE-TO-SERVICE] ${serviceOrigin}@${serviceVersion} -> ${req.method} ${req.path}`);

  next();
}
