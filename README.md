# Proyecto Noir · Productos

Backend independiente del catálogo. Tiene su propio repositorio, dependencias y despliegue. No importa código de los otros servicios.

## Publicación

- Repositorio: https://github.com/eurocl/noir-productos
- API: https://noir-products.onrender.com
- Estado: https://noir-products.onrender.com/health
- Inventario: https://noir-stock.onrender.com

## Base y comunicación

Este servicio usa exclusivamente la base noir_productos en un clúster dedicado de Atlas. Usuarios e Inventario tienen otros clústeres. Los tres backends tienen repositorios, despliegues y bases independientes.

Productos guarda nombre, categoría, descripción, precio e imagen. Las cantidades se consultan y modifican a través de la API HTTP de Inventario. No accede a su base.

DATABASE_URL contiene la conexión y DATABASE_NAME debe ser noir_productos. No se usa MONGO_URI como alternativa. El usuario noir_productos_app tiene únicamente readWrite sobre noir_productos. Al configurar otro entorno, conservar esa restricción.

JWT_SECRET permite validar los tokens emitidos por Usuarios. INTERNAL_SERVICE_SECRET autoriza las llamadas a Inventario. Ambos deben coincidir con los servicios correspondientes.

## Arranque local

1. Instalar Node.js 24
2. Ejecutar npm ci
3. Copiar .env.example a .env y completar la conexión y los secretos
4. Configurar STOCK_SERVICE_URL con la URL de Inventario
5. Ejecutar npm start
6. Abrir http://localhost:3002/health

La API escucha después de conectar a MongoDB. Para otra PC, usar HOST=0.0.0.0 y acceder mediante la IP de esa PC. No publicar .env ni contraseñas.

## Render

Usar este repositorio, rama main, Build Command npm ci y Start Command npm start. Render asigna el puerto. Configurar STOCK_SERVICE_URL=https://noir-stock.onrender.com y autorizar las direcciones de salida del servicio en Atlas.

## Rutas

- GET /products lista el catálogo
- GET /products/:id consulta un producto
- POST /products crea un producto y su inventario inicial, requiere JWT
- DELETE /products/:id elimina el producto y su inventario, requiere JWT
- GET /health informa si la base está conectada

Las compensaciones intentan restaurar la consistencia si falla una operación entre servicios. No son una transacción distribuida. npm test verifica la configuración y el aislamiento del arranque.
