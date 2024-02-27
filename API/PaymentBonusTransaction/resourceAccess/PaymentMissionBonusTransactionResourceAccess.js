/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BONUS_TRX_STATUS, BONUS_TRX_CATEGORY } = require('../PaymentBonusTransactionConstant');
const Logger = require('../../../utils/logging');
const tableName = 'PaymentMissionBonusTransaction';
const primaryKeyField = 'paymentMissionBonusTransactionId';

async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('appUserId'); //user duoc nhan hoa hong
          table.integer('walletId');
          table.integer('referUserId'); //nguoi user duoc tham chieu de tinh hoa hong
          table.integer('paymentMethodId').nullable();
          table.integer('totalJoinedF1').defaultTo(0); //Số nhà giao dịch (đây là số nhà giao dịch F1 mà chơi tài khoản nhiệm vụ trong ngày, chỉ tính f1 nào hôm đó vào chơi nv thì mới tính, vì có người hôm đó sẽ quên hay vì gì đó mà ko vào chơi, thì sẽ ko tính)
          table.integer('totalMissionF1').defaultTo(0); // Nhiệm vụ của đội (là tổng số nhiệm vụ của tất cả F1 nhận được trong ngày. Ví dụ f1 đó được 3nv trong ngày, f1 kia được 1nv thì tổng là 4nv)
          table.integer('totalCompletedMissionF1').defaultTo(0); //Thành công của đội (là tổng số nhiệm vụ mà tất cả F1 hoàn thành thành công trong ngày. Ví dụ f1 đó có 3 nv nhưng hoàn thành thành công chỉ 1nv, còn f1 kia có 4nv và hoàn thành thành công 2nv, thì tổng chỗ này là 1+2=3
          table.integer('totalMission').defaultTo(0); //5. Nhiệm vụ cá nhân (là số nhiệm vụ họ nhận được trong ngày)
          table.integer('totalCompletedMission').defaultTo(0); //6. Thành công cá nhân (đây là số nhiệm vụ mà họ đã hoàn thành thành công trong ngày)
          table.float('paymentAmount', 48, 24).defaultTo(0); //5. Bonus (đây là tổng số tiền họ nhận được trong ngày nhờ hoàn thành thành công nhiệm vụ của mình + hoa hồng 10% trên mỗi nhiệm vụ hoàn thành thành công của F1. ví dụ F1 hoàn thành thành công 1 nv được 10k, thì họ được 1k)
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
          table.string('paymentIdentifier').nullable(); //format YYYY/MM/DD //chống cho việc insert 2 dòng vào DB
          table.string('paymentNote').defaultTo(''); //Ghi chu hoa don
          table.string('paymentRef').defaultTo(''); //Ma hoa don ngoai thuc te
          table.timestamp('paymentApproveDate', { useTz: true }); // ngay duyet
          table.integer('paymentPICId'); // nguoi duyet
          table.integer('paymentStaffId'); // tong dai ly lien quan
          timestamps(table);
          table.unique('paymentIdentifier'); //format YYYY/MM/DD //chống cho việc insert 2 dòng vào DB
          table.index('appUserId'); //user duoc nhan hoa hong
          table.index('walletId');
          table.index('referUserId'); //nguoi user duoc tham chieu de tinh hoa hong
          table.index('paymentPICId'); // nguoi duyet
          table.index('paymentStaffId'); // tong dai ly lien quan
          table.index('paymentStatus');
          table.index('paymentDate'); //format YYYY/MM/DD
          table.index('paymentCategory');
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
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where({ isDeleted: 0 });

  Common.filterHandler(filterData, queryBuilder);

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

async function customSum(filter, startDate, endDate) {
  const _field = 'paymentAmount';

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
      queryBuilder.sum(`${_field} as sumResult`).then(records => {
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
  customCount,
  modelName: tableName,
  customSum,
  sumAmountDistinctByDate,
  incrementPaymentAmount,
};
