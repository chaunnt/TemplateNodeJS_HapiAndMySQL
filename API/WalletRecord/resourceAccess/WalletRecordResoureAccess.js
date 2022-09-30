/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'WalletRecord';
const primaryKeyField = 'WalletRecordId';
async function createTable() {
  console.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('WalletRecordId').primary();
          table.integer('appUserId');
          table.integer('walletId');
          table.float('paymentAmount', 48, 10).defaultTo(0);
          table.float('paymentAmountIn', 48, 10).defaultTo(0); //credit
          table.float('paymentAmountOut', 48, 10).defaultTo(0); //debit
          table.integer('paymentAmountInOut').defaultTo(0); //0: CREDIT , 10: DEBIT
          table.float('balanceBefore', 48, 10).defaultTo(0);
          table.float('balanceAfter', 48, 10).defaultTo(0);
          table.string('WalletRecordNote').nullable(); // nội dung để tham khảo
          table.string('WalletRecordRef').nullable(); //hóa đơn, mã giao dịch .v.v. id để tham khảo
          table.float('WalletRecordRefAmount', 48, 10).defaultTo(0); //Số tiền gì đó, dùng để tham khảo
          table.string('WalletRecordType');
          table.integer('staffId');
          timestamps(table);
          table.index('appUserId');
          table.index('walletId');
          table.index('staffId');
        })
        .then(() => {
          console.info(`${tableName} table created done`);
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function customSum(sumField, filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  queryBuilder.where(filterData);

  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(undefined);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${sumField}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  customSum,
};
