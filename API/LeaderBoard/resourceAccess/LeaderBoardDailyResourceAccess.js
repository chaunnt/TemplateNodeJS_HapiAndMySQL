/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'LeaderBoardDaily';
const primaryKeyField = 'leaderBoardDailyId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('appUserId');
          table.bigInteger('totalPlayAmount').defaultTo(0); //tổng nạp
          table.bigInteger('totalPlayCount').defaultTo(0); //tổng nạp
          table.bigInteger('totalDepositAmount').defaultTo(0); //tổng nạp
          table.bigInteger('totalDepositCount').defaultTo(0); //tổng nạp
          table.bigInteger('totalWithdrawAmount').defaultTo(0); //tổng rút
          table.bigInteger('totalWithdrawCount').defaultTo(0); //tổng rút
          table.bigInteger('totalPlayWinAmount').defaultTo(0); //tổng thắng
          table.bigInteger('totalPlayWinCount').defaultTo(0); //tổng thắng
          table.bigInteger('totalPlayLoseAmount').defaultTo(0); //tổng thua
          table.bigInteger('totalPlayLoseCount').defaultTo(0); //tổng thắng
          table.bigInteger('totalProfit').defaultTo(0); //tổng thắng
          table.string('leaderBoardDailyDate'); // YYYY/MM/DD
          table.integer('dateTime');
          timestamps(table);
          table.index('totalPlayAmount');
          table.index('totalDepositAmount');
          table.index('totalWithdrawAmount');
          table.index('totalPlayWinAmount');
          table.index('totalPlayLoseAmount');
          table.index('totalProfit');
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
  let filter = {};
  filter[`${primaryKeyField}`] = id;
  return await Common.updateById(tableName, filter, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

async function cleanAllData() {
  return await createTable();
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  findById,
  cleanAllData,
  modelName: tableName,
};
