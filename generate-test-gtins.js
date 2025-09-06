import {
  calculateCheckDigit,
  validateGTIN,
  isValidGTIN,
} from './product-service/utils/gtin.util.js';

/**
 * Genera un GTIN válido de la longitud especificada
 * @param {number} length - Longitud del GTIN (8, 12, 13, o 14)
 * @param {string} prefix - Prefijo opcional para el GTIN
 * @returns {string} GTIN válido con dígito verificador calculado
 */
function generateValidGTIN(length, prefix = '') {
  const validLengths = [8, 12, 13, 14];
  if (!validLengths.includes(length)) {
    throw new Error('Longitud debe ser 8, 12, 13 o 14');
  }

  // Crear un número base sin el dígito verificador
  const baseLength = length - 1;
  let base = prefix;

  // Completar con dígitos aleatorios si es necesario
  while (base.length < baseLength) {
    base += Math.floor(Math.random() * 10).toString();
  }

  // Truncar si es demasiado largo
  base = base.substring(0, baseLength);

  // Calcular el dígito verificador
  const checkDigit = calculateCheckDigit(base);

  return base + checkDigit.toString();
}

console.log('🔢 GENERADOR DE GTINs VÁLIDOS PARA PRUEBAS');
console.log('==========================================\n');

// Generar 3 GTINs de diferentes tipos
const testGTINs = [
  {
    type: 'GTIN-8',
    gtin: generateValidGTIN(8, '987'),
    description: 'GTIN-8 para productos pequeños',
  },
  {
    type: 'GTIN-13',
    gtin: generateValidGTIN(13, '789'),
    description: 'GTIN-13 (EAN-13) estándar',
  },
  {
    type: 'GTIN-14',
    gtin: generateValidGTIN(14, '456'),
    description: 'GTIN-14 para cajas/paquetes',
  },
];

console.log('📋 GTINs GENERADOS PARA PRUEBAS:');
console.log('=================================\n');

testGTINs.forEach((item, index) => {
  const validation = validateGTIN(item.gtin);
  const status = validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO';

  console.log(`${index + 1}. ${item.type}: ${item.gtin}`);
  console.log(`   Descripción: ${item.description}`);
  console.log(`   Estado: ${status}`);
  console.log(`   Tipo detectado: ${validation.type || 'N/A'}`);
  if (!validation.isValid) {
    console.log(`   Errores: ${validation.errors.join(', ')}`);
  }
  console.log();
});

console.log('🧪 COMANDOS CURL PARA PROBAR:');
console.log('=============================\n');

testGTINs.forEach((item, index) => {
  console.log(`# Producto ${index + 1} - ${item.type}`);
  console.log(`curl -s -X POST "http://localhost:3000/graphql" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\`);
  console.log(
    `  -d '{"query": "mutation { createProduct(input: { gtin: \\"${
      item.gtin
    }\\", name: \\"Test Product ${index + 1}\\", description: \\"${
      item.description
    }\\", brand: \\"Test Brand\\", manufacturer: \\"Test Manufacturer\\", netWeight: ${
      (index + 1) * 100
    }, netWeightUnit: g }) { id gtin name } }"}'`
  );
  console.log();
});

console.log('🔍 COMANDO PARA VER PRODUCTOS CREADOS:');
console.log('======================================\n');
console.log(`curl -s -X POST "http://localhost:3000/graphql" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\`);
console.log(
  `  -d '{"query": "{ products { gtin name brand netWeight netWeightUnit } }"}'`
);
