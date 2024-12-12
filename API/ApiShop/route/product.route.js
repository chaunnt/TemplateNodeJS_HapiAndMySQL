const Hapi = require('@hapi/hapi');
const connection = require('../../../config/databaseShop');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  // Create
  server.route({
    method: 'POST',
    path: '/products',
    handler: async (request, h) => {
      const { name, description, price, shop_id } = request.payload;
      const query = 'INSERT INTO products (name, description, price, shop_id) VALUES (?, ?, ?, ?)';

      return new Promise((resolve, reject) => {
        connection.query(query, [name, description, price, shop_id], (err, results) => {
          if (err) {
            console.error(err);
            reject(h.response({ error: 'Database error' }).code(500));
          } else {
            resolve(h.response({ id: results.insertId, name, description, price, shop_id }).code(201));
          }
        });
      });
    },
  });

  // Read all
  server.route({
    method: 'GET',
    path: '/products',
    handler: async (request, h) => {
      const query = 'SELECT * FROM products';
      return new Promise((resolve, reject) => {
        connection.query(query, (err, results) => {
          if (err) {
            console.error(err);
            reject(h.response({ error: 'Database error' }).code(500));
          } else {
            resolve(h.response(results).code(200));
          }
        });
      });
    },
  });

  // Read one
  server.route({
    method: 'GET',
    path: '/products/{id}',
    handler: async (request, h) => {
      const query = 'SELECT * FROM products WHERE id = ?';
      return new Promise((resolve, reject) => {
        connection.query(query, [request.params.id], (err, results) => {
          if (err) {
            console.error(err);
            reject(h.response({ error: 'Database error' }).code(500));
          } else if (results.length === 0) {
            resolve(h.response({ message: 'Product not found' }).code(404));
          } else {
            resolve(h.response(results[0]).code(200));
          }
        });
      });
    },
  });

  // Update
  server.route({
    method: 'PUT',
    path: '/products/{id}',
    handler: (request, h) => {
      const { name, description, price, shop_id } = request.payload;
      const query = 'UPDATE products SET name = ?, description = ?, price = ?, shop_id = ? WHERE id = ?';
      return new Promise((resolve, reject) => {
        connection.query(query, [name, description, price, shop_id, request.params.id], (err, results) => {
          if (err) {
            console.error(err);
            reject(h.response({ error: 'Database error' }).code(500));
          } else if (results.affectedRows === 0) {
            resolve(h.response({ message: 'Product not found' }).code(404));
          } else {
            resolve(h.response({ id: request.params.id, name, description, price, shop_id }).code(200));
          }
        });
      });
    },
  });

  // Delete
  server.route({
    method: 'DELETE',
    path: '/products/{id}',
    handler: async (request, h) => {
      const query = 'DELETE FROM products WHERE id = ?';
      try {
        const results = await new Promise((resolve, reject) => {
          connection.query(query, [request.params.id], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
        if (results.affectedRows === 0) {
          return h.response({ message: 'Product not found' }).code(404);
        }
        return h.response({ message: 'Product deleted' }).code(200);
      } catch (err) {
        console.error(err);
        return h.response({ error: 'Database error' }).code(500);
      }
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

init();
