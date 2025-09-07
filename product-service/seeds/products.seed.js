import { Product } from '../models/index.js';
import User from '../models/user.model.js';
import createProduct from '../services/product/createProduct.js';
import approveProduct from '../services/product/approveProduct.js';

/**
 * Productos de ejemplo para demostración
 * 5 productos simples que cubren todos los casos de uso
 */
const SAMPLE_PRODUCTS = [
  {
    gtin: '7895439798580', // GTIN-13 válido
    name: 'Leche Entera',
    description: 'Leche entera pasteurizada 1L',
    brand: 'Lácteos Premium',
    manufacturer: 'Industrias Lácteas S.A.',
    netWeight: 1000,
    netWeightUnit: 'ml',
    role: 'provider', // Será creado por provider → pending
  },
  {
    gtin: '45694257449908', // GTIN-14 válido
    name: 'Pan Integral',
    description: 'Pan integral con semillas de girasol',
    brand: 'Panadería Artesanal',
    manufacturer: 'Panadería Artesanal Ltda.',
    netWeight: 500,
    netWeightUnit: 'g',
    role: 'provider', // Será creado por provider → pending
  },
  {
    gtin: '98716623', // GTIN-8 válido
    name: 'Agua Mineral',
    description: 'Agua mineral natural sin gas',
    brand: 'Aguas Puras',
    manufacturer: 'Embotelladora Nacional S.A.',
    netWeight: 500,
    netWeightUnit: 'ml',
    role: 'editor', // Será creado por editor → published
  },
  {
    gtin: '1234567890128', // GTIN-13 válido (generado)
    name: 'Café Molido',
    description: 'Café molido tostado medio 250g',
    brand: 'Café Premium',
    manufacturer: 'Tostaduria Central S.A.',
    netWeight: 250,
    netWeightUnit: 'g',
    role: 'admin', // Será creado por admin → published
  },
  {
    gtin: '9876543210982', // GTIN-13 válido (generado)
    name: 'Yogurt Natural',
    description: 'Yogurt natural sin azúcar agregada',
    brand: 'Lácteos Saludables',
    manufacturer: 'Industrias Lácteas S.A.',
    netWeight: 200,
    netWeightUnit: 'g',
    role: 'provider', // Será creado por provider → pending (luego se aprobará)
  },
];

/**
 * Crear productos de ejemplo usando los servicios (para disparar eventos NATS)
 */
export const createSampleProducts = async () => {
  try {
    console.log('🌱 Creando productos de ejemplo...');

    // Obtener usuarios por rol
    const admin = await User.findOne({ role: 'admin' });
    const editor = await User.findOne({ role: 'editor' });
    const provider = await User.findOne({ role: 'provider' });

    if (!admin || !editor || !provider) {
      console.error(
        '❌ No se encontraron usuarios necesarios. Ejecuta seed de usuarios primero.'
      );
      return;
    }

    const createdProducts = [];

    for (const productData of SAMPLE_PRODUCTS) {
      // Verificar si el producto ya existe
      const existingProduct = await Product.findOne({ gtin: productData.gtin });
      if (existingProduct) {
        console.log(`⏭️  Producto ${productData.name} ya existe, saltando...`);
        continue;
      }

      // Seleccionar usuario según rol especificado
      let user;
      switch (productData.role) {
        case 'admin':
          user = admin;
          break;
        case 'editor':
          user = editor;
          break;
        case 'provider':
        default:
          user = provider;
          break;
      }

      // Crear producto usando el servicio (esto disparará eventos NATS automáticamente)
      const { role, ...productFields } = productData;

      try {
        const savedProduct = await createProduct(productFields, user);
        createdProducts.push(savedProduct);

        console.log(
          `✅ Producto creado: ${productData.name} (${savedProduct.status}) por ${user.role}`
        );

        // Si fue creado por provider y está pending, programar aprobación
        if (
          savedProduct.status === 'pending' &&
          productData.name === 'Yogurt Natural'
        ) {
          // Programar aprobación del yogurt después de 2 segundos
          setTimeout(async () => {
            try {
              await approveProduct(savedProduct.gtin, editor);
              console.log(
                `✅ Producto "${savedProduct.name}" aprobado automáticamente`
              );
            } catch (approvalError) {
              console.error(
                '❌ Error aprobando producto:',
                approvalError.message
              );
            }
          }, 2000);
        }
      } catch (error) {
        console.error(
          `❌ Error creando producto ${productData.name}:`,
          error.message
        );
      }
    }

    console.log(`🎉 ${createdProducts.length} productos de ejemplo creados`);
    return createdProducts;
  } catch (error) {
    console.error('❌ Error creando productos de ejemplo:', error.message);
    throw error;
  }
};

/**
 * Inicializar productos de ejemplo completos
 */
export const initializeSampleProducts = async () => {
  try {
    console.log('🚀 Inicializando productos de ejemplo...');
    await createSampleProducts();
    console.log('✅ Inicialización de productos de ejemplo completada');
  } catch (error) {
    console.error('❌ Error en inicialización de productos:', error.message);
  }
};

/**
 * Limpiar productos de ejemplo
 */
export const cleanSampleProducts = async () => {
  try {
    const gtins = SAMPLE_PRODUCTS.map((p) => p.gtin);
    await Product.deleteMany({ gtin: { $in: gtins } });
    console.log('🧹 Productos de ejemplo eliminados');
  } catch (error) {
    console.error('❌ Error limpiando productos:', error.message);
  }
};
