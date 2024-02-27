/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { MESSAGE_SEND_STATUS, MESSAGE_ACTION_STATUS, MESSAGE_CATEGORY } = require('../CustomerMessageConstant');
const tableName = 'MessageCustomerMarketing';
const primaryKeyField = 'messageMarketingId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('messageMarketingId').primary();
          table.integer('messageCustomerId').nullable();
          table.integer('customerId').nullable();
          table.integer('messageId').nullable();
          table.integer('customerStationId').nullable();
          table.integer('customerScheduleId').nullable();
          table.integer('appUserVehicleId').nullable();
          table.integer('customerRecordId').nullable();
          table.string('messageSendStatus').defaultTo(MESSAGE_SEND_STATUS.NEW);
          table.string('customerMessageCategories').defaultTo(MESSAGE_CATEGORY.EMAIL);
          table.string('messageFCMStatus').defaultTo(MESSAGE_SEND_STATUS.NEW);
          table.string('customerMessagePhone').nullable();
          table.string('customerMessageEmail').nullable();
          table.string('customerMessagePlateNumber').nullable();
          table.string('customerMessageRef').nullable();
          table.string('messageContent', 1000);
          table.string('messageTitle').nullable();
          table.string('externalStatus').nullable();
          table.string('messageSendDate').nullable();
          table.string('customerReceiveDate').nullable();
          table.string('externalResult').nullable();
          table.string('externalInfo').nullable();
          table.string('externalReceiveDate').nullable();
          table.string('externalProvider').nullable();
          table.integer('isRead').defaultTo(MESSAGE_ACTION_STATUS.UNREAD);
          table.integer('messagePrice').defaultTo(0);
          table.string('messageNote').nullable();
          timestamps(table);
          table.index('customerId');
          table.index('messageId');
          table.index('messageCustomerId');
          table.index('customerStationId');
          table.index('customerScheduleId');
          table.index('appUserVehicleId');
          table.index('customerRecordId');
          table.index('customerMessageCategories');
          table.index('messageSendStatus');
          table.index('customerMessagePhone');
          table.index('customerMessageEmail');
          table.index('customerMessagePlateNumber');
          table.index('customerMessageRef');
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

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('customerMessageContent', 'like', `%${searchText}%`).orWhere('customerMessagePhone', 'like', `%${searchText}%`);
    });
  }

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
