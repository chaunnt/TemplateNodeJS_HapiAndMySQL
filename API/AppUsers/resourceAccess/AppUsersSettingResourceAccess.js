/* Copyright (c) 2021-2023 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUsersSetting';
const {
  USER_VERIFY_INFO_STATUS,
  USER_TYPE,
  USER_REFUND_PLAY,
  USER_VERIFY_EMAIL_STATUS,
  USER_VERIFY_PHONE_NUMBER_STATUS,
  USER_CATEGORY_ID,
  USER_CATEGORY,
  WITHDRAWAL_REQUEST,
  DEPOSIT_REQUEST,
  USER_STATUS,
} = require('../AppUserConstant');
const { LEVER_MEMBERSHIP, LEVEL_MEMBERSHIP_NAME } = require('../../AppUserMembership/AppUserMembershipConstant');
const primaryKeyField = 'appUserId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('resetPasswordCounter').defaultTo(0);
          table.integer('resetSecondaryPasswordCounter').defaultTo(0);
          table.integer('addPaymentBankCounter').defaultTo(0);
          table.integer('addPaymentCryptoCounter').defaultTo(0);
          table.integer('withdrawCount').defaultTo(0);
          timestamps(table);
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
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let filter = {};
  filter[`${primaryKeyField}`] = id;
  return await Common.updateById(tableName, filter, data);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
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

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('firstLoginIp', 'like', `%${searchText}%`)
        .orWhere('ipAddress', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`);
    });
  }

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
    queryBqueryBuilder.orderBy('createdAt', 'desc');
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }

  return queryBuilder;
}
async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function incrementValue(id, field, amount) {
  return await Common.incrementInt(tableName, primaryKeyField, id, `${field}`, amount);
}

module.exports = {
  insert,
  find,
  count,
  deleteById,
  updateById,
  initDB,
  updateAll,
  findById,
  customSearch,
  customCount,
  incrementValue,
  modelName: tableName,
};
