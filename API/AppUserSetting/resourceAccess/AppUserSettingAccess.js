/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const tableName = 'AppUserSetting';

const primaryKeyField = 'appUserId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.integer(primaryKeyField).primary();
          table.integer('enableAutoCheckAppointment').defaultTo(0); // Tự động nhắc hẹn // 0:không kích hoạt
          table.integer('enableAutoCheckDUI').defaultTo(0); // Kiểm tra phạt nguội
          table.integer('enableAutoCheckRegistry').defaultTo(0); //Hạn đăng kiểm
          table.integer('enableAutoCheckRoadFee').defaultTo(0); //Hạn đóng phí đường bộ
          table.integer('enableAutoCheckBHTDS').defaultTo(0); //Hạn BHTDS
          table.integer('enableAutoCheckBHTV').defaultTo(0); //Hạn BHTV
          table.integer('vehicleExpiryDay').defaultTo(0); //Hạn đăng kiểm
          timestamps(table);
          table.index(primaryKeyField);
          table.index('enableAutoCheckAppointment');
          table.index('enableAutoCheckDUI');
          table.index('enableAutoCheckRegistry');
          table.index('enableAutoCheckRoadFee');
          table.index('enableAutoCheckBHTDS');
          table.index('enableAutoCheckBHTV');
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

async function updateById(customerScheduleSmartId, data) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleSmartId;
  return await Common.updateById(tableName, dataId, data);
}
async function deleteById(customerScheduleSmartId) {
  let dataId = {};
  dataId[primaryKeyField] = customerScheduleSmartId;
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
};
