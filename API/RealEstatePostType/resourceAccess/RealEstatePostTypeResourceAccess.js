/* Copyright (c) 2021-2022 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const UtilFunction = require('../../ApiUtils/utilFunctions');
const tableName = 'RealEstatePostType';
const primaryKeyField = 'realEstatePostTypeId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('realEstatePostTypeName').unique();
          timestamps(table);
          table.index(`${primaryKeyField}`);
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve();
        });
    });
  });
}
function __getDefaultFeild() {
  const defaultFeild = [
    {
      realEstatePostTypeName: 'Nhà đất bán',
    },
    {
      realEstatePostTypeName: 'Nhà đất cho thuê',
    },
    {
      realEstatePostTypeName: 'Dự án',
    },
  ];
  return defaultFeild;
}
async function initDB() {
  await createTable();
  const data = __getDefaultFeild();
  for (var i = 0; i < data.length; i++) {
    await Common.insert(tableName, data[i]);
  }
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
async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}
async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  deleteById,
  findById,
  modelName: tableName,
};
