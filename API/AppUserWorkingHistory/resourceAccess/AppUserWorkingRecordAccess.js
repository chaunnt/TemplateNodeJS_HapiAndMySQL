/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserWorkingRecord';
const primaryKeyField = 'appUserWorkingRecordId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('appUserWorkingHistoryId');
          // Thông tin người được phân công
          table.string('appUserId');
          table.string('username');
          table.string('firstName');
          table.string('lastName');
          table.integer('active');
          table.integer('stationsId');
          table.string('appUserRoleName');
          table.integer('employeeCode');
          table.string('appUserPosition');
          table.string('appUserWorkStep');

          timestamps(table);
          table.index(`${primaryKeyField}`);
        })
        .then(() => {
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
  let filter = {};
  filter[`${primaryKeyField}`] = id;
  return await Common.updateById(tableName, filter, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`);
    });
  }

  Common.filterHandler(filterData, queryBuilder);

  queryBuilder.where({ isDeleted: 0 });

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }

  return queryBuilder;
}
async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
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

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function deleteById(AppDevicesId) {
  let dataId = {};
  dataId[primaryKeyField] = AppDevicesId;
  return await Common.deleteById(tableName, dataId);
}

async function findDeletedRecord(skip, limit) {
  let queryBuilder = DB(tableName);

  queryBuilder.where({ isDeleted: 1 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  return new Promise((resole, reject) => {
    try {
      queryBuilder.select().then(records => {
        resole(records);
      });
    } catch (e) {
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
  count,
  deleteById,
  updateById,
  initDB,
  updateAll,
  modelName: tableName,
  primaryKeyField,
  customSearch,
  customCount,
  findById,
  findDeletedRecord,
  permanentlyDelete,
};
