/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationMessageDailyReport';
const primaryKeyField = 'stationMessageDailyReportId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('stationId').nullable();
          table.integer('reportDay'); //Ngày báo cáo (YYYY/MM/DD)
          table.integer('numOfSMSCskh').default(0); //Tổng SL tin nhắn SMS
          table.integer('numOfSMSCskhNew').default(0); //Tổng SL tin nhắn SMS New
          table.integer('numOfSMSCskhSending').default(0); //Tổng SL tin nhắn SMS Sending
          table.integer('numOfSMSCskhCompleted').default(0); //Tổng SL tin nhắn SMS Completed
          table.integer('numOfSMSCskhFailed').default(0); //Tổng SL tin nhắn SMS Failed
          table.integer('numOfSMSCskhCanceled').default(0); //Tổng SL tin nhắn SMS Canceled
          table.integer('totalPaySMSCskh').default(0); //Tổng tiền tin nhắn SMS
          table.integer('numOfZNSCskh').default(0); //Tổng SL tin nhắn ZNS
          table.integer('numOfZNSCskhNew').default(0); //Tổng SL tin nhắn ZNS New
          table.integer('numOfZNSCskhSending').default(0); //Tổng SL tin nhắn ZNS Sending
          table.integer('numOfZNSCskhCompleted').default(0); //Tổng SL tin nhắn ZNS Completed
          table.integer('numOfZNSCskhFailed').default(0); //Tổng SL tin nhắn ZNS Failed
          table.integer('numOfZNSCskhCanceled').default(0); //Tổng SL tin nhắn ZNS Canceled
          table.integer('totalPayZNSCskh').default(0); //Tổng tiền tin nhắn ZNS
          table.integer('numOfEmail').default(0); //Tổng SL tin nhắn Email
          table.integer('numOfEmailNew').default(0); //Tổng SL tin nhắn Email New
          table.integer('numOfEmailSending').default(0); //Tổng SL tin nhắn Email Sending
          table.integer('numOfEmailCompleted').default(0); //Tổng SL tin nhắn Email Completed
          table.integer('numOfEmailFailed').default(0); //Tổng SL tin nhắn Email Failed
          table.integer('numOfEmailCanceled').default(0); //Tổng SL tin nhắn Email Canceled
          table.integer('totalPayEmail').default(0); //Tổng tiền tin nhắn Email
          table.integer('numOfAPNS').default(0); //Tổng SL tin nhắn APNS
          table.integer('numOfAPNSNew').default(0); //Tổng SL tin nhắn APNS New
          table.integer('numOfAPNSSending').default(0); //Tổng SL tin nhắn APNS Sending
          table.integer('numOfAPNSCompleted').default(0); //Tổng SL tin nhắn APNS Completed
          table.integer('numOfAPNSFailed').default(0); //Tổng SL tin nhắn APNS Failed
          table.integer('numOfAPNSCanceled').default(0); //Tổng SL tin nhắn APNS Canceled
          table.integer('totalPayAPNS').default(0); //Tổng tiền tin nhắn APNS
          table.integer('numOfSMSPromotion').default(0); //Tổng SL tin nhắn SMSSpam
          table.integer('numOfSMSPromotionNew').default(0); //Tổng SL tin nhắn SMSSpam New
          table.integer('numOfSMSPromotionSending').default(0); //Tổng SL tin nhắn SMSSpam Sending
          table.integer('numOfSMSPromotionCompleted').default(0); //Tổng SL tin nhắn SMSSpam Completed
          table.integer('numOfSMSPromotionFailed').default(0); //Tổng SL tin nhắn SMSSpam Failed
          table.integer('numOfSMSPromotionCanceled').default(0); //Tổng SL tin nhắn SMSSpam Canceled
          table.integer('totalPaySMSPromotion').default(0); //Tổng tiền tin nhắn SMSSpam
          table.integer('numOfZNSPromotion').default(0); //Tổng SL tin nhắn SMSSpam
          table.integer('numOfZNSPromotionNew').default(0); //Tổng SL tin nhắn SMSSpam New
          table.integer('numOfZNSPromotionSending').default(0); //Tổng SL tin nhắn SMSSpam Sending
          table.integer('numOfZNSPromotionCompleted').default(0); //Tổng SL tin nhắn SMSSpam Completed
          table.integer('numOfZNSPromotionFailed').default(0); //Tổng SL tin nhắn SMSSpam Failed
          table.integer('numOfZNSPromotionCanceled').default(0); //Tổng SL tin nhắn SMSSpam Canceled
          table.integer('totalPayZNSPromotion').default(0); //Tổng tiền tin nhắn SMSSpam
          timestamps(table);
          table.index('stationId');
          table.index('reportDay');
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

async function findOne(filter) {
  return await Common.findOne(tableName, filter);
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

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
  // queryBuilder.where(filterData);
  Common.filterHandler(filterData, queryBuilder);

  queryBuilder.where({ isDeleted: 0 });

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

module.exports = {
  insert,
  find,
  findById,
  findOne,
  count,
  updateById,
  deleteById,
  initDB,
  customSearch,
  customCount,
};
