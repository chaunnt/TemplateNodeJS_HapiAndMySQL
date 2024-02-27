/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'MessageCustomerMarketingReport';
const primaryKeyField = 'msgCustomerMarketingReportId';

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('stationId').nullable();
          table.integer('reportDay'); //Ngày báo cáo (YYYYMMDD)

          table.integer('totalMsgSmsCSKH'); //Tổng SL sms cskh
          table.integer('totalMsgSmsCSKHCompleted').default(0); //Tổng SL sms cskh gửi thành công
          table.integer('totalMsgSmsCSKHCanceled').default(0); //Tổng SL sms cskh đã hủy
          table.integer('totalMsgSmsCSKHFailed').default(0); //Tổng SL sms cskh thất bại

          table.integer('totalMsgSmsPromotion'); //Tổng SL sms quang cao
          table.integer('totalMsgSmsPromotionCompleted').default(0); //Tổng SL sms quang cao gửi thành công
          table.integer('totalMsgSmsPromotionCanceled').default(0); //Tổng SL sms quang cao đã hủy
          table.integer('totalMsgSmsPromotionFailed').default(0); //Tổng SL sms quang cao thất bại

          table.integer('totalMsgZaloCSKH'); //Tổng SL  zalo cskh
          table.integer('totalMsgZaloCSKHCompleted').default(0); //Tổng SL zalo cskh gửi thành công
          table.integer('totalMsgZaloCSKHCanceled').default(0); //Tổng SL zalo cskh đã hủy
          table.integer('totalMsgZaloCSKHFailed').default(0); //Tổng SL zalo cskh thất bại

          table.integer('totalMsgZaloPromotion'); //Tổng SL Zalo quang cao
          table.integer('totalMsgZaloPromotionCompleted').default(0); //Tổng SL Zalo quang cao gửi thành công
          table.integer('totalMsgZaloPromotionCanceled').default(0); //Tổng SL Zalo quang cao đã hủy
          table.integer('totalMsgZaloPromotionFailed').default(0); //Tổng SL Zalo quang cao thất bại

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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    queryBuilder.where('reportDay', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('reportDay', '<=', endDate);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
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
