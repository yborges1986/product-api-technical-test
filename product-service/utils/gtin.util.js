/**
 * Utilidades para validación de GTIN según estándar GS1
 * Soporta GTIN-8, GTIN-12, GTIN-13 y GTIN-14
 */

/**
 * Normaliza un GTIN eliminando espacios, guiones y caracteres no numéricos
 * @param {string} gtin - GTIN a normalizar
 * @returns {string} GTIN normalizado (solo dígitos)
 */
export const formatGTIN = (gtin) => {
  if (typeof gtin !== 'string') {
    return '';
  }
  return gtin.replace(/[^0-9]/g, '');
};

/**
 * Valida el formato básico del GTIN (longitud)
 * @param {string} gtin - GTIN a validar
 * @returns {boolean} true si el formato es válido
 */
export const isValidGTINFormat = (gtin) => {
  const normalizedGTIN = formatGTIN(gtin);
  const validLengths = [8, 12, 13, 14];
  return validLengths.includes(normalizedGTIN.length);
};

/**
 * Calcula el dígito verificador según el algoritmo GS1
 * @param {string} gtin - GTIN sin el dígito verificador
 * @returns {number} Dígito verificador calculado
 */
export const calculateCheckDigit = (gtin) => {
  const digits = gtin.split('').map(Number);
  let sum = 0;

  // Algoritmo GS1: empezar desde la derecha (excluyendo el último dígito verificador)
  for (let i = digits.length - 1; i >= 0; i--) {
    const position = digits.length - i;
    const multiplier = position % 2 === 0 ? 1 : 3; // Posiciones pares x1, impares x3
    sum += digits[i] * multiplier;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Valida el dígito verificador de un GTIN completo
 * @param {string} gtin - GTIN completo con dígito verificador
 * @returns {boolean} true si el dígito verificador es correcto
 */
export const validateGTINCheckDigit = (gtin) => {
  const normalizedGTIN = formatGTIN(gtin);

  if (!isValidGTINFormat(normalizedGTIN)) {
    return false;
  }

  // Separar el GTIN sin el último dígito (verificador) y el último dígito
  const gtinWithoutCheck = normalizedGTIN.slice(0, -1);
  const providedCheckDigit = parseInt(normalizedGTIN.slice(-1), 10);

  // Calcular el dígito verificador esperado
  const calculatedCheckDigit = calculateCheckDigit(gtinWithoutCheck);

  return providedCheckDigit === calculatedCheckDigit;
};

/**
 * Valida completamente un GTIN según estándar GS1
 * @param {string} gtin - GTIN a validar
 * @returns {object} Resultado de la validación con detalles
 */
export const validateGTIN = (gtin) => {
  const result = {
    isValid: false,
    errors: [],
    normalizedGTIN: '',
    type: null,
  };

  // Validar que se proporcione un valor
  if (!gtin) {
    result.errors.push('GTIN es requerido');
    return result;
  }

  // Normalizar
  const normalizedGTIN = formatGTIN(gtin);
  result.normalizedGTIN = normalizedGTIN;

  // Validar que solo contenga dígitos
  if (!/^\d+$/.test(normalizedGTIN)) {
    result.errors.push('GTIN debe contener solo dígitos');
    return result;
  }

  // Validar longitud
  if (!isValidGTINFormat(normalizedGTIN)) {
    result.errors.push('GTIN debe tener 8, 12, 13 o 14 dígitos');
    return result;
  }

  // Determinar tipo de GTIN
  const gtinTypes = {
    8: 'GTIN-8',
    12: 'GTIN-12 (UPC-A)',
    13: 'GTIN-13 (EAN-13)',
    14: 'GTIN-14',
  };
  result.type = gtinTypes[normalizedGTIN.length];

  // Validar dígito verificador
  if (!validateGTINCheckDigit(normalizedGTIN)) {
    result.errors.push('Dígito verificador inválido según estándar GS1');
    return result;
  }

  // Si llegamos aquí, el GTIN es válido
  result.isValid = true;
  return result;
};

/**
 * Función principal de validación para usar en mongoose
 * @param {string} gtin - GTIN a validar
 * @returns {boolean} true si es válido
 */
export const isValidGTIN = (gtin) => {
  const validation = validateGTIN(gtin);
  return validation.isValid;
};

/**
 * Genera un mensaje de error detallado para GTINs inválidos
 * @param {string} gtin - GTIN inválido
 * @returns {string} Mensaje de error descriptivo
 */
export const getGTINValidationError = (gtin) => {
  const validation = validateGTIN(gtin);

  if (validation.isValid) {
    return null;
  }

  const baseMessage = `GTIN inválido: "${gtin}"`;
  const errors = validation.errors.join(', ');

  return `${baseMessage}. ${errors}. El GTIN debe cumplir con el estándar GS1 (8, 12, 13 o 14 dígitos con dígito verificador correcto).`;
};

/**
 * Ejemplos de GTINs válidos para testing
 */
export const SAMPLE_VALID_GTINS = {
  'GTIN-8': '12345670',
  'GTIN-12': '123456789012',
  'GTIN-13': '1234567890128',
  'GTIN-14': '12345678901231',
};

/**
 * Ejemplos de GTINs inválidos para testing
 */
export const SAMPLE_INVALID_GTINS = {
  'wrong-length': '123456',
  'wrong-check-digit': '12345671', // GTIN-8 con dígito verificador incorrecto
  'non-numeric': '1234567A',
  empty: '',
  null: null,
};
