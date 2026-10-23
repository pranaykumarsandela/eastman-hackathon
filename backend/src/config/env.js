const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartcart_db',
  freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 999.00,
  standardShippingFee: parseFloat(process.env.STANDARD_SHIPPING_FEE) || 79.00,
  gstTaxPercentage: parseFloat(process.env.GST_TAX_PERCENTAGE) || 5.00,
  jwtSecret: process.env.JWT_SECRET || 'smartcart_jwt_secret_key_default_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = config;
