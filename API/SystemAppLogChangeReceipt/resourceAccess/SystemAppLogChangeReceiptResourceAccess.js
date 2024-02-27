/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'SystemAppLogChangeReceipt';
const primaryKeyField = 'systemAppLogChangeReceiptId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('dataValueBefore'); //data trước khi thay đổi
          table.string('dataValueAfter'); // data sau khi thay đổi
          table.string('dataFieldName'); // field thay đổi
          table.string('dataPICName'); // tên người thực hiện thay đổi
          table.string('dataPICId'); // id người thực hiện thay đổi
          table.string('dataPICTable'); // bảng update
          table.integer('customerReceiptId'); // id hóa đơn thay đổi
          timestamps(table);
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
  return await Common.insert(tableName, data, primaryKeyField);
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
