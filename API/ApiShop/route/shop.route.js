const Hapi = require('@hapi/hapi');

const connection = require('../../../config/databaseShop');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  // Create
  // Create
  server.route({
    method: 'POST',
    path: '/shops',
    handler: (request, h) => {
      const { name, description, price } = request.payload;
      const query = 'INSERT INTO shops (name, description, price) VALUES (?, ?, ?)';
      connection.query(query, [name, description, price], (err, results) => {
        if (err) {
          console.error(err);
          return h.response({ error: 'Database error' }).code(500);
        }
        return h.response({ id: results.insertId, name, description, price }).code(201);
      });
    },
  });

  // Read all
  server.route({
    method: 'GET',
    path: '/shops',
    handler: (request, h) => {
      const query = 'SELECT * FROM shops';
      connection.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return h.response({ error: 'Database error' }).code(500);
        }
        return h.response(results).code(200);
      });
    },
  });

  // Read one
  server.route({
    method: 'GET',
    path: '/shops/{id}',
    handler: (request, h) => {
      const query = 'SELECT * FROM shops WHERE id = ?';
      connection.query(query, [request.params.id], (err, results) => {
        if (err) {
          console.error(err);
          return h.response({ error: 'Database error' }).code(500);
        }
        if (results.length === 0) {
          return h.response({ message: 'Shop not found' }).code(404);
        }
        return h.response(results[0]).code(200);
      });
    },
  });

  // Update
  server.route({
    method: 'PUT',
    path: '/shops/{id}',
    handler: (request, h) => {
      const { name, description, price } = request.payload;
      const query = 'UPDATE shops SET name = ?, description = ?, price = ? WHERE id = ?';
      connection.query(query, [name, description, price, request.params.id], (err, results) => {
        if (err) {
          console.error(err);
          return h.response({ error: 'Database error' }).code(500);
        }
        if (results.affectedRows === 0) {
          return h.response({ message: 'Shop not found' }).code(404);
        }
        return h.response({ id: request.params.id, name, description, price }).code(200);
      });
    },
  });

  // Delete
  server.route({
    method: 'DELETE',
    path: '/shops/{id}',
    handler: (request, h) => {
      const query = 'DELETE FROM shops WHERE id = ?';
      connection.query(query, [request.params.id], (err, results) => {
        if (err) {
          console.error(err);
          return h.response({ error: 'Database error' }).code(500);
        }
        if (results.affectedRows === 0) {
          return h.response({ message: 'Shop not found' }).code(404);
        }
        return h.response({ message: 'Shop deleted' }).code(200);
      });
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', error => {
  console.log(error);
  process.exit(1);
});

init();
