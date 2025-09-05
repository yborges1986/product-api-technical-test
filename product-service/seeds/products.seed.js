import { Product } from '../models/index.js';
import User from '../models/user.model.js';

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
 * Crear productos de ejemplo
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
      let status;
      let approvedBy = null;
      let approvedAt = null;

      switch (productData.role) {
        case 'admin':
          user = admin;
          status = 'published';
          approvedBy = admin._id;
          approvedAt = new Date();
          break;
        case 'editor':
          user = editor;
          status = 'published';
          approvedBy = editor._id;
          approvedAt = new Date();
          break;
        case 'provider':
        default:
          user = provider;
          status = 'pending';
          break;
      }

      // Crear producto
      const { role, ...productFields } = productData;
      const product = new Product({
        ...productFields,
        status,
        createdBy: user._id,
        approvedBy,
        approvedAt,
      });

      // Establecer usuario para auditoría
      product.setAuditUser(user._id);

      const savedProduct = await product.save();
      createdProducts.push(savedProduct);

      console.log(
        `✅ Producto creado: ${productData.name} (${status}) por ${user.role}`
      );
    }

    console.log(`🎉 ${createdProducts.length} productos de ejemplo creados`);
    return createdProducts;
  } catch (error) {
    console.error('❌ Error creando productos de ejemplo:', error.message);
    throw error;
  }
};

/**
 * Simular flujo de aprobación para el último producto
 */
export const simulateApprovalFlow = async () => {
  try {
    console.log('🔄 Simulando flujo de aprobación...');

    // Buscar el yogurt (último producto de provider)
    const yogurtProduct = await Product.findOne({ name: 'Yogurt Natural' });
    const editor = await User.findOne({ role: 'editor' });

    if (!yogurtProduct || !editor) {
      console.log('⏭️  No se puede simular aprobación, faltan datos');
      return;
    }

    if (yogurtProduct.status === 'published') {
      console.log('⏭️  Producto ya está aprobado');
      return;
    }

    // Aprobar producto
    yogurtProduct.status = 'published';
    yogurtProduct.approvedBy = editor._id;
    yogurtProduct.approvedAt = new Date();

    // Registrar auditoría de aprobación
    yogurtProduct.setAuditUser(editor._id);
    await yogurtProduct.recordApproval(editor._id);

    await yogurtProduct.save();

    console.log(`✅ Producto "${yogurtProduct.name}" aprobado por editor`);
  } catch (error) {
    console.error('❌ Error simulando aprobación:', error.message);
  }
};

/**
 * Inicializar productos de ejemplo completos
 */
export const initializeSampleProducts = async () => {
  try {
    console.log('🚀 Inicializando productos de ejemplo...');

    await createSampleProducts();

    // Simular aprobación después de crear productos
    setTimeout(async () => {
      await simulateApprovalFlow();
    }, 1000);

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
