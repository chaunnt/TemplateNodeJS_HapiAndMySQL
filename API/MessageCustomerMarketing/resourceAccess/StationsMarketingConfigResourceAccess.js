/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
// const { MARKETING_MESSAGE_SEND_STATUS, MESSAGE_ACTION_STATUS, MESSAGE_CATEGORY } = require('../MessageCustomerMarketingConstant');
const tableName = 'StationsMarketingConfig';
const primaryKeyField = 'stationsId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.integer(primaryKeyField).primary();
          table.integer('remainingQtyMessageSmsCSKH').defaultTo(0);
          table.integer('remainingQtyMessageZaloCSKH').defaultTo(0);
          table.integer('remainingQtyMessageAPNS').defaultTo(0);
          table.integer('remainingQtyMessageEmail').defaultTo(0);
          table.integer('remainingQtyMessageSmsPromotion').defaultTo(0);
          table.integer('remainingQtyMessageZaloPromotion').defaultTo(0);
          timestamps(table);
          table.index(primaryKeyField);
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  Common.filterHandler(filterData, queryBuilder);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

async function customCountDistinct(fieldDistinct, filter, startDate, endDate, searchText) {
  //override orderBy of default query
  let order = {
    key: `${fieldDistinct}`,
    value: 'asc',
  };
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).select(`${fieldDistinct}`).groupBy(`${fieldDistinct}`);
      query.then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function permanentlyDelete(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.permanentlyDelete(tableName, dataId);
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  customCountDistinct,
  updateAll,
  permanentlyDelete,
};
