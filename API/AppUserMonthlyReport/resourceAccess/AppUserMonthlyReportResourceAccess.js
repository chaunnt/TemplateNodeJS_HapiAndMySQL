/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BONUS_TRX_STATUS, BONUS_TRX_CATEGORY } = require('../AppUserMonthlyReportConstant');
const Logger = require('../../../utils/logging');
const tableName = 'AppUserMonthlyReport';
const primaryKeyField = 'appUserMonthlyReportId';

async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('appUserMonthlyReportId').primary();
          table.integer('appUserId'); //user duoc nhan hoa hong
          table.float('totalPlay', 48, 24).defaultTo(0);
          table.float('totalPlayF1', 48, 24).defaultTo(0);
          table.float('totalPlayF2', 48, 24).defaultTo(0);
          table.float('totalPlayF3', 48, 24).defaultTo(0);
          table.float('totalPlayF4', 48, 24).defaultTo(0);
          table.float('totalPlayF5', 48, 24).defaultTo(0);
          table.float('totalPlayF6', 48, 24).defaultTo(0);
          table.float('totalPlayF7', 48, 24).defaultTo(0);
          table.float('totalPlayF8', 48, 24).defaultTo(0);
          table.float('totalPlayF9', 48, 24).defaultTo(0);
          table.float('totalPlayF10', 48, 24).defaultTo(0);
          table.integer('reportMonth'); //format YYYYMM
          timestamps(table);
          table.index('appUserId');
          table.index('reportMonth');
        })
        .then(() => {
          Logger.info(`${tableName} table created done`);
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

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));

  // if (searchText) {
  //   queryBuilder.where(function () {
  //     this.orWhere('username', 'like', `%${searchText}%`)
  //       .orWhere('firstName', 'like', `%${searchText}%`)
  //       .orWhere('lastName', 'like', `%${searchText}%`);
  //   });
  // }

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where(filterData);
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
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return await query.count(`${primaryKeyField} as count`);
}

async function customSum(filter, startDate, endDate, field = 'paymentAmount') {
  let queryBuilder = DB(tableName);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (filter) {
    queryBuilder.where(filter);
  }

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${field} as sumResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(undefined);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${field}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function incrementPaymentAmount(id, amount) {
  return await Common.incrementInt(tableName, primaryKeyField, id, 'paymentAmount', amount);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  deleteById,
  customSearch,
  modelName: tableName,
  customSum,
  incrementPaymentAmount,
};
