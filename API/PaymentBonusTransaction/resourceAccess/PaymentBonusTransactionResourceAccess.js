/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BONUS_TRX_STATUS, BONUS_TRX_CATEGORY } = require('../PaymentBonusTransactionConstant');
const Logger = require('../../../utils/logging');
const tableName = 'PaymentBonusTransaction';
const primaryKeyField = 'paymentBonusTransactionId';

async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('paymentBonusTransactionId').primary();
          table.integer('appUserId'); //user duoc nhan hoa hong
          table.integer('walletId');
          table.integer('referUserId'); //nguoi user duoc tham chieu de tinh hoa hong
          table.integer('paymentMethodId').nullable();
          table.float('paymentAmount', 48, 24).defaultTo(0);
          table.float('paymentAmountF1', 48, 24).defaultTo(0);
          table.float('paymentAmountF2', 48, 24).defaultTo(0);
          table.float('paymentAmountF3', 48, 24).defaultTo(0);
          table.float('paymentAmountF4', 48, 24).defaultTo(0);
          table.float('paymentAmountF5', 48, 24).defaultTo(0);
          table.float('paymentAmountF6', 48, 24).defaultTo(0);
          table.float('paymentAmountF7', 48, 24).defaultTo(0);
          table.float('paymentAmountF8', 48, 24).defaultTo(0);
          table.float('paymentAmountF9', 48, 24).defaultTo(0);
          table.float('paymentAmountF10', 48, 24).defaultTo(0);
          table.float('totalReferAmount', 48, 24).defaultTo(0);
          table.integer('paymentCategory').defaultTo(BONUS_TRX_CATEGORY.WITHDRAW_TO_EXTERNAL);
          table.string('paymentUnit'); //don vi tien
          table.string('paymentStatus').defaultTo(BONUS_TRX_STATUS.NEW);
          table.string('paymentDate'); //format YYYY/MM/DD
          table.string('paymentNote').defaultTo(''); //Ghi chu hoa don
          table.string('paymentRef').defaultTo(''); //Ma hoa don ngoai thuc te
          table.timestamp('paymentApproveDate', { useTz: true }); // ngay duyet
          table.integer('paymentPICId'); // nguoi duyet
          table.integer('paymentStaffId'); // tong dai ly lien quan
          timestamps(table);
          table.index('appUserId');
          table.index('referUserId');
          table.index('paymentStatus');
          table.index('paymentDate');
          table.index('paymentCategory');
          table.index('paymentStaffId');
          table.index('paymentMethodId');
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

async function customSearch(startDate, endDate) {
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
  return await queryBuilder.select();
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

async function sumAmountDistinctByDate(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByDate(tableName, 'paymentAmount', filter, startDate, endDate);
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
  sumAmountDistinctByDate,
  incrementPaymentAmount,
};
