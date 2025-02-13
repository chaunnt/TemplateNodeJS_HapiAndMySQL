/* Copyright (c) 2020-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
const dotenv = require('dotenv').config();
console.info({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
});
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
  pool: {
    afterCreate: function (connection, callback) {
      connection.query(`SET time_zone = '+7:00';`, function (err) {
        callback(err, connection);
      });
    },
    min: 0,
    max: 20,
  },
});

function timestamps(table) {
  table.timestamp('updatedAt', { useTz: true }).defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
  table.bigInteger('createdAtTimestamp').nullable();
  table.index('createdAt');
  table.index('updatedAt');
  table.index('createdAtTimestamp');
  table.integer('isHidden').defaultTo(0);
  table.integer('isDeleted').defaultTo(0);
  table.index('isHidden');
  table.index('isDeleted');
}

module.exports = {
  DB: knex,
  timestamps,
};
