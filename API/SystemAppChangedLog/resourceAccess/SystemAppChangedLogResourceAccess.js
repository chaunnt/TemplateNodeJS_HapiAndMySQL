/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'SystemAppLog';
const primaryKeyField = 'systemAppChangedLogId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('systemAppChangedLogId').primary();
          table.text('dataValueBefore').nullable();
          table.text('dataValueAfter').nullable();
          table.string('dataTableName').nullable();
          table.string('dataFieldName').nullable();
          table.string('dataPICName').nullable();
          table.string('dataPICId').nullable();
          table.string('dataPICTable').nullable();
          table.integer('dataRecordId'); // record change id
          timestamps(table);
          table.index('dataTableName');
          table.index('dataFieldName');
          table.index('dataPICId');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve();
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
};
