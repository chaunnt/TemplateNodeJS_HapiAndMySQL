/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { WITHDRAW_TRX_STATUS, WITHDRAW_TRX_CATEGORY, WITHDRAW_TRX_UNIT, WITHDRAW_TRX_TYPE } = require('../PaymentWithdrawTransactionConstant');
const tableName = 'PaymentWithdrawTransaction';
const primaryKeyField = 'paymentWithdrawTransactionId';
const Logger = require('../../../utils/logging');
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('paymentWithdrawTransactionId').primary();
          table.integer('appUserId');
          table.integer('walletId');
          table.integer('referId'); // nguoi gioi thieu
          table.integer('paymentMethodId');
          table.bigInteger('paymentAmount').defaultTo(0); //số tiền rút
          table.bigInteger('balanceBefore').defaultTo(0);
          table.bigInteger('balanceAfter').defaultTo(0);
          table.bigInteger('paymentRewardAmount').defaultTo(0); //số tiền được thưởng
          table.double('paymentRefAmount', 22, 1).defaultTo(0); //số tiền quy đổi hoặc tham chiếu
          table.string('paymentUnit').defaultTo(WITHDRAW_TRX_UNIT.VND); //don vi tien
          table.string('paymentType').defaultTo(WITHDRAW_TRX_TYPE.USER_WITHDRAW);
          table.string('paymentStatus').defaultTo(WITHDRAW_TRX_STATUS.NEW);
          table.string('paymentCategory').defaultTo(WITHDRAW_TRX_CATEGORY.BANK);
          table.string('paymentNote').defaultTo(''); //Ghi chu
          table.string('paymentRef').defaultTo(''); //Ma hoa don,ma giao dich thuc te
          table.string('paymentOwner').defaultTo(''); //ten nguoi gui, ten tai khoan
          table.string('paymentOriginSource').defaultTo(''); //ten ngan hang, ten mang (blockchain)
          table.string('paymentOriginName').defaultTo(''); //so tai khoan, dia chi vi
          table.timestamp('paymentApproveDate', { useTz: true }); // ngay duyet
          table.integer('paymentPICId'); // nguoi duyet
          table.integer('paymentStaffId'); // nguoi tạo, người quản lý
          table.bigInteger('paymentFeeAmount').defaultTo(0); //fee rút tiền cần chuyển

          timestamps(table);
          table.index('appUserId');
          table.index('walletId');
          table.index('referId');
          table.index('paymentMethodId');
          table.index('paymentType');
          table.index('paymentUnit');
          table.index('paymentStatus');
          table.index('paymentCategory');
          table.index('paymentStaffId');
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function customSum(sumField, filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};
  queryBuilder.where(filterData);

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
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
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }
  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function sumAmountDistinctByDate(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByDate(tableName, 'paymentAmount', filter, startDate, endDate);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  customSum,
  customSearch,
  sumAmountDistinctByDate,
  findById,
};
