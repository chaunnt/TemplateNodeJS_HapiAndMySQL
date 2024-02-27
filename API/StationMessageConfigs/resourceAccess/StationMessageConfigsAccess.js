/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const moment = require('moment');

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { SETTING_STATUS } = require('../StationMessageConfigsConstant');

const tableName = 'StationMessageConfigs';

const primaryKeyField = 'stationsId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.integer(primaryKeyField).primary();

          table.integer('enableAutoSentNotiBefore30Days').defaultTo(SETTING_STATUS.DISABLE); // Tự động gửi thông báo đến khách hàng trước 30 ngày
          table.integer('enableAutoSentNotiBefore15Days').defaultTo(SETTING_STATUS.DISABLE);
          table.integer('enableAutoSentNotiBefore7Days').defaultTo(SETTING_STATUS.DISABLE);
          table.integer('enableAutoSentNotiBefore3Days').defaultTo(SETTING_STATUS.DISABLE);
          table.integer('enableAutoSentNotiBefore1Days').defaultTo(SETTING_STATUS.DISABLE);
          table.integer('enableAutoSentNotiBeforeOtherDays').defaultTo(SETTING_STATUS.DISABLE);

          table.integer('enableNotiByAPNS').defaultTo(SETTING_STATUS.DISABLE); // Thông báo qua ứng dụng
          table.integer('enableNotiBySmsCSKH').defaultTo(SETTING_STATUS.DISABLE); // Tin nhắn SMS chăm sóc khách hàng
          table.integer('enableNotiByZaloCSKH').defaultTo(SETTING_STATUS.DISABLE); // Tin nhắn Zalo CSKH
          table.integer('enableNotiBySMSRetry').defaultTo(SETTING_STATUS.DISABLE); // Thông báo qua SMS nếu khách hàng không có Zalo
          table.integer('enableNotiByAutoCall').defaultTo(SETTING_STATUS.DISABLE); // Thông báo cuộc gọi tự động

          table.integer('messageTemplateAPNS').defaultTo(null); // Chọn mẫu tin nhắn cho enableNotiByAPNS
          table.integer('messageTemplateSmsCSKH').defaultTo(null); // Chọn mẫu tin nhắn cho enableNotiBySmsCSKH
          table.integer('messageTemplateZaloCSKH').defaultTo(null); // Chọn mẫu tin nhắn cho enableNotiByZaloCSKH
          table.integer('messageTemplateSMSRetry').defaultTo(null); // Chọn mẫu tin nhắn cho enableNotiBySMSRetry
          table.integer('messageTemplateAutoCall').defaultTo(null); // Chọn mẫu tin nhắn cho enableNotiByAutoCall

          timestamps(table);
          table.index(primaryKeyField);

          table.index('enableAutoSentNotiBefore30Days');
          table.index('enableAutoSentNotiBefore15Days');
          table.index('enableAutoSentNotiBefore7Days');
          table.index('enableAutoSentNotiBefore3Days');
          table.index('enableAutoSentNotiBefore1Days');
          table.index('enableAutoSentNotiBeforeOtherDays');

          table.index('enableNotiByAPNS');
          table.index('enableNotiBySmsCSKH');
          table.index('enableNotiByZaloCSKH');
          table.index('enableNotiBySMSRetry');
          table.index('enableNotiByAutoCall');

          table.index('messageTemplateAPNS');
          table.index('messageTemplateSmsCSKH');
          table.index('messageTemplateZaloCSKH');
          table.index('messageTemplateSMSRetry');
          table.index('messageTemplateAutoCall');
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
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
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

module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  primaryKeyField,
  customCount,
  deleteById,
  customSearch,
};
