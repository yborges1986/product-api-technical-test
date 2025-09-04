import { commonSchema } from './common.schema.js';
import { productSchema } from './product.schema.js';
import { userSchema } from './user.schema.js';
import { authSchema } from './auth.schema.js';

// Combinar todos los schemas en uno solo
export const schema = `
  ${commonSchema}
  ${productSchema}
  ${userSchema}
  ${authSchema}
`;
