/* Copyright (c) 2021-2022 Reminano */

/**
 * Created by Huu on 12/29/21.
 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'shop';
const primaryKeyField = 'id';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('name', 255);
          table.string('address', 255);
          table.timestamp('create_at').defaultTo(DB.fn.now());
          table.index(`${primaryKeyField}`);
          table.index('name');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          resolve();
        })
        .catch(error => {
          Logger.error(`${tableName}`, `Error creating table: ${error}`);
          reject(error);
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
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}
async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(skip, limit, searchText) {
  let queryBuilder = DB(tableName);
  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('name', 'like', `%${searchText}%`).orWhere('address', 'like', `%${searchText}%`);
    });
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }
  queryBuilder.orderBy('createdAt', 'desc');
  return queryBuilder;
}
async function customSearch(skip, limit, searchText) {
  let query = _makeQueryBuilderByFilter(skip, limit, searchText);
  return await query.select();
}

async function customCount(searchText) {
  let query = _makeQueryBuilderByFilter(undefined, undefined, searchText);
  return await query.count(`${primaryKeyField} as count`);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  deleteById,
  findById,
  initDB,
  customSearch,
  customCount,
};
