/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');
const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const { ORDER_STATUS, ORDER_PAYMENT_STATUS } = require('../OrderConstant');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const { isValidValue } = require('../../ApiUtils/utilFunctions');
let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

const tableName = 'Order';
const primaryKeyField = 'orderId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.float('total', 48, 24);
          table.float('taxAmount', 48, 24);
          table.float('discountAmount', 48, 24);
          table.float('totalPayment', 48, 24);
          table.integer('appUserId');
          table.integer('appUserVehicleId');
          table.timestamp('approveDate').nullable();
          table.timestamp('cancelDate').nullable();
          table.timestamp('closedDate').nullable();
          table.integer('orderStatus').defaultTo(ORDER_STATUS.NEW);
          table.string('paymentStatus').defaultTo(ORDER_PAYMENT_STATUS.NEW);
          table.string('note');
          table.integer('stationsId');
          table.integer('customerScheduleId');
          timestamps(table);
          table.index(primaryKeyField);
          table.index('customerScheduleId');
          table.index('stationsId');
          table.index('orderStatus');
          table.index('paymentStatus');
          table.index('closedDate');
          table.index('approveDate');
          table.index('cancelDate');
          table.index('appUserVehicleId');
          table.index('appUserId');
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

  const updateResult = await Common.updateById(tableName, dataId, data);

  // update cache for customerSchedule table ref
  if (updateResult) {
    const record = await findById(id);
    if (record) {
      if (process.env.REDIS_ENABLE * 1 === 1) {
        await RedisInstance.setWithExpire(`${tableName}_customerScheduleId_${record.customerScheduleId}`, JSON.stringify(record));
      }
    }
  }

  return updateResult;
}

async function deleteById(orderId) {
  let dataId = {};
  dataId[primaryKeyField] = orderId;
  return await Common.deleteById(tableName, dataId);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function findOneByScheduleId(scheduleId) {
  const REDIS_KEY = `${tableName}_customerScheduleId_${scheduleId}`;

  if (process.env.REDIS_ENABLE * 1 === 1) {
    let _cacheItem = await RedisInstance.getJson(REDIS_KEY);
    if (isValidValue(_cacheItem)) {
      return _cacheItem;
    }
  }

  const orderItem = await Common.findOne(tableName, { customerScheduleId: scheduleId });

  if (process.env.REDIS_ENABLE * 1 === 1 && orderItem) {
    RedisInstance.setWithExpire(REDIS_KEY, JSON.stringify(orderItem));
  }

  return orderItem;
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
      this.orWhere('note', 'like', `%${searchText}%`);
    });
  }

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }
  queryBuilder.where({ isDeleted: 0 });

  queryBuilder.where(filterData);

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

module.exports = {
  insert,
  find,
  findById,
  findOneByScheduleId,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  deleteById,
};
