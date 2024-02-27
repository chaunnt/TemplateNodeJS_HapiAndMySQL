/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const tableName = 'AppUserVehicleStamp';

const primaryKeyField = 'appUserVehicleStampId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('appUserVehicleId');
          table.string('certificateSeries').unique().notNullable();
          table.string('vehicleExpiryDate').notNullable();
          timestamps(table);
          table.index(primaryKeyField);
          table.index('appUserVehicleId');
          table.index('certificateSeries');
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

async function updateById(customerScheduleSmartId, data) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleSmartId;
  return await Common.updateById(tableName, dataId, data);
}
async function deleteById(customerScheduleSmartId) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleSmartId;
  return await Common.deleteById(tableName, dataId);
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

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('certificateSeries', 'like', `%${searchText}%`);
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
      resolve(undefined);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  primaryKeyField,
  customCount,
  deleteById,
  customSearch,
};
