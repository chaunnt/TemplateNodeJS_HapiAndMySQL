/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { GAME_RECORD_STATUS } = require('../GameRecordConstant');
const { BET_TYPE } = require('../../GamePlayRecords/GamePlayRecordsConstant');

const tableName = 'GameRecordHistory';
const primaryKeyField = 'gameRecordHistoryId';
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('gameRecordId');
          table.string('gameRecordValue');
          table.string('gameRecordType');
          table.string('gameRecordUnit');
          table.integer('isPlayGameRecord');
          table.string('gameRecordSection').unique();
          table.string('gameRecordResult');
          table.string('gameRecordStatus').defaultTo(GAME_RECORD_STATUS.NEW);
          timestamps(table);
          table.index(primaryKeyField);
          table.index('gameRecordId');
          table.index('gameRecordType');
          table.index('gameRecordValue');
          table.index('gameRecordSection');
        })
        .then(async () => {
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

async function find(filter, skip, limit, order, startDate, endDate) {
  return await Common.find(tableName, filter, skip, limit, order, startDate, endDate);
}

async function findById(id) {
  let dataId = { [primaryKeyField]: id };
  return await Common.findById(tableName, dataId, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function sum(field, filter, order) {
  return await Common.sum(tableName, field, filter, order);
}

async function updateAll(filter, data) {
  return await Common.updateAll(tableName, data, filter);
}

async function increment(id, key, amount) {
  const data = await findById(id);
  let gameValue = parseInt(data[key]);
  gameValue += amount;
  await updateById(id, {
    [key]: gameValue,
  });
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  sum,
  updateAll,
  increment,
  findById,
};
