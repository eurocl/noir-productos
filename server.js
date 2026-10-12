import { loadEnvironment, startApi } from './src/runtime.js';
import { createProductsApp } from './src/app.js';
import { databaseConfig } from './src/database-config.js';
loadEnvironment();
try {
  await startApi(createProductsApp(), { name: 'noir-productos', port: 3002, requireJwt: true, requireInternalSecret: true, dependencies: ['stock'], ...databaseConfig() });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
